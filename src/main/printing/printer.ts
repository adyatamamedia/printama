import { BrowserWindow } from 'electron'
import { PrinterInfo } from '../../shared/types'
import sharp from 'sharp'
import { mmToPixel } from '../../shared/units/converter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let cachedPrinters: { data: PrinterInfo[]; timestamp: number } | null = null
let pendingFetch: Promise<PrinterInfo[]> | null = null

export async function getSystemPrinters(
  window: BrowserWindow,
  forceRefresh = false
): Promise<PrinterInfo[]> {
  const now = Date.now()
  if (!forceRefresh && cachedPrinters && now - cachedPrinters.timestamp < 15000) {
    return cachedPrinters.data
  }

  if (pendingFetch) {
    return pendingFetch
  }

  pendingFetch = (async () => {
    try {
      const rawPrinters = await window.webContents.getPrintersAsync()

      let activePnpNames: string[] = []
      let spoolPrinters: any[] = []

      try {
        const [pnpOut, printersOut] = await Promise.all([
          execAsync(
            'powershell -NoProfile -Command "Get-PnpDevice -Class \'Printer\',\'USB\' -Status \'OK\' | Where-Object { $_.Present -eq $true } | Select-Object FriendlyName | ConvertTo-Json"',
            { timeout: 6000 }
          ),
          execAsync(
            'powershell -NoProfile -Command "Get-Printer | Select-Object Name, PortName, DriverName, Type | ConvertTo-Json"',
            { timeout: 6000 }
          )
        ])

        if (pnpOut.stdout.trim()) {
          const parsed = JSON.parse(pnpOut.stdout)
          const arr = Array.isArray(parsed) ? parsed : [parsed]
          activePnpNames = arr.map((d: any) => (d.FriendlyName || '').toLowerCase().trim())
        }

        if (printersOut.stdout.trim()) {
          const parsed = JSON.parse(printersOut.stdout)
          spoolPrinters = Array.isArray(parsed) ? parsed : [parsed]
        }
      } catch (err) {
        console.warn('PowerShell PnP query warning (fallback to default):', err)
      }

      const result = rawPrinters.map((p) => {
        const sp = spoolPrinters.find(
          (w: any) => w.Name === p.name || w.Name?.toLowerCase() === p.name.toLowerCase()
        )
        const portName = sp?.PortName || 'Local / USB Port'
        const pName = (p.name || '').toLowerCase().replace(/ \(copy \d+\)/i, '').trim()
        const dName = (sp?.DriverName || '').toLowerCase().trim()

        const isVirtual =
          /PORTPROMPT|Wilcom|AD_Port|FILE:|PDF|XPS/i.test(portName) ||
          /PDF|Virtual|Document/i.test(p.name)

        const isPnpActive = activePnpNames.some(
          (act) =>
            (act && pName && (act.includes(pName) || pName.includes(act))) ||
            (dName && act.includes(dName))
        )

        const isOnline = isVirtual || isPnpActive
        let statusText = isOnline ? 'Ready (Printer ON)' : 'Offline / Disconnected (OFF)'
        if (isVirtual) statusText = 'Ready (Virtual)'

        return {
          name: p.name,
          displayName: p.displayName || p.name,
          description: p.description,
          isDefault: p.isDefault,
          status: p.status,
          portName,
          isOnline,
          statusText
        }
      })

      cachedPrinters = { data: result, timestamp: Date.now() }
      return result
    } catch (err) {
      console.error('Error fetching system printers:', err)
      return cachedPrinters?.data || []
    } finally {
      pendingFetch = null
    }
  })()

  return pendingFetch
}

const DMPAPER_PRESET_MAP: Record<
  number,
  { presetId: string; name: string; widthMm: number; heightMm: number }
> = {
  1: { presetId: 'Letter', name: 'Letter (215.9 × 279.4 mm)', widthMm: 215.9, heightMm: 279.4 },
  3: { presetId: 'A3', name: 'Tabloid (279.4 × 431.8 mm)', widthMm: 279.4, heightMm: 431.8 },
  5: { presetId: 'F4', name: 'Legal (215.9 × 355.6 mm)', widthMm: 215.9, heightMm: 355.6 },
  8: { presetId: 'A3', name: 'A3 (297 × 420 mm)', widthMm: 297, heightMm: 420 },
  9: { presetId: 'A4', name: 'A4 (210 × 297 mm)', widthMm: 210, heightMm: 297 },
  10: { presetId: 'A4', name: 'A4 Small (210 × 297 mm)', widthMm: 210, heightMm: 297 },
  11: { presetId: 'A5', name: 'A5 (148 × 210 mm)', widthMm: 148, heightMm: 210 },
  14: { presetId: 'Folio', name: 'Folio Internasional (215.9 × 330.2 mm)', widthMm: 215.9, heightMm: 330.2 }
}

export async function getPrinterConfiguration(
  printerName: string
): Promise<import('../../shared/types').WindowsPrinterConfig | null> {
  if (!printerName) return null
  try {
    const safeName = printerName.replace(/'/g, "''")

    // 1. Baca data DEVMODE binary langsung dari Windows Registry (HKCU\Printers\DevModes2)
    const { stdout } = await execAsync(
      `powershell -NoProfile -Command "$p='${safeName}'; $b=(Get-ItemProperty -Path 'HKCU:\\Printers\\DevModes2' -Name $p -ErrorAction SilentlyContinue).$p; if (-not $b) { $b=(Get-ItemProperty -Path 'HKCU:\\Printers\\DevModePerUser' -Name $p -ErrorAction SilentlyContinue).$p }; if ($b) { [System.Convert]::ToBase64String($b) } else { '' }"`,
      { timeout: 3000 }
    )

    const b64 = stdout.trim()
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      if (buf.length >= 96) {
        const orientationNum = buf.readInt16LE(76)
        const paperSizeId = buf.readInt16LE(78)
        const rawLength = buf.readInt16LE(80)
        const rawWidth = buf.readInt16LE(82)
        const copies = buf.readInt16LE(86)
        const colorNum = buf.readInt16LE(92)

        const orientation: 'portrait' | 'landscape' = orientationNum === 2 ? 'landscape' : 'portrait'
        const presetInfo = DMPAPER_PRESET_MAP[paperSizeId]

        const widthMm = rawWidth > 0 ? Math.round((rawWidth / 10) * 10) / 10 : presetInfo?.widthMm
        const heightMm = rawLength > 0 ? Math.round((rawLength / 10) * 10) / 10 : presetInfo?.heightMm
        const isColor = colorNum === 2

        const paperPresetId = presetInfo?.presetId
        const paperName =
          presetInfo?.name ||
          (widthMm && heightMm ? `Kustom (${widthMm} × ${heightMm} mm)` : undefined)

        return {
          name: printerName,
          paperName,
          paperPresetId,
          widthMm,
          heightMm,
          orientation,
          copies: copies > 0 ? copies : 1,
          isColor
        }
      }
    }
  } catch (err) {
    console.warn('Error reading Windows registry DevMode:', err)
  }

  return null
}

/**
 * Membuat Gambar Halaman Kalibrasi Printer 300 DPI (PRD FR-15)
 * - Kotak 20 × 30 mm (2x3)
 * - Kotak 30 × 40 mm (3x4)
 * - Kotak 40 × 60 mm (4x6)
 * - Garis horizontal 100 mm
 * - Garis vertikal 100 mm
 * - Penanda margin & instruksi ukur
 */
export async function generateCalibrationSheetBuffer(paperWidthMm = 210, paperHeightMm = 297, dpi = 300): Promise<Buffer> {
  const widthPx = mmToPixel(paperWidthMm, dpi)
  const heightPx = mmToPixel(paperHeightMm, dpi)

  const svgOverlay = `
  <svg width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font-family: sans-serif; font-size: ${mmToPixel(6, dpi)}px; font-weight: bold; fill: #1e293b; }
      .desc { font-family: sans-serif; font-size: ${mmToPixel(3.5, dpi)}px; fill: #475569; }
      .label { font-family: sans-serif; font-size: ${mmToPixel(3, dpi)}px; font-weight: 600; fill: #0f172a; text-anchor: middle; }
      .box { fill: #f8fafc; stroke: #0f172a; stroke-width: ${mmToPixel(0.3, dpi)}px; }
      .ruler { stroke: #e11d48; stroke-width: ${mmToPixel(0.4, dpi)}px; }
      .ruler-tick { stroke: #e11d48; stroke-width: ${mmToPixel(0.3, dpi)}px; }
      .grid { stroke: #cbd5e1; stroke-dasharray: 4,4; stroke-width: 1px; fill: none; }
    </style>

    <!-- Header -->
    <text x="${mmToPixel(20, dpi)}" y="${mmToPixel(20, dpi)}" class="title">PRINTAMA - LEMBAR UJI KALIBRASI SKALA CETAK</text>
    <text x="${mmToPixel(20, dpi)}" y="${mmToPixel(27, dpi)}" class="desc">PASTIKAN PADA DRIVER PRINTER: Skala = 100% (Actual Size), Fit to Page = Nonaktif (OFF).</text>
    <text x="${mmToPixel(20, dpi)}" y="${mmToPixel(33, dpi)}" class="desc">Ukur kotak di bawah dengan penggaris fisik untuk memastikan toleransi ±0.5 mm.</text>

    <!-- Kotak 2x3 (21.6 x 27.9 mm) -->
    <g transform="translate(${mmToPixel(20, dpi)}, ${mmToPixel(45, dpi)})">
      <rect width="${mmToPixel(21.6, dpi)}" height="${mmToPixel(27.9, dpi)}" class="box" />
      <text x="${mmToPixel(10.8, dpi)}" y="${mmToPixel(15, dpi)}" class="label">2 × 3 cm</text>
      <text x="${mmToPixel(10.8, dpi)}" y="${mmToPixel(20, dpi)}" class="label">(21,6×27,9 mm)</text>
    </g>

    <!-- Kotak 3x4 (27.9 x 38.1 mm) -->
    <g transform="translate(${mmToPixel(50, dpi)}, ${mmToPixel(45, dpi)})">
      <rect width="${mmToPixel(27.9, dpi)}" height="${mmToPixel(38.1, dpi)}" class="box" />
      <text x="${mmToPixel(13.95, dpi)}" y="${mmToPixel(20, dpi)}" class="label">3 × 4 cm</text>
      <text x="${mmToPixel(13.95, dpi)}" y="${mmToPixel(25, dpi)}" class="label">(27,9×38,1 mm)</text>
    </g>

    <!-- Kotak 4x6 (38.1 x 55.9 mm) -->
    <g transform="translate(${mmToPixel(90, dpi)}, ${mmToPixel(45, dpi)})">
      <rect width="${mmToPixel(38.1, dpi)}" height="${mmToPixel(55.9, dpi)}" class="box" />
      <text x="${mmToPixel(19.05, dpi)}" y="${mmToPixel(29, dpi)}" class="label">4 × 6 cm</text>
      <text x="${mmToPixel(19.05, dpi)}" y="${mmToPixel(34, dpi)}" class="label">(38,1×55,9 mm)</text>
    </g>

    <!-- Penggaris Uji 100 mm Horizontal -->
    <g transform="translate(${mmToPixel(20, dpi)}, ${mmToPixel(120, dpi)})">
      <line x1="0" y1="0" x2="${mmToPixel(100, dpi)}" y2="0" class="ruler" />
      <line x1="0" y1="-${mmToPixel(4, dpi)}" x2="0" y2="${mmToPixel(4, dpi)}" class="ruler-tick" />
      <line x1="${mmToPixel(50, dpi)}" y1="-${mmToPixel(3, dpi)}" x2="${mmToPixel(50, dpi)}" y2="${mmToPixel(3, dpi)}" class="ruler-tick" />
      <line x1="${mmToPixel(100, dpi)}" y1="-${mmToPixel(4, dpi)}" x2="${mmToPixel(100, dpi)}" y2="${mmToPixel(4, dpi)}" class="ruler-tick" />
      <text x="${mmToPixel(50, dpi)}" y="-${mmToPixel(5, dpi)}" class="label" style="fill: #e11d48;">PENGGARIS HORIZONTAL: HARUS TEPAT 100.0 mm (10.0 cm)</text>
    </g>

    <!-- Penggaris Uji 100 mm Vertikal -->
    <g transform="translate(${mmToPixel(150, dpi)}, ${mmToPixel(45, dpi)})">
      <line x1="0" y1="0" x2="0" y2="${mmToPixel(100, dpi)}" class="ruler" />
      <line x1="-${mmToPixel(4, dpi)}" y1="0" x2="${mmToPixel(4, dpi)}" y2="0" class="ruler-tick" />
      <line x1="-${mmToPixel(3, dpi)}" y1="${mmToPixel(50, dpi)}" x2="${mmToPixel(3, dpi)}" y2="${mmToPixel(50, dpi)}" class="ruler-tick" />
      <line x1="-${mmToPixel(4, dpi)}" y1="${mmToPixel(100, dpi)}" x2="${mmToPixel(4, dpi)}" y2="${mmToPixel(100, dpi)}" class="ruler-tick" />
      <text x="${mmToPixel(15, dpi)}" y="${mmToPixel(52, dpi)}" class="label" style="fill: #e11d48; text-anchor: start;">VERTIKAL 100 mm</text>
    </g>
  </svg>
  `

  return await sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer()
}
