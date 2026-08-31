import { PhotoRequest, RectMm, LayoutItem, UnplacedItem } from '../types'

export interface PackingRequestItem {
  id: string
  requestId: string
  imageId: string
  sourcePath: string
  presetId: string
  name: string
  widthMm: number
  heightMm: number
  crop: any
  allowRotation: boolean
}

export interface PackingResult {
  placedItems: LayoutItem[]
  unplacedItems: UnplacedItem[]
  usedBoundingBox: RectMm
  cutComplexity: number
}

/**
 * Shelf / Row Packing (PRD FR-07 - Mode Mudah Dipotong)
 * Mengelompokkan item berukuran sama dalam baris lurus mendatar.
 */
export function packShelf(
  itemsToPack: PackingRequestItem[],
  printableArea: RectMm,
  gapMm: number = 2,
  sortByHeight: boolean = true
): PackingResult {
  if (itemsToPack.length === 0) {
    return {
      placedItems: [],
      unplacedItems: [],
      usedBoundingBox: { x: printableArea.x, y: printableArea.y, width: 0, height: 0 },
      cutComplexity: 0
    }
  }

  // Clone and sort items (default: tallest first)
  const queue = [...itemsToPack]
  if (sortByHeight) {
    queue.sort((a, b) => {
      if (b.heightMm !== a.heightMm) return b.heightMm - a.heightMm
      return b.widthMm - a.widthMm
    })
  }

  const placedItems: LayoutItem[] = []
  const unplacedMap: Map<string, UnplacedItem> = new Map()

  let currentX = printableArea.x
  let currentY = printableArea.y
  let currentRowHeight = 0
  let rowsCount = 0

  let maxPlacedX = printableArea.x
  let maxPlacedY = printableArea.y

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    let itemW = item.widthMm
    let itemH = item.heightMm
    let rotation: 0 | 90 = 0

    // Cek apakah muat di baris sekarang
    const requiredWidth = placedItems.length === 0 || currentX === printableArea.x ? itemW : itemW
    const availableRowWidth = printableArea.x + printableArea.width - currentX

    if (itemW <= availableRowWidth) {
      // Cek apakah tinggi muat di printable area
      if (currentY + itemH <= printableArea.y + printableArea.height) {
        placedItems.push({
          id: item.id,
          requestId: item.requestId,
          imageId: item.imageId,
          sourcePath: item.sourcePath,
          xMm: currentX,
          yMm: currentY,
          widthMm: itemW,
          heightMm: itemH,
          rotation,
          crop: item.crop,
          label: item.name
        })

        currentRowHeight = Math.max(currentRowHeight, itemH)
        maxPlacedX = Math.max(maxPlacedX, currentX + itemW)
        maxPlacedY = Math.max(maxPlacedY, currentY + itemH)

        currentX += itemW + gapMm
        continue
      }
    }

    // Jika tidak muat di baris ini, buka baris baru
    if (currentRowHeight > 0) {
      currentY += currentRowHeight + gapMm
      currentX = printableArea.x
      currentRowHeight = 0
      rowsCount++
    }

    // Coba tempatkan di baris baru
    if (
      itemW <= printableArea.width &&
      currentY + itemH <= printableArea.y + printableArea.height
    ) {
      placedItems.push({
        id: item.id,
        requestId: item.requestId,
        imageId: item.imageId,
        sourcePath: item.sourcePath,
        xMm: currentX,
        yMm: currentY,
        widthMm: itemW,
        heightMm: itemH,
        rotation,
        crop: item.crop,
        label: item.name
      })

      currentRowHeight = itemH
      maxPlacedX = Math.max(maxPlacedX, currentX + itemW)
      maxPlacedY = Math.max(maxPlacedY, currentY + itemH)

      currentX += itemW + gapMm
    } else {
      // Tidak muat sama sekali
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
  const usedWidth = placedItems.length > 0 ? maxPlacedX - printableArea.x : 0
  const usedHeight = placedItems.length > 0 ? maxPlacedY - printableArea.y : 0

  return {
    placedItems,
    unplacedItems,
    usedBoundingBox: {
      x: printableArea.x,
      y: printableArea.y,
      width: usedWidth,
      height: usedHeight
    },
    cutComplexity: (rowsCount + 1) * 2
  }
}
