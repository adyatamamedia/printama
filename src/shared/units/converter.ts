import { PaperSettings, RectMm } from '../types'

export const MM_PER_INCH = 25.4

/**
 * Konversi milimeter ke pixel pada DPI tertentu (default 300 DPI untuk render produksi).
 * Pembulatan dilakukan saat output pixel diperlukan.
 */
export function mmToPixel(mm: number, dpi: number = 300): number {
  return Math.round((mm / MM_PER_INCH) * dpi)
}

/**
 * Konversi milimeter ke pixel desimal presisi (tanpa pembulatan).
 */
export function mmToPixelFloat(mm: number, dpi: number = 300): number {
  return (mm / MM_PER_INCH) * dpi
}

/**
 * Konversi pixel ke milimeter berdasarkan DPI.
 */
export function pixelToMm(pixel: number, dpi: number = 300): number {
  return (pixel / dpi) * MM_PER_INCH
}

/**
 * Menghitung printable area (area fisik yang dapat dicetak setelah dikurangi margin)
 */
export function getPrintableArea(paper: PaperSettings): RectMm {
  const isLandscape = paper.orientation === 'landscape'
  const width = isLandscape ? paper.heightMm : paper.widthMm
  const height = isLandscape ? paper.widthMm : paper.heightMm

  const x = paper.marginLeftMm
  const y = paper.marginTopMm
  const printableWidth = Math.max(0, width - paper.marginLeftMm - paper.marginRightMm)
  const printableHeight = Math.max(0, height - paper.marginTopMm - paper.marginBottomMm)

  return {
    x,
    y,
    width: printableWidth,
    height: printableHeight
  }
}

/**
 * Menghitung kapasitas item maksimal dalam 1 baris/kolom fisik
 * Rumus PRD FR-06: capacity = floor((availableLength + gap) / (itemLength + gap))
 */
export function calculateLineCapacity(availableLength: number, itemLength: number, gap: number = 2): number {
  if (availableLength <= 0 || itemLength <= 0) return 0
  if (availableLength < itemLength) return 0
  return Math.floor((availableLength + gap) / (itemLength + gap))
}

/**
 * Menghitung panjang terpakai untuk sejumlah n item dengan gap di antaranya
 */
export function calculateLengthUsed(count: number, itemLength: number, gap: number = 2): number {
  if (count <= 0) return 0
  return count * itemLength + (count - 1) * gap
}

/**
 * Menghitung sisa area persegi panjang terbesar yang belum terpakai (bidang utuh)
 */
export function calculateLargestRemainder(
  effectivePaperWidth: number,
  effectivePaperHeight: number,
  usedBoundingBox: RectMm
): RectMm | undefined {
  if (usedBoundingBox.width <= 0 || usedBoundingBox.height <= 0) {
    return {
      x: 0,
      y: 0,
      width: effectivePaperWidth,
      height: effectivePaperHeight
    }
  }

  // Sisa vertikal di bagian bawah (jika disusun dari atas)
  const verticalRemainderHeight = Math.max(0, effectivePaperHeight - (usedBoundingBox.y + usedBoundingBox.height))
  const verticalRemainderWidth = effectivePaperWidth
  const verticalArea = verticalRemainderWidth * verticalRemainderHeight

  // Sisa horizontal di bagian kanan (jika ada ruang kosong lebar penuh tinggi)
  const horizontalRemainderWidth = Math.max(0, effectivePaperWidth - (usedBoundingBox.x + usedBoundingBox.width))
  const horizontalRemainderHeight = effectivePaperHeight
  const horizontalArea = horizontalRemainderWidth * horizontalRemainderHeight

  if (verticalArea >= horizontalArea && verticalRemainderHeight > 10) {
    return {
      x: 0,
      y: usedBoundingBox.y + usedBoundingBox.height,
      width: verticalRemainderWidth,
      height: verticalRemainderHeight
    }
  } else if (horizontalRemainderWidth > 10) {
    return {
      x: usedBoundingBox.x + usedBoundingBox.width,
      y: 0,
      width: horizontalRemainderWidth,
      height: horizontalRemainderHeight
    }
  }

  return undefined
}
