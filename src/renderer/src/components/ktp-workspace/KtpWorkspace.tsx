import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Scan,
  Upload,
  Scissors,
  Trash2,
  AlertCircle,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  Eye,
  Loader2,
  CreditCard,
  Sliders,
  Sun,
  Contrast,
  Sparkles,
  Check
} from 'lucide-react'
import {
  useKtpStore,
  KTP_PAPERS,
  KtpLayoutPreset,
  KtpColorMode,
  KtpImageSource
} from '../../stores/ktpStore'
import { generateCropMarks } from '../../../../shared/layout-engine/cropmarks'
import { LayoutItem } from '../../../../shared/types'
import { KtpCropModal } from '../modals/KtpCropModal'

interface KtpWorkspaceProps {
  onBackToHome: () => void
  onOpenPrint: () => void
  onOpenExport: () => void
}

export const KtpWorkspace: React.FC<KtpWorkspaceProps> = ({
  onBackToHome,
  onOpenPrint,
  onOpenExport
}) => {
  const frontImage = useKtpStore((state) => state.frontImage)
  const setFrontImage = useKtpStore((state) => state.setFrontImage)
  const backImage = useKtpStore((state) => state.backImage)
  const setBackImage = useKtpStore((state) => state.setBackImage)
  const hasAtLeastOneImage = Boolean(frontImage || backImage)
  const sideMode = useKtpStore((state) => state.sideMode)
  const setSideMode = useKtpStore((state) => state.setSideMode)
  const copyFrontToBack = useKtpStore((state) => state.copyFrontToBack)
  const paper = useKtpStore((state) => state.paper)
  const setPaper = useKtpStore((state) => state.setPaper)
  const layoutPreset = useKtpStore((state) => state.layoutPreset)
  const setLayoutPreset = useKtpStore((state) => state.setLayoutPreset)
  const customRowCount = useKtpStore((state) => state.customRowCount)
  const setCustomRowCount = useKtpStore((state) => state.setCustomRowCount)
  const marginTopMm = useKtpStore((state) => state.marginTopMm)
  const setMarginTopMm = useKtpStore((state) => state.setMarginTopMm)
  const marginLeftMm = useKtpStore((state) => state.marginLeftMm)
  const setMarginLeftMm = useKtpStore((state) => state.setMarginLeftMm)
  const isAutoCenterHorizontal = useKtpStore((state) => state.isAutoCenterHorizontal)
  const setIsAutoCenterHorizontal = useKtpStore((state) => state.setIsAutoCenterHorizontal)
  const colorMode = useKtpStore((state) => state.colorMode)
  const setColorMode = useKtpStore((state) => state.setColorMode)
  const brightness = useKtpStore((state) => state.brightness)
  const setBrightness = useKtpStore((state) => state.setBrightness)
  const contrast = useKtpStore((state) => state.contrast)
  const setContrast = useKtpStore((state) => state.setContrast)
  const saturation = useKtpStore((state) => state.saturation)
  const setSaturation = useKtpStore((state) => state.setSaturation)
  const sharpen = useKtpStore((state) => state.sharpen)
  const setSharpen = useKtpStore((state) => state.setSharpen)
  const flipHorizontal = useKtpStore((state) => state.flipHorizontal)
  const setFlipHorizontal = useKtpStore((state) => state.setFlipHorizontal)
  const rotation = useKtpStore((state) => state.rotation)
  const rotate90 = useKtpStore((state) => state.rotate90)
  const selectedItemId = useKtpStore((state) => state.selectedItemId)
  const setSelectedItemId = useKtpStore((state) => state.setSelectedItemId)
  const itemAdjustments = useKtpStore((state) => state.itemAdjustments)
  const updateItemAdjustments = useKtpStore((state) => state.updateItemAdjustments)
  const updateAllAdjustments = useKtpStore((state) => state.updateAllAdjustments)
  const applyItemAdjustmentsToAll = useKtpStore((state) => state.applyItemAdjustmentsToAll)
  const includeBorder = useKtpStore((state) => state.includeBorder)
  const setIncludeBorder = useKtpStore((state) => state.setIncludeBorder)
  const gapHorizontalMm = useKtpStore((state) => state.gapHorizontalMm)
  const setGapHorizontalMm = useKtpStore((state) => state.setGapHorizontalMm)
  const gapVerticalMm = useKtpStore((state) => state.gapVerticalMm)
  const setGapVerticalMm = useKtpStore((state) => state.setGapVerticalMm)
  const previewZoom = useKtpStore((state) => state.previewZoom)
  const setPreviewZoom = useKtpStore((state) => state.setPreviewZoom)

  const getPlacedKtpItems = useKtpStore((state) => state.getPlacedKtpItems)
  const placedItems = getPlacedKtpItems()

  const selectedItem = placedItems.find((it) => it.id === selectedItemId) || null
  const selectedItemIndex = placedItems.findIndex((it) => it.id === selectedItemId)

  // Current active style values (dari item terpilih atau global)
  const currentAdj = selectedItemId ? itemAdjustments[selectedItemId] || {} : {}
  const currentBrightness = currentAdj.brightness ?? brightness
  const currentContrast = currentAdj.contrast ?? contrast
  const currentSaturation = currentAdj.saturation ?? saturation
  const currentSharpen = currentAdj.sharpen ?? sharpen
  const currentColorMode = currentAdj.colorMode ?? colorMode
  const currentFlipH = currentAdj.flipHorizontal ?? flipHorizontal
  const currentRotation = currentAdj.rotation ?? rotation

  const handleUpdateColorMode = (mode: KtpColorMode) => {
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { colorMode: mode })
    } else {
      updateAllAdjustments({ colorMode: mode })
    }
  }

  const handleUpdateBrightness = (val: number) => {
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { brightness: val })
    } else {
      updateAllAdjustments({ brightness: val })
    }
  }

  const handleUpdateContrast = (val: number) => {
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { contrast: val })
    } else {
      updateAllAdjustments({ contrast: val })
    }
  }

  const handleUpdateSaturation = (val: number) => {
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { saturation: val })
    } else {
      updateAllAdjustments({ saturation: val })
    }
  }

  const handleUpdateSharpen = (val: number) => {
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { sharpen: val })
    } else {
      updateAllAdjustments({ sharpen: val })
    }
  }

  const handleToggleFlipH = () => {
    const nextVal = !currentFlipH
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { flipHorizontal: nextVal })
    } else {
      updateAllAdjustments({ flipHorizontal: nextVal })
    }
  }

  const handleRotateStyle = () => {
    const nextRot = (currentRotation + 90) % 360
    if (selectedItemId) {
      updateItemAdjustments(selectedItemId, { rotation: nextRot })
    } else {
      updateAllAdjustments({ rotation: nextRot })
    }
  }

  const [isScanningFront, setIsScanningFront] = useState(false)
  const [isScanningBack, setIsScanningBack] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [showMargins, setShowMargins] = useState(true)

  // Zoom dropdown menu state
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)
  const zoomMenuRef = useRef<HTMLDivElement>(null)

  // Scroll & drag container refs
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  })

  // State Ukuran Viewport Kanvas Dinamis (Persis Pas Foto)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600
  })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // State Crop Modal
  const [cropTargetSide, setCropTargetSide] = useState<'front' | 'back' | null>(null)
  const [cropModalImage, setCropModalImage] = useState<KtpImageSource | null>(null)

  const isZoomed = previewZoom > 100

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(event.target as Node)) {
        setIsZoomMenuOpen(false)
      }
    }
    if (isZoomMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isZoomMenuOpen])

  const selectZoomPreset = (zoomValue: number) => {
    setPreviewZoom(zoomValue)
    if (zoomValue === 100 && containerRef.current) {
      containerRef.current.scrollLeft = 0
      containerRef.current.scrollTop = 0
    }
    setIsZoomMenuOpen(false)
  }

  const handleResetFit = useCallback(() => {
    setPreviewZoom(100)
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0
      containerRef.current.scrollTop = 0
    }
  }, [setPreviewZoom])

  // Mouse wheel scroll langsung & khusus untuk zoom (non-passive agar 100% cegah scroll halaman)
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomDelta = e.deltaY < 0 ? 15 : -15
    const currentZoom = useKtpStore.getState().previewZoom
    useKtpStore.getState().setPreviewZoom(Math.max(25, Math.min(300, currentZoom + zoomDelta)))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheelNative)
    }
  }, [handleWheelNative, hasAtLeastOneImage])

  // Drag-to-scroll saat zoomed in
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed || !containerRef.current) return
      if (e.button === 0 || e.button === 1) {
        setIsDragging(true)
        dragStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop
        }
      }
    },
    [isZoomed]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return
      const dx = e.clientX - dragStartRef.current.startX
      const dy = e.clientY - dragStartRef.current.startY
      containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx
      containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Hitung Skala Fit Presisi Sesuai Ukuran Viewport (Persis Pas Foto)
  const previewDpi = 96
  const baseWidthPx = (paper.widthMm / 25.4) * previewDpi
  const baseHeightPx = (paper.heightMm / 25.4) * previewDpi

  const availableWidth = Math.max(200, containerSize.width - 48)
  const availableHeight = Math.max(200, containerSize.height - 48)
  const fitScale = Math.min(availableWidth / baseWidthPx, availableHeight / baseHeightPx)
  const scale = fitScale * (previewZoom / 100)

  const finalWidthPx = baseWidthPx * scale
  const finalHeightPx = baseHeightPx * scale

  const mmToPx = (mm: number) => (mm / 25.4) * previewDpi * scale

  // Hitung Corner Bracket Crop Marks di batas potong gap dengan panjang minimalis (2.5mm)
  const offsetGapX = gapHorizontalMm > 0 ? gapHorizontalMm / 2 : 1.0
  const offsetGapY = gapVerticalMm > 0 ? gapVerticalMm / 2 : 1.0

  const cropMarks =
    includeBorder && placedItems.length > 0
      ? generateCropMarks(
          placedItems.map(
            (it): LayoutItem => ({
              id: it.id,
              imageId: it.id,
              presetId: 'ktp',
              label: it.side === 'front' ? 'KTP Depan' : 'KTP Belakang',
              widthMm: it.widthMm,
              heightMm: it.heightMm,
              xMm: it.xMm,
              yMm: it.yMm
            })
          ),
          2.5,
          0,
          { offsetX: offsetGapX, offsetY: offsetGapY },
          { widthMm: paper.widthMm, heightMm: paper.heightMm }
        )
      : []

  const fileInputFrontRef = useRef<HTMLInputElement>(null)
  const fileInputBackRef = useRef<HTMLInputElement>(null)

  const handleNativeFileSelect = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        const img = new Image()
        img.onload = () => {
          const item: KtpImageSource = {
            id: `file-${side}-${Date.now()}`,
            base64,
            widthPx: img.naturalWidth || img.width,
            heightPx: img.naturalHeight || img.height
          }
          if (side === 'front') setFrontImage(item)
          else setBackImage(item)

          setCropTargetSide(side)
          setCropModalImage(item)
        }
        img.src = base64
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Scan hardware WIA direct handler
  const handleScanImage = async (side: 'front' | 'back') => {
    if (!window.api) return
    setScanError(null)
    if (side === 'front') setIsScanningFront(true)
    else setIsScanningBack(true)

    try {
      const res = await window.api.acquireScannerImage()
      if (res.success && (res.base64 || res.filePath)) {
        let scanBase64 = res.base64
        let scanW = res.widthPx || 1000
        let scanH = res.heightPx || 630

        if (res.filePath && window.api?.readFullImage) {
          try {
            const fullRes = await window.api.readFullImage(res.filePath)
            if (fullRes?.base64) {
              scanBase64 = fullRes.base64
              scanW = fullRes.widthPx || scanW
              scanH = fullRes.heightPx || scanH
            }
          } catch (e) {
            console.error('Error reading full scanner image:', e)
          }
        }

        const item: KtpImageSource = {
          id: `scan-${side}-${Date.now()}`,
          filePath: res.filePath,
          base64: scanBase64,
          widthPx: scanW,
          heightPx: scanH
        }
        if (side === 'front') setFrontImage(item)
        else setBackImage(item)

        setCropTargetSide(side)
        setCropModalImage(item)
      } else if (res.error) {
        setScanError(res.error)
      }
    } catch (err: any) {
      setScanError(err.message || 'Gagal memindai dari scanner')
    } finally {
      setIsScanningFront(false)
      setIsScanningBack(false)
    }
  }

  // Upload file fallback handler
  const handleOpenFile = async (side: 'front' | 'back') => {
    if (window.api?.openImages) {
      setScanError(null)
      try {
        const images = await window.api.openImages()
        if (images && images.length > 0) {
          const img = images[0]
          let fullBase64 = img.thumbnailUrl || img.base64
          let fullW = img.widthPx
          let fullH = img.heightPx

          if (img.filePath && window.api?.readFullImage) {
            try {
              const fullRes = await window.api.readFullImage(img.filePath)
              if (fullRes?.base64) {
                fullBase64 = fullRes.base64
                fullW = fullRes.widthPx || fullW
                fullH = fullRes.heightPx || fullH
              }
            } catch (e) {
              console.error('Error reading full file image:', e)
            }
          }

          const item: KtpImageSource = {
            id: `file-${side}-${Date.now()}`,
            filePath: img.filePath,
            base64: fullBase64,
            widthPx: fullW,
            heightPx: fullH
          }
          if (side === 'front') setFrontImage(item)
          else setBackImage(item)

          setCropTargetSide(side)
          setCropModalImage(item)
          return
        }
      } catch (err: any) {
        console.warn('Gagal buka image via API, fallback ke file dialog browser:', err)
      }
    }

    if (side === 'front') fileInputFrontRef.current?.click()
    else fileInputBackRef.current?.click()
  }

  const handleApplyCroppedImage = (croppedBase64: string, widthPx: number, heightPx: number) => {
    if (!cropTargetSide) return
    const updated: KtpImageSource = {
      id: `crop-${cropTargetSide}-${Date.now()}`,
      base64: croppedBase64,
      widthPx,
      heightPx
    }
    if (cropTargetSide === 'front') {
      setFrontImage(updated)
    } else {
      setBackImage(updated)
    }
    setCropTargetSide(null)
    setCropModalImage(null)
  }

  // Visual filter CSS based on colorMode, brightness, contrast, saturation
  const getImageFilterStyle = () => {
    const b = 1 + brightness / 100
    const c = 1 + contrast / 100
    const s = 1 + saturation / 100

    let filterStr = `brightness(${Math.max(0, b)}) contrast(${Math.max(0, c)}) saturate(${Math.max(0, s)})`

    if (colorMode === 'grayscale') {
      filterStr += ' grayscale(100%)'
    } else if (colorMode === 'vintage') {
      filterStr += ' sepia(45%)'
    }

    return filterStr.trim() || 'none'
  }

  const getItemFilterStyle = (item: PlacedKtpItem) => {
    const adj = item.adjustments || itemAdjustments[item.id] || {}
    const b = 1 + (adj.brightness ?? brightness) / 100
    const c = 1 + (adj.contrast ?? contrast) / 100
    const s = 1 + (adj.saturation ?? saturation) / 100

    let filterStr = `brightness(${Math.max(0, b)}) contrast(${Math.max(0, c)}) saturate(${Math.max(0, s)})`

    const mode = adj.colorMode ?? colorMode
    if (mode === 'grayscale') {
      filterStr += ' grayscale(100%)'
    } else if (mode === 'vintage') {
      filterStr += ' sepia(45%)'
    }

    return filterStr.trim() || 'none'
  }

  const getItemTransform = (item: PlacedKtpItem) => {
    const adj = item.adjustments || itemAdjustments[item.id] || {}
    const rot = adj.rotation ?? rotation
    const flip = adj.flipHorizontal ?? flipHorizontal
    return `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden select-none">
      {/* Top Header Navigation */}
      <header className="h-12 border-b border-border px-4 flex items-center justify-between bg-card shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold transition-colors"
            title="Kembali ke Dashboard Beranda"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>

          <div className="h-4 w-px bg-border" />

          <h1 className="font-extrabold text-xs tracking-wide text-foreground uppercase">
            Fotokopi & Scan KTP / ID Card
          </h1>
        </div>

        {/* Action Buttons: Export & Cetak */}
        <div className="flex items-center gap-2">
          <button
            disabled={!hasAtLeastOneImage}
            onClick={onOpenExport}
            className="py-1 px-3 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-30 disabled:pointer-events-none"
            title="Export Gambar / PDF 300 DPI (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            disabled={!hasAtLeastOneImage}
            onClick={onOpenPrint}
            className="py-1 px-3 rounded bg-primary hover:bg-primary-hover text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors border border-primary/80 shadow-sm disabled:opacity-30 disabled:pointer-events-none"
            title="Cetak Dokumen ke Printer (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </header>

      {/* Main Workspace 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hidden Native File Inputs */}
        <input
          type="file"
          ref={fileInputFrontRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => handleNativeFileSelect('front', e)}
        />
        <input
          type="file"
          ref={fileInputBackRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => handleNativeFileSelect('back', e)}
        />

        {/* LEFT PANEL: Input Foto KTP & Scanning */}
        <aside className="w-80 h-full border-r border-border bg-card flex flex-col justify-between overflow-y-auto shrink-0">
          <div className="p-3.5 space-y-4">
            {/* Pilihan Mode Sisi KTP */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                PILIHAN SISI KTP
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSideMode('both')}
                  className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                    sideMode === 'both'
                      ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Depan & Belakang
                </button>
                <button
                  type="button"
                  onClick={() => setSideMode('front_only')}
                  className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-colors ${
                    sideMode === 'front_only'
                      ? 'border-transparent bg-primary/20 text-primary shadow-sm'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sisi Depan Saja
                </button>
              </div>
            </div>

            {scanError && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{scanError}</span>
              </div>
            )}

            {/* Slot 1: KTP Depan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                  SISI DEPAN
                </span>
                {frontImage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCropTargetSide('front')
                        setCropModalImage(frontImage)
                      }}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                      title="Potong (Crop) / Sesuaikan area KTP"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Potong</span>
                    </button>
                    <button
                      onClick={() => setFrontImage(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                      title="Hapus foto depan"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>

              {frontImage ? (
                <div className="space-y-1.5">
                  <div
                    onClick={() => {
                      setCropTargetSide('front')
                      setCropModalImage(frontImage)
                    }}
                    className="relative aspect-[85.6/54] w-full bg-black/40 rounded border border-border overflow-hidden flex items-center justify-center cursor-pointer group"
                    title="Klik untuk memotong/menyesuaikan crop KTP"
                  >
                    <img
                      src={frontImage.base64 || frontImage.filePath}
                      alt="KTP Depan"
                      className="w-full h-full object-cover"
                      style={{
                        filter: getImageFilterStyle(),
                        transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1})`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold bg-primary text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        <span>Potong Ulang</span>
                      </span>
                    </div>
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white font-bold">
                      Depan
                    </span>
                  </div>

                  {sideMode === 'both' && !backImage && (
                    <button
                      onClick={copyFrontToBack}
                      className="w-full py-1 px-2 rounded bg-muted/40 hover:bg-secondary text-foreground border border-border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Gunakan foto depan ini juga untuk slot belakang"
                    >
                      <span>📋 Salin Sisi Depan ke Belakang</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    disabled={isScanningFront}
                    onClick={() => handleScanImage('front')}
                    className="py-1.5 px-2 rounded border border-transparent bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isScanningFront ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : (
                      <Scan className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>Scan Scanner</span>
                  </button>

                  <button
                    onClick={() => handleOpenFile('front')}
                    className="py-1.5 px-2 rounded bg-muted/40 hover:bg-secondary text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Pilih Berkas</span>
                  </button>
                </div>
              )}
            </div>

            {/* Slot 2: KTP Belakang (Hanya tampil di mode Depan & Belakang) */}
            {sideMode === 'both' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                    SISI BELAKANG
                  </span>
                  {backImage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCropTargetSide('back')
                          setCropModalImage(backImage)
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                        title="Potong (Crop) / Sesuaikan area KTP"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Potong</span>
                      </button>
                      <button
                        onClick={() => setBackImage(null)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                        title="Hapus foto belakang"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>

                {backImage ? (
                  <div
                    onClick={() => {
                      setCropTargetSide('back')
                      setCropModalImage(backImage)
                    }}
                    className="relative aspect-[85.6/54] w-full bg-black/40 rounded border border-border overflow-hidden flex items-center justify-center cursor-pointer group"
                    title="Klik untuk memotong/menyesuaikan crop KTP"
                  >
                    <img
                      src={backImage.base64 || backImage.filePath}
                      alt="KTP Belakang"
                      className="w-full h-full object-cover"
                      style={{
                        filter: getImageFilterStyle(),
                        transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1})`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold bg-primary text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        <span>Potong Ulang</span>
                      </span>
                    </div>
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white font-bold">
                      Belakang
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      disabled={isScanningBack}
                      onClick={() => handleScanImage('back')}
                      className="py-1.5 px-2 rounded border border-transparent bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isScanningBack ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Scan className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>Scan Scanner</span>
                    </button>

                    <button
                      onClick={() => handleOpenFile('back')}
                      className="py-1.5 px-2 rounded bg-muted/40 hover:bg-secondary text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Pilih Berkas</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Style Adjustments persis Polaroid / Pas Foto */}
            <div className="space-y-2.5 bg-muted/40 p-2.5 rounded border border-border">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                  STYLE {selectedItem ? <span className="text-[10px] text-primary font-bold">({selectedItem.side === 'front' ? 'Depan' : 'Belakang'} #{selectedItemIndex + 1})</span> : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleRotateStyle}
                    className="p-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                    title={selectedItem ? 'Putar 90° Kartu Terpilih' : 'Putar 90° Semua Kartu'}
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleToggleFlipH}
                    className={`p-1 rounded border transition-colors ${
                      currentFlipH
                        ? 'bg-secondary text-white border-[#5B5F65]'
                        : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                    }`}
                    title={selectedItem ? 'Flip Horizontal Kartu Terpilih' : 'Flip Horizontal Semua Kartu'}
                  >
                    <FlipHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mode Warna / Filter Foto (Tombol mandiri berjejer) */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  MODE WARNA / FILTER
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleUpdateColorMode('color')}
                    className={`h-7 px-1.5 rounded transition-colors border flex items-center justify-center font-bold text-[11px] ${
                      currentColorMode === 'color'
                        ? 'bg-secondary border-white/70 text-white shadow-sm'
                        : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Warna Asli</span>
                  </button>
                  <button
                    onClick={() => handleUpdateColorMode('grayscale')}
                    className={`h-7 px-1.5 rounded transition-colors border flex items-center justify-center font-bold text-[11px] ${
                      currentColorMode === 'grayscale'
                        ? 'bg-secondary border-white/70 text-white shadow-sm'
                        : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Grayscale</span>
                  </button>
                  <button
                    onClick={() => handleUpdateColorMode('vintage')}
                    className={`h-7 px-1.5 rounded transition-colors border flex items-center justify-center font-bold text-[11px] ${
                      currentColorMode === 'vintage'
                        ? 'bg-secondary border-white/70 text-white shadow-sm'
                        : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title="Filter Nuansa Sepia Vintage Hangat"
                  >
                    <span>Vintage</span>
                  </button>
                </div>
              </div>

              {/* Sliders Persis Pas Foto / Polaroid */}
              <div className="space-y-2 text-[11px]">
                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => handleUpdateBrightness(0)}
                      className="flex items-center gap-1 text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (0)"
                    >
                      <Sun className="w-3 h-3 text-muted-foreground" /> Kecerahan
                    </span>
                    <span className="font-mono font-bold text-foreground">{currentBrightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={currentBrightness}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateBrightness(parseInt(e.target.value))}
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => handleUpdateContrast(0)}
                      className="flex items-center gap-1 text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (0)"
                    >
                      <Contrast className="w-3 h-3 text-muted-foreground" /> Kontras
                    </span>
                    <span className="font-mono font-bold text-foreground">{currentContrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={currentContrast}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateContrast(parseInt(e.target.value))}
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => handleUpdateSaturation(0)}
                      className="flex items-center gap-1 text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (0)"
                    >
                      <Sparkles className="w-3 h-3 text-muted-foreground" /> Saturasi
                    </span>
                    <span className="font-mono font-bold text-foreground">{currentSaturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={currentSaturation}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateSaturation(parseInt(e.target.value))}
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>

                {/* Sharpen */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => handleUpdateSharpen(0)}
                      className="flex items-center gap-1 text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (0%)"
                    >
                      <ZoomIn className="w-3 h-3 text-muted-foreground" /> Ketajaman (Sharpen)
                    </span>
                    <span className="font-mono font-bold text-foreground">{currentSharpen}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentSharpen}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateSharpen(parseInt(e.target.value))}
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Tombol Terapkan Style Ini ke Semua Foto */}
              <button
                type="button"
                onClick={() => applyItemAdjustmentsToAll(selectedItemId || '')}
                className="w-full py-1.5 px-2 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-1"
                title="Terapkan nilai Style ini ke seluruh kartu KTP lainnya"
              >
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Terapkan Style Ini ke Semua Foto</span>
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: Canvas Preview Presisi 1:1 (Identik Logika PaperCanvas Pas Foto) */}
        <main className="flex-1 h-full bg-background relative overflow-hidden select-none flex flex-col">
          {/* Scrollable Viewport Container dengan Drag-to-pan saat Zoom */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 w-full h-full relative ${
              isZoomed
                ? 'overflow-auto cursor-grab'
                : 'overflow-hidden flex items-center justify-center cursor-default'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            <div
              className={`${
                isZoomed
                  ? 'min-w-full min-h-full p-8 flex items-center justify-center w-max h-max'
                  : 'w-full h-full flex items-center justify-center p-4'
              }`}
            >
              <div
                onClick={() => setSelectedItemId(null)}
                className="bg-white shadow-2xl relative border border-slate-700/80 select-none cursor-default"
                style={{
                  width: `${finalWidthPx}px`,
                  height: `${finalHeightPx}px`,
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Printable Margin Guidelines (Garis Batas Cetak Kertas - Layer Atas) */}
                {showMargins && (
                  <div
                    className="absolute border border-dashed border-slate-500/80 pointer-events-none z-20"
                    style={{
                      top: `${mmToPx(5)}px`,
                      left: `${mmToPx(5)}px`,
                      right: `${mmToPx(5)}px`,
                      bottom: `${mmToPx(5)}px`
                    }}
                  />
                )}

                {/* Placed KTP Items */}
                {placedItems.map((item, idx) => {
                  const xPx = mmToPx(item.xMm)
                  const yPx = mmToPx(item.yMm)
                  const wPx = mmToPx(item.widthMm)
                  const hPx = mmToPx(item.heightMm)
                  const isSelected = selectedItemId === item.id

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItemId(item.id)
                      }}
                      className={`absolute overflow-hidden select-none cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary z-10' : ''
                      }`}
                      style={{
                        left: `${xPx}px`,
                        top: `${yPx}px`,
                        width: `${wPx}px`,
                        height: `${hPx}px`,
                        border: 'none'
                      }}
                      title={`Klik untuk memilih kartu ${item.side === 'front' ? 'KTP Depan' : 'KTP Belakang'} #${idx + 1}`}
                    >
                      {item.image ? (
                        <img
                          src={item.image.base64 || item.image.filePath}
                          alt={item.side}
                          draggable={false}
                          className="w-full h-full object-fill pointer-events-none select-none"
                          style={{
                            filter: getItemFilterStyle(item),
                            transform: getItemTransform(item)
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 border border-slate-300 flex flex-col items-center justify-center p-2 text-center text-slate-400 select-none pointer-events-none">
                          <CreditCard className="w-6 h-6 stroke-1 mb-1 opacity-50" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            {item.side === 'front' ? 'KTP Depan' : 'KTP Belakang'}
                          </span>
                          <span className="text-[7px] font-mono mt-0.5">85.6 × 54.0 mm</span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Corner Bracket Crop Marks Overlay (Persis seperti Pas Foto) */}
                {includeBorder && cropMarks.length > 0 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{
                      width: `${finalWidthPx}px`,
                      height: `${finalHeightPx}px`
                    }}
                  >
                    {cropMarks.map((mark, idx) => (
                      <line
                        key={idx}
                        x1={mmToPx(mark.x1Mm)}
                        y1={mmToPx(mark.y1Mm)}
                        x2={mmToPx(mark.x2Mm)}
                        y2={mmToPx(mark.y2Mm)}
                        stroke="#000000"
                        strokeWidth="1.2"
                      />
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Quick Item Selected Badge Toolbar (Pojok Kiri Bawah) */}
          {selectedItem && (
            <div className="absolute bottom-3 left-5 flex items-center gap-2 bg-card/95 backdrop-blur-md px-3 py-1.5 rounded border border-border shadow-2xl z-20 cursor-default text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-foreground shrink-0 border-r border-border pr-2.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider">
                  {selectedItem.side === 'front' ? 'KTP Depan' : 'KTP Belakang'} #{selectedItemIndex + 1}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-secondary transition-colors"
                title="Batalkan pilihan kartu ini & terapkan style ke semua"
              >
                Pilih Semua
              </button>
            </div>
          )}

          {/* Floating Canvas Controls (Pojok Kanan Bawah - Persis Pas Foto) */}
          <div className="absolute bottom-3 right-5 flex items-center gap-1 bg-card p-1 rounded border border-border shadow-xl z-20 cursor-default">
            <button
              onClick={() => setShowMargins(!showMargins)}
              className={`p-1.5 rounded text-xs font-medium transition-colors ${
                showMargins
                  ? 'bg-secondary text-white border border-[#5B5F65]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title="Tampilkan / Sembunyikan Garis Batas Margin"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-border mx-0.5" />

            <button
              onClick={() => setPreviewZoom(Math.max(25, previewZoom - 15))}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Zoom Out (Scroll Down)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Display & Dropdown Menu Ke Atas */}
            <div className="relative" ref={zoomMenuRef}>
              <button
                onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                onDoubleClick={handleResetFit}
                className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                  isZoomMenuOpen
                    ? 'bg-secondary text-white border border-[#5B5F65]'
                    : 'text-foreground hover:text-white hover:bg-secondary'
                }`}
                title="Pilih Skala Zoom (Fit, 200%, 100%, 50%, 25%)"
              >
                {previewZoom}%
              </button>

              {/* Dropdown Popup Menu Ke Atas */}
              {isZoomMenuOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded shadow-2xl p-1 min-w-[100px] z-50 flex flex-col gap-0.5">
                  <button
                    onClick={() => selectZoomPreset(100)}
                    className="px-2.5 py-1 text-xs font-bold text-left rounded hover:bg-secondary hover:text-white text-foreground transition-colors flex items-center justify-between"
                  >
                    <span>Fit</span>
                    <span className="font-mono text-[10px] opacity-70">100%</span>
                  </button>
                  <div className="h-[1px] bg-border my-0.5" />
                  {[200, 100, 50, 25].map((z) => (
                    <button
                      key={z}
                      onClick={() => selectZoomPreset(z)}
                      className={`px-2.5 py-1 text-xs font-semibold text-left rounded transition-colors flex items-center justify-between ${
                        previewZoom === z
                          ? 'bg-secondary text-white font-bold border border-[#5B5F65]'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="font-mono">{z}%</span>
                      {previewZoom === z && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewZoom(Math.min(300, previewZoom + 15))}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Zoom In (Scroll Up)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetFit}
              className="p-1.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1"
              title="Reset Skala Fit (100%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </main>

        {/* RIGHT PANEL: Preset Layout & Action Buttons */}
        <aside className="w-80 h-full border-l border-border bg-card flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-3.5 space-y-4">
            {/* Pilihan Kertas */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                UKURAN KERTAS FOTOKOPI
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPaper('a4')}
                  className={`py-2 px-2.5 rounded border text-xs font-bold transition-all text-left ${
                    paper.id === 'a4'
                      ? 'bg-secondary text-white border-white/70 shadow-sm'
                      : 'bg-muted/40 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="font-bold text-foreground">Kertas A4</div>
                  <div className="text-[10px] font-mono text-muted-foreground">210 × 297 mm</div>
                </button>

                <button
                  onClick={() => setPaper('f4')}
                  className={`py-2 px-2.5 rounded border text-xs font-bold transition-all text-left ${
                    paper.id === 'f4'
                      ? 'bg-secondary text-white border-white/70 shadow-sm'
                      : 'bg-muted/40 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="font-bold text-foreground">Kertas F4 / Folio</div>
                  <div className="text-[10px] font-mono text-muted-foreground">215 × 330 mm</div>
                </button>
              </div>
            </div>

            {/* Preset & Jumlah Baris KTP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  JUMLAH BARIS / PASANG
                </span>
                {/* Stepper Jumlah Baris */}
                <div className="flex items-center gap-0.5 bg-muted/60 rounded border border-border p-0.5">
                  <button
                    onClick={() => setCustomRowCount(Math.max(1, customRowCount - 1))}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-secondary text-foreground text-[10px] font-bold"
                    title="Kurangi 1 baris"
                  >
                    -
                  </button>
                  <span className="font-mono text-[11px] font-bold min-w-[16px] text-center text-foreground">
                    {layoutPreset === 'custom'
                      ? customRowCount
                      : layoutPreset === '1_pair_top' || layoutPreset === '1_pair_center'
                      ? 1
                      : layoutPreset === '2_pairs'
                      ? 2
                      : layoutPreset === '4_pairs' || layoutPreset === '8_pairs'
                      ? 4
                      : customRowCount}
                  </span>
                  <button
                    onClick={() => setCustomRowCount(Math.min(10, customRowCount + 1))}
                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-secondary text-foreground text-[10px] font-bold"
                    title="Tambah 1 baris"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: '1_pair_top', name: '1 (Atas)' },
                  { id: '1_pair_center', name: '1 (Tengah)' },
                  { id: '2_pairs', name: '2 Baris' },
                  { id: '4_pairs', name: '4 Baris' },
                  { id: 'fill_paper', name: 'Penuh' },
                  { id: 'custom', name: `Kustom (${customRowCount})` }
                ].map((preset) => {
                  const isActive = layoutPreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setLayoutPreset(preset.id as KtpLayoutPreset)}
                      className={`h-7 px-1 rounded text-center transition-colors border flex items-center justify-center font-bold text-[11px] ${
                        isActive
                          ? 'bg-secondary border-white/70 text-white shadow-sm'
                          : 'bg-muted/40 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pengaturan Margin & Posisi di Kertas */}
            <div className="space-y-2 bg-muted/40 p-2.5 rounded border border-border text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                PENGATURAN MARGIN & POSISI LEMBAR
              </span>

              {/* Margin Atas */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setMarginTopMm(10)}
                    className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    title="Klik ganda untuk reset ke default (10 mm)"
                  >
                    Margin Atas (Top):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={marginTopMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setMarginTopMm(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={marginTopMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setMarginTopMm(parseInt(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Posisi Horizontal: Rata Tengah vs Margin Kiri */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Posisi Horizontal:</span>
                  <button
                    onClick={() => setIsAutoCenterHorizontal(!isAutoCenterHorizontal)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      isAutoCenterHorizontal
                        ? 'bg-secondary text-white border border-white/70 shadow-sm'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {isAutoCenterHorizontal ? '🟢 Rata Tengah' : 'Margin Manual'}
                  </button>
                </div>

                {!isAutoCenterHorizontal && (
                  <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        onDoubleClick={() => setMarginLeftMm(10)}
                        className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        title="Klik ganda untuk reset ke default (10 mm)"
                      >
                        Margin Kiri (Left):
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={marginLeftMm}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onChange={(e) => setMarginLeftMm(parseFloat(e.target.value) || 0)}
                          className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                        />
                        <span className="text-muted-foreground">mm</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={marginLeftMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setMarginLeftMm(parseInt(e.target.value))}
                      className="w-full bg-border rounded cursor-pointer h-1.5"
                    />
                  </div>
                )}
              </div>

              {/* Jarak Kiri-Kanan (Gap Horizontal) */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setGapHorizontalMm(15)}
                    className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    title="Klik ganda untuk reset ke default (15 mm)"
                  >
                    Jarak Kiri - Kanan (Gap H):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={gapHorizontalMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setGapHorizontalMm(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={gapHorizontalMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setGapHorizontalMm(parseInt(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Jarak Atas-Bawah (Gap Vertikal) */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setGapVerticalMm(8)}
                    className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    title="Klik ganda untuk reset ke default (8 mm)"
                  >
                    Jarak Atas - Bawah (Gap V):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={gapVerticalMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setGapVerticalMm(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={gapVerticalMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setGapVerticalMm(parseInt(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Garis Batas Potong / Crop Marks */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-border/60">
                <span className="text-[11px] font-medium text-foreground">
                  Crop Marks (Corner Bracket)
                </span>
                <input
                  type="checkbox"
                  checked={includeBorder}
                  onChange={(e) => setIncludeBorder(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Crop KTP */}
      <KtpCropModal
        isOpen={Boolean(cropTargetSide && cropModalImage)}
        sourceImage={cropModalImage}
        sideLabel={cropTargetSide === 'front' ? 'Sisi Depan' : 'Sisi Belakang'}
        onClose={() => {
          setCropTargetSide(null)
          setCropModalImage(null)
        }}
        onApplyCrop={handleApplyCroppedImage}
      />
    </div>
  )
}
