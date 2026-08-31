import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Usb,
  RotateCw,
  Layers
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useKtpStore } from '../../stores/ktpStore'
import { usePolaroidStore } from '../../stores/polaroidStore'
import { PrinterInfo, PrintOptions } from '../../../../shared/types'
import { renderKtpPageToBase64 } from '../../utils/ktpRenderer'
import { renderPolaroidPageToBase64 } from '../../utils/polaroidRenderer'

interface PrintModalProps {
  isOpen: boolean
  mode?: 'home' | 'pas-foto' | 'ktp-id' | 'polaroid'
  onClose: () => void
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  mode = 'pas-foto',
  onClose
}) => {
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [copies, setCopies] = useState<number>(1)
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true)
  const [pageScope, setPageScope] = useState<'all' | 'current' | 'custom'>('all')
  const [customPagesText, setCustomPagesText] = useState<string>('1')
  const [selectedCustomPages, setSelectedCustomPages] = useState<number[]>([1])

  const [isPrinting, setIsPrinting] = useState<boolean>(false)
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false)
  const [liveStatus, setLiveStatus] = useState<{
    isOnline: boolean
    portName: string
    statusText: string
  }>({
    isOnline: true,
    portName: 'USB Port',
    statusText: 'Ready (Printer ON)'
  })
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

  // Fetch seluruh daftar printer dari sistem dan muat konfigurasi defaultnya
  const fetchPrinters = useCallback(async () => {
    if (!window.api) return
    setIsLoadingPrinters(true)
    try {
      const list = await window.api.getPrinters()
      setPrinters(list)
      if (list.length > 0) {
        const defaultName = list.find((p) => p.isDefault)?.name || list[0].name
        const activeName = selectedPrinter && list.some((p) => p.name === selectedPrinter)
          ? selectedPrinter
          : defaultName

        setSelectedPrinter(activeName)

        const found = list.find((p) => p.name === activeName)
        if (found) {
          setLiveStatus({
            isOnline: found.isOnline ?? true,
            portName: found.portName || 'USB Port',
            statusText: found.statusText || 'Ready (Printer ON)'
          })
        }

        // Baca jumlah lembar (copies) default langsung dari Windows
        if (typeof window.api.getPrinterConfig === 'function') {
          const cfg = await window.api.getPrinterConfig(activeName)
          if (cfg?.copies && cfg.copies >= 1) {
            setCopies(cfg.copies)
          }
        }
      }
    } finally {
      setIsLoadingPrinters(false)
    }
  }, [selectedPrinter])

  useEffect(() => {
    if (isOpen) {
      fetchPrinters()
    }
  }, [isOpen, fetchPrinters])

  // Auto-sync copies & reset spinner saat jendela Printama aktif kembali setelah menutup dialog Windows
  useEffect(() => {
    const handleWindowFocus = async () => {
      setIsOpeningSettings(false)
      if (isOpen && selectedPrinter && window.api?.getPrinterConfig) {
        try {
          const cfg = await window.api.getPrinterConfig(selectedPrinter)
          if (cfg?.copies && cfg.copies >= 1) {
            setCopies(cfg.copies)
          }
        } catch (err) {
          // ignore
        }
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isOpen, selectedPrinter])

  const [isOpeningSettings, setIsOpeningSettings] = useState<boolean>(false)

  if (!isOpen) return null
  if (isKtpMode && !ktpFrontImage && !ktpBackImage) return null
  if (isPolaroidMode && polaroidPhotos.length === 0) return null
  if (!isKtpMode && !isPolaroidMode && !pasFotoLayoutResult) return null

  // Handler saat user memilih printer berbeda dari dropdown
  const handlePrinterChange = async (printerName: string) => {
    setSelectedPrinter(printerName)
    const found = printers.find((p) => p.name === printerName)
    if (found) {
      setLiveStatus({
        isOnline: found.isOnline ?? true,
        portName: found.portName || 'USB Port',
        statusText: found.statusText || 'Ready (Printer ON)'
      })
    }

    if (window.api && typeof window.api.getPrinterConfig === 'function') {
      try {
        const config = await window.api.getPrinterConfig(printerName)
        if (config?.copies && config.copies >= 1) {
          setCopies(config.copies)
        }
      } catch (err) {
        console.warn('Gagal membaca preferensi printer:', err)
      }
    }
  }

  // Buka jendela Windows Printer Preferences dan sinkronkan jumlah lembar saat ditutup
  const handleOpenSettings = async () => {
    if (!window.api || !selectedPrinter) return
    setIsOpeningSettings(true)
    setStatusMessage(null)

    try {
      if (typeof window.api.openPrinterPreferences === 'function') {
        const config = await window.api.openPrinterPreferences(selectedPrinter)
        if (config?.copies && config.copies >= 1) {
          setCopies(config.copies)
          setStatusMessage({
            type: 'success',
            text: `Jumlah lembar (${config.copies} lembar) berhasil disinkronkan dari driver.`
          })
        }
      }
    } catch (err: any) {
      console.error('Gagal membuka printer settings dialog:', err)
    } finally {
      setIsOpeningSettings(false)
    }
  }

  const handleExecutePrint = async () => {
    if (!window.api) return
    setIsPrinting(true)
    setStatusMessage(null)

    const printOptions: PrintOptions = {
      printerName: selectedPrinter,
      copies,
      dpi: 300,
      includeCropMarks,
      silent: true
    }

    const selectedIndices = getSelectedPageIndices()

    try {
      // ==========================================
      // 1. CETAK MODUL KTP (1:1 Skala Fisik)
      // ==========================================
      if (isKtpMode) {
        const { base64, widthMm, heightMm } = await renderKtpPageToBase64(300, includeCropMarks)
        const res = await window.api.printDirect({
          base64,
          widthMm,
          heightMm,
          printOptions
        })

        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: 'Perintah cetak KTP berhasil dikirim ke antrian printer.'
          })
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Pencetakan KTP dibatalkan atau terjadi kesalahan printer.'
          })
        }
        return
      }

      // ==========================================
      // 2. CETAK MODUL POLAROID
      // ==========================================
      if (isPolaroidMode) {
        for (let i = 0; i < selectedIndices.length; i++) {
          const pIdx = selectedIndices[i]
          const { base64, widthMm, heightMm } = await renderPolaroidPageToBase64(
            pIdx,
            300,
            includeCropMarks
          )
          const res = await window.api.printDirect({
            base64,
            widthMm,
            heightMm,
            printOptions
          })

          if (!res.success) {
            setStatusMessage({
              type: 'error',
              text: res.error || `Pencetakan halaman #${pIdx + 1} dibatalkan atau gagal.`
            })
            return
          }
        }

        setStatusMessage({
          type: 'success',
          text: `Perintah cetak foto polaroid (${selectedIndices.length} halaman) berhasil dikirim ke antrian printer.`
        })
        return
      }

      // ==========================================
      // 3. CETAK MODUL PAS FOTO
      // ==========================================
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

      const res = await window.api.executePrint({
        layoutResult: filteredLayoutResult,
        adjustments: pasFotoAdjustments,
        paper: pasFotoPaper,
        images: pasFotoImages,
        printOptions
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Perintah cetak (${selectedIndices.length} halaman) berhasil dikirim ke antrian printer.`
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Pencetakan dibatalkan atau terjadi kesalahan printer.'
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan internal'
      })
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-10 px-3 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              {isKtpMode
                ? 'Cetak Fotokopi KTP Presisi 1:1'
                : isPolaroidMode
                ? 'Cetak Foto Polaroid Aesthetic'
                : 'Cetak Pas Foto Presisi'}
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
        <div className="p-3.5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* 1. Printer Selector & Settings Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Printer
              </label>
              <button
                type="button"
                onClick={fetchPrinters}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Segarkan status semua printer"
              >
                <RotateCw className={`w-2.5 h-2.5 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={selectedPrinter}
                onChange={(e) => handlePrinterChange(e.target.value)}
                className="flex-1 bg-muted/50 border border-border rounded text-xs font-semibold px-2.5 py-1.5 text-foreground focus:outline-none focus:border-white/60 truncate"
              >
                {printers.length === 0 ? (
                  <option value="">Tidak ada printer terdeteksi</option>
                ) : (
                  printers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))
                )}
              </select>

              {/* Setting Button (Membuka Driver Dialog Windows) */}
              <button
                type="button"
                onClick={handleOpenSettings}
                disabled={!selectedPrinter || isOpeningSettings}
                className="p-1.5 rounded bg-secondary hover:bg-muted border border-border text-foreground hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                title="Buka Pengaturan Driver Printer Windows (Preferences)"
              >
                {isOpeningSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Status & Location / USB Dynamic Indicator */}
            {selectedPrinter && (
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded border border-border/70 text-[11px] relative">
                {/* Status Indicator */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Status:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        liveStatus.isOnline
                          ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                          : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      }`}
                    />
                    <span
                      className={`font-bold transition-colors ${
                        liveStatus.isOnline ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {liveStatus.statusText}
                    </span>
                  </div>
                </div>

                {/* Location / Port */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    Port:
                  </span>
                  <div className="flex items-center gap-1 text-foreground font-mono font-bold">
                    <Usb className="w-3 h-3 text-muted-foreground" />
                    <span>{liveStatus.portName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    <span className="text-muted-foreground">Klik lembar yang ingin dicetak:</span>
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
                      className="w-full bg-muted/40 border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Jumlah Lembar (Copies) */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
              Jumlah Salinan / Copies Tiap Halaman
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-muted/50 border border-border rounded px-2.5 py-1.5 text-xs font-bold font-mono text-foreground"
            />
          </div>

          {/* 3. Crop marks checkbox */}
          <label className="flex items-center gap-2 p-2 rounded bg-muted/40 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={includeCropMarks}
              onChange={(e) => setIncludeCropMarks(e.target.checked)}
              className="rounded border-border text-foreground focus:ring-white"
            />
            <span className="text-foreground font-medium text-xs">
              Cetak Garis Batas Potong (Cutter)
            </span>
          </label>

          {/* Status Message */}
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
        <div className="h-11 px-3 border-t border-border flex items-center justify-end gap-2 bg-muted/20 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
          >
            Tutup
          </button>
          <button
            disabled={isPrinting}
            onClick={handleExecutePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 disabled:opacity-40 transition-colors border border-primary/80 shadow-sm"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mencetak...</span>
              </>
            ) : (
              <>
                <Printer className="w-3.5 h-3.5" />
                <span>
                  Cetak Dokumen
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
