import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  SourceImage,
  ExportOptions,
  PrintOptions,
  LayoutResult,
  ImageAdjustments,
  PaperSettings,
  PrinterInfo,
  UserPreferences
} from '../shared/types'

// Custom APIs for renderer
export const api = {
  // File dialogs
  openImages: (): Promise<SourceImage[]> => ipcRenderer.invoke('dialog:open-images'),
  readFullImage: (
    filePath: string
  ): Promise<{ base64: string; widthPx: number; heightPx: number } | null> =>
    ipcRenderer.invoke('image:read-full', filePath),
  showSaveDialog: (options: {
    defaultName: string
    format: 'png' | 'jpeg' | 'pdf'
  }): Promise<string | null> => ipcRenderer.invoke('dialog:save-file', options),

  // 300 DPI Export
  exportLayout: (payload: {
    layoutResult: LayoutResult
    adjustments: ImageAdjustments
    paper: PaperSettings
    images: SourceImage[]
    exportOptions: ExportOptions
  }): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('export:execute', payload),

  // Printing & Calibration
  getPrinters: (): Promise<PrinterInfo[]> => ipcRenderer.invoke('printing:get-printers'),
  getPrinterStatus: (
    printerName: string
  ): Promise<{ isOnline: boolean; portName: string; statusText: string }> =>
    ipcRenderer.invoke('printing:get-printer-status', printerName),
  getPrinterConfig: (printerName: string): Promise<import('../shared/types').WindowsPrinterConfig | null> =>
    ipcRenderer.invoke('printing:get-printer-config', printerName),
  openPrinterPreferences: (
    printerName: string
  ): Promise<import('../shared/types').WindowsPrinterConfig | null> =>
    ipcRenderer.invoke('printing:open-printer-preferences', printerName),
  saveCalibrationSheet: (): Promise<{ success: boolean; filePath?: string }> =>
    ipcRenderer.invoke('printing:save-calibration-sheet'),
  executePrint: (payload: {
    layoutResult: LayoutResult
    adjustments: ImageAdjustments
    paper: PaperSettings
    images: SourceImage[]
    printOptions: PrintOptions
  }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('printing:execute-print', payload),

  // User Settings
  getSettings: (): Promise<UserPreferences> => ipcRenderer.invoke('settings:get'),
  setSettings: (prefs: Partial<UserPreferences>): Promise<UserPreferences> =>
    ipcRenderer.invoke('settings:set', prefs),

  // Cleanup
  cleanTempFiles: (): Promise<{ success: boolean; deletedCount: number }> =>
    ipcRenderer.invoke('app:clean-temp'),

  // Hardware Scanner (WIA)
  getScannerDevices: (): Promise<{ id: string; name: string; type: string }[]> =>
    ipcRenderer.invoke('scanner:get-devices'),
  acquireScannerImage: (): Promise<{
    success: boolean
    filePath?: string
    base64?: string
    widthPx?: number
    heightPx?: number
    error?: string
  }> => ipcRenderer.invoke('scanner:acquire-image'),

  // Direct Document Export & Print (Canvas/KTP/Polaroid)
  exportDirect: (payload: {
    base64?: string
    pages?: Array<{ base64: string; widthMm?: number; heightMm?: number }>
    destinationPath: string
    format: 'png' | 'jpeg' | 'pdf'
    widthMm?: number
    heightMm?: number
  }): Promise<{ success: boolean; filePath?: string; error?: string }> =>
    ipcRenderer.invoke('export:direct', payload),

  printDirect: (payload: {
    base64: string
    widthMm: number
    heightMm: number
    printOptions: PrintOptions
  }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('printing:print-direct', payload),

  // External Links & Auto-Update
  openExternal: (url: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('app:open-external', url),
  checkForUpdates: (): Promise<{
    hasUpdate: boolean
    currentVersion: string
    latestVersion?: string
    releaseTitle?: string
    releaseNotes?: string
    downloadUrl?: string
    htmlUrl?: string
    publishedAt?: string
    error?: string
  }> => ipcRenderer.invoke('app:check-for-updates')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
