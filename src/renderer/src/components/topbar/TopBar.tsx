import React from 'react'
import {
  Printer,
  Download,
  Trash2,
  Compass,
  FilePlus,
  Layers
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'

interface TopBarProps {
  onBackToHome?: () => void
  onOpenExport: () => void
  onOpenPrint: () => void
  onOpenCalibration: () => void
  onOpenResetConfirm: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  onBackToHome,
  onOpenExport,
  onOpenPrint,
  onOpenCalibration,
  onOpenResetConfirm
}) => {
  const images = useWorkspaceStore((state) => state.images)
  const recommendations = useWorkspaceStore((state) => state.recommendations)
  const selectedRecommendationIndex = useWorkspaceStore(
    (state) => state.selectedRecommendationIndex
  )

  const currentLayout = recommendations[selectedRecommendationIndex]
  const hasImages = images.length > 0
  const canPrint = hasImages && currentLayout && currentLayout.placedItems.length > 0

  const handlePickPhotos = async () => {
    if (!window.api) return
    const photos = await window.api.openImages()
    if (photos && photos.length > 0) {
      useWorkspaceStore.getState().addImages(photos)
    }
  }

  return (
    <header className="h-12 border-b border-border bg-card px-3 flex items-center justify-between select-none z-20">
      {/* Tools (Left) */}
      <div className="flex items-center gap-2">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold transition-colors"
            title="Kembali ke Dashboard Beranda"
          >
            <span>⬅ Beranda</span>
          </button>
        )}

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded border border-border">
        <button
          onClick={handlePickPhotos}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-card hover:bg-secondary text-foreground transition-colors border border-border"
          title="Buka Foto (Ctrl+O)"
        >
          <FilePlus className="w-3.5 h-3.5 text-primary" />
          <span>Buka Foto</span>
        </button>

        <button
          onClick={onOpenCalibration}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          title="Kalibrasi Ukuran Fisik Printer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Kalibrasi</span>
        </button>

        <button
          onClick={onOpenResetConfirm}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Selesai & Bersihkan Workspace (FR-16)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Bersihkan</span>
        </button>
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex items-center gap-2">
        <button
          disabled={!canPrint}
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-secondary hover:bg-accent text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border active:translate-y-px"
          title="Ekspor ke JPG, PNG, atau PDF 300 DPI (Ctrl+E)"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>Ekspor 300 DPI</span>
        </button>

        <button
          disabled={!canPrint}
          onClick={onOpenPrint}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold bg-primary hover:bg-primary-hover text-white disabled:opacity-30 disabled:pointer-events-none transition-colors border border-primary/80 active:translate-y-px"
          title="Cetak Langsung Skala 100% (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Sekarang</span>
        </button>
      </div>
    </header>
  )
}
