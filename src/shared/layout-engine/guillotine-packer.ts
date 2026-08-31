import { RectMm, LayoutItem, UnplacedItem } from '../types'
import { PackingRequestItem, PackingResult } from './shelf-packer'

interface FreeRect extends RectMm {}

/**
 * 2D Guillotine / MaxRects Packing (PRD FR-07 - Mode Paling Hemat & Efisiensi Maksimal)
 * Memotong ruang bebas menjadi sub-persegi panjang guillotine lurus.
 */
export function packGuillotine(
  itemsToPack: PackingRequestItem[],
  printableArea: RectMm,
  gapMm: number = 2,
  allowRotation: boolean = false
): PackingResult {
  if (itemsToPack.length === 0) {
    return {
      placedItems: [],
      unplacedItems: [],
      usedBoundingBox: { x: printableArea.x, y: printableArea.y, width: 0, height: 0 },
      cutComplexity: 0
    }
  }

  // Urutkan item dari area terbesar atau sisi terpanjang
  const queue = [...itemsToPack].sort((a, b) => {
    const areaA = a.widthMm * a.heightMm
    const areaB = b.widthMm * b.heightMm
    if (areaB !== areaA) return areaB - areaA
    return b.heightMm - a.heightMm
  })

  const freeRects: FreeRect[] = [{ ...printableArea }]
  const placedItems: LayoutItem[] = []
  const unplacedMap: Map<string, UnplacedItem> = new Map()

  let minX = printableArea.x + printableArea.width
  let minY = printableArea.y + printableArea.height
  let maxX = printableArea.x
  let maxY = printableArea.y

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    let bestRectIndex = -1
    let bestRotation: 0 | 90 = 0
    let bestScore = Number.MAX_VALUE

    for (let r = 0; r < freeRects.length; r++) {
      const rect = freeRects[r]

      // Normal orientation
      if (item.widthMm <= rect.width && item.heightMm <= rect.height) {
        const leftoverW = rect.width - item.widthMm
        const leftoverH = rect.height - item.heightMm
        const shortSide = Math.min(leftoverW, leftoverH)
        if (shortSide < bestScore) {
          bestScore = shortSide
          bestRectIndex = r
          bestRotation = 0
        }
      }

      // Rotated 90 deg (if allowed)
      if (allowRotation && item.allowRotation) {
        if (item.heightMm <= rect.width && item.widthMm <= rect.height) {
          const leftoverW = rect.width - item.heightMm
          const leftoverH = rect.height - item.widthMm
          const shortSide = Math.min(leftoverW, leftoverH)
          if (shortSide < bestScore) {
            bestScore = shortSide
            bestRectIndex = r
            bestRotation = 90
          }
        }
      }
    }

    if (bestRectIndex !== -1) {
      const chosenRect = freeRects[bestRectIndex]
      const actualWidth = bestRotation === 90 ? item.heightMm : item.widthMm
      const actualHeight = bestRotation === 90 ? item.widthMm : item.heightMm

      const posX = chosenRect.x
      const posY = chosenRect.y

      placedItems.push({
        id: item.id,
        requestId: item.requestId,
        imageId: item.imageId,
        sourcePath: item.sourcePath,
        xMm: posX,
        yMm: posY,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        rotation: bestRotation,
        crop: item.crop,
        label: item.name
      })

      minX = Math.min(minX, posX)
      minY = Math.min(minY, posY)
      maxX = Math.max(maxX, posX + actualWidth)
      maxY = Math.max(maxY, posY + actualHeight)

      // Split guillotine ruang bebas
      freeRects.splice(bestRectIndex, 1)

      const rightWidth = chosenRect.width - actualWidth - gapMm
      const bottomHeight = chosenRect.height - actualHeight - gapMm

      if (rightWidth > 0) {
        freeRects.push({
          x: posX + actualWidth + gapMm,
          y: posY,
          width: rightWidth,
          height: actualHeight
        })
      }

      if (bottomHeight > 0) {
        freeRects.push({
          x: posX,
          y: posY + actualHeight + gapMm,
          width: chosenRect.width,
          height: bottomHeight
        })
      }
    } else {
      const unplaced = unplacedMap.get(item.requestId) || {
        requestId: item.requestId,
        presetId: item.presetId as any,
        name: item.name,
        count: 0,
        widthMm: item.widthMm,
        heightMm: item.heightMm
      }
      unplaced.count += 1
      unplacedMap.set(item.requestId, unplaced)
    }
  }

  const unplacedItems = Array.from(unplacedMap.values())
  const usedWidth = placedItems.length > 0 ? maxX - minX : 0
  const usedHeight = placedItems.length > 0 ? maxY - minY : 0

  return {
    placedItems,
    unplacedItems,
    usedBoundingBox: {
      x: placedItems.length > 0 ? minX : printableArea.x,
      y: placedItems.length > 0 ? minY : printableArea.y,
      width: usedWidth,
      height: usedHeight
    },
    cutComplexity: placedItems.length * 1.5
  }
}
