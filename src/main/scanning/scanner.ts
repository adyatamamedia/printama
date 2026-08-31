import { promises as fs } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { ensureTempDirectory } from '../filesystem/temp'
import sharp from 'sharp'

const execAsync = promisify(exec)

export interface ScannerDevice {
  id: string
  name: string
  type: string
}

export interface ScanResult {
  success: boolean
  filePath?: string
  base64?: string
  widthPx?: number
  heightPx?: number
  error?: string
}

/**
 * Menjalankan skrip PowerShell secara aman menggunakan UTF-16LE EncodedCommand
 * Menghindari bug escaping karakter backslash dan tanda kutip pada Windows.
 */
function runEncodedPowerShell(script: string, timeoutMs = 180000): Promise<{ stdout: string; stderr: string }> {
  const utf16Buffer = Buffer.from(script, 'utf16le')
  const base64 = utf16Buffer.toString('base64')
  return execAsync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${base64}`, {
    timeout: timeoutMs
  })
}

/**
 * Deteksi perangkat hardware scanner yang terhubung di Windows via WIA (Windows Image Acquisition)
 */
export async function getConnectedScanners(): Promise<ScannerDevice[]> {
  try {
    const psScript = `
      try {
        $dm = New-Object -ComObject WIA.DeviceManager
        $scanners = @()
        foreach ($info in $dm.DeviceInfos) {
          if ($info.Type -eq 1 -or $info.Type -eq 'ScannerDeviceType') {
            $scanners += [PSCustomObject]@{
              id = $info.DeviceID
              name = $info.Properties.Item("Name").Value
              type = "Scanner"
            }
          }
        }
        $scanners | ConvertTo-Json -Compress
      } catch {
        Write-Output "[]"
      }
    `

    const { stdout } = await runEncodedPowerShell(psScript, 10000)

    const raw = stdout.trim()
    if (!raw || raw === '[]' || raw === 'null') {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (err) {
    console.warn('Gagal mendeteksi scanner WIA:', err)
    return []
  }
}

/**
 * Buka Dialog Native Windows Scanner Acquisition (WIA CommonDialog)
 * Memungkinkan user memilih scanner, preview, warna/grayscale, dan scan langsung.
 */
export async function acquireImageFromScanner(): Promise<ScanResult> {
  const tempDir = await ensureTempDirectory()
  const tempScanPath = join(tempDir, `scan-${Date.now()}.jpg`)

  // PowerShell script menggunakan WIA.CommonDialog ShowAcquireImage
  // Dan konversi melalui System.Drawing.Bitmap untuk menjamin file JPEG standar
  const psScript = `
    $ErrorActionPreference = "Stop"
    [void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")
    try {
      $dialog = New-Object -ComObject WIA.CommonDialog
      $image = $dialog.ShowAcquireImage(1, 0, 131072, "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}", $false, $true, $false)
      if ($image -eq $null) {
        Write-Output "CANCELLED"
        exit
      }

      $rawTemp = "${tempScanPath}.raw"
      if (Test-Path -LiteralPath $rawTemp) { Remove-Item -LiteralPath $rawTemp -Force }
      if (Test-Path -LiteralPath "${tempScanPath}") { Remove-Item -LiteralPath "${tempScanPath}" -Force }

      $image.SaveFile($rawTemp)

      if (Test-Path -LiteralPath $rawTemp) {
        $bmp = [System.Drawing.Image]::FromFile($rawTemp)
        $bmp.Save("${tempScanPath}", [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $bmp.Dispose()
        Remove-Item -LiteralPath $rawTemp -Force
        Write-Output "SUCCESS"
      } else {
        Write-Output "ERROR: Gagal menyimpan data sementara dari scanner"
      }
    } catch {
      Write-Output ("ERROR: " + $_.Exception.Message)
    }
  `

  try {
    const { stdout } = await runEncodedPowerShell(psScript, 180000)
    const output = stdout.trim()

    if (output.includes('CANCELLED')) {
      return { success: false, error: 'Proses scan dibatalkan oleh pengguna' }
    }

    if (output.startsWith('ERROR:')) {
      const errMsg = output.replace('ERROR:', '').trim()
      if (errMsg.includes('0x80210015') || errMsg.includes('No device') || errMsg.includes('HRESULT: 0x80210015')) {
        return {
          success: false,
          error: 'Tidak ada perangkat scanner yang terdeteksi atau scanner sedang mati/sibuk. Pastikan kabel scanner terhubung.'
        }
      }
      return { success: false, error: errMsg }
    }

    // Baca file gambar hasil scan resolusi asli 100% (tanpa downscaling agar hasil crop KTP tajam & presisi)
    try {
      const stats = await fs.stat(tempScanPath)
      if (stats.size > 0) {
        const fileBuffer = await fs.readFile(tempScanPath)
        const metadata = await sharp(fileBuffer).metadata()
        const mime = `image/${metadata.format || 'jpeg'}`
        const base64 = `data:${mime};base64,${fileBuffer.toString('base64')}`

        return {
          success: true,
          filePath: tempScanPath,
          base64,
          widthPx: metadata.width || 0,
          heightPx: metadata.height || 0
        }
      }
    } catch (readErr: any) {
      return { success: false, error: 'Gagal memuat hasil file scan: ' + readErr.message }
    }

    return { success: false, error: 'File hasil scan tidak ditemukan' }
  } catch (err: any) {
    if (err.message && (err.message.includes('0x80210015') || err.message.includes('HRESULT: 0x80210015'))) {
      return { success: false, error: 'Tidak ada perangkat scanner yang terhubung atau scanner sedang sibuk.' }
    }
    return { success: false, error: err.message || 'Gagal menjalankan pemindaian scanner.' }
  }
}
