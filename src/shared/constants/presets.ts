import { PaperSettings, PackagePreset, ImageAdjustments, UserPreferences } from '../types'

export const PHOTO_SIZE_PRESETS = [
  {
    id: '2x3' as const,
    name: '2×3 cm',
    widthMm: 21.6,
    heightMm: 27.9,
    aspectRatio: 21.6 / 27.9,
    description: 'Resmi: 21,6 × 27,9 mm (0,85 × 1,11 inci)'
  },
  {
    id: '3x4' as const,
    name: '3×4 cm',
    widthMm: 27.9,
    heightMm: 38.1,
    aspectRatio: 27.9 / 38.1,
    description: 'Resmi: 27,9 × 38,1 mm (1,11 × 1,50 inci)'
  },
  {
    id: '4x6' as const,
    name: '4×6 cm',
    widthMm: 38.1,
    heightMm: 55.9,
    aspectRatio: 38.1 / 55.9,
    description: 'Resmi: 38,1 × 55,9 mm (1,50 × 2,20 inci)'
  }
] as const

export const DEFAULT_PAPER_PRESETS: PaperSettings[] = [
  {
    presetId: 'A4',
    name: 'A4 (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  },
  {
    presetId: 'F4',
    name: 'F4 / Folio Indo (210 × 330 mm)',
    widthMm: 210,
    heightMm: 330,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  },
  {
    presetId: 'Folio',
    name: 'Folio Internasional (215.9 × 330.2 mm)',
    widthMm: 215.9,
    heightMm: 330.2,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  },
  {
    presetId: 'A5',
    name: 'A5 (148 × 210 mm)',
    widthMm: 148,
    heightMm: 210,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  },
  {
    presetId: 'Letter',
    name: 'Letter (215.9 × 279.4 mm)',
    widthMm: 215.9,
    heightMm: 279.4,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  },
  {
    presetId: 'A3',
    name: 'A3 (297 × 420 mm)',
    widthMm: 297,
    heightMm: 420,
    marginTopMm: 5,
    marginRightMm: 5,
    marginBottomMm: 5,
    marginLeftMm: 5,
    orientation: 'portrait',
    feedAlignment: 'center'
  }
]

export const DEFAULT_PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: 'standard',
    name: 'Standar',
    description: '4 pcs 2×3, 3 pcs 3×4, 5 pcs 4×6',
    items: [
      { presetId: '2x3', quantity: 4 },
      { presetId: '3x4', quantity: 3 },
      { presetId: '4x6', quantity: 5 }
    ]
  },
  {
    id: 'complete',
    name: 'Lengkap',
    description: '8 pcs 2×3, 6 pcs 3×4, 5 pcs 4×6',
    items: [
      { presetId: '2x3', quantity: 8 },
      { presetId: '3x4', quantity: 6 },
      { presetId: '4x6', quantity: 5 }
    ]
  },
  {
    id: 'job_app',
    name: 'Lamaran Kerja',
    description: '6 pcs 3×4, 5 pcs 4×6',
    items: [
      { presetId: '2x3', quantity: 0 },
      { presetId: '3x4', quantity: 6 },
      { presetId: '4x6', quantity: 5 }
    ]
  },
  {
    id: 'full',
    name: 'Full',
    description: '8 pcs 2×3, 12 pcs 3×4, 15 pcs 4×6',
    items: [
      { presetId: '2x3', quantity: 8 },
      { presetId: '3x4', quantity: 12 },
      { presetId: '4x6', quantity: 15 }
    ]
  }
]

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  colorMode: 'color',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  sharpen: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultDpi: 300,
  defaultGapMm: 2,
  defaultMarginMm: {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
  },
  cropMarkLengthMm: 2,
  cropMarkThicknessMm: 0.2,
  customPackagePresets: [],
  customPaperPresets: [],
  scaleCompensation: {}
}
