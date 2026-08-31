import React, { useState, useMemo } from 'react'
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Image as ImageIcon,
  FileImage,
  FileText
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useKtpStore } from '../../stores/ktpStore'
import { usePolaroidStore } from '../../stores/polaroidStore'
import { ExportOptions } from '../../../../shared/types'
import { renderKtpPageToBase64 } from '../../utils/ktpRenderer'
import { renderPolaroidPageToBase64 } from '../../utils/polaroidRenderer'

interface ExportModalProps {
  isOpen: boolean
  mode?: 'home' | 'pas-foto' | 'ktp-id' | 'polaroid'
  onClose: () => void
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  mode = 'pas-foto',
  onClose
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('png')
  const [quality, setQuality] = useState(95)
  const [dpi, setDpi] = useState(300)
  const [includeCropMarks, setIncludeCropMarks] = useState(true)
  const [pageScope, setPageScope] = useState<'all' | 'current' | 'custom'>('all')
  const [customPagesText, setCustomPagesText] = useState<string>('1')
  const [selectedCustomPages, setSelectedCustomPages] = useState<number[]>([1])

  const [isExporting, setIsExporting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  // Store Pas Foto
  const pasFotoLayoutResult = useWorkspaceStore(
    (state) => state.recommendations[state.selectedRecommendationIndex]
  )
  const pasFotoAdjustments = useWorkspaceStore((state) => state.adjustments)
  const pasFotoPaper = useWorkspaceStore((state) => state.paper)
  const pasFotoImages = useWorkspaceStore((state) => state.images)
  const pasFotoActivePage = useWorkspaceStore((state) => (state as any).activePageIndex || 0)

  // Store KTP
  const ktpPaper = useKtpStore((state) => state.paper)
  const ktpFrontImage = useKtpStore((state) => state.frontImage)
  const ktpBackImage = useKtpStore((state) => state.backImage)

  // Store Polaroid
  const polaroidPhotos = usePolaroidStore((state) => state.photos)
  const polaroidPaper = usePolaroidStore((state) => state.paper)
  const polaroidTotalPages = usePolaroidStore((state) => state.getTotalPages())
  const polaroidActivePage = usePolaroidStore((state) => state.activePageIndex)

  const isKtpMode = mode === 'ktp-id'
  const isPolaroidMode = mode === 'polaroid'

  // Hitung total halaman yang tersedia
  const totalPages = useMemo(() => {
    if (isKtpMode) return 1
    if (isPolaroidMode) return Math.max(1, polaroidTotalPages)
    return Math.max(1, pasFotoLayoutResult?.pages?.length || 1)
  }, [isKtpMode, isPolaroidMode, polaroidTotalPages, pasFotoLayoutResult])

  const activePageIndex = useMemo(() => {
    if (isPolaroidMode) return polaroidActivePage
    if (!isKtpMode) return pasFotoActivePage
    return 0
  }, [isPolaroidMode, isKtpMode, polaroidActivePage, pasFotoActivePage])

  if (!isOpen) return null

  // Validasi apakah ada konten yang bisa diekspor
  if (isKtpMode && !ktpFrontImage && !ktpBackImage) return null
  if (isPolaroidMode && polaroidPhotos.length === 0) return null
  if (!isKtpMode && !isPolaroidMode && !pasFotoLayoutResult) return null

  // Parser rentang halaman custom (contoh: "1, 3-5")
  const parsePageRange = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>()
    const parts = input.split(',')
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-')
        const start = parseInt(startStr, 10)
        const end = parseInt(endStr, 10)
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end))
          const max = Math.min(maxPages, Math.max(start, end))
          for (let p = min; p <= max; p++) {
            pages.add(p)
          }
        }
      } else {
        const p = parseInt(trimmed, 10)
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pages.add(p)
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b)
  }

  // Ambil daftar 0-indexed halaman yang terpilih
  const getSelectedPageIndices = (): number[] => {
    if (totalPages <= 1 || pageScope === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    if (pageScope === 'current') {
      return [Math.min(activePageIndex, totalPages - 1)]
    }
    // Custom
    const parsed = selectedCustomPages.filter((p) => p >= 1 && p <= totalPages)
    if (parsed.length === 0) {
      return [0]
    }
    return parsed.map((p) => p - 1)
  }

  const togglePageSelection = (pageNum: number) => {
    let updated: number[]
    if (selectedCustomPages.includes(pageNum)) {
      if (selectedCustomPages.length === 1) return // Sisakan minimal 1 halaman
      updated = selectedCustomPages.filter((p) => p !== pageNum)
    } else {
      updated = [...selectedCustomPages, pageNum].sort((a, b) => a - b)
    }
    setSelectedCustomPages(updated)
    setCustomPagesText(updated.join(', '))
  }

  const handleCustomTextChange = (text: string) => {
    setCustomPagesText(text)
    const parsed = parsePageRange(text, totalPages)
    if (parsed.length > 0) {
      setSelectedCustomPages(parsed)
    }
  }

  const handleExecuteExport = async () => {
    if (!window.api) return
    setStatusMessage(null)

    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const selectedIndices = getSelectedPageIndices()

    // ==========================================
    // 1. EKSPOR DOKUMEN MODUL KTP
    // ==========================================
    if (isKtpMode) {
      const defaultName = `Printama-KTP-${dateStr}-${ktpPaper.id}-${dpi}dpi.${format === 'jpeg' ? 'jpg' : format}`
      const destPath = await window.api.showSaveDialog({
        defaultName,
        format
      })

      if (!destPath) return

      setIsExporting(true)
      try {
        const { base64, widthMm, heightMm } = await renderKtpPageToBase64(dpi, includeCropMarks)
        const res = await window.api.exportDirect({
          base64,
          destinationPath: destPath,
          format,
          widthMm,
          heightMm
        })

        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `Berhasil diekspor ke: ${res.filePath}`
          })
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Gagal mengekspor berkas KTP'
          })
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Terjadi kesalahan sistem'
        })
      } finally {
        setIsExporting(false)
      }
      return
    }

    // ==========================================
    // 2. EKSPOR DOKUMEN MODUL POLAROID
    // ==========================================
    if (isPolaroidMode) {
      const pageSuffix =
        selectedIndices.length === 1
          ? `-Hal${selectedIndices[0] + 1}`
          : selectedIndices.length === totalPages
          ? '-SemuaHal'
          : `-${selectedIndices.length}Hal`

      const defaultName = `Printama-Polaroid-${dateStr}${pageSuffix}-${polaroidPaper.id}-${dpi}dpi.${
        format === 'jpeg' ? 'jpg' : format
      }`

      const destPath = await window.api.showSaveDialog({
        defaultName,
        format
      })

      if (!destPath) return

      setIsExporting(true)
      try {
        const renderedPages = await Promise.all(
          selectedIndices.map((pIdx) => renderPolaroidPageToBase64(pIdx, dpi, includeCropMarks))
        )

        const res = await window.api.exportDirect({
          base64: renderedPages[0]?.base64 || '',
          pages: renderedPages,
          destinationPath: destPath,
          format,
          widthMm: polaroidPaper.widthMm,
          heightMm: polaroidPaper.heightMm
        })

        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `Berhasil diekspor (${selectedIndices.length} halaman) ke: ${res.filePath}`
          })
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Gagal mengekspor berkas Polaroid'
          })
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Terjadi kesalahan sistem'
        })
      } finally {
        setIsExporting(false)
      }
      return
    }

    // ==========================================
    // 3. EKSPOR DOKUMEN MODUL PAS FOTO
    // ==========================================
    const pageSuffix =
      selectedIndices.length === 1
        ? `-Hal${selectedIndices[0] + 1}`
        : selectedIndices.length === totalPages
        ? '-SemuaHal'
        : `-${selectedIndices.length}Hal`

    const defaultName = `Printama-PasFoto-${dateStr}${pageSuffix}-${pasFotoPaper.presetId}-${dpi}dpi.${
      format === 'jpeg' ? 'jpg' : format
    }`

    const destPath = await window.api.showSaveDialog({
      defaultName,
      format
    })

    if (!destPath) return

    setIsExporting(true)

    const exportOptions: ExportOptions = {
      format,
      quality,
      dpi,
      destinationPath: destPath,
      includeCropMarks
    }

    try {
      const adjustmentsByImage = useWorkspaceStore.getState().adjustmentsByImage
      const itemAdjustments = useWorkspaceStore.getState().itemAdjustments
      const colorModeByPresetAndImage = useWorkspaceStore.getState().colorModeByPresetAndImage

      const enrichedPages = pasFotoLayoutResult.pages.map((page) => ({
        ...page,
        placedItems: page.placedItems.map((item) => {
          const presetKey =
            item.presetId ||
            (item.widthMm === 20 || item.heightMm === 20 ? '2x3' :
             item.widthMm === 30 || item.heightMm === 30 ? (item.widthMm === 40 || item.heightMm === 40 ? '3x4' : '2x3') :
             item.widthMm === 40 || item.heightMm === 40 ? '4x6' : '')

          const colorMode =
            itemAdjustments[item.id]?.colorMode ||
            colorModeByPresetAndImage[`${item.imageId}_${presetKey}`] ||
            adjustmentsByImage[item.imageId]?.colorMode ||
            pasFotoAdjustments.colorMode ||
            'color'

          return {
            ...item,
            adjustments: {
              ...pasFotoAdjustments,
              ...(adjustmentsByImage[item.imageId] || {}),
              ...(itemAdjustments[item.id] || {}),
              colorMode
            }
          }
        })
      }))

      const filteredLayoutResult = {
        ...pasFotoLayoutResult,
        pages: enrichedPages.filter((_, idx) => selectedIndices.includes(idx))
      }

      const res = await window.api.exportLayout({
        layoutResult: filteredLayoutResult,
        adjustments: pasFotoAdjustments,
        paper: pasFotoPaper,
        images: pasFotoImages,
        exportOptions
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Berhasil diekspor (${selectedIndices.length} halaman) ke: ${res.filePath}`
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal mengekspor berkas'
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="h-10 px-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              {isKtpMode
                ? 'Ekspor Hasil Fotokopi KTP'
                : isPolaroidMode
                ? 'Ekspor Hasil Cetak Foto Polaroid'
                : 'Ekspor Hasil Cetak Pas Foto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Opsi Pemilihan Halaman (Khusus jika lebih dari 1 halaman) */}
          {totalPages > 1 && (
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Pilihan Halaman
              </label>

              {/* Mode Pemilihan */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPageScope('all')}
                  className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                    pageScope === 'all'
                      ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                      : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Semua ({totalPages})
                </button>
                <button
                  type="button"
                  onClick={() => setPageScope('current')}
                  className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                    pageScope === 'current'
                      ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                      : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hal. #{activePageIndex + 1} Saja
                </button>
                <button
                  type="button"
                  onClick={() => setPageScope('custom')}
                  className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                    pageScope === 'custom'
                      ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                      : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Kontrol Interaktif Halaman Custom */}
              {pageScope === 'custom' && (
                <div className="space-y-2 pt-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Klik lembar yang ingin diekspor:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const all = Array.from({ length: totalPages }, (_, i) => i + 1)
                        setSelectedCustomPages(all)
                        setCustomPagesText(all.join(', '))
                      }}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      Pilih Semua
                    </button>
                  </div>

                  {/* Chips Nomor Halaman */}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/30 rounded border border-border/50">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                      const isSelected = selectedCustomPages.includes(num)
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => togglePageSelection(num)}
                          className={`w-8 h-7 rounded text-[11px] font-extrabold border transition-all ${
                            isSelected
                              ? 'border-transparent bg-primary/20 text-primary shadow-sm scale-105'
                              : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-slate-500'
                          }`}
                          title={`Halaman ${num}`}
                        >
                          #{num}
                        </button>
                      )
                    })}
                  </div>

                  {/* Input Teks Rentang Custom */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Atau ketik rentang halaman (contoh: 1, 3-5):</span>
                      <span className="font-bold text-foreground">
                        {getSelectedPageIndices().length} lembar terpilih
                      </span>
                    </div>
                    <input
                      type="text"
                      value={customPagesText}
                      onChange={(e) => handleCustomTextChange(e.target.value)}
                      placeholder="contoh: 1, 2-4"
                      className="w-full bg-muted/40 border border-border/50 rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Format selection */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Format Berkas
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {/* PNG (Blue) */}
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs transition-all ${
                  format === 'png'
                    ? 'border border-transparent bg-sky-500/20 text-sky-400 font-bold shadow-sm'
                    : 'border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-sky-500/10'
                }`}
              >
                <ImageIcon className={`w-3.5 h-3.5 ${format === 'png' ? 'text-sky-400' : 'text-muted-foreground'}`} />
                <span>PNG</span>
              </button>

              {/* JPG (Green) */}
              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs transition-all ${
                  format === 'jpeg'
                    ? 'border border-transparent bg-emerald-500/20 text-emerald-400 font-bold shadow-sm'
                    : 'border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-emerald-500/10'
                }`}
              >
                <FileImage className={`w-3.5 h-3.5 ${format === 'jpeg' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                <span>JPG</span>
              </button>

              {/* PDF (Red) */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-xs transition-all ${
                  format === 'pdf'
                    ? 'border border-transparent bg-rose-500/20 text-rose-400 font-bold shadow-sm'
                    : 'border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-rose-500/10'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${format === 'pdf' ? 'text-rose-400' : 'text-muted-foreground'}`} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Quality slider for JPG (Tanpa Card Wrapper) */}
          {format === 'jpeg' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-muted-foreground">
                <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Kualitas Kompresi
                </label>
                <span className="font-mono font-bold text-emerald-400 text-xs">{quality}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}

          {/* DPI selector */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Resolusi Cetak
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setDpi(300)}
                className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                  dpi === 300
                    ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                    : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                300 DPI (Standar)
              </button>
              <button
                onClick={() => setDpi(600)}
                className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                  dpi === 600
                    ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                    : 'border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                600 DPI (Ultra HD)
              </button>
            </div>
          </div>

          {/* Crop marks checkbox */}
          <label className="flex items-center gap-2 p-2 rounded bg-muted/40 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={includeCropMarks}
              onChange={(e) => setIncludeCropMarks(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-foreground font-medium text-xs">
              Sertakan Garis Batas Potong / Cutter
            </span>
          </label>

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded flex items-start gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              )}
              <span className="break-all leading-tight">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-11 px-3 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
          >
            Tutup
          </button>
          <button
            disabled={isExporting}
            onClick={handleExecuteExport}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 disabled:opacity-40 transition-colors border border-primary/80 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Merender {dpi} DPI...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  Simpan Berkas
                  {totalPages > 1 && ` (${getSelectedPageIndices().length} Hal)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
