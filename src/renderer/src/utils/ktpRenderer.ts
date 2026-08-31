import { useKtpStore } from '../stores/ktpStore'
import { generateCropMarks } from '../../../shared/layout-engine/cropmarks'
import { LayoutItem } from '../../../shared/types'

export async function renderKtpPageToBase64(
  dpi: number = 300,
  includeCropMarks: boolean = true
): Promise<{ base64: string; widthMm: number; heightMm: number }> {
  const state = useKtpStore.getState()
  const { paper, colorMode, brightness, contrast, gapHorizontalMm } = state
  const items = state.getPlacedKtpItems()

  const widthMm = paper.widthMm
  const heightMm = paper.heightMm

  const canvas = document.createElement('canvas')
  const widthPx = Math.round((widthMm / 25.4) * dpi)
  const heightPx = Math.round((heightMm / 25.4) * dpi)

  canvas.width = widthPx
  canvas.height = heightPx

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia')

  // Background putih bersih
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)

  // Pre-load all images
  const loadedImages: { [id: string]: HTMLImageElement } = {}
  for (const item of items) {
    if (item.image && (item.image.base64 || item.image.filePath)) {
      const src = item.image.base64 || item.image.filePath!
      if (!loadedImages[item.id]) {
        const img = new Image()
        img.src = src
        await new Promise((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
        })
        loadedImages[item.id] = img
      }
    }
  }

  // Render each KTP item with colorMode & adjustments
  for (const item of items) {
    const x = Math.round((item.xMm / 25.4) * dpi)
    const y = Math.round((item.yMm / 25.4) * dpi)
    const w = Math.round((item.widthMm / 25.4) * dpi)
    const h = Math.round((item.heightMm / 25.4) * dpi)

    const img = loadedImages[item.id]
    if (img) {
      ctx.save()
      const adj = item.adjustments || state.itemAdjustments[item.id] || {}
      const itemColorMode = adj.colorMode ?? colorMode
      const itemBrightness = adj.brightness ?? brightness
      const itemContrast = adj.contrast ?? contrast
      const itemSaturation = adj.saturation ?? state.saturation ?? 0
      const itemFlipH = adj.flipHorizontal ?? state.flipHorizontal ?? false
      const itemRotation = adj.rotation ?? state.rotation ?? 0

      let filter = ''
      if (itemColorMode === 'grayscale') {
        filter += 'grayscale(100%) '
      } else if (itemColorMode === 'vintage') {
        filter += 'sepia(45%) '
      }
      if (itemBrightness !== 0) {
        filter += `brightness(${Math.max(0, 100 + itemBrightness)}%) `
      }
      if (itemContrast !== 0) {
        filter += `contrast(${Math.max(0, 100 + itemContrast)}%) `
      }
      if (itemSaturation !== 0) {
        filter += `saturate(${Math.max(0, 100 + itemSaturation)}%) `
      }

      ctx.filter = filter.trim() || 'none'
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (itemFlipH || itemRotation !== 0) {
        ctx.translate(x + w / 2, y + h / 2)
        if (itemRotation !== 0) {
          ctx.rotate((itemRotation * Math.PI) / 180)
        }
        if (itemFlipH) {
          ctx.scale(-1, 1)
        }
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
      } else {
        ctx.drawImage(img, x, y, w, h)
      }
      ctx.restore()
    }
  }

  // Render Corner Bracket Crop Marks (Persis seperti Pas Foto dengan logika gap X dan Y)
  if (includeCropMarks && items.length > 0) {
    const layoutItems: LayoutItem[] = items.map((it) => ({
      id: it.id,
      imageId: it.id,
      presetId: 'ktp',
      label: it.side === 'front' ? 'KTP Depan' : 'KTP Belakang',
      widthMm: it.widthMm,
      heightMm: it.heightMm,
      xMm: it.xMm,
      yMm: it.yMm
    }))

    const offsetGapX = gapHorizontalMm > 0 ? gapHorizontalMm / 2 : 1.0
    const offsetGapY = state.gapVerticalMm > 0 ? state.gapVerticalMm / 2 : 1.0

    const cropMarks = generateCropMarks(
      layoutItems,
      2.5,
      0,
      {
        offsetX: offsetGapX,
        offsetY: offsetGapY
      },
      { widthMm: paper.widthMm, heightMm: paper.heightMm }
    )

    ctx.save()
    ctx.strokeStyle = '#000000'
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
