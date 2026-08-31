import React, { useState } from 'react'
import {
  Package,
  Plus,
  Minus,
  Download,
  Printer,
  User,
  Users,
  Copy
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import {
  DEFAULT_PACKAGE_PRESETS,
  DEFAULT_PAPER_PRESETS,
  PHOTO_SIZE_PRESETS
} from '../../../../shared/constants/presets'
import { PaperPresetId, PhotoPresetId } from '../../../../shared/types'

interface RightPanelProps {
  onOpenExport: () => void
  onOpenPrint: () => void
}

export const RightPanel: React.FC<RightPanelProps> = ({ onOpenExport, onOpenPrint }) => {
  const images = useWorkspaceStore((state) => state.images)
  const selectedImageId = useWorkspaceStore((state) => state.selectedImageId)
  const requests = useWorkspaceStore((state) => state.requests)
  const printMode = useWorkspaceStore((state) => state.printMode)
  const setPrintMode = useWorkspaceStore((state) => state.setPrintMode)
  const setSelectedImageId = useWorkspaceStore((state) => state.setSelectedImageId)
  const paper = useWorkspaceStore((state) => state.paper)
  const gapMm = useWorkspaceStore((state) => state.gapMm)
  const includeCropMarks = useWorkspaceStore((state) => state.includeCropMarks)
  const recommendations = useWorkspaceStore((state) => state.recommendations)
  const selectedIndex = useWorkspaceStore((state) => state.selectedRecommendationIndex)

  const updateRequestQuantity = useWorkspaceStore((state) => state.updateRequestQuantity)
  const updateRequestQuantityForAll = useWorkspaceStore((state) => state.updateRequestQuantityForAll)
  const applyPackagePreset = useWorkspaceStore((state) => state.applyPackagePreset)
  const applyPackagePresetToAll = useWorkspaceStore((state) => state.applyPackagePresetToAll)
  const applyCurrentRequestsToAll = useWorkspaceStore((state) => state.applyCurrentRequestsToAll)
  const setPaperPreset = useWorkspaceStore((state) => state.setPaperPreset)
  const updatePaperSettings = useWorkspaceStore((state) => state.updatePaperSettings)
  const setGapMm = useWorkspaceStore((state) => state.setGapMm)
  const setIncludeCropMarks = useWorkspaceStore((state) => state.setIncludeCropMarks)

  // State untuk bulk edit: otomatis terapkan perubahan jumlah ke semua foto orang
  const [applyToAll, setApplyToAll] = useState<boolean>(true)

  const currentLayout = recommendations[selectedIndex]
  const hasImages = images.length > 0
  const canPrint = hasImages && currentLayout && currentLayout.placedItems.length > 0

  const activeImage = images.find((img) => img.id === selectedImageId) || images[0]

  const isPresetActive = (pkg: (typeof DEFAULT_PACKAGE_PRESETS)[0]) => {
    return (
      pkg.items.every((item) => {
        const req = requests.find((r) => r.presetId === item.presetId)
        return (req?.quantity || 0) === item.quantity
      }) &&
      requests.every((r) => {
        const item = pkg.items.find((it) => it.presetId === r.presetId)
        return (r.quantity || 0) === (item?.quantity || 0)
      })
    )
  }

  const handleApplyPackage = (pkgId: string) => {
    if (printMode === 'multi' && applyToAll) {
      applyPackagePresetToAll(pkgId)
    } else {
      applyPackagePreset(pkgId)
    }
  }

  const handleQuantityChange = (presetId: PhotoPresetId, qty: number) => {
    if (printMode === 'multi' && applyToAll) {
      updateRequestQuantityForAll(presetId, qty)
    } else {
      updateRequestQuantity(presetId, qty)
    }
  }

  // Hitung total pas foto dari semua orang yang ada di lembar cetak
  const totalPlacedCount = currentLayout?.totalItemsPlaced || 0

  return (
    <aside className="w-80 h-full border-l border-border bg-card flex flex-col justify-between select-none shrink-0 overflow-y-auto">
      {/* Scrollable Content Area */}
      <div className="flex-1">
        {/* Header */}
        <div className="h-10 px-3.5 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              PAKET & LAYOUT
            </h2>
          </div>
          {currentLayout && currentLayout.totalPages > 1 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
              {currentLayout.totalPages} Lembar Kertas
            </span>
          )}
        </div>

        <div className="p-3.5 space-y-4">
          {/* 0. Tombol Switch Mode Cetak: 1 Orang vs Campur Multi-Foto */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Mode Cetak
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`h-8 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all border ${
                  printMode === 'single'
                    ? 'bg-secondary text-white border-white/70 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                }`}
                title="Cetak foto 1 orang penuh di 1 lembar kertas"
              >
                <User className="w-3.5 h-3.5" />
                <span>1 Orang</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('multi')}
                className={`h-8 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all border ${
                  printMode === 'multi'
                    ? 'bg-secondary text-white border-white/70 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                }`}
                title="Gabungkan foto beberapa orang berbeda dalam 1 lembar kertas"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Campur Foto</span>
              </button>
            </div>

            {/* Indikator Foto Aktif saat Mode Campur Foto */}
            {printMode === 'multi' && images.length > 1 && (
              <div className="bg-muted/30 p-2 rounded border border-border text-xs space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>Pilih Foto Yang Diatur:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {totalPlacedCount} foto di kertas
                  </span>
                </div>
                <select
                  value={selectedImageId || ''}
                  onChange={(e) => setSelectedImageId(e.target.value)}
                  className="w-full bg-card border border-border rounded px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-white/60 truncate"
                >
                  {images.map((img, idx) => (
                    <option key={img.id} value={img.id}>
                      Orang {idx + 1}: {img.fileName}
                    </option>
                  ))}
                </select>

                {/* Bulk Edit Toggle & Copy Button */}
                <div className="pt-1 border-t border-border flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-foreground hover:text-white">
                    <input
                      type="checkbox"
                      checked={applyToAll}
                      onChange={(e) => setApplyToAll(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span>Ubah Semua Sekaligus</span>
                  </label>

                  <button
                    type="button"
                    onClick={applyCurrentRequestsToAll}
                    className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted hover:bg-secondary text-foreground hover:text-white border border-border transition-colors font-medium"
                    title="Salin jumlah ukuran foto aktif ke semua orang"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Salin ke Semua</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1. Paket Preset Cepat (Super Compact Standalone Buttons) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Preset Paket Cepat
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_PACKAGE_PRESETS.map((pkg) => {
                const isActive = isPresetActive(pkg)
                return (
                  <button
                    key={pkg.id}
                    onClick={() => handleApplyPackage(pkg.id)}
                    className={`h-7 px-2 rounded-md flex items-center justify-center text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-secondary text-white border-white/70 shadow-sm'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                    title={`${pkg.name} (${pkg.description})`}
                  >
                    <span className="truncate">{pkg.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Jumlah Foto Per Ukuran */}
          <div className="space-y-1.5 bg-muted/40 p-2.5 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Jumlah Foto Pesanan
              </span>
              {printMode === 'multi' && (
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                  {applyToAll ? `(Semua ${images.length} Orang)` : `(${activeImage?.fileName || ''})`}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {PHOTO_SIZE_PRESETS.map((p) => {
                const req = requests.find((r) => r.presetId === p.id)
                const qty = req?.quantity || 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-card px-2.5 py-1.5 rounded border border-border"
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {p.widthMm} × {p.heightMm} mm
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuantityChange(p.id, qty - 1)}
                        className="w-5 h-5 rounded bg-muted hover:bg-secondary border border-border flex items-center justify-center text-foreground transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(p.id, parseInt(e.target.value) || 0)
                        }
                        className="w-8 text-center font-bold text-xs font-mono bg-transparent py-0.5 focus:outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(p.id, qty + 1)}
                        className="w-5 h-5 rounded bg-muted hover:bg-secondary border border-border flex items-center justify-center text-foreground transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Kertas & Margin */}
          <div className="space-y-2 bg-muted/40 p-2.5 rounded border border-border">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Kertas & Margin Printer
            </span>

            <div className="space-y-1.5">
              <select
                value={paper.presetId}
                onChange={(e) => setPaperPreset(e.target.value as PaperPresetId)}
                className="w-full bg-card border border-border rounded text-xs font-semibold px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
              >
                {DEFAULT_PAPER_PRESETS.map((p) => (
                  <option key={p.presetId} value={p.presetId}>
                    {p.name}
                  </option>
                ))}
                {paper.presetId === 'custom' && (
                  <option value="custom">
                    {paper.name}
                  </option>
                )}
              </select>

              {paper.presetId === 'custom' && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Lebar (mm)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      value={paper.widthMm}
                      onChange={(e) =>
                        updatePaperSettings({ widthMm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-card border border-border rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Tinggi (mm)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      value={paper.heightMm}
                      onChange={(e) =>
                        updatePaperSettings({ heightMm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-card border border-border rounded px-2 py-1 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Margin Inputs */}
              <div className="grid grid-cols-4 gap-1 pt-1 text-[10px]">
                <div>
                  <label className="text-muted-foreground block">Atas</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paper.marginTopMm}
                    onChange={(e) =>
                      updatePaperSettings({ marginTopMm: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-card border border-border rounded px-1 py-0.5 font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block">Kanan</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paper.marginRightMm}
                    onChange={(e) =>
                      updatePaperSettings({ marginRightMm: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-card border border-border rounded px-1 py-0.5 font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block">Bawah</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paper.marginBottomMm}
                    onChange={(e) =>
                      updatePaperSettings({ marginBottomMm: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-card border border-border rounded px-1 py-0.5 font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block">Kiri</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paper.marginLeftMm}
                    onChange={(e) =>
                      updatePaperSettings({ marginLeftMm: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-card border border-border rounded px-1 py-0.5 font-mono text-center font-bold"
                  />
                </div>
              </div>

              {/* Gap & Crop Mark toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-[11px]">Jarak (Gap):</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={gapMm}
                    onChange={(e) => setGapMm(parseFloat(e.target.value) || 0)}
                    className="w-10 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                  />
                  <span className="text-[11px] text-muted-foreground">mm</span>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-foreground font-medium">
                  <input
                    type="checkbox"
                    checked={includeCropMarks}
                    onChange={(e) => setIncludeCropMarks(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Crop Marks</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
