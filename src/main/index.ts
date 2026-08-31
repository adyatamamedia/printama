import icon from '../../resources/icon.png?asset'
import { app, shell, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/handlers'
import { cleanTempFiles, ensureTempDirectory } from './filesystem/temp'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const appIcon = nativeImage.createFromPath(icon)

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'Printama - Penata & Pencetak Pas Foto Presisi',
    backgroundColor: '#0c1420',
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // needed for full node bridge in preload
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.setIcon(appIcon)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Register IPC handlers
  registerIpcHandlers(mainWindow)

  // Load URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.adyatamatech.printama')

  // Pastikan direktori temporary ada & bersihkan cache lama
  await ensureTempDirectory()
  await cleanTempFiles()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await cleanTempFiles()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
