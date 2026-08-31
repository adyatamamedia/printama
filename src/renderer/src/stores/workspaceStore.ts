import { create } from 'zustand'
import {
  SourceImage,
  ImageAdjustments,
  PhotoColorMode,
  PhotoRequest,
  PaperSettings,
  LayoutMode,
  LayoutResult,
  PhotoPresetId,
  PaperPresetId
} from '../../../shared/types'
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_PAPER_PRESETS,
  DEFAULT_PACKAGE_PRESETS,
  PHOTO_SIZE_PRESETS
} from '../../../shared/constants/presets'
import { generateLayoutRecommendations } from '../../../shared/layout-engine'

export type PrintTargetMode = 'single' | 'multi'

interface WorkspaceState {
  images: SourceImage[]
  selectedImageId: string | null
  selectedItemId: string | null
  adjustments: ImageAdjustments
  adjustmentsByImage: Record<string, Partial<ImageAdjustments>>
  itemAdjustments: Record<string, Partial<ImageAdjustments>>
  colorModeByPresetAndImage: Record<string, PhotoColorMode>
  requests: PhotoRequest[] // Active requests for currently selected image
  photoRequestsByImage: Record<string, PhotoRequest[]> // Stored requests per image ID
  printMode: PrintTargetMode
  paper: PaperSettings
  gapMm: number
  layoutMode: LayoutMode
  cropMarkLengthMm: number
  includeCropMarks: boolean
  recommendations: LayoutResult[]
  selectedRecommendationIndex: number
  activePageIndex: number // Halaman kanvas yang sedang aktif (0-indexed)

  // Zoom & View
  previewZoom: number // 100 = 100%

  // Actions
  setPrintMode: (mode: PrintTargetMode) => void
  setActivePageIndex: (index: number) => void
  setImages: (images: SourceImage[]) => void
  addImages: (images: SourceImage[]) => void
  removeImage: (id: string) => void
  clearAllImages: () => void
  setSelectedImageId: (id: string | null) => void
  setSelectedItemId: (id: string | null) => void

  setAdjustments: (adjustments: Partial<ImageAdjustments>) => void
  resetAdjustments: () => void
  applyCurrentAdjustmentsToAll: () => void
  applyAdjustmentsToPreset: (presetId: PhotoPresetId, specificAdj?: Partial<ImageAdjustments>, targetImageId?: string | null) => void

  updateRequestCrop: (
    presetId: PhotoPresetId,
    crop: { xPercent?: number; yPercent?: number; zoom?: number }
  ) => void
  updateRequestQuantity: (presetId: PhotoPresetId, quantity: number) => void
  updateRequestQuantityForAll: (presetId: PhotoPresetId, quantity: number) => void
  applyPackagePreset: (presetId: string) => void
  applyPackagePresetToAll: (presetId: string) => void
  applyCurrentRequestsToAll: () => void

  setPaperPreset: (presetId: PaperPresetId) => void
  updatePaperSettings: (paper: Partial<PaperSettings>) => void
  setGapMm: (gap: number) => void
  setLayoutMode: (mode: LayoutMode) => void
  setIncludeCropMarks: (include: boolean) => void
  setSelectedRecommendationIndex: (index: number) => void

  setPreviewZoom: (zoom: number) => void
  recalculateLayout: () => void
  usePaperRemainder: () => void
  resetWorkspace: () => void
}

const defaultA4 = DEFAULT_PAPER_PRESETS[0]

function createDefaultRequestsForImage(imageId: string = 'default'): PhotoRequest[] {
  return PHOTO_SIZE_PRESETS.map((preset) => ({
    id: `req-${imageId}-${preset.id}`,
    imageId,
    presetId: preset.id,
    name: preset.name,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    quantity: preset.id === '2x3' ? 4 : preset.id === '3x4' ? 3 : 5, // default paket Standar (4x 2x3, 3x 3x4, 5x 4x6)
    crop: {
      xPercent: 50,
      yPercent: 50,
      zoom: 1,
      aspectRatio: preset.aspectRatio
    }
  }))
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  images: [],
  selectedImageId: null,
  selectedItemId: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  adjustmentsByImage: {},
  itemAdjustments: {},
  colorModeByPresetAndImage: {},
  requests: createDefaultRequestsForImage('default'),
  photoRequestsByImage: { default: createDefaultRequestsForImage('default') },
  printMode: 'single',
  paper: { ...defaultA4 },
  gapMm: 2,
  layoutMode: 'as_ordered',
  cropMarkLengthMm: 2,
  includeCropMarks: true,
  recommendations: [],
  selectedRecommendationIndex: 0,
  activePageIndex: 0,
  previewZoom: 100,

  setPrintMode: (printMode) => {
    set({ printMode })
    get().recalculateLayout()
  },

  setActivePageIndex: (activePageIndex) => {
    set({ activePageIndex })
  },

  setImages: (images) => {
    const photoRequestsByImage: Record<string, PhotoRequest[]> = {}
    images.forEach((img) => {
      photoRequestsByImage[img.id] = createDefaultRequestsForImage(img.id)
    })
    const selectedImageId = images.length > 0 ? images[0].id : null
    const requests = selectedImageId
      ? photoRequestsByImage[selectedImageId]
      : createDefaultRequestsForImage('default')

    set({ images, selectedImageId, selectedItemId: null, requests, photoRequestsByImage })
    get().recalculateLayout()
  },

  addImages: (newImages) => {
    const existing = get().images
    const updated = [...existing, ...newImages]
    const photoRequestsByImage = { ...get().photoRequestsByImage }

    newImages.forEach((img) => {
      if (!photoRequestsByImage[img.id]) {
        photoRequestsByImage[img.id] = createDefaultRequestsForImage(img.id)
      }
    })

    const selectedImageId = get().selectedImageId || (updated.length > 0 ? updated[0].id : null)
    const requests = selectedImageId
      ? photoRequestsByImage[selectedImageId]
      : createDefaultRequestsForImage('default')

    set({ images: updated, selectedImageId, requests, photoRequestsByImage })
    get().recalculateLayout()
  },

  removeImage: (id) => {
    const updated = get().images.filter((img) => img.id !== id)
    const selectedImageId = updated.length > 0 ? updated[0].id : null
    const photoRequestsByImage = { ...get().photoRequestsByImage }
    const adjustmentsByImage = { ...get().adjustmentsByImage }
    delete photoRequestsByImage[id]
    delete adjustmentsByImage[id]

    const requests = selectedImageId
      ? photoRequestsByImage[selectedImageId] || createDefaultRequestsForImage(selectedImageId)
      : createDefaultRequestsForImage('default')

    const activeAdj = selectedImageId
      ? adjustmentsByImage[selectedImageId] || DEFAULT_ADJUSTMENTS
      : DEFAULT_ADJUSTMENTS

    set({
      images: updated,
      selectedImageId,
      selectedItemId: null,
      requests,
      photoRequestsByImage,
      adjustmentsByImage,
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...activeAdj }
    })
    get().recalculateLayout()
  },

  clearAllImages: () => {
    set({
      images: [],
      selectedImageId: null,
      selectedItemId: null,
      requests: createDefaultRequestsForImage('default'),
      photoRequestsByImage: { default: createDefaultRequestsForImage('default') },
      adjustmentsByImage: {},
      itemAdjustments: {},
      colorModeByPresetAndImage: {},
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      recommendations: []
    })
  },

  setSelectedImageId: (id) => {
    if (!id) return
    const { photoRequestsByImage, adjustmentsByImage } = get()
    const requests = photoRequestsByImage[id] || createDefaultRequestsForImage(id)
    const imageAdj = adjustmentsByImage[id] || DEFAULT_ADJUSTMENTS

    set({
      selectedImageId: id,
      selectedItemId: null,
      requests,
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...imageAdj }
    })
    get().recalculateLayout()
  },

  setSelectedItemId: (id) => {
    if (!id) {
      set({ selectedItemId: null })
      return
    }
    const { itemAdjustments, adjustmentsByImage, recommendations, selectedRecommendationIndex, activePageIndex } = get()
    const currentLayout = recommendations[selectedRecommendationIndex]
    const activePage = currentLayout?.pages?.[activePageIndex] || currentLayout?.pages?.[0]
    const placedItems = activePage?.placedItems || currentLayout?.placedItems || []
    const item = placedItems.find((it) => it.id === id)

    const itemAdj = itemAdjustments[id] || (item?.imageId ? adjustmentsByImage[item.imageId] : null) || DEFAULT_ADJUSTMENTS

    set({
      selectedItemId: id,
      selectedImageId: item?.imageId || get().selectedImageId,
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...itemAdj }
    })
  },

  setAdjustments: (newAdj) => {
    const { selectedItemId, selectedImageId, itemAdjustments, adjustmentsByImage, adjustments, recommendations } = get()
    const updated = { ...adjustments, ...newAdj }
    const updatedItemAdj = { ...itemAdjustments }
    const updatedByImage = { ...adjustmentsByImage }

    if (selectedItemId) {
      updatedItemAdj[selectedItemId] = {
        ...(updatedItemAdj[selectedItemId] || (selectedImageId ? adjustmentsByImage[selectedImageId] : null) || DEFAULT_ADJUSTMENTS),
        ...newAdj
      }
    }

    if (selectedImageId) {
      updatedByImage[selectedImageId] = {
        ...(updatedByImage[selectedImageId] || DEFAULT_ADJUSTMENTS),
        ...newAdj
      }

      if (!selectedItemId) {
        recommendations.forEach((rec) => {
          const allItems = rec.pages ? rec.pages.flatMap((p) => p.placedItems) : rec.placedItems || []
          allItems
            .filter((it) => it.imageId === selectedImageId)
            .forEach((it) => {
              updatedItemAdj[it.id] = {
                ...(updatedItemAdj[it.id] || updatedByImage[selectedImageId] || DEFAULT_ADJUSTMENTS),
                ...newAdj
              }
            })
        })
      }
    }

    set({
      adjustments: updated,
      itemAdjustments: updatedItemAdj,
      adjustmentsByImage: updatedByImage
    })
  },

  resetAdjustments: () => {
    const { selectedItemId, selectedImageId, itemAdjustments, adjustmentsByImage, recommendations } = get()
    const updatedItemAdj = { ...itemAdjustments }
    const updatedByImage = { ...adjustmentsByImage }

    if (selectedItemId) {
      delete updatedItemAdj[selectedItemId]
    } else if (selectedImageId) {
      delete updatedByImage[selectedImageId]
      recommendations.forEach((rec) => {
        const allItems = rec.pages ? rec.pages.flatMap((p) => p.placedItems) : rec.placedItems || []
        allItems
          .filter((it) => it.imageId === selectedImageId)
          .forEach((it) => {
            delete updatedItemAdj[it.id]
          })
      })
    }

    set({
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      itemAdjustments: updatedItemAdj,
      adjustmentsByImage: updatedByImage
    })
  },

  applyCurrentAdjustmentsToAll: () => {
    const { images, adjustments, recommendations } = get()
    const updatedByImage: Record<string, Partial<ImageAdjustments>> = {}
    const updatedItemAdj: Record<string, Partial<ImageAdjustments>> = {}

    images.forEach((img) => {
      updatedByImage[img.id] = { ...adjustments }
    })

    recommendations.forEach((rec) => {
      const allItems = rec.pages ? rec.pages.flatMap((p) => p.placedItems) : rec.placedItems || []
      allItems.forEach((it) => {
        updatedItemAdj[it.id] = { ...adjustments }
      })
    })

    set({
      adjustmentsByImage: updatedByImage,
      itemAdjustments: updatedItemAdj
    })
  },

  applyAdjustmentsToPreset: (presetId, specificAdj, targetImageId) => {
    const { adjustments, recommendations, itemAdjustments, colorModeByPresetAndImage, images, selectedImageId } = get()
    const imageIdToFilter = targetImageId !== undefined ? targetImageId : selectedImageId
    const adjToApply = specificAdj || adjustments
    const updatedItemAdj = { ...itemAdjustments }
    const updatedColorMode = { ...colorModeByPresetAndImage }

    if (specificAdj?.colorMode) {
      if (imageIdToFilter) {
        updatedColorMode[`${imageIdToFilter}_${presetId}`] = specificAdj.colorMode
      } else {
        images.forEach((img) => {
          updatedColorMode[`${img.id}_${presetId}`] = specificAdj.colorMode!
        })
        updatedColorMode[`default_${presetId}`] = specificAdj.colorMode
      }
    }

    recommendations.forEach((rec) => {
      const allItems = rec.pages ? rec.pages.flatMap((p) => p.placedItems) : rec.placedItems || []
      allItems.forEach((it: any) => {
        const isMatchPreset =
          it.presetId === presetId ||
          it.requestId?.includes(presetId) ||
          it.label?.toLowerCase().includes(presetId.toLowerCase()) ||
          (presetId === '2x3' && ((it.widthMm === 20 && it.heightMm === 30) || (it.widthMm === 30 && it.heightMm === 20))) ||
          (presetId === '3x4' && ((it.widthMm === 30 && it.heightMm === 40) || (it.widthMm === 40 && it.heightMm === 30))) ||
          (presetId === '4x6' && ((it.widthMm === 40 && it.heightMm === 60) || (it.widthMm === 60 && it.heightMm === 40)))

        const isMatchImage = !imageIdToFilter || it.imageId === imageIdToFilter

        if (isMatchPreset && isMatchImage) {
          updatedItemAdj[it.id] = {
            ...(updatedItemAdj[it.id] || DEFAULT_ADJUSTMENTS),
            ...adjToApply
          }
        }
      })
    })

    set({
      itemAdjustments: updatedItemAdj,
      colorModeByPresetAndImage: updatedColorMode
    })
  },

  updateRequestCrop: (presetId, cropUpdate) => {
    const { selectedImageId, photoRequestsByImage } = get()
    const activeId = selectedImageId || 'default'
    const currentList = photoRequestsByImage[activeId] || createDefaultRequestsForImage(activeId)

    const updatedList = currentList.map((req) =>
      req.presetId === presetId
        ? {
            ...req,
            crop: { ...req.crop, ...cropUpdate }
          }
        : req
    )

    set({
      requests: updatedList,
      photoRequestsByImage: {
        ...photoRequestsByImage,
        [activeId]: updatedList
      }
    })
    get().recalculateLayout()
  },

  updateRequestQuantity: (presetId, quantity) => {
    const qty = Math.max(0, quantity)
    const { selectedImageId, photoRequestsByImage } = get()
    const activeId = selectedImageId || 'default'
    const currentList = photoRequestsByImage[activeId] || createDefaultRequestsForImage(activeId)

    const updatedList = currentList.map((req) =>
      req.presetId === presetId ? { ...req, quantity: qty } : req
    )

    set({
      requests: updatedList,
      photoRequestsByImage: {
        ...photoRequestsByImage,
        [activeId]: updatedList
      }
    })
    get().recalculateLayout()
  },

  updateRequestQuantityForAll: (presetId, quantity) => {
    const qty = Math.max(0, quantity)
    const { images, photoRequestsByImage, selectedImageId } = get()
    const updatedMap: Record<string, PhotoRequest[]> = { ...photoRequestsByImage }

    images.forEach((img) => {
      const list = updatedMap[img.id] || createDefaultRequestsForImage(img.id)
      updatedMap[img.id] = list.map((req) =>
        req.presetId === presetId ? { ...req, quantity: qty } : req
      )
    })

    const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default')
    const requests = updatedMap[activeId] || createDefaultRequestsForImage(activeId)

    set({ photoRequestsByImage: updatedMap, requests })
    get().recalculateLayout()
  },

  applyPackagePreset: (presetId) => {
    const pkg = DEFAULT_PACKAGE_PRESETS.find((p) => p.id === presetId)
    if (!pkg) return

    const { selectedImageId, photoRequestsByImage } = get()
    const activeId = selectedImageId || 'default'
    const currentList = photoRequestsByImage[activeId] || createDefaultRequestsForImage(activeId)

    const updatedList = currentList.map((req) => {
      const item = pkg.items.find((i) => i.presetId === req.presetId)
      return {
        ...req,
        quantity: item ? item.quantity : 0
      }
    })

    set({
      requests: updatedList,
      photoRequestsByImage: {
        ...photoRequestsByImage,
        [activeId]: updatedList
      }
    })
    get().recalculateLayout()
  },

  applyPackagePresetToAll: (presetId) => {
    const pkg = DEFAULT_PACKAGE_PRESETS.find((p) => p.id === presetId)
    if (!pkg) return

    const { images, photoRequestsByImage, selectedImageId } = get()
    const updatedMap: Record<string, PhotoRequest[]> = { ...photoRequestsByImage }

    images.forEach((img) => {
      const list = updatedMap[img.id] || createDefaultRequestsForImage(img.id)
      updatedMap[img.id] = list.map((req) => {
        const item = pkg.items.find((i) => i.presetId === req.presetId)
        return {
          ...req,
          quantity: item ? item.quantity : 0
        }
      })
    })

    const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default')
    const requests = updatedMap[activeId] || createDefaultRequestsForImage(activeId)

    set({ photoRequestsByImage: updatedMap, requests })
    get().recalculateLayout()
  },

  applyCurrentRequestsToAll: () => {
    const { images, photoRequestsByImage, selectedImageId, requests } = get()
    if (images.length <= 1) return

    const activeId = selectedImageId || images[0].id
    const currentList = photoRequestsByImage[activeId] || requests
    const updatedMap: Record<string, PhotoRequest[]> = { ...photoRequestsByImage }

    images.forEach((img) => {
      if (img.id !== activeId) {
        const targetList = updatedMap[img.id] || createDefaultRequestsForImage(img.id)
        updatedMap[img.id] = targetList.map((targetReq) => {
          const matchingSource = currentList.find((s) => s.presetId === targetReq.presetId)
          return {
            ...targetReq,
            quantity: matchingSource ? matchingSource.quantity : targetReq.quantity
          }
        })
      }
    })

    set({ photoRequestsByImage: updatedMap })
    get().recalculateLayout()
  },

  setPaperPreset: (presetId) => {
    if (presetId === 'custom') {
      set((state) => ({
        paper: {
          ...state.paper,
          presetId: 'custom',
          name: 'Kertas Custom'
        }
      }))
    } else {
      const preset = DEFAULT_PAPER_PRESETS.find((p) => p.presetId === presetId)
      if (preset) {
        set({ paper: { ...preset } })
      }
    }
    get().recalculateLayout()
  },

  updatePaperSettings: (paperUpdate) => {
    set((state) => ({
      paper: { ...state.paper, ...paperUpdate }
    }))
    get().recalculateLayout()
  },

  setGapMm: (gapMm) => {
    set({ gapMm: Math.max(0, gapMm) })
    get().recalculateLayout()
  },

  setLayoutMode: (layoutMode) => {
    set({ layoutMode })
    get().recalculateLayout()
  },

  setIncludeCropMarks: (includeCropMarks) => {
    set({ includeCropMarks })
    get().recalculateLayout()
  },

  setSelectedRecommendationIndex: (selectedRecommendationIndex) => {
    set({ selectedRecommendationIndex })
  },

  setPreviewZoom: (previewZoom) => {
    set({ previewZoom: Math.max(25, Math.min(300, previewZoom)) })
  },

  recalculateLayout: () => {
    const state = get()

    // Jika mode single, ambil request foto yang sedang aktif
    // Jika mode multi, kumpulkan seluruh request dari semua foto yang diupload
    let activeRequests: PhotoRequest[] = []

    if (state.printMode === 'single') {
      const activeId = state.selectedImageId || 'default'
      activeRequests = state.photoRequestsByImage[activeId] || state.requests
    } else {
      // Mode Multi: Ambil seluruh request dari setiap foto yang ada
      state.images.forEach((img) => {
        const reqs = state.photoRequestsByImage[img.id]
        if (reqs) {
          activeRequests.push(...reqs)
        }
      })
      if (activeRequests.length === 0) {
        activeRequests = state.requests
      }
    }

    const recommendations = generateLayoutRecommendations({
      requests: activeRequests,
      paper: state.paper,
      images: state.images,
      gapMm: state.gapMm,
      layoutMode: state.layoutMode,
      cropMarkLengthMm: state.cropMarkLengthMm,
      includeCropMarks: state.includeCropMarks
    })

    const nextRecIndex =
      state.selectedRecommendationIndex < recommendations.length
        ? state.selectedRecommendationIndex
        : 0

    const currentRec = recommendations[nextRecIndex]
    const maxPages = currentRec?.totalPages || 1
    const nextPageIndex = Math.min(state.activePageIndex, Math.max(0, maxPages - 1))

    set({
      recommendations,
      selectedRecommendationIndex: nextRecIndex,
      activePageIndex: nextPageIndex
    })
  },

  usePaperRemainder: () => {
    const state = get()
    const currentLayout = state.recommendations[state.selectedRecommendationIndex]
    if (!currentLayout || !currentLayout.remainderMm) return

    const rem = currentLayout.remainderMm
    // Set custom paper based on largest rectangular remainder
    set({
      paper: {
        presetId: 'custom',
        name: `Sisa Kertas (${Math.round(rem.width)} × ${Math.round(rem.height)} mm)`,
        widthMm: Math.round(rem.width),
        heightMm: Math.round(rem.height),
        marginTopMm: 3,
        marginRightMm: 3,
        marginBottomMm: 3,
        marginLeftMm: 3,
        orientation: rem.width > rem.height ? 'landscape' : 'portrait',
        feedAlignment: 'center'
      }
    })
    get().recalculateLayout()
  },

  resetWorkspace: () => {
    const defaultReqs = createDefaultRequestsForImage('default')
    set({
      images: [],
      selectedImageId: null,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      requests: defaultReqs,
      photoRequestsByImage: { default: defaultReqs },
      printMode: 'single',
      paper: { ...defaultA4 },
      gapMm: 2,
      layoutMode: 'as_ordered',
      recommendations: [],
      selectedRecommendationIndex: 0,
      activePageIndex: 0
    })
    // Call cleanup in background
    window.api?.cleanTempFiles()
  }
}))
