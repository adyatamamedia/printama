import { describe, it, expect } from 'vitest'
import {
  mmToPixel,
  pixelToMm,
  calculateLineCapacity,
  calculateLengthUsed,
  getPrintableArea,
  calculateLargestRemainder
} from '../src/shared/units/converter'
import { generateLayoutRecommendations } from '../src/shared/layout-engine/engine'
import { generateCropMarks } from '../src/shared/layout-engine/cropmarks'
import { DEFAULT_PAPER_PRESETS } from '../src/shared/constants/presets'
import { PhotoRequest, SourceImage, PaperSettings } from '../src/shared/types'

describe('Physical Unit Converter', () => {
  it('converts mm to 300 DPI pixels accurately', () => {
    // 25.4 mm = 1 inch = 300 pixels @ 300 DPI
    expect(mmToPixel(25.4, 300)).toBe(300)

    // A4 width: 210 mm -> (210 / 25.4) * 300 = 2480.31 -> 2480 px
    expect(mmToPixel(210, 300)).toBe(2480)

    // A4 height: 297 mm -> (297 / 25.4) * 300 = 3507.87 -> 3508 px
    expect(mmToPixel(297, 300)).toBe(3508)
  })

  it('converts pixels back to mm', () => {
    expect(pixelToMm(300, 300)).toBeCloseTo(25.4, 1)
  })
})

describe('Row Capacity Calculation (Standar Resmi Pas Foto Indonesia)', () => {
  it('calculates exact 8 items of 2x3 (21.6 mm) in A4 row with 5mm margin and 2mm gap', () => {
    // A4 width: 210 mm. Left margin: 5mm, Right margin: 5mm -> available = 200 mm
    const availableWidth = 200
    const photoWidth = 21.6 // 2x3 portrait width resmi
    const gap = 2

    // Formula: floor((200 + 2) / (21.6 + 2)) = floor(202 / 23.6) = 8
    const capacity = calculateLineCapacity(availableWidth, photoWidth, gap)
    expect(capacity).toBe(8)

    // 8 items width = 8 * 21.6 + 7 * 2 = 172.8 + 14 = 186.8 mm <= 200 mm
    const used = calculateLengthUsed(capacity, photoWidth, gap)
    expect(used).toBeCloseTo(186.8, 1)
    expect(used).toBeLessThanOrEqual(availableWidth)
  })

  it('calculates exact 6 items of 3x4 (27.9 mm) in A4 row', () => {
    const availableWidth = 200
    const photoWidth = 27.9
    const gap = 2
    // floor((200 + 2) / (27.9 + 2)) = floor(202 / 29.9) = 6
    expect(calculateLineCapacity(availableWidth, photoWidth, gap)).toBe(6)
    // 6 * 27.9 + 5 * 2 = 167.4 + 10 = 177.4 mm
    expect(calculateLengthUsed(6, photoWidth, gap)).toBeCloseTo(177.4, 1)
  })

  it('calculates exact 5 items of 4x6 (38.1 mm) in A4 row', () => {
    const availableWidth = 200
    const photoWidth = 38.1
    const gap = 2
    // floor((200 + 2) / (38.1 + 2)) = floor(202 / 40.1) = 5
    expect(calculateLineCapacity(availableWidth, photoWidth, gap)).toBe(5)
    // 5 * 38.1 + 4 * 2 = 190.5 + 8 = 198.5 mm
    expect(calculateLengthUsed(5, photoWidth, gap)).toBeCloseTo(198.5, 1)
  })
})

describe('Layout Engine Recommendations', () => {
  const mockImage: SourceImage = {
    id: 'img-1',
    filePath: 'C:/photos/test.jpg',
    fileName: 'test.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    widthPx: 1200,
    heightPx: 1600,
    thumbnailUrl: 'data:image/jpeg;base64,...'
  }

  const a4Paper: PaperSettings = DEFAULT_PAPER_PRESETS.find((p) => p.presetId === 'A4')!

  it('produces layout recommendations for standard mixed package on A4', () => {
    const requests: PhotoRequest[] = [
      {
        id: 'req-1',
        imageId: 'img-1',
        presetId: '2x3',
        name: '2×3 cm',
        widthMm: 21.6,
        heightMm: 27.9,
        quantity: 4,
        crop: { xPercent: 50, yPercent: 50, zoom: 1, aspectRatio: 21.6 / 27.9 }
      },
      {
        id: 'req-2',
        imageId: 'img-1',
        presetId: '3x4',
        name: '3×4 cm',
        widthMm: 27.9,
        heightMm: 38.1,
        quantity: 4,
        crop: { xPercent: 50, yPercent: 50, zoom: 1, aspectRatio: 27.9 / 38.1 }
      },
      {
        id: 'req-3',
        imageId: 'img-1',
        presetId: '4x6',
        name: '4×6 cm',
        widthMm: 38.1,
        heightMm: 55.9,
        quantity: 2,
        crop: { xPercent: 50, yPercent: 50, zoom: 1, aspectRatio: 38.1 / 55.9 }
      }
    ]

    const recommendations = generateLayoutRecommendations({
      requests,
      paper: a4Paper,
      images: [mockImage],
      gapMm: 2
    })

    expect(recommendations.length).toBeGreaterThan(0)
    const firstResult = recommendations[0]
    expect(firstResult.fitsAll).toBe(true)
    expect(firstResult.totalItemsPlaced).toBe(10) // 4 + 4 + 2 = 10
    expect(firstResult.unplacedItems.length).toBe(0)
    expect(firstResult.placedItems.length).toBe(10)
    expect(firstResult.remainderMm).toBeDefined()
    expect(firstResult.cropMarks.length).toBeGreaterThan(0)
  })

  it('flags overflow when paper size is too small for requested items', () => {
    const tinyPaper: PaperSettings = {
      presetId: 'custom',
      name: 'Tiny Paper',
      widthMm: 50,
      heightMm: 50,
      marginTopMm: 5,
      marginRightMm: 5,
      marginBottomMm: 5,
      marginLeftMm: 5,
      orientation: 'portrait',
      feedAlignment: 'center'
    }

    const requests: PhotoRequest[] = [
      {
        id: 'req-big',
        imageId: 'img-1',
        presetId: '4x6',
        name: '4×6 cm',
        widthMm: 40,
        heightMm: 60, // Exceeds printable height (50 - 10 = 40mm)
        quantity: 2,
        crop: { xPercent: 50, yPercent: 50, zoom: 1, aspectRatio: 4 / 6 }
      }
    ]

    const recommendations = generateLayoutRecommendations({
      requests,
      paper: tinyPaper,
      images: [mockImage],
      gapMm: 2
    })

    expect(recommendations.length).toBeGreaterThan(0)
    const result = recommendations[0]
    expect(result.fitsAll).toBe(false)
    expect(result.unplacedItems.length).toBeGreaterThan(0)
  })
})

describe('Crop Marks & Paper Remainder', () => {
  it('generates corner bracket crop marks (┌ ┐ └ ┘) with 1.0mm offset (gap / 2)', () => {
    const mockPlacedItems = [
      {
        id: '1',
        requestId: 'r1',
        imageId: 'img1',
        sourcePath: '',
        xMm: 10,
        yMm: 10,
        widthMm: 20,
        heightMm: 30,
        rotation: 0 as const,
        crop: {} as any,
        label: '2x3'
      }
    ]

    const marks = generateCropMarks(mockPlacedItems, 2.5, 2, 1.0)
    expect(marks.length).toBe(8) // 4 corners * 2 legs each = 8 lines

    // Top-Left corner: ┌ at (x = 10 - 1.0 = 9.0, y = 10 - 1.0 = 9.0)
    // Horizontal line: y = 9.0, from x = 9.0 to x = 12.5
    const topHMark = marks.find((m) => Math.abs(m.y1Mm - 9.0) < 0.1 && m.orientation === 'horizontal')
    expect(topHMark).toBeDefined()
    expect(topHMark?.x1Mm).toBeCloseTo(9.0, 0.1)
    expect(topHMark?.x2Mm).toBeCloseTo(12.5, 0.1)

    // Vertical line: x = 9.0, from y = 9.0 to y = 12.5
    const leftVMark = marks.find((m) => Math.abs(m.x1Mm - 9.0) < 0.1 && m.orientation === 'vertical')
    expect(leftVMark).toBeDefined()
    expect(leftVMark?.y1Mm).toBeCloseTo(9.0, 0.1)
    expect(leftVMark?.y2Mm).toBeCloseTo(12.5, 0.1)
  })

  it('never draws crop marks that overlap or penetrate adjacent photos of different sizes', () => {
    const mixedItems = [
      {
        id: '1',
        requestId: 'r1',
        imageId: 'img1',
        sourcePath: '',
        xMm: 10,
        yMm: 10,
        widthMm: 40,
        heightMm: 60,
        rotation: 0 as const,
        crop: {} as any,
        label: '4x6'
      },
      {
        id: '2',
        requestId: 'r2',
        imageId: 'img1',
        sourcePath: '',
        xMm: 52,
        yMm: 10,
        widthMm: 30,
        heightMm: 40,
        rotation: 0 as const,
        crop: {} as any,
        label: '3x4'
      }
    ]

    const marks = generateCropMarks(mixedItems, 2.5, 2, 0.5)

    for (const mark of marks) {
      const minX = Math.min(mark.x1Mm, mark.x2Mm)
      const maxX = Math.max(mark.x1Mm, mark.x2Mm)
      const minY = Math.min(mark.y1Mm, mark.y2Mm)
      const maxY = Math.max(mark.y1Mm, mark.y2Mm)

      for (const item of mixedItems) {
        const insideX = maxX > item.xMm + 0.05 && minX < item.xMm + item.widthMm - 0.05
        const insideY = maxY > item.yMm + 0.05 && minY < item.yMm + item.heightMm - 0.05
        expect(insideX && insideY).toBe(false)
      }
    }
  })
})
