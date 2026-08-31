import sharp from 'sharp'
import {
  LayoutResult,
  LayoutItem,
  ImageAdjustments,
  CropMarkLine,
  SourceImage,
  PaperSettings
} from '../../shared/types'
import { mmToPixel } from '../../shared/units/converter'

export interface RenderProductionOptions {
  layoutResult: LayoutResult
  adjustments: ImageAdjustments
  paper: PaperSettings
  images: SourceImage[]
  dpi?: number
  format?: 'png' | 'jpeg'
  jpegQuality?: number
  includeCropMarks?: boolean
  pageIndex?: number
}

/**
 * Render seluruh halaman layout multi-lembar ke dalam array Buffer 300 DPI
 */
export async function renderAllPagesToBuffers(options: RenderProductionOptions): Promise<Buffer[]> {
  const { layoutResult } = options
  const totalPages = layoutResult.totalPages || layoutResult.pages?.length || 1
  const buffers: Buffer[] = []

  for (let i = 0; i < totalPages; i++) {
    const buf = await renderLayoutToBuffer({ ...options, pageIndex: i })
    buffers.push(buf)
  }

  return buffers
}

/**
 * Render produksi 300 DPI menggunakan Sharp di Main Process (PRD FR-13)
 * Menghasilkan resolusi penuh tanpa distorsi / blur visual preview.
 */
export async function renderLayoutToBuffer(options: RenderProductionOptions): Promise<Buffer> {
  const {
    layoutResult,
    adjustments,
    dpi = 300,
    format = 'png',
    jpegQuality = 95,
    includeCropMarks = true,
    pageIndex = 0
  } = options

  let placedItems: LayoutItem[] = []
  let cropMarks: CropMarkLine[] = []

  if (layoutResult.pages && layoutResult.pages.length > 0) {
    const activePage = layoutResult.pages[pageIndex] || layoutResult.pages[0]
    placedItems = activePage ? (activePage.placedItems || []) : []
    cropMarks = activePage ? (activePage.cropMarks || []) : []
  } else {
    placedItems = layoutResult.placedItems || []
    cropMarks = layoutResult.cropMarks || []
  }

  const paperWidthPx = mmToPixel(layoutResult.effectivePaperWidthMm, dpi)
  const paperHeightPx = mmToPixel(layoutResult.effectivePaperHeightMm, dpi)

  // 1. Buat kanvas dasar putih 300 DPI
  const baseCanvas = sharp({
    create: {
      width: paperWidthPx,
      height: paperHeightPx,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })

  // 2. Siapkan image composite layer
  const composites: sharp.OverlayOptions[] = []

  // Cache processed image source buffer per path
  const imageSourceCache = new Map<string, Buffer>()

  for (const item of placedItems) {
    if (!item.sourcePath) continue

    const itemWidthPx = mmToPixel(item.widthMm, dpi)
    const itemHeightPx = mmToPixel(item.heightMm, dpi)
    const itemLeftPx = mmToPixel(item.xMm, dpi)
    const itemTopPx = mmToPixel(item.yMm, dpi)

    try {
      let sourceBuffer = imageSourceCache.get(item.sourcePath)
      if (!sourceBuffer) {
        sourceBuffer = await sharp(item.sourcePath).toBuffer()
        imageSourceCache.set(item.sourcePath, sourceBuffer)
      }

      // Proses foto (adjustments + crop + resize)
      const processedPhotoBuffer = await processPhotoItem({
        sourceBuffer,
        adjustments: item.adjustments || adjustments,
        targetWidthPx: itemWidthPx,
        targetHeightPx: itemHeightPx,
        crop: item.crop,
        rotation: item.rotation
      })

      composites.push({
        input: processedPhotoBuffer,
        left: itemLeftPx,
        top: itemTopPx
      })
    } catch (err) {
      console.error(`Gagal memproses item foto ${item.label}:`, err)
    }
  }

  // 3. Tambahkan Crop Mark Overlay jika diaktifkan (PRD FR-10)
  if (includeCropMarks && cropMarks.length > 0) {
    const cropMarkSvg = generateCropMarksSvg(
      cropMarks,
      paperWidthPx,
      paperHeightPx,
      dpi
    )
    composites.push({
      input: Buffer.from(cropMarkSvg),
      top: 0,
      left: 0
    })
  }

  // 4. Lakukan compositing akhir
  let finalImage = baseCanvas.composite(composites).toColorspace('srgb')

  if (format === 'jpeg') {
    return await finalImage
      .jpeg({
        quality: jpegQuality,
        chromaSubsampling: '4:4:4'
      })
      .withMetadata({ density: dpi })
      .toBuffer()
  } else {
    return await finalImage
      .png({ compressionLevel: 6 })
      .withMetadata({ density: dpi })
      .toBuffer()
  }
}

interface ProcessPhotoOptions {
  sourceBuffer: Buffer
  adjustments: ImageAdjustments
  targetWidthPx: number
  targetHeightPx: number
  crop: { xPercent: number; yPercent: number; zoom: number }
  rotation: 0 | 90
}

async function processPhotoItem(options: ProcessPhotoOptions): Promise<Buffer> {
  const { sourceBuffer, adjustments, targetWidthPx, targetHeightPx, crop, rotation } = options

  let pipeline = sharp(sourceBuffer).toColorspace('srgb')

  // 1. Rotasi dasar & Flip
  const totalRotation = ((adjustments.rotation || 0) + (rotation || 0)) % 360
  if (totalRotation !== 0) {
    pipeline = pipeline.rotate(totalRotation)
  }
  if (adjustments.flipHorizontal) {
    pipeline = pipeline.flop()
  }
  if (adjustments.flipVertical) {
    pipeline = pipeline.flip()
  }

  // 2. Adjustments: Brightness, Saturation, Contrast
  const hasBrightness = adjustments.brightness !== undefined && adjustments.brightness !== 0
  const hasSaturation = adjustments.saturation !== undefined && adjustments.saturation !== 0

  if (hasBrightness || hasSaturation) {
    const brightnessMul = 1 + (adjustments.brightness || 0) / 100
    const saturationMul = Math.max(0, 1 + (adjustments.saturation || 0) / 100)
    pipeline = pipeline.modulate({
      brightness: brightnessMul,
      saturation: saturationMul
    })
  }

  // Contrast via linear (hanya dieksekusi jika contrast !== 0)
  if (adjustments.contrast !== undefined && adjustments.contrast !== 0) {
    const contrastVal = adjustments.contrast / 100
    const a = 1 + contrastVal
    const b = -0.5 * contrastVal * 255
    pipeline = pipeline.linear(a, b)
  }

  // Sharpen
  if (adjustments.sharpen && adjustments.sharpen > 0) {
    const sigma = 0.5 + (adjustments.sharpen / 100) * 1.5
    pipeline = pipeline.sharpen({ sigma })
  }

  // 3. Color Mode: Grayscale (B&W) / Vintage (Sepia)
  if (adjustments.colorMode === 'grayscale') {
    pipeline = pipeline.grayscale()
  } else if (adjustments.colorMode === 'vintage') {
    pipeline = pipeline.recomb([
      [0.393, 0.769, 0.189],
      [0.349, 0.686, 0.168],
      [0.272, 0.534, 0.131]
    ])
  }

  // 3. Metadata dimensi sumber untuk crop
  const metadata = await pipeline.metadata()
  const metaW = metadata.width || targetWidthPx
  const metaH = metadata.height || targetHeightPx

  // Hitung crop viewport berdasarkan zoom & center offset
  const zoom = Math.max(1, crop.zoom || 1)
  const targetAspect = targetWidthPx / targetHeightPx

  // Hitung sub-rectangle crop dari gambar sumber
  let cropW: number
  let cropH: number

  if (metaW / metaH > targetAspect) {
    cropH = metaH / zoom
    cropW = cropH * targetAspect
  } else {
    cropW = metaW / zoom
    cropH = cropW / targetAspect
  }

  // Center offset (default xPercent = 50, yPercent = 50)
  const xPercent = (crop.xPercent ?? 50) / 100
  const yPercent = (crop.yPercent ?? 50) / 100

  const centerX = metaW * xPercent
  const centerY = metaH * yPercent

  let left = Math.round(centerX - cropW / 2)
  let top = Math.round(centerY - cropH / 2)

  // Clamp within source bounds
  left = Math.max(0, Math.min(left, metaW - Math.round(cropW)))
  top = Math.max(0, Math.min(top, metaH - Math.round(cropH)))

  const extractW = Math.min(Math.round(cropW), metaW - left)
  const extractH = Math.min(Math.round(cropH), metaH - top)

  // Ekstrak region dan resize ke target resolusi 300 DPI
  return await pipeline
    .extract({
      left,
      top,
      width: Math.max(1, extractW),
      height: Math.max(1, extractH)
    })
    .resize(targetWidthPx, targetHeightPx, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3
    })
    .toBuffer()
}

/**
 * Generate SVG overlay untuk short crop marks (2 mm tebal 0.2 mm)
 */
function generateCropMarksSvg(
  marks: CropMarkLine[],
  paperWidthPx: number,
  paperHeightPx: number,
  dpi: number
): string {
  const strokeWidthPx = Math.max(1, mmToPixel(0.2, dpi))

  const linesSvg = marks
    .map((m) => {
      const x1 = mmToPixel(m.x1Mm, dpi)
      const y1 = mmToPixel(m.y1Mm, dpi)
      const x2 = mmToPixel(m.x2Mm, dpi)
      const y2 = mmToPixel(m.y2Mm, dpi)
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="${strokeWidthPx}" stroke-linecap="square" />`
    })
    .join('\n')

  return `<svg width="${paperWidthPx}" height="${paperHeightPx}" viewBox="0 0 ${paperWidthPx} ${paperHeightPx}" xmlns="http://www.w3.org/2000/svg">
    ${linesSvg}
  </svg>`
}
