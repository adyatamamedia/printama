import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  Sparkles,
  Scissors,
  Lock,
  Unlock,
  Compass
} from 'lucide-react'
import { KTP_WIDTH_MM, KTP_HEIGHT_MM, KtpImageSource } from '../../stores/ktpStore'

interface KtpCropModalProps {
  isOpen: boolean
  sourceImage: KtpImageSource | null
  sideLabel: string
  onClose: () => void
  onApplyCrop: (croppedBase64: string, widthPx: number, heightPx: number) => void
}

const KTP_ASPECT_RATIO = KTP_WIDTH_MM / KTP_HEIGHT_MM // ~1.585185

export const KtpCropModal: React.FC<KtpCropModalProps> = ({
  isOpen,
  sourceImage,
  sideLabel,
  onClose,
  onApplyCrop
}) => {
  if (!isOpen || !sourceImage) return null

  const [imageSrc, setImageSrc] = useState<string>(sourceImage.base64 || '')
  const [baseRotation, setBaseRotation] = useState<number>(0) // 0, 90, 180, 270
  const [angleTilt, setAngleTilt] = useState<number>(0) // -45 to +45 degrees
  const [lockRatio, setLockRatio] = useState<boolean>(false) // Default BEBAS (Freeform)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 60
  }) // in percentage (0 - 100)

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef<string | null>(null)
  const dragStartRef = useRef<{
    startX: number
    startY: number
    initialRect: typeof cropRect
    initialAngle: number
  }>({
    startX: 0,
    startY: 0,
    initialRect: { x: 0, y: 0, width: 0, height: 0 },
    initialAngle: 0
  })

  const totalAngle = baseRotation + angleTilt

  // Load high resolution image
  useEffect(() => {
    let isMounted = true

    const loadHighResImage = async () => {
      let finalSrc = sourceImage.base64 || ''

      // Jika ada filePath fisik, muat gambar resolusi asli 100% tanpa kompresi
      if (sourceImage.filePath && window.api?.readFullImage) {
        try {
          const res = await window.api.readFullImage(sourceImage.filePath)
          if (res?.base64 && isMounted) {
            finalSrc = res.base64
          }
        } catch (err) {
          console.error('Gagal membaca gambar resolusi penuh:', err)
        }
      }

      if (!finalSrc || !isMounted) return
      setImageSrc(finalSrc)

      const img = new Image()
      img.onload = () => {
        if (!isMounted) return
        setImageObj(img)
        const imgAspect = img.width / img.height
        let w = 75
        let h = (w * imgAspect) / KTP_ASPECT_RATIO
        if (h > 80) {
          h = 70
          w = (h / imgAspect) * KTP_ASPECT_RATIO
        }
        setCropRect({
          x: Math.max(5, (100 - w) / 2),
          y: Math.max(5, (100 - h) / 2),
          width: Math.min(90, w),
          height: Math.min(90, h)
        })
      }
      img.src = finalSrc
    }

    loadHighResImage()

    return () => {
      isMounted = false
    }
  }, [sourceImage])

  // Auto Detect KTP Algorithm on Image
  const handleAutoDetectKtp = useCallback(() => {
    if (!imageObj) return

    const canvas = document.createElement('canvas')
    const maxDim = 400
    const scale = Math.min(maxDim / imageObj.width, maxDim / imageObj.height, 1)
    canvas.width = Math.round(imageObj.width * scale)
    canvas.height = Math.round(imageObj.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data

    const bgR = data[0]
    const bgG = data[1]
    const bgB = data[2]

    let minX = canvas.width
    let minY = canvas.height
    let maxX = 0
    let maxY = 0
    let found = false

    const threshold = 35

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const idx = (y * canvas.width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB)
        if (diff > threshold) {
          found = true
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    if (found && maxX > minX + 20 && maxY > minY + 20) {
      const padX = (maxX - minX) * 0.02
      const padY = (maxY - minY) * 0.02

      const detectedLeft = Math.max(0, (minX - padX) / canvas.width) * 100
      const detectedTop = Math.max(0, (minY - padY) / canvas.height) * 100
      const detectedW = Math.min(100 - detectedLeft, ((maxX - minX + padX * 2) / canvas.width) * 100)
      const detectedH = Math.min(100 - detectedTop, ((maxY - minY + padY * 2) / canvas.height) * 100)

      setCropRect({
        x: detectedLeft,
        y: detectedTop,
        width: detectedW,
        height: detectedH
      })
    }
  }, [imageObj])

  // Mouse drag handlers for 8 handles, move, and gesture tilt
  const handleMouseDown = (action: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = action
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect },
      initialAngle: angleTilt
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const action = isDraggingRef.current

      // Gesture drag for tilt rotation (knob directly under the crop box)
      if (action === 'tilt_knob') {
        const deltaX = e.clientX - dragStartRef.current.startX
        const sensitivity = 0.2
        let newAngle = dragStartRef.current.initialAngle + deltaX * sensitivity
        newAngle = Math.max(-45, Math.min(45, Math.round(newAngle * 10) / 10))
        if (Math.abs(newAngle) <= 0.3) newAngle = 0
        setAngleTilt(newAngle)
        return
      }

      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100
      const dy = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100

      const init = dragStartRef.current.initialRect

      if (action === 'move') {
        let newX = Math.max(0, Math.min(100 - init.width, init.x + dx))
        let newY = Math.max(0, Math.min(100 - init.height, init.y + dy))
        setCropRect((prev) => ({ ...prev, x: newX, y: newY }))
        return
      }

      let newX = init.x
      let newY = init.y
      let newW = init.width
      let newH = init.height

      if (action.includes('e')) {
        newW = Math.max(5, Math.min(100 - init.x, init.width + dx))
      }
      if (action.includes('s')) {
        newH = Math.max(5, Math.min(100 - init.y, init.height + dy))
      }
      if (action.includes('w')) {
        newW = Math.max(5, init.width - dx)
        newX = init.x + (init.width - newW)
        if (newX < 0) {
          newX = 0
          newW = init.x + init.width
        }
      }
      if (action.includes('n')) {
        newH = Math.max(5, init.height - dy)
        newY = init.y + (init.height - newH)
        if (newY < 0) {
          newY = 0
          newH = init.y + init.height
        }
      }

      if (lockRatio) {
        if (action === 'e' || action === 'w' || action === 'se' || action === 'nw') {
          newH = newW / KTP_ASPECT_RATIO
        } else {
          newW = newH * KTP_ASPECT_RATIO
        }
      }

      setCropRect({
        x: Math.max(0, Math.min(95, newX)),
        y: Math.max(0, Math.min(95, newY)),
        width: Math.max(5, Math.min(100 - newX, newW)),
        height: Math.max(5, Math.min(100 - newY, newH))
      })
    }

    const handleMouseUp = () => {
      isDraggingRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [cropRect, lockRatio])

  // Apply Crop and output sharp cropped image
  const handleSaveCrop = () => {
    if (!imageObj) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const srcW = imageObj.naturalWidth || imageObj.width
    const srcH = imageObj.naturalHeight || imageObj.height

    const rad = (totalAngle * Math.PI) / 180
    const sin = Math.abs(Math.sin(rad))
    const cos = Math.abs(Math.cos(rad))

    const rotW = Math.round(srcW * cos + srcH * sin)
    const rotH = Math.round(srcW * sin + srcH * cos)

    const rotCanvas = document.createElement('canvas')
    rotCanvas.width = rotW
    rotCanvas.height = rotH
    const rotCtx = rotCanvas.getContext('2d')
    if (!rotCtx) return

    rotCtx.imageSmoothingEnabled = true
    rotCtx.imageSmoothingQuality = 'high'
    rotCtx.translate(rotW / 2, rotH / 2)
    rotCtx.rotate(rad)
    rotCtx.drawImage(imageObj, -srcW / 2, -srcH / 2)

    // Calculate exact pixel coordinates and dimensions from rotated scan source
    const cropXPx = (cropRect.x / 100) * rotCanvas.width
    const cropYPx = (cropRect.y / 100) * rotCanvas.height
    const cropWPx = Math.max(10, Math.round((cropRect.width / 100) * rotCanvas.width))
    const cropHPx = Math.max(10, Math.round((cropRect.height / 100) * rotCanvas.height))

    canvas.width = cropWPx
    canvas.height = cropHPx

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(rotCanvas, cropXPx, cropYPx, cropWPx, cropHPx, 0, 0, cropWPx, cropHPx)

    const croppedBase64 = canvas.toDataURL('image/png')
    onApplyCrop(croppedBase64, cropWPx, cropHPx)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">
              Potong & Luruskan KTP • {sideLabel}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Toolbar: Tools & Straighten Angle */}
        <div className="px-4 py-2.5 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center flex-wrap gap-2">
            {/* Auto Detect */}
            <button
              onClick={handleAutoDetectKtp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-bold transition-colors"
              title="Deteksi posisi KTP otomatis pada hasil scan kaca scanner"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Deteksi Otomatis</span>
            </button>

            {/* Toggle Rasio Bebas vs Terkunci */}
            <button
              onClick={() => setLockRatio(!lockRatio)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-semibold transition-colors ${
                lockRatio
                  ? 'bg-secondary text-primary border-primary/50'
                  : 'bg-muted/40 hover:bg-muted text-foreground border-border'
              }`}
              title="Ganti antara mode Potong Bebas atau Kunci Rasio Standar KTP"
            >
              {lockRatio ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Rasio Terkunci (85.6:54)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rasio Bebas</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* 90-degree Rotations */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBaseRotation((r) => (r - 90 + 360) % 360)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-secondary hover:bg-muted text-foreground border border-border font-medium transition-colors"
                title="Putar Kiri 90°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>90° Kiri</span>
              </button>

              <button
                onClick={() => setBaseRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-secondary hover:bg-muted text-foreground border border-border font-medium transition-colors"
                title="Putar Kanan 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>90° Kanan</span>
              </button>
            </div>
          </div>

          {/* Kemiringan Derajat Bebas (Straighten Slider + Stepper) */}
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
            <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
              Kemiringan:
            </span>

            <button
              onClick={() => setAngleTilt((a) => Math.max(-45, Math.round((a - 0.5) * 10) / 10))}
              className="w-5 h-5 flex items-center justify-center rounded bg-secondary hover:bg-muted text-foreground text-xs font-bold"
              title="Miringkan kiri -0.5°"
            >
              -
            </button>

            <input
              type="range"
              min="-45"
              max="45"
              step="0.5"
              value={angleTilt}
              onChange={(e) => setAngleTilt(parseFloat(e.target.value))}
              className="w-24 bg-border rounded cursor-pointer h-1.5"
              title="Geser slider untuk meluruskan KTP yang miring di scanner"
            />

            <button
              onClick={() => setAngleTilt((a) => Math.min(45, Math.round((a + 0.5) * 10) / 10))}
              className="w-5 h-5 flex items-center justify-center rounded bg-secondary hover:bg-muted text-foreground text-xs font-bold"
              title="Miringkan kanan +0.5°"
            >
              +
            </button>

            <span className="font-mono font-bold text-primary min-w-[38px] text-center text-xs">
              {angleTilt > 0 ? `+${angleTilt}°` : `${angleTilt}°`}
            </span>

            {angleTilt !== 0 && (
              <button
                onClick={() => setAngleTilt(0)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline pl-0.5"
                title="Kembalikan ke 0°"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Interactive Image Canvas Viewport */}
        <div className="flex-1 bg-[#0c0d12] p-6 flex items-center justify-center overflow-auto relative min-h-[420px]">
          <div
            ref={containerRef}
            className="relative max-h-[60vh] max-w-full flex items-center justify-center shadow-2xl border border-border/80"
          >
            {/* Display Image with Combined Total Angle Rotation */}
            <img
              src={imageSrc}
              alt="Scan Source"
              className="max-h-[60vh] max-w-full object-contain pointer-events-none select-none"
              style={{
                transform: `rotate(${totalAngle}deg)`
              }}
            />

            {/* Dark Mask Outside Crop Area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top mask */}
              <div
                className="absolute bg-black/60 top-0 left-0 right-0"
                style={{ height: `${cropRect.y}%` }}
              />
              {/* Bottom mask */}
              <div
                className="absolute bg-black/60 bottom-0 left-0 right-0"
                style={{ height: `${100 - cropRect.y - cropRect.height}%` }}
              />
              {/* Left mask */}
              <div
                className="absolute bg-black/60 left-0"
                style={{
                  top: `${cropRect.y}%`,
                  height: `${cropRect.height}%`,
                  width: `${cropRect.x}%`
                }}
              />
              {/* Right mask */}
              <div
                className="absolute bg-black/60 right-0"
                style={{
                  top: `${cropRect.y}%`,
                  height: `${cropRect.height}%`,
                  width: `${100 - cropRect.x - cropRect.width}%`
                }}
              />
            </div>

            {/* Interactive Crop Box with Grid Lines */}
            <div
              onMouseDown={(e) => handleMouseDown('move', e)}
              className="absolute border-2 border-primary shadow-2xl cursor-move flex items-center justify-center"
              style={{
                left: `${cropRect.x}%`,
                top: `${cropRect.y}%`,
                width: `${cropRect.width}%`,
                height: `${cropRect.height}%`
              }}
            >
              {/* Rule of Thirds grid lines inside crop box */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-primary/60" />
                <div className="border-r border-b border-primary/60" />
                <div className="border-b border-primary/60" />
                <div className="border-r border-b border-primary/60" />
                <div className="border-r border-b border-primary/60" />
                <div className="border-b border-primary/60" />
                <div className="border-r border-primary/60" />
                <div className="border-r border-primary/60" />
                <div />
              </div>

              {/* 4 Corner Resize Handles */}
              <div
                onMouseDown={(e) => handleMouseDown('nw', e)}
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-primary border-2 border-slate-900 rounded-sm cursor-nwse-resize"
                title="Tarik Sudut Kiri Atas"
              />
              <div
                onMouseDown={(e) => handleMouseDown('ne', e)}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-slate-900 rounded-sm cursor-nesw-resize"
                title="Tarik Sudut Kanan Atas"
              />
              <div
                onMouseDown={(e) => handleMouseDown('sw', e)}
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-primary border-2 border-slate-900 rounded-sm cursor-nesw-resize"
                title="Tarik Sudut Kiri Bawah"
              />
              <div
                onMouseDown={(e) => handleMouseDown('se', e)}
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-slate-900 rounded-sm cursor-nwse-resize"
                title="Tarik Sudut Kanan Bawah"
              />

              {/* 4 Edge Midpoint Handles for Freeform Resizing */}
              <div
                onMouseDown={(e) => handleMouseDown('n', e)}
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary border border-slate-900 rounded-full cursor-ns-resize"
                title="Tarik Sisi Atas"
              />
              <div
                onMouseDown={(e) => handleMouseDown('s', e)}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary border border-slate-900 rounded-full cursor-ns-resize"
                title="Tarik Sisi Bawah"
              />
              <div
                onMouseDown={(e) => handleMouseDown('w', e)}
                className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-primary border border-slate-900 rounded-full cursor-ew-resize"
                title="Tarik Sisi Kiri"
              />
              <div
                onMouseDown={(e) => handleMouseDown('e', e)}
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-primary border border-slate-900 rounded-full cursor-ew-resize"
                title="Tarik Sisi Kanan"
              />

              {/* Tangkai Gesture Putar Tepat di Bawah Box */}
              <div
                onMouseDown={(e) => handleMouseDown('tilt_knob', e)}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-ew-resize group/knob"
                title="Klik & Tahan geser ke kiri/kanan untuk memutar sudut kemiringan"
              >
                <div className="w-0.5 h-3 bg-primary/80" />
                <div className="w-6 h-6 rounded-full bg-primary group-hover/knob:bg-primary-hover text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-950 transition-transform group-hover/knob:scale-110">
                  <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-4 border-t border-border bg-card flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-semibold bg-secondary hover:bg-muted text-foreground transition-colors border border-border"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCrop}
              className="flex items-center gap-1.5 px-5 py-2 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 transition-colors shadow-lg shadow-primary/20 border border-primary/80"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Terapkan Potongan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
