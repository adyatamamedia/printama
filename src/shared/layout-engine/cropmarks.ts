import { CropMarkLine, LayoutItem } from '../types'

/**
 * Menghasilkan garis crop mark sudut standar percetakan (Corner Bracket Crop Marks / L-marks).
 * Mendukung offset gap tunggal maupun offset X dan Y terpisah (untuk modul KTP dengan custom gap H dan V).
 * Posisi garis berada di tengah-tengah jarak antar objek (gap / 2) sehingga garis potong
 * otomatis sejajar dan menyambung antar objek yang bersebelahan.
 */
export function generateCropMarks(
  items: LayoutItem[],
  markLengthMm: number = 2.5,
  gapMm: number = 2,
  offsetGapMm: number | { offsetX: number; offsetY: number } = 1.0,
  bounds?: { widthMm: number; heightMm: number }
): CropMarkLine[] {
  if (items.length === 0) return []

  const offX = typeof offsetGapMm === 'object' ? offsetGapMm.offsetX : offsetGapMm
  const offY = typeof offsetGapMm === 'object' ? offsetGapMm.offsetY : offsetGapMm

  const rawMarks: CropMarkLine[] = []

  const maxW = bounds ? bounds.widthMm : Infinity
  const maxH = bounds ? bounds.heightMm : Infinity

  for (const item of items) {
    const left = item.xMm
    const right = item.xMm + item.widthMm
    const top = item.yMm
    const bottom = item.yMm + item.heightMm

    const lenX = Math.min(markLengthMm, item.widthMm * 0.35)
    const lenY = Math.min(markLengthMm, item.heightMm * 0.35)

    // 1. Corner Top-Left: ┌
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, left - offX)),
      y1Mm: Math.max(0, Math.min(maxH, top - offY)),
      x2Mm: Math.max(0, Math.min(maxW, left - offX + lenX)),
      y2Mm: Math.max(0, Math.min(maxH, top - offY)),
      orientation: 'horizontal'
    })
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, left - offX)),
      y1Mm: Math.max(0, Math.min(maxH, top - offY)),
      x2Mm: Math.max(0, Math.min(maxW, left - offX)),
      y2Mm: Math.max(0, Math.min(maxH, top - offY + lenY)),
      orientation: 'vertical'
    })

    // 2. Corner Top-Right: ┐
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, right + offX)),
      y1Mm: Math.max(0, Math.min(maxH, top - offY)),
      x2Mm: Math.max(0, Math.min(maxW, right + offX - lenX)),
      y2Mm: Math.max(0, Math.min(maxH, top - offY)),
      orientation: 'horizontal'
    })
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, right + offX)),
      y1Mm: Math.max(0, Math.min(maxH, top - offY)),
      x2Mm: Math.max(0, Math.min(maxW, right + offX)),
      y2Mm: Math.max(0, Math.min(maxH, top - offY + lenY)),
      orientation: 'vertical'
    })

    // 3. Corner Bottom-Left: └
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, left - offX)),
      y1Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      x2Mm: Math.max(0, Math.min(maxW, left - offX + lenX)),
      y2Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      orientation: 'horizontal'
    })
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, left - offX)),
      y1Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      x2Mm: Math.max(0, Math.min(maxW, left - offX)),
      y2Mm: Math.max(0, Math.min(maxH, bottom + offY - lenY)),
      orientation: 'vertical'
    })

    // 4. Corner Bottom-Right: ┘
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, right + offX)),
      y1Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      x2Mm: Math.max(0, Math.min(maxW, right + offX - lenX)),
      y2Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      orientation: 'horizontal'
    })
    rawMarks.push({
      x1Mm: Math.max(0, Math.min(maxW, right + offX)),
      y1Mm: Math.max(0, Math.min(maxH, bottom + offY)),
      x2Mm: Math.max(0, Math.min(maxW, right + offX)),
      y2Mm: Math.max(0, Math.min(maxH, bottom + offY - lenY)),
      orientation: 'vertical'
    })
  }

  // Filter garis yang panjangnya valid (> 0.2mm) dan tidak memotong bagian dalam foto manapun
  const validLengthMarks = rawMarks.filter((m) => {
    const len = Math.hypot(m.x2Mm - m.x1Mm, m.y2Mm - m.y1Mm)
    return len >= 0.2
  })

  const safeMarks = validLengthMarks.filter((mark) => !isLineInsideAnyPhoto(mark, items))

  return deduplicateMarks(safeMarks)
}

/**
 * Memeriksa apakah garis berada di dalam area foto manapun
 */
function isLineInsideAnyPhoto(line: CropMarkLine, items: LayoutItem[]): boolean {
  const minX = Math.min(line.x1Mm, line.x2Mm)
  const maxX = Math.max(line.x1Mm, line.x2Mm)
  const minY = Math.min(line.y1Mm, line.y2Mm)
  const maxY = Math.max(line.y1Mm, line.y2Mm)

  const eps = 0.01

  for (const item of items) {
    const pLeft = item.xMm + eps
    const pRight = item.xMm + item.widthMm - eps
    const pTop = item.yMm + eps
    const pBottom = item.yMm + item.heightMm - eps

    if (line.orientation === 'horizontal') {
      const y = line.y1Mm
      if (y >= pTop && y <= pBottom) {
        if (maxX > pLeft && minX < pRight) {
          return true
        }
      }
    } else {
      const x = line.x1Mm
      if (x >= pLeft && x <= pRight) {
        if (maxY > pTop && minY < pBottom) {
          return true
        }
      }
    }
  }

  return false
}

function deduplicateMarks(marks: CropMarkLine[]): CropMarkLine[] {
  const uniqueMarks: CropMarkLine[] = []
  const tolerance = 0.1

  for (const mark of marks) {
    const isDuplicate = uniqueMarks.some((existing) => {
      if (existing.orientation !== mark.orientation) return false
      const matchX1 = Math.abs(existing.x1Mm - mark.x1Mm) < tolerance
      const matchY1 = Math.abs(existing.y1Mm - mark.y1Mm) < tolerance
      const matchX2 = Math.abs(existing.x2Mm - mark.x2Mm) < tolerance
      const matchY2 = Math.abs(existing.y2Mm - mark.y2Mm) < tolerance
      return matchX1 && matchY1 && matchX2 && matchY2
    })

    if (!isDuplicate) {
      uniqueMarks.push(mark)
    }
  }

  return uniqueMarks
}
