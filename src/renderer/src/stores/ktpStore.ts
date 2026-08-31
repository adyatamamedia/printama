import { create } from 'zustand'

export interface KtpImageSource {
  id: string
  filePath?: string
  base64?: string
  widthPx?: number
  heightPx?: number
  crop?: {
    xPercent: number
    yPercent: number
    zoom: number
  }
}

export type KtpLayoutPreset =
  | '1_pair_top'
  | '1_pair_center'
  | '2_pairs'
  | '4_pairs'
  | '8_pairs'
  | 'fill_paper'
  | 'custom'

export type KtpColorMode = 'color' | 'grayscale' | 'vintage'

export type KtpSideMode = 'both' | 'front_only' | 'duplicate_front'

export interface KtpPaper {
  id: 'a4' | 'f4'
  name: string
  widthMm: number
  heightMm: number
}

export const KTP_PAPERS: KtpPaper[] = [
  { id: 'a4', name: 'A4 (210 × 297 mm)', widthMm: 210, heightMm: 297 },
  { id: 'f4', name: 'F4 / Folio (215 × 330 mm)', widthMm: 215, heightMm: 330 }
]

export const KTP_WIDTH_MM = 85.6
export const KTP_HEIGHT_MM = 54.0

export interface KtpItemAdjustments {
  brightness?: number
  contrast?: number
  saturation?: number
  sharpen?: number
  colorMode?: KtpColorMode
  flipHorizontal?: boolean
  rotation?: number
}

export interface PlacedKtpItem {
  id: string
  side: 'front' | 'back'
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  image: KtpImageSource | null
  adjustments?: KtpItemAdjustments
}

export interface KtpState {
  frontImage: KtpImageSource | null
  backImage: KtpImageSource | null
  sideMode: KtpSideMode
  paper: KtpPaper
  layoutPreset: KtpLayoutPreset
  customRowCount: number
  marginTopMm: number
  marginLeftMm: number
  isAutoCenterHorizontal: boolean
  isAutoCenterVertical: boolean
  colorMode: KtpColorMode
  brightness: number
  contrast: number
  saturation: number
  sharpen: number
  flipHorizontal: boolean
  rotation: number
  selectedItemId: string | null
  itemAdjustments: Record<string, KtpItemAdjustments>
  includeBorder: boolean
  gapHorizontalMm: number
  gapVerticalMm: number
  previewZoom: number

  // Actions
  setFrontImage: (img: KtpImageSource | null) => void
  setBackImage: (img: KtpImageSource | null) => void
  setSideMode: (mode: KtpSideMode) => void
  copyFrontToBack: () => void
  setPaper: (paperId: 'a4' | 'f4') => void
  setLayoutPreset: (preset: KtpLayoutPreset) => void
  setCustomRowCount: (count: number) => void
  setMarginTopMm: (margin: number) => void
  setMarginLeftMm: (margin: number) => void
  setIsAutoCenterHorizontal: (auto: boolean) => void
  setIsAutoCenterVertical: (auto: boolean) => void
  setColorMode: (mode: KtpColorMode) => void
  setBrightness: (brightness: number) => void
  setContrast: (contrast: number) => void
  setSaturation: (saturation: number) => void
  setSharpen: (sharpen: number) => void
  setFlipHorizontal: (flip: boolean) => void
  rotate90: () => void
  setSelectedItemId: (id: string | null) => void
  updateItemAdjustments: (id: string, adj: Partial<KtpItemAdjustments>) => void
  updateAllAdjustments: (adj: Partial<KtpItemAdjustments>) => void
  applyItemAdjustmentsToAll: (sourceId: string) => void
  setIncludeBorder: (include: boolean) => void
  setGapHorizontalMm: (gap: number) => void
  setGapVerticalMm: (gap: number) => void
  setPreviewZoom: (zoom: number) => void
  resetKtp: () => void

  // Layout calculation
  getPlacedKtpItems: () => PlacedKtpItem[]
}

export const useKtpStore = create<KtpState>((set, get) => ({
  frontImage: null,
  backImage: null,
  sideMode: 'both',
  customRowCount: 2,
  paper: KTP_PAPERS[1], // F4 / Folio (215 × 330 mm)
  layoutPreset: '1_pair_top',
  marginTopMm: 10,
  marginLeftMm: 10,
  isAutoCenterHorizontal: true,
  isAutoCenterVertical: false,
  colorMode: 'color',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
  flipHorizontal: false,
  rotation: 0,
  selectedItemId: null,
  itemAdjustments: {},
  includeBorder: true,
  gapHorizontalMm: 15,
  gapVerticalMm: 8,
  previewZoom: 100,

  setFrontImage: (frontImage) => set({ frontImage }),
  setBackImage: (backImage) => set({ backImage }),
  setSideMode: (sideMode) => set({ sideMode }),
  copyFrontToBack: () => {
    const { frontImage } = get()
    if (frontImage) {
      set({
        backImage: {
          ...frontImage,
          id: `back-copy-${Date.now()}`
        }
      })
    }
  },
  setPaper: (paperId) => {
    const p = KTP_PAPERS.find((item) => item.id === paperId)
    if (p) set({ paper: p })
  },
  setLayoutPreset: (layoutPreset) => set({ layoutPreset }),
  setCustomRowCount: (customRowCount) => set({ customRowCount }),
  setMarginTopMm: (marginTopMm) => set({ marginTopMm }),
  setMarginLeftMm: (marginLeftMm) => set({ marginLeftMm }),
  setIsAutoCenterHorizontal: (isAutoCenterHorizontal) => set({ isAutoCenterHorizontal }),
  setIsAutoCenterVertical: (isAutoCenterVertical) => set({ isAutoCenterVertical }),
  setColorMode: (colorMode) => set({ colorMode }),
  setBrightness: (brightness) => set({ brightness }),
  setContrast: (contrast) => set({ contrast }),
  setSaturation: (saturation) => set({ saturation }),
  setSharpen: (sharpen) => set({ sharpen }),
  setFlipHorizontal: (flipHorizontal) => set({ flipHorizontal }),
  rotate90: () => set((s) => ({ rotation: (s.rotation + 90) % 360 })),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  updateItemAdjustments: (id, adj) => {
    set((state) => {
      const current = state.itemAdjustments[id] || {}
      return {
        itemAdjustments: {
          ...state.itemAdjustments,
          [id]: { ...current, ...adj }
        }
      }
    })
  },
  updateAllAdjustments: (adj) => {
    set((state) => {
      // update global state
      const nextGlobal: Partial<KtpState> = {}
      if (adj.brightness !== undefined) nextGlobal.brightness = adj.brightness
      if (adj.contrast !== undefined) nextGlobal.contrast = adj.contrast
      if (adj.saturation !== undefined) nextGlobal.saturation = adj.saturation
      if (adj.sharpen !== undefined) nextGlobal.sharpen = adj.sharpen
      if (adj.colorMode !== undefined) nextGlobal.colorMode = adj.colorMode
      if (adj.flipHorizontal !== undefined) nextGlobal.flipHorizontal = adj.flipHorizontal
      if (adj.rotation !== undefined) nextGlobal.rotation = adj.rotation

      // update all existing item overrides
      const updatedItemAdjustments: Record<string, KtpItemAdjustments> = {}
      Object.keys(state.itemAdjustments).forEach((key) => {
        updatedItemAdjustments[key] = {
          ...state.itemAdjustments[key],
          ...adj
        }
      })

      return {
        ...nextGlobal,
        itemAdjustments: updatedItemAdjustments
      }
    })
  },
  applyItemAdjustmentsToAll: (sourceId) => {
    const { itemAdjustments, brightness, contrast, saturation, sharpen, colorMode, flipHorizontal, rotation } = get()
    const source = sourceId ? itemAdjustments[sourceId] : null
    const targetAdj: KtpItemAdjustments = {
      brightness: source?.brightness ?? brightness,
      contrast: source?.contrast ?? contrast,
      saturation: source?.saturation ?? saturation,
      sharpen: source?.sharpen ?? sharpen,
      colorMode: source?.colorMode ?? colorMode,
      flipHorizontal: source?.flipHorizontal ?? flipHorizontal,
      rotation: source?.rotation ?? rotation
    }

    const items = get().getPlacedKtpItems()
    const newAdjustments: Record<string, KtpItemAdjustments> = {}
    items.forEach((it) => {
      newAdjustments[it.id] = { ...targetAdj }
    })

    set({
      brightness: targetAdj.brightness ?? 0,
      contrast: targetAdj.contrast ?? 0,
      saturation: targetAdj.saturation ?? 0,
      sharpen: targetAdj.sharpen ?? 0,
      colorMode: targetAdj.colorMode ?? 'color',
      flipHorizontal: targetAdj.flipHorizontal ?? false,
      rotation: targetAdj.rotation ?? 0,
      itemAdjustments: newAdjustments
    })
  },
  setIncludeBorder: (includeBorder) => set({ includeBorder }),
  setGapHorizontalMm: (gapHorizontalMm) => set({ gapHorizontalMm: Math.max(0, Math.min(50, gapHorizontalMm)) }),
  setGapVerticalMm: (gapVerticalMm) => set({ gapVerticalMm: Math.max(0, Math.min(50, gapVerticalMm)) }),
  setPreviewZoom: (previewZoom) => set({ previewZoom: Math.max(25, Math.min(300, previewZoom)) }),

  resetKtp: () =>
    set({
      frontImage: null,
      backImage: null,
      sideMode: 'both',
      paper: KTP_PAPERS[1],
      layoutPreset: '1_pair_top',
      customRowCount: 2,
      marginTopMm: 10,
      marginLeftMm: 10,
      isAutoCenterHorizontal: true,
      isAutoCenterVertical: false,
      colorMode: 'color',
      brightness: 0,
      contrast: 0,
      includeBorder: true,
      gapHorizontalMm: 15,
      gapVerticalMm: 8
    }),

  getPlacedKtpItems: () => {
    const {
      frontImage,
      backImage,
      sideMode,
      paper,
      layoutPreset,
      customRowCount,
      marginTopMm,
      marginLeftMm,
      isAutoCenterHorizontal,
      isAutoCenterVertical,
      gapHorizontalMm,
      gapVerticalMm
    } = get()
    const items: PlacedKtpItem[] = []

    const paperW = paper.widthMm
    const paperH = paper.heightMm

    // Hitung ukuran fisik mm KTP standar (85.6 mm lebar, tinggi proporsional dari crop)
    const getCardMm = (img: KtpImageSource | null) => {
      if (!img || !img.widthPx || !img.heightPx || img.widthPx <= 0 || img.heightPx <= 0) {
        return { widthMm: KTP_WIDTH_MM, heightMm: KTP_HEIGHT_MM }
      }
      const aspect = img.widthPx / img.heightPx
      const widthMm = KTP_WIDTH_MM // Standar fisik KTP 85.6 mm (8.56 cm)
      const heightMm = widthMm / aspect // Menjaga proporsi murni hasil potong tanpa distorsi
      return { widthMm, heightMm }
    }

    const { widthMm: frontW, heightMm: frontH } = getCardMm(frontImage)

    // Tentukan data gambar belakang berdasarkan sideMode
    const effectiveBackImage = sideMode === 'duplicate_front' ? frontImage : backImage
    const { widthMm: backW, heightMm: backH } = getCardMm(effectiveBackImage || frontImage)

    // ==========================================
    // MODE 1: HANYA SISI DEPAN (Single Sided KTP)
    // ==========================================
    const { itemAdjustments } = get()

    if (sideMode === 'front_only') {
      const singleW = frontW
      const singleH = frontH
      const pairWidth = singleW * 2 + gapHorizontalMm

      // Hitung baris yang diinginkan
      let rows = 1
      let columns = 1

      if (layoutPreset === '1_pair_top' || layoutPreset === '1_pair_center') {
        rows = 1
        columns = 1
      } else if (layoutPreset === '2_pairs') {
        rows = 1
        columns = 2
      } else if (layoutPreset === '4_pairs') {
        rows = 2
        columns = 2
      } else if (layoutPreset === '8_pairs') {
        rows = 4
        columns = 2
      } else if (layoutPreset === 'fill_paper') {
        rows = Math.max(1, Math.floor((paperH - 20) / (singleH + gapVerticalMm)))
        columns = 2
      } else if (layoutPreset === 'custom') {
        rows = customRowCount
        columns = 2
      }

      const totalW = columns === 1 ? singleW : pairWidth
      const totalH = rows * singleH + (rows - 1) * gapVerticalMm

      const startX = isAutoCenterHorizontal
        ? Math.max(2, (paperW - totalW) / 2)
        : Math.max(0, marginLeftMm)

      const startY =
        isAutoCenterVertical || layoutPreset === '1_pair_center'
          ? Math.max(2, (paperH - totalH) / 2)
          : Math.max(0, marginTopMm)

      let count = 0
      for (let r = 0; r < rows; r++) {
        const rowY = startY + r * (singleH + gapVerticalMm)
        if (rowY + singleH > paperH) break

        for (let c = 0; c < columns; c++) {
          const colX = startX + c * (singleW + gapHorizontalMm)
          if (colX + singleW > paperW) break

          const itemId = `ktp-front-${count}`
          items.push({
            id: itemId,
            side: 'front',
            xMm: colX,
            yMm: rowY,
            widthMm: singleW,
            heightMm: singleH,
            image: frontImage,
            adjustments: itemAdjustments[itemId]
          })
          count++
        }
      }

      return items
    }

    // ==========================================
    // MODE 2: DEPAN & BELAKANG (Pasang)
    // ==========================================
    const pairWidth = frontW + backW + gapHorizontalMm
    const rowHeight = Math.max(frontH, backH)

    let rows = 1
    if (layoutPreset === '1_pair_top' || layoutPreset === '1_pair_center') {
      rows = 1
    } else if (layoutPreset === '2_pairs') {
      rows = 2
    } else if (layoutPreset === '4_pairs') {
      rows = 4
    } else if (layoutPreset === '8_pairs') {
      rows = 4
    } else if (layoutPreset === 'fill_paper') {
      rows = Math.max(1, Math.floor((paperH - 20) / (rowHeight + gapVerticalMm)))
    } else if (layoutPreset === 'custom') {
      rows = customRowCount
    }

    const totalH = rows * rowHeight + (rows - 1) * gapVerticalMm

    const startX = isAutoCenterHorizontal
      ? Math.max(2, (paperW - pairWidth) / 2)
      : Math.max(0, marginLeftMm)

    const startY =
      isAutoCenterVertical || layoutPreset === '1_pair_center'
        ? Math.max(2, (paperH - totalH) / 2)
        : Math.max(0, marginTopMm)

    for (let r = 0; r < rows; r++) {
      const rowY = startY + r * (rowHeight + gapVerticalMm)
      if (rowY + rowHeight > paperH) break

      const frontId = `ktp-front-${r}`
      const backId = `ktp-back-${r}`

      // KTP Depan
      items.push({
        id: frontId,
        side: 'front',
        xMm: startX,
        yMm: rowY,
        widthMm: frontW,
        heightMm: frontH,
        image: frontImage,
        adjustments: itemAdjustments[frontId]
      })

      // KTP Belakang
      items.push({
        id: backId,
        side: 'back',
        xMm: startX + frontW + gapHorizontalMm,
        yMm: rowY,
        widthMm: backW,
        heightMm: backH,
        image: effectiveBackImage,
        adjustments: itemAdjustments[backId]
      })
    }

    return items
  }
}))
