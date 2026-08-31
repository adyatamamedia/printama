import { PDFDocument } from 'pdf-lib'
import { mmToPixelFloat, MM_PER_INCH } from '../../shared/units/converter'

const POINTS_PER_INCH = 72

export function mmToPoints(mm: number): number {
  return (mm / MM_PER_INCH) * POINTS_PER_INCH
}

export async function createPdfFromMultipleImageBuffers(
  imageBuffers: Buffer[],
  format: 'png' | 'jpeg',
  widthMm: number,
  heightMm: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const pageWidthPoints = mmToPoints(widthMm)
  const pageHeightPoints = mmToPoints(heightMm)

  for (const buffer of imageBuffers) {
    const page = pdfDoc.addPage([pageWidthPoints, pageHeightPoints])
    let embeddedImage
    if (format === 'jpeg') {
      embeddedImage = await pdfDoc.embedJpg(buffer)
    } else {
      embeddedImage = await pdfDoc.embedPng(buffer)
    }
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidthPoints,
      height: pageHeightPoints
    })
  }

  return await pdfDoc.save()
}

export async function createPdfFromImageBuffer(
  imageBuffer: Buffer,
  format: 'png' | 'jpeg',
  widthMm: number,
  heightMm: number
): Promise<Uint8Array> {
  return await createPdfFromMultipleImageBuffers([imageBuffer], format, widthMm, heightMm)
}
