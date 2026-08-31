import { z } from 'zod'

export const ImageAdjustmentsSchema = z.object({
  brightness: z.number().min(-100).max(100),
  contrast: z.number().min(-100).max(100),
  saturation: z.number().min(-100).max(100),
  temperature: z.number().min(-100).max(100),
  sharpen: z.number().min(0).max(100),
  rotation: z.number(),
  flipHorizontal: z.boolean(),
  flipVertical: z.boolean()
})

export const CropSettingsSchema = z.object({
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  zoom: z.number().min(1).max(5),
  aspectRatio: z.number().positive()
})

export const PaperSettingsSchema = z.object({
  presetId: z.string(),
  name: z.string(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  marginTopMm: z.number().min(0),
  marginRightMm: z.number().min(0),
  marginBottomMm: z.number().min(0),
  marginLeftMm: z.number().min(0),
  orientation: z.enum(['portrait', 'landscape']),
  feedAlignment: z.enum(['left', 'center', 'right'])
})

export const ExportOptionsSchema = z.object({
  format: z.enum(['png', 'jpeg', 'pdf']),
  quality: z.number().min(1).max(100).optional(),
  dpi: z.number().min(72).max(1200),
  destinationPath: z.string().min(1),
  includeCropMarks: z.boolean(),
  cropMarkLengthMm: z.number().optional(),
  cropMarkThicknessMm: z.number().optional()
})

export const PrintOptionsSchema = z.object({
  printerName: z.string().optional(),
  copies: z.number().int().min(1).max(100),
  dpi: z.number().min(72).max(1200),
  includeCropMarks: z.boolean(),
  cropMarkLengthMm: z.number().optional(),
  cropMarkThicknessMm: z.number().optional(),
  silent: z.boolean().optional()
})
