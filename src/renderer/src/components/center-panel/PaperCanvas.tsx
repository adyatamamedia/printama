import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  FileImage,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Tag
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { DEFAULT_ADJUSTMENTS } from '../../../../shared/constants/presets'
import logoDark from '../../assets/logo-dark.png'

export const PaperCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const paper = useWorkspaceStore((state) => state.paper)
  const recommendations = useWorkspaceStore((state) => state.recommendations)
  const selectedIndex = useWorkspaceStore((state) => state.selectedRecommendationIndex)
  const activePageIndex = useWorkspaceStore((state) => state.activePageIndex)
  const setActivePageIndex = useWorkspaceStore((state) => state.setActivePageIndex)
  const selectedImageId = useWorkspaceStore((state) => state.selectedImageId)
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId)
  const setSelectedItemId = useWorkspaceStore((state) => state.setSelectedItemId)
  const setSelectedImageId = useWorkspaceStore((state) => state.setSelectedImageId)
  const adjustments = useWorkspaceStore((state) => state.adjustments)
  const adjustmentsByImage = useWorkspaceStore((state) => state.adjustmentsByImage)
  const itemAdjustments = useWorkspaceStore((state) => state.itemAdjustments)
  const colorModeByPresetAndImage = useWorkspaceStore((state) => state.colorModeByPresetAndImage)
  const images = useWorkspaceStore((state) => state.images)
  const previewZoom = useWorkspaceStore((state) => state.previewZoom)
  const setPreviewZoom = useWorkspaceStore((state) => state.setPreviewZoom)
  const includeCropMarks = useWorkspaceStore((state) => state.includeCropMarks)

  const [showMargins, setShowMargins] = useState(true)
  const [showBadges, setShowBadges] = useState(true)
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)
  const zoomMenuRef = useRef<HTMLDivElement>(null)

  // Drag-to-scroll state saat zoom > 100%
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  })

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

  const currentLayout = recommendations[selectedIndex]
  const isZoomed = previewZoom > 100

  // Hitung dimensi kertas dalam mm & pixel
  const isLandscape = paper.orientation === 'landscape'
  const paperWidthMm = isLandscape ? paper.heightMm : paper.widthMm
  const paperHeightMm = isLandscape ? paper.widthMm : paper.heightMm

  const previewDpi = 96
  const baseWidthPx = (paperWidthMm / 25.4) * previewDpi
  const baseHeightPx = (paperHeightMm / 25.4) * previewDpi

  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600
  })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportDims({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const availableWidth = Math.max(200, viewportDims.width - 48)
  const availableHeight = Math.max(200, viewportDims.height - 48)
  const fitScale = Math.min(availableWidth / baseWidthPx, availableHeight / baseHeightPx)
  const scale = fitScale * (previewZoom / 100)

  const finalWidthPx = baseWidthPx * scale
  const finalHeightPx = baseHeightPx * scale

  const mmToPx = (mm: number) => (mm / 25.4) * previewDpi * scale

  // Reset zoom to fit
  const handleResetFit = useCallback(() => {
    setPreviewZoom(100)
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0
      containerRef.current.scrollTop = 0
    }
  }, [setPreviewZoom])

  // Mouse wheel scroll langsung & khusus untuk zoom
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomDelta = e.deltaY < 0 ? 15 : -15
    const currentZoom = useWorkspaceStore.getState().previewZoom
    useWorkspaceStore.getState().setPreviewZoom(Math.max(25, Math.min(300, currentZoom + zoomDelta)))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheelNative)
    }
  }, [handleWheelNative, images.length])

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

  const handlePickPhotos = async () => {
    if (!window.api) return
    const photos = await window.api.openImages()
    if (photos && photos.length > 0) {
      useWorkspaceStore.getState().addImages(photos)
    }
  }

  // Ambil data halaman yang sedang aktif
  const activePage = currentLayout?.pages?.[activePageIndex] || currentLayout?.pages?.[0]
  const placedItems = activePage?.placedItems || currentLayout?.placedItems || []
  const cropMarks = activePage?.cropMarks || currentLayout?.cropMarks || []
  const remainderMm = activePage?.remainderMm || currentLayout?.remainderMm

  // Filter helper untuk masing-masing foto item
  const getItemFilterStyle = (item: any) => {
    const itemId = item.id
    const imageId = item.imageId
    const itemAdj = itemAdjustments[itemId] || adjustmentsByImage[imageId] || DEFAULT_ADJUSTMENTS

    const presetKey =
      item.presetId ||
      (item.widthMm === 20 || item.heightMm === 20 ? '2x3' :
       item.widthMm === 30 || item.heightMm === 30 ? (item.widthMm === 40 || item.heightMm === 40 ? '3x4' : '2x3') :
       item.widthMm === 40 || item.heightMm === 40 ? '4x6' : '')

    const mode =
      itemAdjustments[itemId]?.colorMode ??
      colorModeByPresetAndImage[`${imageId}_${presetKey}`] ??
      adjustmentsByImage[imageId]?.colorMode ??
      DEFAULT_ADJUSTMENTS.colorMode ??
      'color'

    let filterStr = ''
    if (itemAdj.brightness && itemAdj.brightness !== 0) {
      const b = 1 + itemAdj.brightness / 100
      filterStr += `brightness(${Math.max(0, b)}) `
    }
    if (itemAdj.contrast && itemAdj.contrast !== 0) {
      const c = 1 + itemAdj.contrast / 100
      filterStr += `contrast(${Math.max(0, c)}) `
    }
    if (itemAdj.saturation && itemAdj.saturation !== 0) {
      const s = 1 + itemAdj.saturation / 100
      filterStr += `saturate(${Math.max(0, s)}) `
    }
    if (mode === 'grayscale') {
      filterStr += 'grayscale(100%) '
    } else if (mode === 'vintage') {
      filterStr += 'sepia(50%) '
    }
    return filterStr.trim() || undefined
  }

  // Kalkulasi sub-pixel crop & positioning 100% identik dengan Sharp backend (processPhotoItem)
  const getExactPhotoCropStyle = (item: any, imgData?: any): React.CSSProperties => {
    const metaW = imgData?.widthPx || 1000
    const metaH = imgData?.heightPx || 1000

    const itemWPx = mmToPx(item.widthMm)
    const itemHPx = mmToPx(item.heightMm)
    const targetAspect = itemWPx / itemHPx

    const zoom = Math.max(1, item.crop?.zoom || 1)
    const xPercent = (item.crop?.xPercent ?? 50) / 100
    const yPercent = (item.crop?.yPercent ?? 50) / 100

    let cropW: number
    let cropH: number

    if (metaW / metaH > targetAspect) {
      cropH = metaH / zoom
      cropW = cropH * targetAspect
    } else {
      cropW = metaW / zoom
      cropH = cropW / targetAspect
    }

    const centerX = metaW * xPercent
    const centerY = metaH * yPercent

    let sX = centerX - cropW / 2
    let sY = centerY - cropH / 2

    sX = Math.max(0, Math.min(sX, metaW - cropW))
    sY = Math.max(0, Math.min(sY, metaH - cropH))

    const scaleFactor = itemWPx / cropW
    const renderedW = metaW * scaleFactor
    const renderedH = metaH * scaleFactor
    const leftPx = -sX * scaleFactor
    const topPx = -sY * scaleFactor

    const itemAdj = itemAdjustments[item.id] || adjustmentsByImage[item.imageId] || DEFAULT_ADJUSTMENTS

    const transforms: string[] = []
    if (itemAdj.rotation) {
      transforms.push(`rotate(${itemAdj.rotation}deg)`)
    }
    if (itemAdj.flipHorizontal) {
      transforms.push('scaleX(-1)')
    }

    return {
      position: 'absolute',
      width: `${renderedW}px`,
      height: `${renderedH}px`,
      left: `${leftPx}px`,
      top: `${topPx}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      filter: getItemFilterStyle(item),
      transform: transforms.length > 0 ? transforms.join(' ') : undefined
    }
  }

  const activeSelectedItem = placedItems.find((it) => it.id === selectedItemId)

  return (
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
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center max-w-sm p-6 rounded bg-card border border-border cursor-default shadow-xl">
              <img src={logoDark} alt="Printama" className="h-6 object-contain mb-3" />
              <p className="text-xs text-muted-foreground mb-4">
                Pilih foto untuk menyusun pas foto resmi otomatis pada{' '}
                <strong className="text-foreground">{paper.name}</strong>.
              </p>
              <button
                onClick={handlePickPhotos}
                className="px-4 py-1.5 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 transition-colors border border-primary/80 shadow-sm"
              >
                Pilih Foto
              </button>
            </div>
          ) : (
            <div
              onClick={() => setSelectedItemId(null)}
              className="bg-white shadow-2xl relative border border-slate-700/80 select-none cursor-default"
              style={{
                width: `${finalWidthPx}px`,
                height: `${finalHeightPx}px`,
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
              }}
            >
              {/* Printable Margins Guidelines (Garis Batas Margin Kertas) */}
              {showMargins && (
                <div
                  className="absolute border border-dashed border-slate-500/80 pointer-events-none z-20"
                  style={{
                    top: `${mmToPx(paper.marginTopMm)}px`,
                    left: `${mmToPx(paper.marginLeftMm)}px`,
                    right: `${mmToPx(paper.marginRightMm)}px`,
                    bottom: `${mmToPx(paper.marginBottomMm)}px`
                  }}
                />
              )}

              {/* Placed Photo Items */}
              {placedItems.map((item) => {
                const itemXPx = mmToPx(item.xMm)
                const itemYPx = mmToPx(item.yMm)
                const itemWPx = mmToPx(item.widthMm)
                const itemHPx = mmToPx(item.heightMm)

                const isSelected = selectedItemId === item.id
                const imgData = images.find((im) => im.id === item.imageId)

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemId(item.id)
                      setSelectedImageId(item.imageId)
                    }}
                    className={`absolute overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-primary z-10 shadow-md'
                        : 'border border-black/20 hover:border-black/50'
                    }`}
                    style={{
                      left: `${itemXPx}px`,
                      top: `${itemYPx}px`,
                      width: `${itemWPx}px`,
                      height: `${itemHPx}px`,
                      backgroundColor: '#f1f5f9'
                    }}
                    title={`Klik untuk mengatur Style foto ${item.label}`}
                  >
                    {imgData ? (
                      <img
                        src={imgData.thumbnailUrl}
                        alt={item.label}
                        draggable={false}
                        className="pointer-events-none select-none"
                        style={getExactPhotoCropStyle(item, imgData)}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}

                    {/* Badge Nama File & Ukuran di Bawah Tengah Foto (Bottom Center) */}
                    {showBadges && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-black/85 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm select-none pointer-events-none truncate max-w-[90%] flex items-center gap-1 z-10 whitespace-nowrap"
                        title={imgData?.fileName ? `${imgData.fileName} (${item.label})` : item.label}
                      >
                        {imgData?.fileName ? (
                          <>
                            <span className="truncate max-w-[75px]">{imgData.fileName}</span>
                            <span className="opacity-40">•</span>
                            <span className="shrink-0">{item.label}</span>
                          </>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Corner Bracket Crop Marks Overlay (SVG) */}
              {includeCropMarks && cropMarks.length > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  style={{ width: `${finalWidthPx}px`, height: `${finalHeightPx}px` }}
                >
                  {cropMarks.map((mark, mIdx) => (
                    <line
                      key={mIdx}
                      x1={mmToPx(mark.x1Mm)}
                      y1={mmToPx(mark.y1Mm)}
                      x2={mmToPx(mark.x2Mm)}
                      y2={mmToPx(mark.y2Mm)}
                      stroke="#000000"
                      strokeWidth={Math.max(1, mmToPx(0.2))}
                    />
                  ))}
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Multi-Page Sheet Navigator (Tengah Atas) */}
      {images.length > 0 && currentLayout && currentLayout.totalPages > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur-md px-3 py-1.5 rounded border border-border shadow-2xl z-20">
          <button
            onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex === 0}
            className="p-1 rounded bg-secondary hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
            title="Lembar Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-foreground">
              Lembar {activePageIndex + 1}
            </span>
            <span className="text-muted-foreground">/ {currentLayout.totalPages}</span>
          </div>

          <button
            onClick={() => setActivePageIndex(Math.min(currentLayout.totalPages - 1, activePageIndex + 1))}
            disabled={activePageIndex >= currentLayout.totalPages - 1}
            className="p-1 rounded bg-secondary hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
            title="Lembar Selanjutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Status & Selector Badge (Compact) */}
      {images.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-border shadow-lg z-20 flex items-center gap-2 text-[11px]">
          <Sliders className="w-3 h-3 text-primary shrink-0" />
          <div className="flex items-center gap-1 font-medium">
            <span className="text-muted-foreground">Target Style:</span>
            <span className="text-primary font-semibold">
              {activeSelectedItem
                ? `Foto ${activeSelectedItem.label}`
                : 'Semua Foto (Global)'}
            </span>
          </div>
          {activeSelectedItem && (
            <button
              onClick={() => setSelectedItemId(null)}
              className="text-[10px] font-medium bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border transition-colors ml-1"
              title="Kembali ke mode edit seluruh foto"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {/* Floating Bottom Toolbar / Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setShowMargins(!showMargins)}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border shadow-lg transition-colors ${
            showMargins
              ? 'bg-card text-foreground border-border hover:bg-secondary'
              : 'bg-muted text-muted-foreground border-border hover:bg-card'
          }`}
          title="Tampilkan/Sembunyikan Garis Margin Kertas"
        >
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Margin</span>
        </button>

        <button
          onClick={() => setShowBadges(!showBadges)}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border shadow-lg transition-colors ${
            showBadges
              ? 'bg-card text-foreground border-border hover:bg-secondary'
              : 'bg-muted text-muted-foreground border-border hover:bg-card'
          }`}
          title="Tampilkan/Sembunyikan Label Nama File & Ukuran"
        >
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Label</span>
        </button>

        {/* Zoom Controls Bar */}
        <div className="flex items-center bg-card/95 backdrop-blur-md rounded border border-border shadow-2xl p-1 gap-1">
          <button
            onClick={() => setPreviewZoom(Math.max(25, previewZoom - 15))}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Perkecil (-15%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Indicator Dropdown */}
          <div className="relative" ref={zoomMenuRef}>
            <button
              onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
              className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded hover:bg-secondary transition-colors"
              title="Pilih level perbesaran"
            >
              {previewZoom}%
            </button>

            {isZoomMenuOpen && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded shadow-xl py-1 w-24 z-30">
                {[50, 75, 100, 150, 200].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => selectZoomPreset(preset)}
                    className={`w-full text-left px-3 py-1 text-xs font-mono transition-colors ${
                      previewZoom === preset
                        ? 'bg-primary text-slate-950 font-bold'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setPreviewZoom(Math.min(300, previewZoom + 15))}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Perbesar (+15%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* Fit to window reset button */}
          <button
            onClick={handleResetFit}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Pas ke Layar (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </main>
  )
}
