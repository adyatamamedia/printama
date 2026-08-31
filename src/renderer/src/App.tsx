import React, { useState, useEffect } from 'react'
import { LeftPanel } from './components/left-panel/LeftPanel'
import { PaperCanvas } from './components/center-panel/PaperCanvas'
import { RightPanel } from './components/right-panel/RightPanel'
import { BottomBar } from './components/bottom-bar/BottomBar'
import { HomeDashboard } from './components/home/HomeDashboard'
import { KtpWorkspace } from './components/ktp-workspace/KtpWorkspace'
import { PolaroidWorkspace } from './components/polaroid-workspace/PolaroidWorkspace'
import { ExportModal } from './components/modals/ExportModal'
import { PrintModal } from './components/modals/PrintModal'
import { CalibrationModal } from './components/modals/CalibrationModal'
import { ConfirmResetModal } from './components/modals/ConfirmResetModal'
import { useWorkspaceStore } from './stores/workspaceStore'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ArrowLeft, Download, Printer } from 'lucide-react'

type AppView = 'home' | 'pas-foto' | 'ktp-id' | 'polaroid'

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const pasFotoImages = useWorkspaceStore((state) => state.images)
  const hasPasFoto = pasFotoImages.length > 0

  // Global Keyboard Shortcuts (PRD FR-12.3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O: Pilih foto (jika di modul pas foto)
      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        if (currentView === 'pas-foto' && window.api) {
          window.api.openImages().then((photos) => {
            if (photos && photos.length > 0) {
              useWorkspaceStore.getState().addImages(photos)
            }
          })
        }
      }
      // Ctrl+P: Print preview / dialog
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setIsPrintOpen(true)
      }
      // Ctrl+E: Export 300 DPI
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setIsExportOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView])

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
        {/* 1. VIEW: Home Dashboard */}
        {currentView === 'home' && (
          <HomeDashboard onSelectModule={(mod) => setCurrentView(mod)} />
        )}

        {/* 2. VIEW: Modul Pas Foto */}
        {currentView === 'pas-foto' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header Pas Foto dengan Tombol Beranda */}
            <header className="h-12 border-b border-border px-4 flex items-center justify-between bg-card shrink-0 z-20 select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold transition-colors"
                  title="Kembali ke Dashboard Beranda"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </button>
                <div className="h-4 w-px bg-border" />
                <h1 className="font-extrabold text-xs tracking-wide text-foreground uppercase">
                  LAYOUT PAS FOTO
                </h1>
              </div>

              {/* Action Buttons: Export & Cetak */}
              <div className="flex items-center gap-2">
                <button
                  disabled={!hasPasFoto}
                  onClick={() => setIsExportOpen(true)}
                  className="py-1 px-3 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                  title="Export Gambar 300 DPI (Ctrl+E)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  disabled={!hasPasFoto}
                  onClick={() => setIsPrintOpen(true)}
                  className="py-1 px-3 rounded bg-primary hover:bg-primary-hover text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors border border-primary/80 shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                  title="Cetak Dokumen ke Printer (Ctrl+P)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            </header>

            {/* Three-Panel Workspace */}
            <div className="flex-1 flex overflow-hidden">
              <LeftPanel />
              <PaperCanvas />
              <RightPanel
                onOpenExport={() => setIsExportOpen(true)}
                onOpenPrint={() => setIsPrintOpen(true)}
              />
            </div>

            {/* Status Bar & Sisa Kertas Action */}
            <BottomBar />
          </div>
        )}

        {/* 3. VIEW: Modul Fotokopi & Scan KTP / ID Card */}
        {currentView === 'ktp-id' && (
          <KtpWorkspace
            onBackToHome={() => setCurrentView('home')}
            onOpenPrint={() => setIsPrintOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}

        {/* 4. VIEW: Modul Foto Polaroid (Default 1 Lembar 9 Foto) */}
        {currentView === 'polaroid' && (
          <PolaroidWorkspace
            onBackToHome={() => setCurrentView('home')}
            onOpenPrint={() => setIsPrintOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}

        {/* Modals */}
        <ExportModal
          isOpen={isExportOpen}
          mode={currentView}
          onClose={() => setIsExportOpen(false)}
        />
        <PrintModal
          isOpen={isPrintOpen}
          mode={currentView}
          onClose={() => setIsPrintOpen(false)}
        />
        <CalibrationModal
          isOpen={isCalibrationOpen}
          onClose={() => setIsCalibrationOpen(false)}
        />
        <ConfirmResetModal
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App
