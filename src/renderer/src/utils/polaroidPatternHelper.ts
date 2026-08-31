import { PolaroidBgType, PolaroidPatternType } from '../stores/polaroidStore'

/**
 * Menghasilkan SVG URL untuk background pattern berdasarkan warna dasar & warna pola
 */
export function getPatternSvgDataUrl(
  pattern: PolaroidPatternType,
  bgColor: string,
  patternColor: string
): string {
  let svgContent = ''
  const encodedBg = encodeURIComponent(bgColor)
  const encodedPattern = encodeURIComponent(patternColor)

  switch (pattern) {
    case 'dots':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' fill='${encodedBg}'/><circle cx='12' cy='12' r='3.5' fill='${encodedPattern}'/></svg>`
      break
    case 'stripes':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' fill='${encodedBg}'/><path d='M-6,6 l12,-12 M0,24 l24,-24 M18,30 l12,-12' stroke='${encodedPattern}' stroke-width='4'/></svg>`
      break
    case 'grid':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' fill='${encodedBg}'/><path d='M 24 0 L 0 0 0 24' fill='none' stroke='${encodedPattern}' stroke-width='2'/></svg>`
      break
    case 'hearts':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><rect width='28' height='28' fill='${encodedBg}'/><path d='M14 21.5s-7-5-7-8.8a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 3.8-7 8.8-7 8.8z' fill='${encodedPattern}'/></svg>`
      break
    case 'stars':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><rect width='28' height='28' fill='${encodedBg}'/><polygon points='14,4 16.5,10.2 23,10.8 18.2,15.2 19.5,21.8 14,18.4 8.5,21.8 9.8,15.2 5,10.8 11.5,10.2' fill='${encodedPattern}'/></svg>`
      break
    case 'zigzag':
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12' viewBox='0 0 24 12'><rect width='24' height='12' fill='${encodedBg}'/><path d='M0 12 L12 0 L24 12' fill='none' stroke='${encodedPattern}' stroke-width='2.5'/></svg>`
      break
    default:
      svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' fill='${encodedBg}'/><circle cx='12' cy='12' r='3.5' fill='${encodedPattern}'/></svg>`
      break
  }

  return `data:image/svg+xml;utf8,${svgContent}`
}

/**
 * Menghasilkan objek React CSS style untuk kartu polaroid (live canvas preview)
 */
export function getPolaroidBackgroundStyle(options: {
  bgType: PolaroidBgType
  customBgColor: string
  bgPattern: PolaroidPatternType
  patternColor: string
  patternScale?: number
  customBgImage: string | null
  fallbackColor?: string
  canvasScale?: number
}): React.CSSProperties {
  const {
    bgType,
    customBgColor,
    bgPattern,
    patternColor,
    patternScale = 1.0,
    customBgImage,
    fallbackColor = '#ffffff',
    canvasScale = 1.0
  } = options

  if (bgType === 'image' && customBgImage) {
    return {
      backgroundColor: customBgColor || fallbackColor,
      backgroundImage: `url(${customBgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  if (bgType === 'pattern') {
    const dataUrl = getPatternSvgDataUrl(bgPattern, customBgColor || fallbackColor, patternColor)
    // 6.35 mm di 96 DPI preview dikalikan canvasScale
    const baseSize = ((6.35 / 25.4) * 96 * (canvasScale || 1.0)) * patternScale
    return {
      backgroundColor: customBgColor || fallbackColor,
      backgroundImage: `url("${dataUrl}")`,
      backgroundSize: `${baseSize}px ${bgPattern === 'zigzag' ? baseSize / 2 : baseSize}px`,
      backgroundRepeat: 'repeat'
    }
  }

  // Solid Color
  return {
    backgroundColor: customBgColor || fallbackColor,
    backgroundImage: 'none'
  }
}

/**
 * Menggambar background Polaroid pada Canvas 2D (untuk High-Res Exporter)
 */
export async function drawPolaroidBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  options: {
    x: number
    y: number
    width: number
    height: number
    bgType: PolaroidBgType
    customBgColor: string
    bgPattern: PolaroidPatternType
    patternColor: string
    patternScale?: number
    customBgImage: string | null
    fallbackColor?: string
    loadedCustomImage?: HTMLImageElement | null
    dpi?: number
  }
): Promise<void> {
  const {
    x,
    y,
    width,
    height,
    bgType,
    customBgColor,
    bgPattern,
    patternColor,
    patternScale = 1.0,
    customBgImage,
    fallbackColor = '#ffffff',
    loadedCustomImage,
    dpi = 300
  } = options

  const effectiveBg = customBgColor || fallbackColor

  // 1. Jika mode Upload Image & ada gambar
  if (bgType === 'image' && (loadedCustomImage || customBgImage)) {
    let img = loadedCustomImage
    if (!img && customBgImage) {
      img = new Image()
      img.src = customBgImage
      await new Promise<void>((resolve) => {
        if (img!.complete) resolve()
        else {
          img!.onload = () => resolve()
          img!.onerror = () => resolve()
        }
      })
    }

    if (img && img.width && img.height) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()

      // Render image cover
      const imgAspect = img.width / img.height
      const cardAspect = width / height
      let renderW = width
      let renderH = height
      let renderX = x
      let renderY = y

      if (imgAspect > cardAspect) {
        renderW = height * imgAspect
        renderX = x - (renderW - width) / 2
      } else {
        renderH = width / imgAspect
        renderY = y - (renderH - height) / 2
      }

      ctx.drawImage(img, renderX, renderY, renderW, renderH)
      ctx.restore()
      return
    }
  }

  // 2. Jika mode Pattern
  if (bgType === 'pattern') {
    const dataUrl = getPatternSvgDataUrl(bgPattern, effectiveBg, patternColor)
    const patternImg = new Image()
    patternImg.src = dataUrl
    await new Promise<void>((resolve) => {
      if (patternImg.complete) resolve()
      else {
        patternImg.onload = () => resolve()
        patternImg.onerror = () => resolve()
      }
    })

    if (patternImg.width && patternImg.height) {
      ctx.save()
      // Hitung ukuran tile pattern presisi pada resolusi DPI ekspor (6.35 mm)
      const baseTileW = Math.max(1, Math.round(((6.35 / 25.4) * dpi) * patternScale))
      const baseTileH = Math.max(1, Math.round(bgPattern === 'zigzag' ? baseTileW / 2 : baseTileW))

      const offscreen = document.createElement('canvas')
      offscreen.width = baseTileW
      offscreen.height = baseTileH
      const offCtx = offscreen.getContext('2d')

      if (offCtx) {
        offCtx.drawImage(patternImg, 0, 0, baseTileW, baseTileH)
        const pattern = ctx.createPattern(offscreen, 'repeat')
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(x, y, width, height)
          ctx.restore()
          return
        }
      }

      const fallbackPattern = ctx.createPattern(patternImg, 'repeat')
      ctx.fillStyle = fallbackPattern || effectiveBg
      ctx.fillRect(x, y, width, height)
      ctx.restore()
      return
    }
  }

  // 3. Mode Solid Color
  ctx.save()
  ctx.fillStyle = effectiveBg
  ctx.fillRect(x, y, width, height)
  ctx.restore()
}
