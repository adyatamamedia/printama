import {
  usePolaroidStore,
  PolaroidPlacedSlot,
  PolaroidFrameColor
} from '../stores/polaroidStore'
import { generateCropMarks } from '../../../shared/layout-engine/cropmarks'
import { LayoutItem } from '../../../shared/types'
import { drawPolaroidBackgroundToCanvas } from './polaroidPatternHelper'

const FRAME_COLORS: Record<string, { bg: string; text: string }> = {
  white: { bg: '#ffffff', text: '#1e293b' },
  black: { bg: '#18181b', text: '#f8fafc' },
  cream: { bg: '#fdfbf7', text: '#292524' },
  pink: { bg: '#fdf2f8', text: '#831843' },
  blue: { bg: '#f0f9ff', text: '#075985' },
  vintage: { bg: '#f5f0eb', text: '#451a03' }
}

/**
 * Render satu halaman Polaroid ke base64 (resolusi tinggi 300 DPI)
 */
export async function renderPolaroidPageToBase64(
  pageIndex: number,
  dpi: number = 300,
  includeCropMarks: boolean = true
): Promise<{ base64: string; widthMm: number; heightMm: number }> {
  const state = usePolaroidStore.getState()
  const widthMm = state.paper.widthMm
  const heightMm = state.paper.heightMm

  const canvasWidthPx = Math.round((widthMm / 25.4) * dpi)
  const canvasHeightPx = Math.round((heightMm / 25.4) * dpi)

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidthPx
  canvas.height = canvasHeightPx
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Gagal menginisialisasi 2D canvas context')

  // 1. Gambar Kertas Putih Dasar
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx)

  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi)
  const slots = state.getPlacedSlotsForPage(pageIndex)
  const pageConfig = state.getPageConfig(pageIndex)
  const effectiveFrameColor = pageConfig.frameColor || state.frameColor
  const frameStyle = FRAME_COLORS[effectiveFrameColor] || FRAME_COLORS.white

  const bgType = pageConfig.bgType || state.bgType
  const customBgColor = pageConfig.customBgColor || state.customBgColor
  const bgPattern = pageConfig.bgPattern || state.bgPattern
  const patternColor = pageConfig.patternColor || state.patternColor
  const patternScale = pageConfig.patternScale || state.patternScale
  const customBgImage = pageConfig.customBgImage !== undefined ? pageConfig.customBgImage : state.customBgImage
  const cropMarkColor = pageConfig.cropMarkColor || state.cropMarkColor
  const includeBorder = pageConfig.includeBorder !== undefined ? pageConfig.includeBorder : state.includeBorder
  const colorMode = pageConfig.colorMode || state.colorMode

  // 2. Preload semua gambar foto dan background custom untuk halaman ini
  const loadedMap = new Map<string, HTMLImageElement>()
  for (const slot of slots) {
    if (slot.photo) {
      const src = slot.photo.base64 || slot.photo.filePath
      if (src && !loadedMap.has(slot.photo.id)) {
        const img = new Image()
        img.src = src
        await new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        })
        loadedMap.set(slot.photo.id, img)
      }
    }
  }

  let loadedBgImage: HTMLImageElement | null = null
  if (bgType === 'image' && customBgImage) {
    loadedBgImage = new Image()
    loadedBgImage.src = customBgImage
    await new Promise<void>((resolve) => {
      if (loadedBgImage!.complete) resolve()
      else {
        loadedBgImage!.onload = () => resolve()
        loadedBgImage!.onerror = () => resolve()
      }
    })
  }

  // 3. Gambar Setiap Kartu Polaroid di Slot
  for (const slot of slots) {
    const cardXPx = mmToPx(slot.xMm)
    const cardYPx = mmToPx(slot.yMm)
    const cardWPx = mmToPx(slot.widthMm)
    const cardHPx = mmToPx(slot.heightMm)

    // Gambar Latar Kartu Polaroid (Solid / Pattern / Image)
    await drawPolaroidBackgroundToCanvas(ctx, {
      x: cardXPx,
      y: cardYPx,
      width: cardWPx,
      height: cardHPx,
      bgType,
      customBgColor: customBgColor || frameStyle.bg,
      bgPattern,
      patternColor,
      patternScale,
      customBgImage,
      fallbackColor: frameStyle.bg,
      loadedCustomImage: loadedBgImage,
      dpi
    })

    // Area Foto di dalam kartu Polaroid
    const cardDims = state.getCardDimensions(pageIndex)
    const photoMarginPx = mmToPx(cardDims.photoMarginMm)
    const photoChinPx = mmToPx(cardDims.photoChinMm)

    const photoXPx = cardXPx + photoMarginPx
    const photoYPx = cardYPx + photoMarginPx
    const photoWPx = cardWPx - photoMarginPx * 2
    const photoHPx = cardHPx - photoMarginPx - photoChinPx

    if (slot.photo && loadedMap.has(slot.photo.id)) {
      const img = loadedMap.get(slot.photo.id)!
      if (img.width && img.height) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(photoXPx, photoYPx, photoWPx, photoHPx)
        ctx.clip()

        const photoAdj = {
          brightness: slot.photo.adjustments?.brightness ?? 0,
          contrast: slot.photo.adjustments?.contrast ?? 0,
          saturation: slot.photo.adjustments?.saturation ?? 0,
          flipHorizontal: slot.photo.adjustments?.flipHorizontal ?? false
        }

        let filterStr = ''
        if (photoAdj.brightness !== 0) {
          const b = 1 + photoAdj.brightness / 100
          filterStr += `brightness(${Math.max(0, b)}) `
        }
        if (photoAdj.contrast !== 0) {
          const c = 1 + photoAdj.contrast / 100
          filterStr += `contrast(${Math.max(0, c)}) `
        }
        if (photoAdj.saturation !== 0) {
          const s = 1 + photoAdj.saturation / 100
          filterStr += `saturate(${Math.max(0, s)}) `
        }

        const photoColorMode = slot.photo.adjustments?.colorMode ?? 'color'
        if (photoColorMode === 'grayscale') {
          filterStr += 'grayscale(100%) '
        } else if (photoColorMode === 'vintage') {
          filterStr += 'sepia(45%) '
        }

        ctx.filter = filterStr.trim() || 'none'

        // Transform Crop & Flip with Rotation Compensation
        const cropZoom = Math.max(1, slot.photo.crop?.zoom || 1)
        const cropX = slot.photo.crop?.xPercent ?? 50
        const cropY = slot.photo.crop?.yPercent ?? 50
        const cropRot = slot.photo.crop?.rotation || 0
        const isFlipped = photoAdj.flipHorizontal

        const isSwapped = (cropRot % 180 !== 0)
        const minCoverScale = isSwapped ? Math.max(photoWPx / photoHPx, photoHPx / photoWPx) : 1
        const totalZoom = cropZoom * minCoverScale

        const maxPanXPx = isSwapped
          ? Math.max(0, (photoHPx * totalZoom - photoWPx) / 2)
          : Math.max(0, (photoWPx * totalZoom - photoWPx) / 2)

        const maxPanYPx = isSwapped
          ? Math.max(0, (photoWPx * totalZoom - photoHPx) / 2)
          : Math.max(0, (photoHPx * totalZoom - photoHPx) / 2)

        const panXPx = ((cropX - 50) / 50) * maxPanXPx
        const panYPx = ((cropY - 50) / 50) * maxPanYPx

        const centerX = photoXPx + photoWPx / 2
        const centerY = photoYPx + photoHPx / 2

        ctx.translate(centerX + panXPx, centerY + panYPx)
        ctx.scale(totalZoom, totalZoom)

        if (cropRot !== 0) {
          ctx.rotate((cropRot * Math.PI) / 180)
        }

        if (isFlipped) {
          ctx.scale(-1, 1)
        }

        // Gambar Image object-cover
        const imgAspect = img.width / img.height
        const targetAspect = photoWPx / photoHPx
        let drawW = photoWPx
        let drawH = photoHPx

        if (imgAspect > targetAspect) {
          drawH = photoHPx
          drawW = photoHPx * imgAspect
        } else {
          drawW = photoWPx
          drawH = photoWPx / imgAspect
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()
      }
    }

    // Gambar Caption Teks Polaroid di Chin Area
    if (slot.photo?.caption) {
      ctx.save()
      ctx.fillStyle = frameStyle.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const fontSizePx = Math.max(12, Math.round(mmToPx(3.2)))
      ctx.font = `600 ${fontSizePx}px sans-serif`
      const captionYPx = cardYPx + cardHPx - photoChinPx / 2
      ctx.fillText(slot.photo.caption, cardXPx + cardWPx / 2, captionYPx, cardWPx - 10)
      ctx.restore()
    }
  }

  // 4. Gambar Corner Bracket Crop Marks jika diaktifkan
  if (includeCropMarks && includeBorder && slots.length > 0) {
    const layoutItems: LayoutItem[] = slots.map((s) => ({
      id: `slot-${s.slotIndex}`,
      requestId: `req-${s.slotIndex}`,
      imageId: s.photo?.id || `empty-${s.slotIndex}`,
      sourcePath: s.photo?.filePath || '',
      label: 'Polaroid',
      widthMm: s.widthMm,
      heightMm: s.heightMm,
      xMm: s.xMm,
      yMm: s.yMm,
      rotation: 0,
      crop: {
        xPercent: 50,
        yPercent: 50,
        zoom: 1,
        aspectRatio: s.widthMm / s.heightMm
      }
    }))

    const cropMarks = generateCropMarks(
      layoutItems,
      2.5,
      0,
      {
        offsetX: 0,
        offsetY: 0
      },
      { widthMm: state.paper.widthMm, heightMm: state.paper.heightMm }
    )

    ctx.save()
    ctx.strokeStyle = cropMarkColor || '#000000'
    ctx.lineWidth = Math.max(1, Math.round((0.2 / 25.4) * dpi))

    cropMarks.forEach((mark) => {
      const x1 = Math.round((mark.x1Mm / 25.4) * dpi)
      const y1 = Math.round((mark.y1Mm / 25.4) * dpi)
      const x2 = Math.round((mark.x2Mm / 25.4) * dpi)
      const y2 = Math.round((mark.y2Mm / 25.4) * dpi)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })
    ctx.restore()
  }

  const base64 = canvas.toDataURL('image/png')
  return { base64, widthMm, heightMm }
}

/**
 * Render seluruh halaman polaroid ke array base64
 */
export async function renderAllPolaroidPagesToBase64(
  dpi: number = 300,
  includeCropMarks: boolean = true
): Promise<Array<{ base64: string; widthMm: number; heightMm: number }>> {
  const totalPages = usePolaroidStore.getState().getTotalPages()
  const results: Array<{ base64: string; widthMm: number; heightMm: number }> = []

  for (let p = 0; p < totalPages; p++) {
    const pageRes = await renderPolaroidPageToBase64(p, dpi, includeCropMarks)
    results.push(pageRes)
  }

  return results
}
