import { create } from 'zustand'

export interface PolaroidCropData {
  zoom: number
  xPercent: number
  yPercent: number
  rotation: number
}

export interface PolaroidPhotoAdjustments {
  brightness?: number
  contrast?: number
  saturation?: number
  sharpen?: number
  flipHorizontal?: boolean
  colorMode?: PolaroidColorMode
}

export interface PolaroidPhoto {
  id: string
  filePath: string
  base64: string
  caption?: string
  crop?: PolaroidCropData
  adjustments?: PolaroidPhotoAdjustments
}

export interface PolaroidPaper {
  id: 'a4' | 'f4'
  name: string
  widthMm: number
  heightMm: number
}

export const POLAROID_PAPERS: Record<'a4' | 'f4', PolaroidPaper> = {
  a4: {
    id: 'a4',
    name: 'A4 (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297
  },
  f4: {
    id: 'f4',
    name: 'F4 / Folio (215 × 330 mm)',
    widthMm: 215,
    heightMm: 330
  }
}

export type PolaroidGridPreset = '3x3' | '2x3' | '2x2' | '2x4' | '3x4'
export type PolaroidFrameColor = 'white' | 'black' | 'cream' | 'pink' | 'blue' | 'vintage' | 'custom'
export type PolaroidColorMode = 'color' | 'grayscale' | 'vintage'
export type PolaroidStyleScope = 'all' | 'selected'
export type PolaroidPageScope = 'current' | 'all'
export type PolaroidBgType = 'color' | 'pattern' | 'image'
export type PolaroidPatternType = 'dots' | 'stripes' | 'grid' | 'hearts' | 'stars' | 'zigzag'

export interface PolaroidPlacedSlot {
  slotIndex: number
  pageIndex: number
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  photo: PolaroidPhoto | null
}

export interface PolaroidPageConfig {
  gridPreset?: PolaroidGridPreset
  bgType?: PolaroidBgType
  customBgColor?: string
  bgPattern?: PolaroidPatternType
  patternColor?: string
  patternScale?: number
  customBgImage?: string | null
  frameColor?: PolaroidFrameColor
  colorMode?: PolaroidColorMode
  includeBorder?: boolean
  cropMarkColor?: string
}

export const DEFAULT_PAGE_CONFIG: PolaroidPageConfig = {
  gridPreset: '3x3',
  bgType: 'color',
  customBgColor: '#ffffff',
  bgPattern: 'dots',
  patternColor: '#cbd5e1',
  patternScale: 1.0,
  customBgImage: null,
  frameColor: 'white',
  colorMode: 'color',
  includeBorder: true,
  cropMarkColor: '#000000'
}

interface PolaroidState {
  pagePhotos: Record<number, PolaroidPhoto[]>
  photos: PolaroidPhoto[]
  paper: PolaroidPaper
  gridPreset: PolaroidGridPreset
  frameColor: PolaroidFrameColor
  colorMode: PolaroidColorMode
  styleScope: PolaroidStyleScope
  pageScope: PolaroidPageScope
  brightness: number
  contrast: number
  saturation: number
  sharpen: number
  flipHorizontal: boolean
  includeBorder: boolean
  gapHorizontalMm: number
  gapVerticalMm: number
  marginTopMm: number
  marginBottomMm: number
  marginLeftMm: number
  marginRightMm: number
  isAutoCenterHorizontal: boolean
  previewZoom: number
  activePageIndex: number
  manualPageCount: number

  // Konfigurasi Per Halaman / Canvas
  pageConfigs: Record<number, PolaroidPageConfig>

  // Kustomisasi Background & Pola Polaroid
  bgType: PolaroidBgType
  customBgColor: string
  bgPattern: PolaroidPatternType
  patternColor: string
  patternScale: number
  customBgImage: string | null // base64 / path gambar
  cropMarkColor: string

  // Dimensi kartu polaroid
  cardWidthMm: number
  cardHeightMm: number
  photoMarginMm: number
  photoChinMm: number

  // Actions
  addPhotos: (newPhotos: PolaroidPhoto[]) => void
  addPhotosToPage: (pageIndex: number, newPhotos: PolaroidPhoto[]) => void
  getPagePhotos: (pageIndex: number) => PolaroidPhoto[]
  removePhoto: (id: string) => void
  replacePhoto: (id: string, newPhotoData: { filePath: string; base64: string }) => void
  swapPhotos: (indexA: number, indexB: number) => void
  swapPhotosOnPage: (pageIndex: number, indexA: number, indexB: number) => void
  movePhoto: (fromIndex: number, toIndex: number) => void
  movePhotoOnPage: (pageIndex: number, fromIndex: number, toIndex: number) => void
  clearAllPhotos: (clearSlotsOnly?: boolean) => void
  clearPagePhotos: (pageIndex: number) => void
  duplicatePhotoToSlots: (photoId: string, count?: number) => void
  duplicatePhotoToCurrentSheet: (photoId: string, pageIndex: number) => void
  addNewPage: () => void
  removePage: (pageIndex: number) => void
  updatePhotoCaption: (id: string, caption: string) => void
  updatePhotoCrop: (id: string, crop: PolaroidCropData) => void
  updatePhotoAdjustments: (id: string, adjustments: Partial<PolaroidPhotoAdjustments>) => void
  updateAllPhotosAdjustments: (adjustments: Partial<PolaroidPhotoAdjustments>) => void
  applyPhotoAdjustmentsToAll: (sourcePhotoId: string) => void
  resetPhotoAdjustments: (id: string) => void
  setStyleScope: (scope: PolaroidStyleScope) => void
  setPageScope: (scope: PolaroidPageScope) => void
  setPaper: (paperId: 'a4' | 'f4') => void
  setGridPreset: (preset: PolaroidGridPreset) => void
  setFrameColor: (color: PolaroidFrameColor) => void
  setColorMode: (mode: PolaroidColorMode) => void
  setBrightness: (val: number) => void
  setContrast: (val: number) => void
  setSaturation: (val: number) => void
  setSharpen: (val: number) => void
  setFlipHorizontal: (val: boolean) => void
  resetStyleAdjustments: () => void
  setIncludeBorder: (val: boolean) => void
  setGapHorizontalMm: (val: number) => void
  setGapVerticalMm: (val: number) => void
  setPhotoMarginMm: (val: number) => void
  setPhotoChinMm: (val: number) => void

  setBgType: (type: PolaroidBgType) => void
  setCustomBgColor: (color: string) => void
  setBgPattern: (pattern: PolaroidPatternType) => void
  setPatternColor: (color: string) => void
  setPatternScale: (scale: number) => void
  setCustomBgImage: (img: string | null) => void
  setCropMarkColor: (color: string) => void

  getPageConfig: (pageIndex: number) => PolaroidPageConfig
  updateCurrentPageConfig: (config: Partial<PolaroidPageConfig>) => void
  applyCurrentPageConfigToAll: () => void

  setMarginTopMm: (val: number) => void
  setMarginBottomMm: (val: number) => void
  setMarginLeftMm: (val: number) => void
  setMarginRightMm: (val: number) => void
  setIsAutoCenterHorizontal: (val: boolean) => void
  setPreviewZoom: (val: number) => void
  setActivePageIndex: (index: number) => void

  // Helper selectors
  getGridDimensions: (pageIndex?: number) => { cols: number; rows: number; totalPerSheet: number }
  getCardDimensions: (pageIndex?: number) => {
    cardWidthMm: number
    cardHeightMm: number
    photoMarginMm: number
    photoChinMm: number
  }
  getPagePhotoRange: (pageIndex: number) => { startIndex: number; endIndex: number; count: number }
  getTotalPages: () => number
  getPlacedSlotsForPage: (pageIndex?: number) => PolaroidPlacedSlot[]
  getAllPlacedPages: () => PolaroidPlacedSlot[][]
}

export const usePolaroidStore = create<PolaroidState>((set, get) => ({
  pagePhotos: { 0: [] },
  photos: [],
  paper: POLAROID_PAPERS.a4,
  gridPreset: '3x3', // Default 9 foto per lembar
  frameColor: 'white',
  colorMode: 'color',
  styleScope: 'selected',
  pageScope: 'current',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  flipHorizontal: false,
  includeBorder: true,
  gapHorizontalMm: 0,
  gapVerticalMm: 0,
  marginTopMm: 5,
  marginBottomMm: 5,
  marginLeftMm: 5,
  marginRightMm: 5,
  isAutoCenterHorizontal: true,
  previewZoom: 100,
  activePageIndex: 0,
  manualPageCount: 1,

  pageConfigs: {},

  // Latar & Pola Default
  bgType: 'color',
  customBgColor: '#ffffff',
  bgPattern: 'dots',
  patternColor: '#cbd5e1',
  patternScale: 1.0,
  customBgImage: null,
  cropMarkColor: '#000000',

  // Standar Polaroid 2R aesthetic proporsional (60 × 90 mm)
  cardWidthMm: 60,
  cardHeightMm: 90,
  photoMarginMm: 4,
  photoChinMm: 14,

  getPagePhotos: (pageIndex) => {
    return get().pagePhotos[pageIndex] || []
  },

  addPhotos: (newPhotos) => {
    const activePage = get().activePageIndex
    get().addPhotosToPage(activePage, newPhotos)
  },

  addPhotosToPage: (startPageIndex, newPhotos) => {
    if (!newPhotos || newPhotos.length === 0) return

    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = { ...state.pagePhotos }
      const updatedPageConfigs: Record<number, PolaroidPageConfig> = { ...state.pageConfigs }

      let currentPage = startPageIndex
      let photosToDistribute = [...newPhotos]

      while (photosToDistribute.length > 0) {
        // Inisialisasi page config jika lembar baru
        if (!updatedPageConfigs[currentPage]) {
          updatedPageConfigs[currentPage] = {
            ...(updatedPageConfigs[startPageIndex] || DEFAULT_PAGE_CONFIG)
          }
        }

        // Dapatkan kapasitas grid untuk lembar ini
        const preset = updatedPageConfigs[currentPage]?.gridPreset || state.gridPreset
        let totalPerSheet = 9
        switch (preset) {
          case '2x2':
            totalPerSheet = 4
            break
          case '2x3':
            totalPerSheet = 6
            break
          case '2x4':
            totalPerSheet = 8
            break
          case '3x4':
            totalPerSheet = 12
            break
          case '3x3':
          default:
            totalPerSheet = 9
            break
        }

        const currentPhotosOnPage = updatedPagePhotos[currentPage] || []
        const availableSlots = Math.max(0, totalPerSheet - currentPhotosOnPage.length)

        if (availableSlots > 0) {
          const chunk = photosToDistribute.slice(0, availableSlots)
          updatedPagePhotos[currentPage] = [...currentPhotosOnPage, ...chunk]
          photosToDistribute = photosToDistribute.slice(availableSlots)
        }

        // Jika lembar saat ini sudah penuh dan masih ada sisa foto, lanjut ke lembar berikutnya
        if (photosToDistribute.length > 0) {
          currentPage++
        }
      }

      // Hitung total lembar baru
      const maxPageIdx = Math.max(
        ...Object.keys(updatedPagePhotos).map(Number),
        startPageIndex
      )
      const newPageCount = Math.max(state.manualPageCount || 1, maxPageIdx + 1)

      return {
        pagePhotos: updatedPagePhotos,
        pageConfigs: updatedPageConfigs,
        manualPageCount: newPageCount,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  removePhoto: (id) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).filter((p) => p.id !== id)
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  replacePhoto: (id, newPhotoData) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) =>
          p.id === id
            ? {
                ...p,
                filePath: newPhotoData.filePath,
                base64: newPhotoData.base64,
                crop: { zoom: 1, xPercent: 50, yPercent: 50, rotation: 0 },
                adjustments: undefined
              }
            : p
        )
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  swapPhotosOnPage: (pageIndex, indexA, indexB) => {
    set((state) => {
      const current = [...(state.pagePhotos[pageIndex] || [])]
      const total = current.length
      if (indexA < 0 || indexA >= total || indexB < 0 || indexB >= total || indexA === indexB) {
        return state
      }
      const temp = current[indexA]
      current[indexA] = current[indexB]
      current[indexB] = temp
      const updatedPagePhotos = {
        ...state.pagePhotos,
        [pageIndex]: current
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  swapPhotos: (indexA, indexB) => {
    get().swapPhotosOnPage(get().activePageIndex, indexA, indexB)
  },

  movePhotoOnPage: (pageIndex, fromIndex, toIndex) => {
    set((state) => {
      const current = [...(state.pagePhotos[pageIndex] || [])]
      const total = current.length
      if (fromIndex < 0 || fromIndex >= total || toIndex < 0 || toIndex >= total || fromIndex === toIndex) {
        return state
      }
      const [moved] = current.splice(fromIndex, 1)
      current.splice(toIndex, 0, moved)
      const updatedPagePhotos = {
        ...state.pagePhotos,
        [pageIndex]: current
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  movePhoto: (fromIndex, toIndex) => {
    get().movePhotoOnPage(get().activePageIndex, fromIndex, toIndex)
  },

  clearAllPhotos: () => {
    set({
      pagePhotos: { 0: [] },
      photos: [],
      activePageIndex: 0,
      manualPageCount: 1,
      pageConfigs: { 0: { ...DEFAULT_PAGE_CONFIG } },
      ...DEFAULT_PAGE_CONFIG
    })
  },

  clearPagePhotos: (pageIndex) => {
    set((state) => {
      const updatedPagePhotos = {
        ...state.pagePhotos,
        [pageIndex]: []
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  duplicatePhotoToSlots: (photoId, _count = 9) => {
    get().duplicatePhotoToCurrentSheet(photoId, get().activePageIndex)
  },

  duplicatePhotoToCurrentSheet: (photoId, pageIndex) => {
    const state = get()
    const allPhotos = Object.values(state.pagePhotos).flat()
    const target = allPhotos.find((p) => p.id === photoId)
    if (!target) return
    const grid = state.getGridDimensions(pageIndex)
    const count = grid.totalPerSheet || 9
    const duplicated: PolaroidPhoto[] = Array.from({ length: count }, (_, idx) => ({
      ...target,
      id: `${target.id}-copy-p${pageIndex}-${idx}-${Date.now()}`
    }))
    const updatedPagePhotos = {
      ...state.pagePhotos,
      [pageIndex]: duplicated
    }
    set({
      pagePhotos: updatedPagePhotos,
      photos: Object.values(updatedPagePhotos).flat()
    })
  },

  addNewPage: () => {
    const currentTotal = get().getTotalPages()
    const nextTotal = currentTotal + 1
    set((state) => ({
      manualPageCount: nextTotal,
      activePageIndex: currentTotal,
      pagePhotos: {
        ...state.pagePhotos,
        [currentTotal]: []
      },
      pageConfigs: {
        ...state.pageConfigs,
        [currentTotal]: { ...DEFAULT_PAGE_CONFIG }
      }
    }))
  },

  removePage: (pageIndex: number) => {
    const state = get()
    const total = state.getTotalPages()
    if (total <= 1) {
      state.clearPagePhotos(0)
      return
    }

    const newPagePhotos: Record<number, PolaroidPhoto[]> = {}
    const newConfigs: Record<number, PolaroidPageConfig> = {}
    let newIdx = 0
    for (let i = 0; i < total; i++) {
      if (i === pageIndex) continue
      newPagePhotos[newIdx] = state.pagePhotos[i] || []
      newConfigs[newIdx] = state.getPageConfig(i)
      newIdx++
    }

    const newActive = Math.min(state.activePageIndex, total - 2)
    set({
      manualPageCount: Math.max(1, total - 1),
      activePageIndex: Math.max(0, newActive),
      pagePhotos: newPagePhotos,
      photos: Object.values(newPagePhotos).flat(),
      pageConfigs: newConfigs
    })
  },

  updatePhotoCaption: (id, caption) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) => (p.id === id ? { ...p, caption } : p))
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  updatePhotoCrop: (id, crop) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) => (p.id === id ? { ...p, crop } : p))
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  updatePhotoAdjustments: (id, adjustments) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) =>
          p.id === id
            ? {
                ...p,
                adjustments: {
                  brightness: p.adjustments?.brightness ?? state.brightness,
                  contrast: p.adjustments?.contrast ?? state.contrast,
                  saturation: p.adjustments?.saturation ?? state.saturation,
                  sharpen: p.adjustments?.sharpen ?? state.sharpen,
                  flipHorizontal: p.adjustments?.flipHorizontal ?? state.flipHorizontal,
                  ...adjustments
                }
              }
            : p
        )
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  updateAllPhotosAdjustments: (adjustments) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) => ({
          ...p,
          adjustments: {
            ...p.adjustments,
            ...adjustments
          }
        }))
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  applyPhotoAdjustmentsToAll: (sourcePhotoId) => {
    const state = get()
    const allPhotos = Object.values(state.pagePhotos).flat()
    const source = allPhotos.find((p) => p.id === sourcePhotoId)
    if (!source || !source.adjustments) return
    state.updateAllPhotosAdjustments(source.adjustments)
  },

  resetPhotoAdjustments: (id) => {
    set((state) => {
      const updatedPagePhotos: Record<number, PolaroidPhoto[]> = {}
      for (const [pIdx, pList] of Object.entries(state.pagePhotos)) {
        updatedPagePhotos[Number(pIdx)] = (pList || []).map((p) =>
          p.id === id
            ? {
                ...p,
                adjustments: {
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  sharpen: 0,
                  flipHorizontal: false,
                  colorMode: 'color'
                }
              }
            : p
        )
      }
      return {
        pagePhotos: updatedPagePhotos,
        photos: Object.values(updatedPagePhotos).flat()
      }
    })
  },

  setStyleScope: (scope) => set({ styleScope: scope }),

  setPaper: (paperId) => {
    set({ paper: POLAROID_PAPERS[paperId] })
  },

  setPageScope: (scope) => set({ pageScope: scope }),

  getPageConfig: (pageIndex: number) => {
    const state = get()
    const custom = state.pageConfigs[pageIndex]
    if (custom) {
      return {
        gridPreset: custom.gridPreset ?? DEFAULT_PAGE_CONFIG.gridPreset!,
        bgType: custom.bgType ?? DEFAULT_PAGE_CONFIG.bgType!,
        customBgColor: custom.customBgColor ?? DEFAULT_PAGE_CONFIG.customBgColor!,
        bgPattern: custom.bgPattern ?? DEFAULT_PAGE_CONFIG.bgPattern!,
        patternColor: custom.patternColor ?? DEFAULT_PAGE_CONFIG.patternColor!,
        patternScale: custom.patternScale ?? DEFAULT_PAGE_CONFIG.patternScale!,
        customBgImage: custom.customBgImage !== undefined ? custom.customBgImage : DEFAULT_PAGE_CONFIG.customBgImage!,
        frameColor: custom.frameColor ?? DEFAULT_PAGE_CONFIG.frameColor!,
        colorMode: custom.colorMode ?? DEFAULT_PAGE_CONFIG.colorMode!,
        includeBorder: custom.includeBorder ?? DEFAULT_PAGE_CONFIG.includeBorder!,
        cropMarkColor: custom.cropMarkColor ?? DEFAULT_PAGE_CONFIG.cropMarkColor!
      }
    }
    return { ...DEFAULT_PAGE_CONFIG } as Required<PolaroidPageConfig>
  },

  updateCurrentPageConfig: (config: Partial<PolaroidPageConfig>) => {
    const state = get()
    const pIndex = state.activePageIndex
    const currentForActive = state.getPageConfig(pIndex)
    const mergedActive = { ...currentForActive, ...config }

    set((s) => ({
      ...config,
      pageConfigs: {
        ...s.pageConfigs,
        [pIndex]: mergedActive
      }
    }))
  },

  applyCurrentPageConfigToAll: () => {
    const state = get()
    const currentCfg = state.getPageConfig(state.activePageIndex)
    const updatedPages: Record<number, PolaroidPageConfig> = {}
    const total = state.getTotalPages()
    for (let i = 0; i < total; i++) {
      updatedPages[i] = { ...currentCfg }
    }
    set({
      ...currentCfg,
      pageConfigs: updatedPages
    })
  },

  setGridPreset: (preset) => {
    get().updateCurrentPageConfig({ gridPreset: preset })
  },

  setFrameColor: (color) => {
    get().updateCurrentPageConfig({ frameColor: color })
  },
  setColorMode: (mode) => {
    get().updateCurrentPageConfig({ colorMode: mode })
  },
  setBrightness: (val) => {
    const clamped = Math.max(-100, Math.min(100, val))
    set({ brightness: clamped })
  },
  setContrast: (val) => {
    const clamped = Math.max(-100, Math.min(100, val))
    set({ contrast: clamped })
  },
  setSaturation: (val) => {
    const clamped = Math.max(-100, Math.min(100, val))
    set({ saturation: clamped })
  },
  setSharpen: (val) => {
    const clamped = Math.max(0, Math.min(100, val))
    set({ sharpen: clamped })
  },
  setFlipHorizontal: (val) => set({ flipHorizontal: val }),
  resetStyleAdjustments: () =>
    set((state) => ({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpen: 0,
      flipHorizontal: false,
      photos: state.photos.map((p) => ({
        ...p,
        adjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          sharpen: 0,
          flipHorizontal: false
        }
      }))
    })),
  setIncludeBorder: (val) => {
    get().updateCurrentPageConfig({ includeBorder: val })
  },
  setGapHorizontalMm: (val) => set({ gapHorizontalMm: Math.max(0, Math.min(30, val)) }),
  setGapVerticalMm: (val) => set({ gapVerticalMm: Math.max(0, Math.min(30, val)) }),
  setPhotoMarginMm: (val) => set({ photoMarginMm: Math.max(0.5, Math.min(25, val)) }),
  setPhotoChinMm: (val) => set({ photoChinMm: Math.max(2, Math.min(40, val)) }),

  setBgType: (type) => {
    get().updateCurrentPageConfig({ bgType: type })
  },
  setCustomBgColor: (color) => {
    get().updateCurrentPageConfig({ customBgColor: color })
  },
  setBgPattern: (pattern) => {
    get().updateCurrentPageConfig({ bgPattern: pattern })
  },
  setPatternColor: (color) => {
    get().updateCurrentPageConfig({ patternColor: color })
  },
  setPatternScale: (scale) => {
    const clamped = Math.max(0.2, Math.min(3.0, scale))
    get().updateCurrentPageConfig({ patternScale: clamped })
  },
  setCustomBgImage: (img) => {
    get().updateCurrentPageConfig({ customBgImage: img })
  },
  setCropMarkColor: (color) => {
    get().updateCurrentPageConfig({ cropMarkColor: color })
  },

  setMarginTopMm: (val) => set({ marginTopMm: Math.max(0, Math.min(100, val)) }),
  setMarginBottomMm: (val) => set({ marginBottomMm: Math.max(0, Math.min(100, val)) }),
  setMarginLeftMm: (val) => set({ marginLeftMm: Math.max(0, Math.min(100, val)) }),
  setMarginRightMm: (val) => set({ marginRightMm: Math.max(0, Math.min(100, val)) }),
  setIsAutoCenterHorizontal: (val) => set({ isAutoCenterHorizontal: val }),
  setPreviewZoom: (val) => set({ previewZoom: Math.max(25, Math.min(300, val)) }),
  setActivePageIndex: (index) => {
    const targetIndex = Math.max(0, index)
    const state = get()
    const cfg = state.getPageConfig(targetIndex)
    set({
      activePageIndex: targetIndex,
      gridPreset: cfg.gridPreset || state.gridPreset,
      bgType: cfg.bgType || state.bgType,
      customBgColor: cfg.customBgColor || state.customBgColor,
      bgPattern: cfg.bgPattern || state.bgPattern,
      patternColor: cfg.patternColor || state.patternColor,
      patternScale: cfg.patternScale || state.patternScale,
      customBgImage: cfg.customBgImage !== undefined ? cfg.customBgImage : state.customBgImage,
      frameColor: cfg.frameColor || state.frameColor,
      colorMode: cfg.colorMode || state.colorMode,
      includeBorder: cfg.includeBorder !== undefined ? cfg.includeBorder : state.includeBorder,
      cropMarkColor: cfg.cropMarkColor || state.cropMarkColor
    })
  },

  getGridDimensions: (pageIndex?: number) => {
    const state = get()
    const pIndex = pageIndex !== undefined ? pageIndex : state.activePageIndex
    const preset = state.getPageConfig(pIndex).gridPreset || state.gridPreset
    switch (preset) {
      case '2x2':
        return { cols: 2, rows: 2, totalPerSheet: 4 }
      case '2x3':
        return { cols: 2, rows: 3, totalPerSheet: 6 }
      case '2x4':
        return { cols: 2, rows: 4, totalPerSheet: 8 }
      case '3x4':
        return { cols: 3, rows: 4, totalPerSheet: 12 }
      case '3x3':
      default:
        return { cols: 3, rows: 3, totalPerSheet: 9 }
    }
  },

  getCardDimensions: (pageIndex?: number) => {
    const state = get()
    const { cols, rows } = state.getGridDimensions(pageIndex)
    const paperW = state.paper.widthMm
    const paperH = state.paper.heightMm

    // Margin horizontal (Pinggir Kiri & Kanan Kertas)
    const marginL = Math.max(0, state.marginLeftMm)
    const marginR = state.isAutoCenterHorizontal ? marginL : Math.max(0, state.marginRightMm)

    // Margin vertikal (Atas & Bawah Kertas)
    const marginT = Math.max(0, state.marginTopMm)
    const marginB = Math.max(0, state.marginBottomMm)

    // Maksimalkan penuh area cetak di dalam batas margin (kartu selalu nempel tanpa renggang)
    const availW = Math.max(20, paperW - marginL - marginR)
    const availH = Math.max(20, paperH - marginT - marginB)

    const cardW = Math.round((availW / cols) * 10) / 10
    const cardH = Math.round((availH / rows) * 10) / 10

    const photoMarginMm = state.photoMarginMm !== undefined ? state.photoMarginMm : 4
    const photoChinMm = state.photoChinMm !== undefined ? state.photoChinMm : 14

    return { cardWidthMm: cardW, cardHeightMm: cardH, photoMarginMm, photoChinMm }
  },

  getPagePhotoRange: (pageIndex: number) => {
    const state = get()
    let startIndex = 0
    for (let i = 0; i < pageIndex; i++) {
      const grid = state.getGridDimensions(i)
      startIndex += grid.totalPerSheet
    }
    const currentGrid = state.getGridDimensions(pageIndex)
    return {
      startIndex,
      endIndex: startIndex + currentGrid.totalPerSheet,
      count: currentGrid.totalPerSheet
    }
  },

  getTotalPages: () => {
    const state = get()
    const photoPages = Object.keys(state.pagePhotos || {})
      .map(Number)
      .filter((p) => (state.pagePhotos[p] || []).length > 0)
    const maxPhotoPage = photoPages.length > 0 ? Math.max(...photoPages) : -1
    const configPages = Object.keys(state.pageConfigs || {}).map(Number)
    const maxConfigPage = configPages.length > 0 ? Math.max(...configPages) : -1
    const computed = Math.max(maxPhotoPage + 1, maxConfigPage + 1, state.manualPageCount || 1, 1)
    return computed
  },

  getPlacedSlotsForPage: (pageIndex?: number) => {
    const state = get()
    const pIndex = pageIndex !== undefined ? pageIndex : state.activePageIndex
    const { cols, rows } = state.getGridDimensions(pIndex)
    const { cardWidthMm, cardHeightMm } = state.getCardDimensions(pIndex)
    const pagePhotoList = state.pagePhotos[pIndex] || []

    const cardW = cardWidthMm
    const cardH = cardHeightMm
    const paperW = state.paper.widthMm
    const paperH = state.paper.heightMm

    const totalGridWidth = cols * cardW
    const totalGridHeight = rows * cardH

    // Posisi X awal (Kiri)
    const startX = state.isAutoCenterHorizontal
      ? Math.max(0, (paperW - totalGridWidth) / 2)
      : Math.max(0, state.marginLeftMm)

    // Posisi Y awal (Atas)
    const startY = Math.max(0, state.marginTopMm)

    const slots: PolaroidPlacedSlot[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c
        const photo = slotIdx < pagePhotoList.length ? pagePhotoList[slotIdx] : null

        const xMm = startX + c * cardW
        const yMm = startY + r * cardH

        slots.push({
          slotIndex: slotIdx,
          pageIndex: pIndex,
          xMm,
          yMm,
          widthMm: cardW,
          heightMm: cardH,
          photo
        })
      }
    }

    return slots
  },

  getAllPlacedPages: () => {
    const totalPages = get().getTotalPages()
    const allPages: PolaroidPlacedSlot[][] = []
    for (let p = 0; p < totalPages; p++) {
      allPages.push(get().getPlacedSlotsForPage(p))
    }
    return allPages
  }
}))
