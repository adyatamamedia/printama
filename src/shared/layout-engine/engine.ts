import {
  PhotoRequest,
  PaperSettings,
  LayoutMode,
  LayoutResult,
  LayoutStrategy,
  RectMm,
  SourceImage,
  LayoutPage,
  UnplacedItem
} from '../types'
import { getPrintableArea, calculateLargestRemainder } from '../units/converter'
import { packShelf, PackingRequestItem, PackingResult } from './shelf-packer'
import { packGuillotine } from './guillotine-packer'
import { generateCropMarks } from './cropmarks'

export interface LayoutEngineOptions {
  requests: PhotoRequest[]
  paper: PaperSettings
  images: SourceImage[]
  gapMm?: number
  layoutMode?: LayoutMode
  cropMarkLengthMm?: number
  includeCropMarks?: boolean
}

/**
 * Mesin Layout Otomatis Printama (PRD FR-07, FR-08, FR-09)
 * Mendukung Multi-Lembar (Multi-Page Canvas) Otomatis
 */
export function generateLayoutRecommendations(options: LayoutEngineOptions): LayoutResult[] {
  const {
    requests,
    paper,
    images,
    gapMm = 2,
    layoutMode = 'as_ordered',
    cropMarkLengthMm = 2,
    includeCropMarks = true
  } = options

  const printableArea = getPrintableArea(paper)
  const isLandscape = paper.orientation === 'landscape'
  const effectivePaperWidthMm = isLandscape ? paper.heightMm : paper.widthMm
  const effectivePaperHeightMm = isLandscape ? paper.widthMm : paper.heightMm

  // Filter requests with quantity > 0
  const activeRequests = requests.filter((r) => r.quantity > 0)
  if (activeRequests.length === 0) {
    return []
  }

  // Siapkan daftar item individual untuk di-pack
  const imageMap = new Map(images.map((img) => [img.id, img]))
  const initialItemsToPack: PackingRequestItem[] = []

  let totalItemsRequested = 0
  for (const req of activeRequests) {
    const img = imageMap.get(req.imageId)
    const sourcePath = img ? img.filePath : ''
    for (let q = 0; q < req.quantity; q++) {
      totalItemsRequested++
      initialItemsToPack.push({
        id: `item-${req.id}-${q}`,
        requestId: req.id,
        imageId: req.imageId,
        sourcePath,
        presetId: req.presetId,
        name: req.name,
        widthMm: req.widthMm,
        heightMm: req.heightMm,
        crop: req.crop,
        allowRotation: false
      })
    }
  }

  // Handle layout mode expansion jika pengguna memilih mode genapkan baris / penuhi kertas
  const itemsToPack = expandItemsForLayoutMode(
    initialItemsToPack,
    layoutMode,
    printableArea,
    gapMm
  )

  // Jalankan multi-page packing untuk setiap strategi
  const results: LayoutResult[] = []

  // 1. Strategi "Mudah Dipotong" (Shelf packing teratur per baris tinggi)
  results.push(
    packMultiPageStrategy(
      'easy_cut',
      'Mudah Dipotong',
      'Ukuran dikelompokkan dalam baris lurus mendatar sehingga sangat cepat & mudah dipotong dengan cutter/paper trimmer.',
      (items) => packShelf(items, printableArea, gapMm, true),
      itemsToPack,
      totalItemsRequested,
      printableArea,
      effectivePaperWidthMm,
      effectivePaperHeightMm,
      gapMm,
      cropMarkLengthMm,
      includeCropMarks
    )
  )

  // 2. Strategi "Paling Hemat" (Guillotine 2D packing / MaxRects)
  results.push(
    packMultiPageStrategy(
      'efficient',
      'Paling Hemat',
      'Memanfaatkan area kertas semaksimal mungkin dengan susunan paling rapat.',
      (items) => packGuillotine(items, printableArea, gapMm, false),
      itemsToPack,
      totalItemsRequested,
      printableArea,
      effectivePaperWidthMm,
      effectivePaperHeightMm,
      gapMm,
      cropMarkLengthMm,
      includeCropMarks
    )
  )

  // 3. Strategi "Sisa Kertas Terbaik" (Shelf packing dengan penekanan rapat di tepi atas)
  results.push(
    packMultiPageStrategy(
      'best_remainder',
      'Sisa Kertas Terbaik',
      'Menyusun pas foto merapat di tepi atas untuk menyisakan satu bidang persegi panjang terbesar di bagian bawah.',
      (items) => packShelf(items, printableArea, gapMm, false),
      itemsToPack,
      totalItemsRequested,
      printableArea,
      effectivePaperWidthMm,
      effectivePaperHeightMm,
      gapMm,
      cropMarkLengthMm,
      includeCropMarks
    )
  )

  return results
}

function packMultiPageStrategy(
  strategy: LayoutStrategy,
  strategyTitle: string,
  strategyDescription: string,
  packerFn: (items: PackingRequestItem[]) => PackingResult,
  allItems: PackingRequestItem[],
  totalItemsRequested: number,
  printableArea: RectMm,
  effectivePaperWidthMm: number,
  effectivePaperHeightMm: number,
  gapMm: number,
  cropMarkLengthMm: number,
  includeCropMarks: boolean
): LayoutResult {
  const pages: LayoutPage[] = []
  let remainingItems = [...allItems]
  let pageIndex = 0
  const maxPages = 50 // Batas keamanan agar tidak looping tak berhingga

  const offsetGapMm = gapMm > 0 ? gapMm / 2 : 1.0

  while (remainingItems.length > 0 && pageIndex < maxPages) {
    const packing = packerFn(remainingItems)

    if (packing.placedItems.length === 0) {
      // Tidak ada satu pun item yang muat di lembar kosong (misal ukuran foto lebih besar dari kertas)
      break
    }

    const cropMarks = includeCropMarks
      ? generateCropMarks(packing.placedItems, cropMarkLengthMm, gapMm, offsetGapMm, {
          widthMm: effectivePaperWidthMm,
          heightMm: effectivePaperHeightMm
        })
      : []

    const remainderMm = calculateLargestRemainder(
      effectivePaperWidthMm,
      effectivePaperHeightMm,
      packing.usedBoundingBox
    )

    pages.push({
      pageIndex,
      placedItems: packing.placedItems,
      usedAreaMm: packing.usedBoundingBox,
      remainderMm,
      cropMarks
    })

    // Hapus HANYA item yang benar-benar berhasil ditempatkan di halaman ini menggunakan Set ID
    const placedIds = new Set(packing.placedItems.map((p) => p.id))
    remainingItems = remainingItems.filter((item) => !placedIds.has(item.id))
    pageIndex++
  }

  // Kumpulkan unplacedItems jika setelah semua halaman masih ada sisa
  const unplacedMap = new Map<string, UnplacedItem>()
  for (const item of remainingItems) {
    const existing = unplacedMap.get(item.presetId)
    if (existing) {
      existing.count++
    } else {
      unplacedMap.set(item.presetId, {
        requestId: item.requestId,
        presetId: item.presetId,
        name: item.name,
        count: 1,
        widthMm: item.widthMm,
        heightMm: item.heightMm
      })
    }
  }
  const unplacedItems = Array.from(unplacedMap.values())

  const allPlacedItems = pages.flatMap((p) => p.placedItems)
  const totalItemsPlaced = allPlacedItems.length
  const fitsAll = remainingItems.length === 0 && totalItemsPlaced >= totalItemsRequested

  // Hitung efisiensi rata-rata seluruh halaman
  const printableAreaMm2 = printableArea.width * printableArea.height
  const totalPlacedAreaMm2 = allPlacedItems.reduce(
    (acc, item) => acc + item.widthMm * item.heightMm,
    0
  )
  const totalAvailableAreaMm2 = printableAreaMm2 * Math.max(1, pages.length)
  const efficiencyPercent =
    totalAvailableAreaMm2 > 0
      ? Math.min(100, Math.round((totalPlacedAreaMm2 / totalAvailableAreaMm2) * 100))
      : 0

  const primaryPage = pages[0] || {
    pageIndex: 0,
    placedItems: [],
    usedAreaMm: { x: 0, y: 0, width: 0, height: 0 },
    cropMarks: []
  }

  return {
    id: `layout-${strategy}-${Date.now()}`,
    strategy,
    strategyTitle,
    strategyDescription,
    fitsAll,
    totalPages: Math.max(1, pages.length),
    pages: pages.length > 0 ? pages : [primaryPage],
    placedItems: allPlacedItems,
    unplacedItems,
    totalItemsRequested,
    totalItemsPlaced,
    usedAreaMm: primaryPage.usedAreaMm,
    remainderMm: primaryPage.remainderMm,
    efficiencyPercent,
    cutComplexity: 0,
    cropMarks: primaryPage.cropMarks,
    effectivePaperWidthMm,
    effectivePaperHeightMm
  }
}

function expandItemsForLayoutMode(
  baseItems: PackingRequestItem[],
  mode: LayoutMode,
  printableArea: RectMm,
  gapMm: number
): PackingRequestItem[] {
  if (mode === 'as_ordered' || baseItems.length === 0) {
    return baseItems
  }

  // Jika mode fill_paper, gandakan item secara proporsional hingga perkiraan luas kertas
  if (mode === 'fill_paper') {
    const totalArea = printableArea.width * printableArea.height
    let currentArea = baseItems.reduce((acc, it) => acc + (it.widthMm + gapMm) * (it.heightMm + gapMm), 0)
    const expanded = [...baseItems]

    let index = 0
    while (currentArea < totalArea * 0.95 && expanded.length < 100) {
      const template = baseItems[index % baseItems.length]
      expanded.push({
        ...template,
        id: `item-exp-${index}-${template.id}`
      })
      currentArea += (template.widthMm + gapMm) * (template.heightMm + gapMm)
      index++
    }
    return expanded
  }

  return baseItems
}
