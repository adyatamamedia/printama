export type PhotoPresetId = '2x3' | '3x4' | '4x6' | 'custom'

export type PaperPresetId = 'A4' | 'F4' | 'Folio' | 'A5' | 'A3' | 'Letter' | 'custom'

export type LayoutMode = 'as_ordered' | 'fill_row' | 'fill_used' | 'fill_paper' | 'best_remainder'

export type LayoutStrategy = 'efficient' | 'easy_cut' | 'best_remainder'

export interface RectMm {
  x: number
  y: number
  width: number
  height: number
}

export type PhotoColorMode = 'color' | 'grayscale' | 'vintage'

export interface ImageAdjustments {
  colorMode?: PhotoColorMode // 'color' | 'grayscale' | 'vintage'
  brightness: number // -100 to 100, default 0
  contrast: number // -100 to 100, default 0
  saturation: number // -100 to 100, default 0
  temperature: number // -100 to 100, default 0
  sharpen: number // 0 to 100, default 0
  rotation: number // 0, 90, 180, 270
  flipHorizontal: boolean
  flipVertical: boolean
}

export interface CropSettings {
  xPercent: number // 0 to 100% center offset
  yPercent: number // 0 to 100% center offset
  zoom: number // 1.0 to 3.0
  aspectRatio: number // width / height
}

export interface SourceImage {
  id: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  widthPx: number
  heightPx: number
  thumbnailUrl: string // local file url or base64 data url
}

export interface PhotoRequest {
  id: string
  imageId: string
  presetId: PhotoPresetId
  name: string
  widthMm: number
  heightMm: number
  quantity: number
  crop: CropSettings
  isCustomSize?: boolean
}

export interface PaperSettings {
  presetId: PaperPresetId
  name: string
  widthMm: number
  heightMm: number
  marginTopMm: number
  marginRightMm: number
  marginBottomMm: number
  marginLeftMm: number
  orientation: 'portrait' | 'landscape'
  feedAlignment: 'left' | 'center' | 'right'
}

export interface LayoutItem {
  id: string
  requestId: string
  imageId: string
  sourcePath: string
  xMm: number
  yMm: number
  widthMm: number
  heightMm: number
  rotation: 0 | 90
  crop: CropSettings
  label: string
  adjustments?: ImageAdjustments
}

export interface UnplacedItem {
  requestId: string
  presetId: PhotoPresetId
  name: string
  count: number
  widthMm: number
  heightMm: number
}

export interface CropMarkLine {
  x1Mm: number
  y1Mm: number
  x2Mm: number
  y2Mm: number
  orientation: 'horizontal' | 'vertical'
}

export interface LayoutPage {
  pageIndex: number // 0-indexed
  placedItems: LayoutItem[]
  usedAreaMm: RectMm
  remainderMm?: RectMm
  cropMarks: CropMarkLine[]
}

export interface LayoutResult {
  id: string
  strategy: LayoutStrategy
  strategyTitle: string
  strategyDescription: string
  fitsAll: boolean
  totalPages: number
  pages: LayoutPage[]
  placedItems: LayoutItem[]
  unplacedItems: UnplacedItem[]
  totalItemsRequested: number
  totalItemsPlaced: number
  usedAreaMm: RectMm
  remainderMm?: RectMm
  efficiencyPercent: number
  cutComplexity: number
  cropMarks: CropMarkLine[]
  effectivePaperWidthMm: number
  effectivePaperHeightMm: number
}

export interface PackagePreset {
  id: string
  name: string
  description: string
  items: {
    presetId: PhotoPresetId
    quantity: number
  }[]
}

export interface WindowsPrinterConfig {
  name: string
  paperName?: string
  paperPresetId?: string
  widthMm?: number
  heightMm?: number
  orientation?: 'portrait' | 'landscape'
  copies?: number
  isColor?: boolean
}

export interface PrinterInfo {
  name: string
  displayName?: string
  description?: string
  isDefault: boolean
  status?: number
  portName?: string
  isOnline?: boolean
  statusText?: string
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'pdf'
  quality?: number // 1 to 100 for jpeg
  dpi: number // default 300
  destinationPath: string
  includeCropMarks: boolean
  cropMarkLengthMm?: number
  cropMarkThicknessMm?: number
}

export interface PrintOptions {
  printerName?: string
  copies: number
  dpi: number
  includeCropMarks: boolean
  cropMarkLengthMm?: number
  cropMarkThicknessMm?: number
  silent?: boolean
}

export interface UserPreferences {
  defaultDpi: number
  defaultGapMm: number
  defaultMarginMm: {
    top: number
    right: number
    bottom: number
    left: number
  }
  cropMarkLengthMm: number
  cropMarkThicknessMm: number
  lastPrinterName?: string
  lastExportDir?: string
  customPackagePresets: PackagePreset[]
  customPaperPresets: PaperSettings[]
  scaleCompensation: {
    [printerName: string]: {
      horizontalScale: number // default 1.000
      verticalScale: number // default 1.000
    }
  }
}
