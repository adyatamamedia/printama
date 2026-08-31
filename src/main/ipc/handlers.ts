import { app, ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { promises as fs, existsSync } from 'fs'
import path, { join, basename, extname } from 'path'
import sharp from 'sharp'
import {
  SourceImage,
  ExportOptions,
  PrintOptions,
  LayoutResult,
  ImageAdjustments,
  PaperSettings
} from '../../shared/types'
import { renderLayoutToBuffer, renderAllPagesToBuffers } from '../image/renderer'
import { createPdfFromMultipleImageBuffers } from '../pdf/generator'
import {
  getSystemPrinters,
  getPrinterConfiguration,
  generateCalibrationSheetBuffer
} from '../printing/printer'
import { loadPreferences, savePreferences } from '../settings/store'
import { cleanTempFiles, ensureTempDirectory } from '../filesystem/temp'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // 1. Buka File Gambar (JPG, PNG, WebP)
  ipcMain.handle('dialog:open-images', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Pilih Pas Foto',
      filters: [
        { name: 'Foto Pas / Gambar', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
        { name: 'Semua File', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    const loadedImages: SourceImage[] = []

    for (const filePath of result.filePaths) {
      try {
        const metadata = await sharp(filePath).metadata()
        if (!metadata.width || !metadata.height) continue

        // Buat high-definition preview buffer tanpa membebani memori
        const thumbBuffer = await sharp(filePath)
          .resize(1600, 2000, { fit: 'inside' })
          .jpeg({ quality: 92 })
          .toBuffer()

        const base64Thumb = `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`
        const stats = await fs.stat(filePath)

        loadedImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          filePath,
          fileName: basename(filePath),
          fileSize: stats.size,
          mimeType: `image/${metadata.format || 'jpeg'}`,
          widthPx: metadata.width,
          heightPx: metadata.height,
          thumbnailUrl: base64Thumb
        })
      } catch (err) {
        console.error(`Gagal membaca metadata foto ${filePath}:`, err)
      }
    }

    return loadedImages
  })

  // 1.1 Read Full High-Res Image (Tanpa downscaling untuk modal crop & export jernih)
  ipcMain.handle('image:read-full', async (_event, filePath: string) => {
    try {
      if (!filePath || !existsSync(filePath)) return null
      const buf = await fs.readFile(filePath)
      const metadata = await sharp(buf).metadata()
      const mime = `image/${metadata.format || 'jpeg'}`
      return {
        base64: `data:${mime};base64,${buf.toString('base64')}`,
        widthPx: metadata.width || 0,
        heightPx: metadata.height || 0
      }
    } catch (err) {
      console.error('Gagal membaca gambar resolusi penuh:', err)
      return null
    }
  })

  // 2. Dialog Save File (JPG / PNG / PDF)
  ipcMain.handle(
    'dialog:save-file',
    async (
      _event,
      options: { defaultName: string; format: 'png' | 'jpeg' | 'pdf' }
    ) => {
      const filters =
        options.format === 'pdf'
          ? [{ name: 'Dokumen PDF (*.pdf)', extensions: ['pdf'] }]
          : options.format === 'jpeg'
          ? [{ name: 'Gambar JPEG (*.jpg)', extensions: ['jpg', 'jpeg'] }]
          : [{ name: 'Gambar PNG (*.png)', extensions: ['png'] }]

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Simpan Hasil Cetak Pas Foto',
        defaultPath: options.defaultName,
        filters
      })

      if (result.canceled) return null
      return result.filePath
    }
  )

  // 3. Eksekusi Ekspor File 300 DPI Multi-Halaman (JPG, PNG, PDF)
  ipcMain.handle(
    'export:execute',
    async (
      _event,
      payload: {
        layoutResult: LayoutResult
        adjustments: ImageAdjustments
        paper: PaperSettings
        images: SourceImage[]
        exportOptions: ExportOptions
      }
    ) => {
      const { layoutResult, adjustments, paper, images, exportOptions } = payload

      try {
        const renderFormat = exportOptions.format === 'pdf' ? 'png' : exportOptions.format

        const allBuffers = await renderAllPagesToBuffers({
          layoutResult,
          adjustments,
          paper,
          images,
          dpi: exportOptions.dpi || 300,
          format: renderFormat,
          jpegQuality: exportOptions.quality || 95,
          includeCropMarks: exportOptions.includeCropMarks
        })

        if (exportOptions.format === 'pdf') {
          const pdfBytes = await createPdfFromMultipleImageBuffers(
            allBuffers,
            'png',
            layoutResult.effectivePaperWidthMm,
            layoutResult.effectivePaperHeightMm
          )
          await fs.writeFile(exportOptions.destinationPath, Buffer.from(pdfBytes))
          shell.showItemInFolder(exportOptions.destinationPath)
          return { success: true, filePath: exportOptions.destinationPath }
        } else {
          if (allBuffers.length === 1) {
            await fs.writeFile(exportOptions.destinationPath, allBuffers[0])
            shell.showItemInFolder(exportOptions.destinationPath)
            return { success: true, filePath: exportOptions.destinationPath }
          } else {
            const ext = extname(exportOptions.destinationPath)
            const base = exportOptions.destinationPath.slice(0, -ext.length)
            let firstFile = ''
            for (let i = 0; i < allBuffers.length; i++) {
              const pagePath = `${base}_Lembar_${i + 1}${ext}`
              await fs.writeFile(pagePath, allBuffers[i])
              if (i === 0) firstFile = pagePath
            }
            if (firstFile) {
              shell.showItemInFolder(firstFile)
            }
            return { success: true, filePath: `${base}_Lembar_1 s/d _Lembar_${allBuffers.length}${ext}` }
          }
        }
      } catch (err: any) {
        console.error('Ekspor gagal:', err)
        return { success: false, error: err.message || 'Gagal mengekspor berkas' }
      }
    }
  )

  // 4. Deteksi Printer Windows
  ipcMain.handle('printing:get-printers', async () => {
    return await getSystemPrinters(mainWindow)
  })

  // 4b. Status Printer Real-Time Dinamis
  ipcMain.handle('printing:get-printer-status', async (_event, printerName: string) => {
    if (!printerName) return { isOnline: false, portName: '-', statusText: 'Pilih printer' }
    try {
      const printers = await getSystemPrinters(mainWindow)
      const found = printers.find(
        (p) => p.name === printerName || p.name.toLowerCase() === printerName.toLowerCase()
      )
      if (found) {
        return {
          isOnline: found.isOnline ?? true,
          portName: found.portName || 'USB Port',
          statusText: found.statusText || 'Ready (Printer ON)'
        }
      }
    } catch (err) {
      console.error('Error fetching live printer status:', err)
    }

    return {
      isOnline: true,
      portName: 'USB Port',
      statusText: 'Ready (Printer ON)'
    }
  })

  // 4c. Buka Dialog Windows Settings / Preferences Printer & Tunggu User Menutupnya
  ipcMain.handle('printing:open-printer-preferences', async (_event, printerName: string) => {
    if (!printerName) return null
    try {
      const { exec } = await import('child_process')

      const cleanName = printerName.replace(/"/g, '')
      await new Promise<void>((resolve) => {
        const proc = exec(`rundll32.exe printui.dll,PrintUIEntry /e /n "${cleanName}"`, () => {
          resolve()
        })
        proc.on('exit', () => resolve())
        proc.on('close', () => resolve())
        proc.on('error', () => resolve())

        // Batas maksimal keamanan 60 detik
        setTimeout(() => resolve(), 60000)
      })

      // Beri sedikit jeda agar Windows selesai menyimpan konfigurasi
      await new Promise((resolve) => setTimeout(resolve, 300))

      return await getPrinterConfiguration(printerName)
    } catch (err) {
      console.warn('Gagal membaca konfigurasi setelah dialog:', err)
      return await getPrinterConfiguration(printerName)
    }
  })

  // 4d. Ambil Konfigurasi Printer Driver Windows
  ipcMain.handle('printing:get-printer-config', async (_event, printerName: string) => {
    return await getPrinterConfiguration(printerName)
  })

  // 5. Cetak Lembar Uji Kalibrasi
  ipcMain.handle('printing:save-calibration-sheet', async () => {
    const saveResult = await dialog.showSaveDialog(mainWindow, {
      title: 'Simpan Lembar Uji Kalibrasi Printer',
      defaultPath: `Printama-Kalibrasi-A4-${Date.now()}.png`,
      filters: [{ name: 'Gambar PNG (*.png)', extensions: ['png'] }]
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false }
    }

    const buffer = await generateCalibrationSheetBuffer(210, 297, 300)
    await fs.writeFile(saveResult.filePath, buffer)
    shell.showItemInFolder(saveResult.filePath)

    return { success: true, filePath: saveResult.filePath }
  })

  // 6. Cetak Langsung Multi-Lembar melalui Driver Printer Windows
  ipcMain.handle(
    'printing:execute-print',
    async (
      _event,
      payload: {
        layoutResult: LayoutResult
        adjustments: ImageAdjustments
        paper: PaperSettings
        images: SourceImage[]
        printOptions: PrintOptions
      }
    ) => {
      const { layoutResult, adjustments, paper, images, printOptions } = payload

      try {
        const widthMm = layoutResult.effectivePaperWidthMm
        const heightMm = layoutResult.effectivePaperHeightMm

        // Render seluruh halaman 300 DPI
        const allBuffers = await renderAllPagesToBuffers({
          layoutResult,
          adjustments,
          paper,
          images,
          dpi: printOptions.dpi || 300,
          format: 'png',
          includeCropMarks: printOptions.includeCropMarks
        })

        const tempDir = app.getPath('temp')
        const jobId = `printama-pasfoto-${Date.now()}`
        const tempFiles: string[] = []

        // Simpan setiap buffer halaman ke file sementara agar tidak terkena limit URL Chromium
        const pageElements: string[] = []
        for (let i = 0; i < allBuffers.length; i++) {
          const pageImgPath = path.join(tempDir, `${jobId}-page-${i}.png`)
          await fs.writeFile(pageImgPath, allBuffers[i])
          tempFiles.push(pageImgPath)
          const fileUrl = `file:///${pageImgPath.replace(/\\/g, '/')}`
          pageElements.push(`<div class="page"><img src="${fileUrl}" /></div>`)
        }

        const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .page {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    img {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      display: block;
      object-fit: fill;
    }
  </style>
</head>
<body>
  ${pageElements.join('')}
</body>
</html>`

        const htmlPath = path.join(tempDir, `${jobId}.html`)
        await fs.writeFile(htmlPath, printHtml, 'utf-8')
        tempFiles.push(htmlPath)

        const printWindow = new BrowserWindow({
          show: false,
          width: 800,
          height: 1000,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
          }
        })

        await printWindow.loadFile(htmlPath)

        // Pastikan seluruh konten gambar telah selesai ter-render di DOM
        await printWindow.webContents.executeJavaScript(
          `new Promise((resolve) => {
            const imgs = Array.from(document.querySelectorAll('img'));
            if (imgs.every(img => img.complete)) {
              resolve(true);
            } else {
              let loaded = 0;
              imgs.forEach(img => {
                img.onload = img.onerror = () => {
                  loaded++;
                  if (loaded === imgs.length) resolve(true);
                };
              });
            }
          })`
        )

        return new Promise((resolve) => {
          printWindow.webContents.print(
            {
              silent: printOptions.silent !== undefined ? printOptions.silent : true,
              printBackground: true,
              deviceName: printOptions.printerName || '',
              copies: printOptions.copies || 1,
              margins: { marginType: 'none' },
              pageSize: {
                width: Math.round(widthMm * 1000), // microns
                height: Math.round(heightMm * 1000) // microns
              }
            },
            async (success, failureReason) => {
              try {
                printWindow.close()
              } catch (_) {}

              // Bersihkan file sementara
              for (const f of tempFiles) {
                try {
                  await fs.unlink(f)
                } catch (_) {}
              }

              if (!success) {
                resolve({ success: false, error: failureReason })
              } else {
                resolve({ success: true })
              }
            }
          )
        })
      } catch (err: any) {
        console.error('Pencetakan gagal:', err)
        return { success: false, error: err.message }
      }
    }
  )

  // 7. Pengaturan Preferensi Lokal
  ipcMain.handle('settings:get', async () => {
    return await loadPreferences()
  })

  ipcMain.handle('settings:set', async (_event, prefs) => {
    return await savePreferences(prefs)
  })

  // 8. Pembersihan Cache File Sementara (PRD FR-16)
  ipcMain.handle('app:clean-temp', async () => {
    return await cleanTempFiles()
  })

  // 9. Deteksi Scanner Hardware & Scan Langsung dari Windows (WIA)
  ipcMain.handle('scanner:get-devices', async () => {
    const { getConnectedScanners } = await import('../scanning/scanner')
    return await getConnectedScanners()
  })

  ipcMain.handle('scanner:acquire-image', async () => {
    const { acquireImageFromScanner } = await import('../scanning/scanner')
    return await acquireImageFromScanner()
  })

  // 10. Ekspor Dokumen Langsung dari Base64 / Canvas (KTP, Polaroid & Modul Lainnya)
  ipcMain.handle(
    'export:direct',
    async (
      _event,
      payload: {
        base64?: string
        pages?: Array<{ base64: string; widthMm?: number; heightMm?: number }>
        destinationPath: string
        format: 'png' | 'jpeg' | 'pdf'
        widthMm?: number
        heightMm?: number
      }
    ) => {
      const { base64, pages, destinationPath, format, widthMm = 210, heightMm = 297 } = payload
      try {
        const rawPages =
          pages && pages.length > 0
            ? pages
            : base64
            ? [{ base64, widthMm, heightMm }]
            : []

        if (rawPages.length === 0) {
          throw new Error('Tidak ada data halaman yang akan diekspor')
        }

        const buffers = rawPages
          .map((p) => {
            const str = (typeof p === 'string' ? p : p?.base64) || ''
            const cleanBase64 = str.replace(/^data:image\/\w+;base64,/, '')
            return Buffer.from(cleanBase64, 'base64')
          })
          .filter((b) => b.length > 0)

        if (format === 'pdf') {
          const pdfBytes = await createPdfFromMultipleImageBuffers(
            buffers,
            'png',
            rawPages[0].widthMm || widthMm,
            rawPages[0].heightMm || heightMm
          )
          await fs.writeFile(destinationPath, Buffer.from(pdfBytes))
          shell.showItemInFolder(destinationPath)
          return { success: true, filePath: destinationPath }
        } else {
          if (buffers.length === 1) {
            await fs.writeFile(destinationPath, buffers[0])
            shell.showItemInFolder(destinationPath)
            return { success: true, filePath: destinationPath }
          } else {
            const ext = extname(destinationPath)
            const base = destinationPath.slice(0, -ext.length)
            let firstFile = ''
            for (let i = 0; i < buffers.length; i++) {
              const pageFile = `${base}_hal-${i + 1}${ext}`
              await fs.writeFile(pageFile, buffers[i])
              if (i === 0) firstFile = pageFile
            }
            if (firstFile) {
              shell.showItemInFolder(firstFile)
            }
            return { success: true, filePath: `${base}_hal-1 s/d _hal-${buffers.length}${ext}` }
          }
        }
      } catch (err: any) {
        console.error('Ekspor direct gagal:', err)
        return { success: false, error: err.message || 'Gagal mengekspor berkas' }
      }
    }
  )

  // 11. Cetak Langsung Dokumen dari Base64 (KTP & Modul Lainnya)
  ipcMain.handle(
    'printing:print-direct',
    async (
      _event,
      payload: {
        base64: string
        widthMm: number
        heightMm: number
        printOptions: PrintOptions
      }
    ) => {
      const { base64, widthMm, heightMm, printOptions } = payload
      const tempDir = app.getPath('temp')
      const jobId = `printama-ktp-${Date.now()}`
      const tempFiles: string[] = []

      try {
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '')
        const imgPath = path.join(tempDir, `${jobId}.png`)
        await fs.writeFile(imgPath, Buffer.from(cleanBase64, 'base64'))
        tempFiles.push(imgPath)

        const fileUrl = `file:///${imgPath.replace(/\\/g, '/')}`
        const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .page {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      overflow: hidden;
    }
    img {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      display: block;
      object-fit: fill;
    }
  </style>
</head>
<body>
  <div class="page"><img src="${fileUrl}" /></div>
</body>
</html>`

        const htmlPath = path.join(tempDir, `${jobId}.html`)
        await fs.writeFile(htmlPath, printHtml, 'utf-8')
        tempFiles.push(htmlPath)

        const printWindow = new BrowserWindow({
          show: false,
          width: 800,
          height: 1000,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false
          }
        })

        await printWindow.loadFile(htmlPath)

        await printWindow.webContents.executeJavaScript(
          `new Promise((resolve) => {
            const img = document.querySelector('img');
            if (img && img.complete) {
              resolve(true);
            } else if (img) {
              img.onload = img.onerror = () => resolve(true);
            } else {
              resolve(true);
            }
          })`
        )

        return new Promise((resolve) => {
          printWindow.webContents.print(
            {
              silent: printOptions.silent !== undefined ? printOptions.silent : true,
              printBackground: true,
              deviceName: printOptions.printerName || '',
              copies: printOptions.copies || 1,
              margins: { marginType: 'none' },
              pageSize: {
                width: Math.round(widthMm * 1000), // microns
                height: Math.round(heightMm * 1000) // microns
              }
            },
            async (success, failureReason) => {
              try {
                printWindow.close()
              } catch (_) {}

              // Bersihkan file sementara
              for (const f of tempFiles) {
                try {
                  await fs.unlink(f)
                } catch (_) {}
              }

              if (!success) {
                resolve({ success: false, error: failureReason })
              } else {
                resolve({ success: true })
              }
            }
          )
        })
      } catch (err: any) {
        console.error('Cetak KTP gagal:', err)
        // Bersihkan jika terjadi error
        for (const f of tempFiles) {
          try {
            await fs.unlink(f)
          } catch (_) {}
        }
        return { success: false, error: err.message }
      }
    }
  )

  // 12. Buka URL Eksternal di Default Browser
  ipcMain.handle('app:open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 13. Dapatkan Versi Aplikasi Aktif
  ipcMain.handle('app:get-version', () => {
    return app.getVersion() || '1.0.0'
  })

  // 13. Auto-Check Update dari GitHub Releases / Tags
  ipcMain.handle('app:check-for-updates', async () => {
    try {
      const currentVersion = app.getVersion() || '1.0.0'
      const headers = {
        'User-Agent': 'Printama-Desktop-App',
        Accept: 'application/vnd.github.v3+json'
      }

      // 1. Coba ambil dari Releases resmi
      let release: any = null
      let rawTag = ''
      let latestVersion = ''
      let releaseTitle = ''
      let releaseNotes = ''
      let downloadUrl = ''
      let htmlUrl = `https://github.com/adyatamamedia/printama/releases`
      let publishedAt: string | undefined

      const releaseRes = await fetch(
        'https://api.github.com/repos/adyatamamedia/printama/releases/latest',
        { headers }
      )

      if (releaseRes.ok) {
        release = await releaseRes.json()
        rawTag = release.tag_name || ''
        latestVersion = rawTag.replace(/^v/i, '')
        releaseTitle = release.name || `Rilis v${latestVersion}`
        releaseNotes = release.body || 'Pembaruan stabilitas dan peningkatan performa.'
        htmlUrl = release.html_url || htmlUrl
        publishedAt = release.published_at

        const exeAsset = release.assets?.find(
          (a: any) => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.exe')
        )
        downloadUrl = exeAsset ? exeAsset.browser_download_url : htmlUrl
      } else {
        // 2. Fallback: Coba ambil dari Git Tags terbaru
        const tagsRes = await fetch(
          'https://api.github.com/repos/adyatamamedia/printama/tags',
          { headers }
        )

        if (tagsRes.ok) {
          const tags = (await tagsRes.json()) as any[]
          if (Array.isArray(tags) && tags.length > 0) {
            rawTag = tags[0].name || ''
            latestVersion = rawTag.replace(/^v/i, '')
            releaseTitle = `Printama v${latestVersion}`
            releaseNotes = 'Rilis versi terbaru dari GitHub.'
            htmlUrl = `https://github.com/adyatamamedia/printama/releases/tag/${rawTag}`
            downloadUrl = htmlUrl
          }
        }
      }

      if (!latestVersion) {
        return {
          hasUpdate: false,
          currentVersion
        }
      }

      const parseSemver = (v: string) =>
        v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0)
      const [cMaj, cMin, cPatch] = parseSemver(currentVersion)
      const [lMaj, lMin, lPatch] = parseSemver(latestVersion)

      let hasUpdate = false
      if (lMaj > cMaj) hasUpdate = true
      else if (lMaj === cMaj && lMin > cMin) hasUpdate = true
      else if (lMaj === cMaj && lMin === cMin && lPatch > cPatch) hasUpdate = true

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseTitle,
        releaseNotes,
        downloadUrl,
        htmlUrl,
        publishedAt
      }
    } catch (err: any) {
      console.error('Check update failed:', err)
      return {
        hasUpdate: false,
        currentVersion: app.getVersion() || '1.0.0',
        error: err.message
      }
    }
  })
}
