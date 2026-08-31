import React, { useState, useRef, useEffect } from 'react'
import { X, Check, RotateCw, RotateCcw, ZoomIn, ZoomOut, Scissors, Compass } from 'lucide-react'
import { PolaroidPhoto, PolaroidCropData } from '../../stores/polaroidStore'

interface PolaroidCropModalProps {
  isOpen: boolean
  photo: PolaroidPhoto | null
  onClose: () => void
  onApplyCrop: (photoId: string, crop: PolaroidCropData) => void
}

export const PolaroidCropModal: React.FC<PolaroidCropModalProps> = ({
  isOpen,
  photo,
  onClose,
  onApplyCrop
}) => {
  if (!isOpen || !photo) return null

  const initialCrop = photo.crop || { zoom: 1, xPercent: 50, yPercent: 50, rotation: 0 }

  const [zoom, setZoom] = useState<number>(initialCrop.zoom || 1)
  const [xPercent, setXPercent] = useState<number>(initialCrop.xPercent ?? 50)
  const [yPercent, setYPercent] = useState<number>(initialCrop.yPercent ?? 50)
  const [rotation, setRotation] = useState<number>(initialCrop.rotation || 0)

  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 50,
    initY: 50
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: xPercent,
      initY: yPercent
    }
  }

  const isSwapped = (rotation % 180 !== 0)
  const boxW = 208
  const boxH = 256
  const minCoverScale = isSwapped ? Math.max(boxW / boxH, boxH / boxW) : 1
  const totalZoom = Math.max(1, zoom) * minCoverScale

  const maxPanXPx = isSwapped
    ? Math.max(0, (boxH * totalZoom - boxW) / 2)
    : Math.max(0, (boxW * totalZoom - boxW) / 2)

  const maxPanYPx = isSwapped
    ? Math.max(0, (boxW * totalZoom - boxH) / 2)
    : Math.max(0, (boxH * totalZoom - boxH) / 2)

  const panXPx = ((xPercent - 50) / 50) * maxPanXPx
  const panYPx = ((yPercent - 50) / 50) * maxPanYPx

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const dxPx = e.clientX - dragStartRef.current.startX
      const dyPx = e.clientY - dragStartRef.current.startY

      if (maxPanXPx > 0) {
        const deltaX = (dxPx / maxPanXPx) * 50
        setXPercent(Math.max(0, Math.min(100, Math.round(dragStartRef.current.initX + deltaX))))
      }
      if (maxPanYPx > 0) {
        const deltaY = (dyPx / maxPanYPx) * 50
        setYPercent(Math.max(0, Math.min(100, Math.round(dragStartRef.current.initY + deltaY))))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, zoom, rotation, maxPanXPx, maxPanYPx])

  const handleSave = () => {
    onApplyCrop(photo.id, {
      zoom,
      xPercent,
      yPercent,
      rotation
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Sesuaikan Posisi & Zoom Foto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
            <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground text-[11px] whitespace-nowrap">Zoom:</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 bg-border rounded cursor-pointer accent-primary h-1.5"
            />
            <span className="font-mono text-[11px] w-10 text-right text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="px-2 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Putar 90° Berlawanan Arah Jarum Jam"
            >
              <RotateCcw className="w-3 h-3" />
              <span>-90°</span>
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-2 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Putar 90° Searah Jarum Jam"
            >
              <RotateCw className="w-3 h-3" />
              <span>+90°</span>
            </button>
            {rotation !== 0 && (
              <button
                onClick={() => setRotation(0)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline pl-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Interactive Viewport */}
        <div className="flex-1 bg-[#0c0d12] p-8 flex items-center justify-center min-h-[360px]">
          <div className="bg-white p-2.5 pb-8 shadow-2xl rounded-sm border border-slate-300 flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              className={`w-52 h-64 bg-slate-900 overflow-hidden relative border border-slate-300 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <img
                src={photo.base64 || photo.filePath}
                alt="Crop preview"
                draggable={false}
                className="w-full h-full object-cover pointer-events-none select-none origin-center"
                style={{
                  transform: `translate(${panXPx}px, ${panYPx}px) scale(${totalZoom}) rotate(${rotation}deg)`
                }}
              />

              {/* Grid Guide Overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </div>

            {/* Chin Text Preview */}
            <div className="h-6 flex items-center justify-center text-[10px] font-medium text-slate-700 tracking-wide mt-1 truncate max-w-[200px]">
              {photo.caption ? photo.caption : 'Teks Caption Polaroid'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-4 border-t border-border bg-card flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-secondary hover:bg-muted text-foreground transition-colors border border-border"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 transition-colors shadow border border-primary/80"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
