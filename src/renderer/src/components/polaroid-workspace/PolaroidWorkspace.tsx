import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Upload,
  Scissors,
  Trash2,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Camera,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Plus,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Sliders,
  Check,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Sun,
  Contrast,
  Sparkles,
  FlipHorizontal,
  Palette,
  Image as ImageIcon,
  Grid,
  Heart,
  Star,
  Paintbrush,
  Circle
} from 'lucide-react'
import {
  usePolaroidStore,
  PolaroidPhoto,
  PolaroidGridPreset,
  PolaroidFrameColor,
  PolaroidColorMode,
  PolaroidBgType,
  PolaroidPatternType
} from '../../stores/polaroidStore'
import { generateCropMarks } from '../../../../shared/layout-engine/cropmarks'
import { LayoutItem, SourceImage } from '../../../../shared/types'
import { PolaroidCropModal } from '../modals/PolaroidCropModal'
import { getPolaroidBackgroundStyle } from '../../utils/polaroidPatternHelper'

interface PolaroidWorkspaceProps {
  onBackToHome: () => void
  onOpenPrint: () => void
  onOpenExport: () => void
}

const FRAME_COLORS: Array<{ id: PolaroidFrameColor; label: string; bg: string; text: string; border: string }> = [
  { id: 'white', label: 'Putih', bg: '#ffffff', text: '#1e293b', border: '#cbd5e1' },
  { id: 'black', label: 'Hitam', bg: '#18181b', text: '#f8fafc', border: '#3f3f46' },
  { id: 'cream', label: 'Krem', bg: '#fdfbf7', text: '#292524', border: '#e7e5e4' },
  { id: 'pink', label: 'Pink', bg: '#fdf2f8', text: '#831843', border: '#fbcfe8' },
  { id: 'blue', label: 'Biru', bg: '#f0f9ff', text: '#075985', border: '#bae6fd' },
  { id: 'vintage', label: 'Vintage', bg: '#f5f0eb', text: '#451a03', border: '#d7ccc8' }
]

export const PolaroidWorkspace: React.FC<PolaroidWorkspaceProps> = ({
  onBackToHome,
  onOpenPrint,
  onOpenExport
}) => {
  const photos = usePolaroidStore((state) => state.photos)
  const pagePhotos = usePolaroidStore((state) => state.pagePhotos)
  const addPhotos = usePolaroidStore((state) => state.addPhotos)
  const addPhotosToPage = usePolaroidStore((state) => state.addPhotosToPage)
  const removePhoto = usePolaroidStore((state) => state.removePhoto)
  const replacePhoto = usePolaroidStore((state) => state.replacePhoto)
  const swapPhotos = usePolaroidStore((state) => state.swapPhotos)
  const movePhoto = usePolaroidStore((state) => state.movePhoto)
  const movePhotoOnPage = usePolaroidStore((state) => state.movePhotoOnPage)
  const clearAllPhotos = usePolaroidStore((state) => state.clearAllPhotos)
  const clearPagePhotos = usePolaroidStore((state) => state.clearPagePhotos)
  const duplicatePhotoToSlots = usePolaroidStore((state) => state.duplicatePhotoToSlots)
  const duplicatePhotoToCurrentSheet = usePolaroidStore((state) => state.duplicatePhotoToCurrentSheet)
  const updatePhotoCaption = usePolaroidStore((state) => state.updatePhotoCaption)
  const updatePhotoCrop = usePolaroidStore((state) => state.updatePhotoCrop)

  const paper = usePolaroidStore((state) => state.paper)
  const setPaper = usePolaroidStore((state) => state.setPaper)
  const gridPreset = usePolaroidStore((state) => state.gridPreset)
  const setGridPreset = usePolaroidStore((state) => state.setGridPreset)
  const frameColor = usePolaroidStore((state) => state.frameColor)
  const setFrameColor = usePolaroidStore((state) => state.setFrameColor)
  const colorMode = usePolaroidStore((state) => state.colorMode)
  const setColorMode = usePolaroidStore((state) => state.setColorMode)

  const bgType = usePolaroidStore((state) => state.bgType)
  const setBgType = usePolaroidStore((state) => state.setBgType)
  const customBgColor = usePolaroidStore((state) => state.customBgColor)
  const setCustomBgColor = usePolaroidStore((state) => state.setCustomBgColor)
  const bgPattern = usePolaroidStore((state) => state.bgPattern)
  const setBgPattern = usePolaroidStore((state) => state.setBgPattern)
  const patternColor = usePolaroidStore((state) => state.patternColor)
  const setPatternColor = usePolaroidStore((state) => state.setPatternColor)
  const patternScale = usePolaroidStore((state) => state.patternScale)
  const setPatternScale = usePolaroidStore((state) => state.setPatternScale)
  const customBgImage = usePolaroidStore((state) => state.customBgImage)
  const setCustomBgImage = usePolaroidStore((state) => state.setCustomBgImage)
  const cropMarkColor = usePolaroidStore((state) => state.cropMarkColor)
  const setCropMarkColor = usePolaroidStore((state) => state.setCropMarkColor)

  const styleScope = usePolaroidStore((state) => state.styleScope)
  const setStyleScope = usePolaroidStore((state) => state.setStyleScope)
  const updatePhotoAdjustments = usePolaroidStore((state) => state.updatePhotoAdjustments)
  const updateAllPhotosAdjustments = usePolaroidStore((state) => state.updateAllPhotosAdjustments)
  const applyPhotoAdjustmentsToAll = usePolaroidStore((state) => state.applyPhotoAdjustmentsToAll)
  const resetPhotoAdjustments = usePolaroidStore((state) => state.resetPhotoAdjustments)
  const brightness = usePolaroidStore((state) => state.brightness)
  const setBrightness = usePolaroidStore((state) => state.setBrightness)
  const contrast = usePolaroidStore((state) => state.contrast)
  const setContrast = usePolaroidStore((state) => state.setContrast)
  const saturation = usePolaroidStore((state) => state.saturation)
  const setSaturation = usePolaroidStore((state) => state.setSaturation)
  const sharpen = usePolaroidStore((state) => state.sharpen)
  const setSharpen = usePolaroidStore((state) => state.setSharpen)
  const flipHorizontal = usePolaroidStore((state) => state.flipHorizontal)
  const setFlipHorizontal = usePolaroidStore((state) => state.setFlipHorizontal)
  const resetStyleAdjustments = usePolaroidStore((state) => state.resetStyleAdjustments)
  const includeBorder = usePolaroidStore((state) => state.includeBorder)
  const setIncludeBorder = usePolaroidStore((state) => state.setIncludeBorder)

  const photoMarginMm = usePolaroidStore((state) => state.photoMarginMm)
  const setPhotoMarginMm = usePolaroidStore((state) => state.setPhotoMarginMm)
  const photoChinMm = usePolaroidStore((state) => state.photoChinMm)
  const setPhotoChinMm = usePolaroidStore((state) => state.setPhotoChinMm)

  const gapHorizontalMm = usePolaroidStore((state) => state.gapHorizontalMm)
  const setGapHorizontalMm = usePolaroidStore((state) => state.setGapHorizontalMm)
  const gapVerticalMm = usePolaroidStore((state) => state.gapVerticalMm)
  const setGapVerticalMm = usePolaroidStore((state) => state.setGapVerticalMm)
  const marginTopMm = usePolaroidStore((state) => state.marginTopMm)
  const setMarginTopMm = usePolaroidStore((state) => state.setMarginTopMm)
  const marginBottomMm = usePolaroidStore((state) => state.marginBottomMm)
  const setMarginBottomMm = usePolaroidStore((state) => state.setMarginBottomMm)
  const marginLeftMm = usePolaroidStore((state) => state.marginLeftMm)
  const setMarginLeftMm = usePolaroidStore((state) => state.setMarginLeftMm)
  const marginRightMm = usePolaroidStore((state) => state.marginRightMm)
  const setMarginRightMm = usePolaroidStore((state) => state.setMarginRightMm)
  const isAutoCenterHorizontal = usePolaroidStore((state) => state.isAutoCenterHorizontal)
  const setIsAutoCenterHorizontal = usePolaroidStore((state) => state.setIsAutoCenterHorizontal)

  const previewZoom = usePolaroidStore((state) => state.previewZoom)
  const setPreviewZoom = usePolaroidStore((state) => state.setPreviewZoom)
  const activePageIndex = usePolaroidStore((state) => state.activePageIndex)
  const setActivePageIndex = usePolaroidStore((state) => state.setActivePageIndex)
  const manualPageCount = usePolaroidStore((state) => state.manualPageCount)
  const addNewPage = usePolaroidStore((state) => state.addNewPage)
  const removePage = usePolaroidStore((state) => state.removePage)
  const pageConfigs = usePolaroidStore((state) => state.pageConfigs)
  const getPageConfig = usePolaroidStore((state) => state.getPageConfig)
  const updateCurrentPageConfig = usePolaroidStore((state) => state.updateCurrentPageConfig)
  const applyCurrentPageConfigToAll = usePolaroidStore((state) => state.applyCurrentPageConfigToAll)
  const setPageScope = usePolaroidStore((state) => state.setPageScope)

  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600
  })

  // Foto pada lembar (canvas) aktif saat ini
  const currentSheetPhotos = pagePhotos[activePageIndex] || []

  // State Crop Modal & Selected Active Photo
  const [croppingPhoto, setCroppingPhoto] = useState<PolaroidPhoto | null>(null)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)

  // Auto-select first photo in CURRENT active canvas
  useEffect(() => {
    if (currentSheetPhotos.length > 0) {
      if (!selectedPhotoId || !currentSheetPhotos.some((p) => p.id === selectedPhotoId)) {
        setSelectedPhotoId(currentSheetPhotos[0].id)
      }
    } else {
      setSelectedPhotoId(null)
    }
  }, [activePageIndex, currentSheetPhotos, selectedPhotoId])

  const selectedPhoto =
    currentSheetPhotos.find((p) => p.id === selectedPhotoId) ||
    (currentSheetPhotos.length > 0 ? currentSheetPhotos[0] : null)
  const selectedIndex = selectedPhoto ? currentSheetPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1

  const fileInputBgRef = useRef<HTMLInputElement>(null)

  const handlePickCustomBgImage = async () => {
    if (window.api?.openImages) {
      try {
        const selected = await window.api.openImages()
        if (selected && selected.length > 0) {
          setCustomBgImage(selected[0].thumbnailUrl || selected[0].filePath)
          setBgType('image')
          return
        }
      } catch (err) {
        console.error('Gagal memilih gambar background via API:', err)
      }
    }
    fileInputBgRef.current?.click()
  }

  const handleFileInputBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          setCustomBgImage(result)
          setBgType('image')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const gridInfo = React.useMemo(() => {
    return usePolaroidStore.getState().getGridDimensions(activePageIndex)
  }, [gridPreset, activePageIndex, pageConfigs])

  const totalPages = React.useMemo(() => {
    return usePolaroidStore.getState().getTotalPages()
  }, [photos.length, pagePhotos, gridPreset, activePageIndex, pageConfigs, manualPageCount])

  const placedSlots = React.useMemo(() => {
    return usePolaroidStore.getState().getPlacedSlotsForPage(activePageIndex)
  }, [
    pagePhotos,
    photos,
    paper,
    gridPreset,
    photoMarginMm,
    photoChinMm,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    isAutoCenterHorizontal,
    activePageIndex,
    pageConfigs
  ])

  const [showMargins, setShowMargins] = useState(true)
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)
  const zoomMenuRef = useRef<HTMLDivElement>(null)

  // Drag-to-pan & viewport sizing
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  })

  const currentCrop = selectedPhoto?.crop || { zoom: 1, xPercent: 50, yPercent: 50, rotation: 0 }

  const handleUpdateZoom = (newZoom: number) => {
    if (!selectedPhoto) return
    const z = Math.max(1, Math.min(3, Math.round(newZoom * 100) / 100))
    updatePhotoCrop(selectedPhoto.id, {
      ...currentCrop,
      zoom: z
    })
  }

  const handleUpdatePosX = (newX: number) => {
    if (!selectedPhoto) return
    const x = Math.max(0, Math.min(100, Math.round(newX)))
    updatePhotoCrop(selectedPhoto.id, {
      ...currentCrop,
      xPercent: x
    })
  }

  const handleUpdatePosY = (newY: number) => {
    if (!selectedPhoto) return
    const y = Math.max(0, Math.min(100, Math.round(newY)))
    updatePhotoCrop(selectedPhoto.id, {
      ...currentCrop,
      yPercent: y
    })
  }

  const handleRotate90 = () => {
    if (!selectedPhoto) return
    const currentRot = currentCrop.rotation || 0
    const nextRot = (currentRot + 90) % 360
    updatePhotoCrop(selectedPhoto.id, {
      ...currentCrop,
      rotation: nextRot
    })
  }

  const handleApplyToAllPhotos = () => {
    if (!selectedPhoto) return
    photos.forEach((p) => {
      updatePhotoCrop(p.id, { ...currentCrop })
    })
  }

  const handleResetPhotoCrop = () => {
    if (!selectedPhoto) return
    updatePhotoCrop(selectedPhoto.id, {
      zoom: 1,
      xPercent: 50,
      yPercent: 50,
      rotation: 0
    })
  }

  // State Mouse Gesture Drag langsung pada foto
  const [isPhotoDragging, setIsPhotoDragging] = useState(false)
  const photoDragRef = useRef<{
    photoId: string
    startX: number
    startY: number
    initX: number
    initY: number
    zoom: number
    rotation: number
    boxWidthPx: number
    boxHeightPx: number
  } | null>(null)

  const handlePhotoMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    photoId: string,
    currentCropData: any,
    photoWPx: number,
    photoHPx: number
  ) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedPhotoId(photoId)
    const crop = currentCropData || { zoom: 1, xPercent: 50, yPercent: 50, rotation: 0 }
    photoDragRef.current = {
      photoId,
      startX: e.clientX,
      startY: e.clientY,
      initX: crop.xPercent ?? 50,
      initY: crop.yPercent ?? 50,
      zoom: crop.zoom || 1,
      rotation: crop.rotation || 0,
      boxWidthPx: Math.max(50, photoWPx),
      boxHeightPx: Math.max(50, photoHPx)
    }
    setIsPhotoDragging(true)
  }

  // Global mousemove & mouseup untuk gesture geser foto
  useEffect(() => {
    let rafId: number | null = null

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!photoDragRef.current) return
      const { photoId, startX, startY, initX, initY, zoom, rotation, boxWidthPx, boxHeightPx } =
        photoDragRef.current

      const isSwapped = ((rotation || 0) % 180 !== 0)
      const minCoverScale = isSwapped ? Math.max(boxWidthPx / boxHeightPx, boxHeightPx / boxWidthPx) : 1
      const totalZoom = Math.max(1, zoom || 1) * minCoverScale

      const maxPanXPx = isSwapped
        ? Math.max(0, (boxHeightPx * totalZoom - boxWidthPx) / 2)
        : Math.max(0, (boxWidthPx * totalZoom - boxWidthPx) / 2)

      const maxPanYPx = isSwapped
        ? Math.max(0, (boxWidthPx * totalZoom - boxHeightPx) / 2)
        : Math.max(0, (boxHeightPx * totalZoom - boxHeightPx) / 2)

      const dxPx = e.clientX - startX
      const dyPx = e.clientY - startY

      let newX = 50
      if (maxPanXPx > 0) {
        const deltaXPercent = (dxPx / maxPanXPx) * 50
        newX = Math.max(0, Math.min(100, Math.round(initX + deltaXPercent)))
      }

      let newY = 50
      if (maxPanYPx > 0) {
        const deltaYPercent = (dyPx / maxPanYPx) * 50
        newY = Math.max(0, Math.min(100, Math.round(initY + deltaYPercent)))
      }

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const state = usePolaroidStore.getState()
        const photo = state.photos.find((item) => item.id === photoId)
        if (photo) {
          const c = photo.crop || { zoom: 1, xPercent: 50, yPercent: 50, rotation: 0 }
          if (c.xPercent !== newX || c.yPercent !== newY) {
            state.updatePhotoCrop(photoId, {
              ...c,
              xPercent: newX,
              yPercent: newY
            })
          }
        }
      })
    }

    const onGlobalMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (photoDragRef.current) {
        setIsPhotoDragging(false)
        photoDragRef.current = null
      }
    }

    window.addEventListener('mousemove', onGlobalMouseMove, { passive: false })
    window.addEventListener('mouseup', onGlobalMouseUp)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onGlobalMouseMove)
      window.removeEventListener('mouseup', onGlobalMouseUp)
    }
  }, [])

  const isZoomed = previewZoom > 100

  // Update container size on resize
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

  // Outside click for zoom menu
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

  // Mouse wheel scroll khusus untuk zoom (non-passive)
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomDelta = e.deltaY < 0 ? 15 : -15
    const currentZoom = usePolaroidStore.getState().previewZoom
    usePolaroidStore.getState().setPreviewZoom(Math.max(25, Math.min(300, currentZoom + zoomDelta)))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheelNative)
    }
  }, [handleWheelNative, activePageIndex, currentSheetPhotos.length])

  // Drag-to-scroll saat zoomed in (hanya jika tidak sedang drag foto)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (photoDragRef.current) return
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

  const fileInputPhotosRef = useRef<HTMLInputElement>(null)

  // Buka File Picker Batch (API Electron dengan fallback native file dialog)
  const handlePickPhotos = async () => {
    if (window.api?.openImages) {
      try {
        const selected = await window.api.openImages()
        if (selected && selected.length > 0) {
          const newItems: PolaroidPhoto[] = selected.map((img: SourceImage) => ({
            id: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            filePath: img.filePath,
            base64: img.thumbnailUrl,
            caption: ''
          }))
          addPhotosToPage(activePageIndex, newItems)
          return
        }
      } catch (err) {
        console.error('Gagal membuka gambar via Electron API:', err)
      }
    }
    fileInputPhotosRef.current?.click()
  }

  const handleFileInputPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        if (base64) {
          const newPhoto: PolaroidPhoto = {
            id: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            filePath: (file as any).path || file.name,
            base64,
            caption: ''
          }
          addPhotosToPage(activePageIndex, [newPhoto])
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  // Ganti Foto Tunggal dengan File Baru
  const handleReplacePhoto = async (photoId: string) => {
    if (!window.api) return
    try {
      const selected = await window.api.openImages()
      if (selected && selected.length > 0) {
        const img = selected[0]
        replacePhoto(photoId, {
          filePath: img.filePath,
          base64: img.thumbnailUrl
        })
      }
    } catch (err) {
      console.error('Gagal mengganti gambar:', err)
    }
  }

  // Hitung Skala Fit Viewport Presisi
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

  // Hitung Corner Bracket Crop Marks persis di sudut fisik kartu polaroid (tanpa offset pinggir)
  const cropMarks =
    includeBorder && placedSlots.length > 0
      ? generateCropMarks(
          placedSlots.map(
            (s): LayoutItem => ({
              id: `slot-${s.slotIndex}`,
              requestId: `req-${s.slotIndex}`,
              imageId: s.photo?.id || `empty-${s.slotIndex}`,
              sourcePath: s.photo?.filePath || '',
              label: 'Polaroid',
              widthMm: s.widthMm,
              heightMm: s.heightMm,
              xMm: s.xMm,
              yMm: s.yMm,
              rotation: 0,
              crop: {
                xPercent: 50,
                yPercent: 50,
                zoom: 1,
                aspectRatio: s.widthMm / s.heightMm
              }
            })
          ),
          2.5,
          0,
          { offsetX: 0, offsetY: 0 },
          { widthMm: paper.widthMm, heightMm: paper.heightMm }
        )
      : []

  const activeFrameStyle = FRAME_COLORS.find((f) => f.id === frameColor) || FRAME_COLORS[0]

  // Nilai aktif style (mengikuti opsi target: Semua vs Terpilih)
  const currentBrightness = selectedPhoto?.adjustments?.brightness ?? 0
  const currentContrast = selectedPhoto?.adjustments?.contrast ?? 0
  const currentSaturation = selectedPhoto?.adjustments?.saturation ?? 0
  const currentSharpen = selectedPhoto?.adjustments?.sharpen ?? 0
  const currentFlipH = selectedPhoto?.adjustments?.flipHorizontal ?? false
  const currentColorMode: PolaroidColorMode = selectedPhoto?.adjustments?.colorMode ?? 'color'

  const handleUpdateColorMode = (mode: PolaroidColorMode) => {
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { colorMode: mode })
    } else {
      updateAllPhotosAdjustments({ colorMode: mode })
    }
  }

  const handleUpdateBrightness = (val: number) => {
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { brightness: val })
    } else {
      updateAllPhotosAdjustments({ brightness: val })
    }
  }

  const handleUpdateContrast = (val: number) => {
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { contrast: val })
    } else {
      updateAllPhotosAdjustments({ contrast: val })
    }
  }

  const handleUpdateSaturation = (val: number) => {
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { saturation: val })
    } else {
      updateAllPhotosAdjustments({ saturation: val })
    }
  }

  const handleUpdateSharpen = (val: number) => {
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { sharpen: val })
    } else {
      updateAllPhotosAdjustments({ sharpen: val })
    }
  }

  const handleToggleFlipH = () => {
    const nextVal = !currentFlipH
    if (selectedPhoto) {
      updatePhotoAdjustments(selectedPhoto.id, { flipHorizontal: nextVal })
    } else {
      updateAllPhotosAdjustments({ flipHorizontal: nextVal })
    }
  }

  const handleRotateStyle = () => {
    if (selectedPhoto) {
      handleRotate90()
    } else {
      photos.forEach((p) => {
        const rot = ((p.crop?.rotation || 0) + 90) % 360
        updatePhotoCrop(p.id, {
          zoom: p.crop?.zoom || 1,
          xPercent: p.crop?.xPercent ?? 50,
          yPercent: p.crop?.yPercent ?? 50,
          rotation: rot
        })
      })
    }
  }

  // Visual filter CSS persis Pas Foto (PaperCanvas.tsx)
  const getPhotoFilterStyle = (photo: PolaroidPhoto | null) => {
    const pBrightness = photo?.adjustments?.brightness ?? 0
    const pContrast = photo?.adjustments?.contrast ?? 0
    const pSaturation = photo?.adjustments?.saturation ?? 0

    let filterStr = ''
    if (pBrightness !== 0) {
      const b = 1 + pBrightness / 100
      filterStr += `brightness(${Math.max(0, b)}) `
    }
    if (pContrast !== 0) {
      const c = 1 + pContrast / 100
      filterStr += `contrast(${Math.max(0, c)}) `
    }
    if (pSaturation !== 0) {
      const s = 1 + pSaturation / 100
      filterStr += `saturate(${Math.max(0, s)}) `
    }

    const pColorMode = photo?.adjustments?.colorMode ?? 'color'
    if (pColorMode === 'grayscale') {
      filterStr += 'grayscale(100%) '
    } else if (pColorMode === 'vintage') {
      filterStr += 'sepia(45%) '
    }

    return filterStr.trim() || 'none'
  }

  const isPhotoFlipped = (photo: PolaroidPhoto | null) => {
    return photo?.adjustments?.flipHorizontal ?? flipHorizontal ?? false
  }

  const hasPhotos = photos.length > 0

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
            Layout Polaroid
          </h1>
        </div>

        {/* Action Buttons: Export & Cetak */}
        <div className="flex items-center gap-2">
          <button
            disabled={!hasPhotos}
            onClick={onOpenExport}
            className="py-1 px-3 rounded bg-secondary hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-30 disabled:pointer-events-none"
            title="Export Gambar / PDF 300 DPI (Ctrl+E)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            disabled={!hasPhotos}
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
        {/* LEFT PANEL: Foto Manager & Caption Input */}
        <aside
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const files = e.dataTransfer.files
            if (files && files.length > 0) {
              Array.from(files).forEach((file) => {
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string
                    if (base64) {
                      addPhotosToPage(activePageIndex, [
                        {
                          id: `pol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                          filePath: (file as any).path || file.name,
                          base64,
                          caption: ''
                        }
                      ])
                    }
                  }
                  reader.readAsDataURL(file)
                }
              })
            }
          }}
          className="w-80 h-full border-r border-border bg-card flex flex-col justify-between overflow-y-auto shrink-0"
        >
          <input
            type="file"
            ref={fileInputPhotosRef}
            onChange={handleFileInputPhotosChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <div className="p-3.5 space-y-4">
            {/* Header & Upload Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  FOTO POLAROID ({currentSheetPhotos.length})
                </span>
                {currentSheetPhotos.length > 0 && (
                  <button
                    onClick={() => clearPagePhotos(activePageIndex)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                    title="Hapus semua foto pada lembar ini"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handlePickPhotos}
                  className="py-2.5 px-3 rounded bg-primary hover:bg-primary-hover text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors border border-primary/80 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tambah Foto Polaroid</span>
                </button>

                {currentSheetPhotos.length === 1 && (
                  <button
                    onClick={() => duplicatePhotoToCurrentSheet(currentSheetPhotos[0].id, activePageIndex)}
                    className="py-1.5 px-2.5 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title={`Duplikasi foto ini ke seluruh ${gridInfo.totalPerSheet} slot lembar #${activePageIndex + 1}`}
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    <span>Duplikat ke 1 Lembar Penuh ({gridInfo.totalPerSheet} Foto)</span>
                  </button>
                )}
              </div>
            </div>

            {/* List Foto & Caption Input */}
            <div className="space-y-2.5">
              {currentSheetPhotos.length === 0 ? (
                <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-xs space-y-2">
                  <Camera className="w-8 h-8 stroke-1 mx-auto text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">Lembar #{activePageIndex + 1} Masih Kosong</p>
                  <p className="text-[11px] text-muted-foreground">
                    Klik tombol Tambah Foto Polaroid di atas untuk mengisi foto pada lembar ini ({gridInfo.totalPerSheet} slot tersedia).
                  </p>
                </div>
              ) : (
                currentSheetPhotos.map((item, idx) => {
                  const isSelected = selectedPhotoId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPhotoId(item.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-muted/80 border-primary shadow-sm'
                          : 'bg-muted/40 border-border hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Mini Thumbnail */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            setCroppingPhoto(item)
                          }}
                          className="w-12 h-14 bg-black rounded overflow-hidden relative cursor-pointer group shrink-0 border border-border"
                          title="Klik untuk membuka modal potong (crop) penuh"
                        >
                          <img
                            src={item.base64 || item.filePath}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `scale(${item.crop?.zoom || 1}) rotate(${item.crop?.rotation || 0}deg)${
                                isPhotoFlipped(item) ? ' scaleX(-1)' : ''
                              }`,
                              objectPosition: `${item.crop?.xPercent ?? 50}% ${item.crop?.yPercent ?? 50}%`,
                              filter: getPhotoFilterStyle(item)
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Scissors className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        {/* Info & Actions */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-foreground truncate flex items-center gap-1">
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                              Foto #{idx + 1}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {/* Geser Urutan Atas */}
                              <button
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  movePhotoOnPage(activePageIndex, idx, idx - 1)
                                }}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                title="Geser Urutan ke Atas (Tukar Posisi)"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>

                              {/* Geser Urutan Bawah */}
                              <button
                                disabled={idx === currentSheetPhotos.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  movePhotoOnPage(activePageIndex, idx, idx + 1)
                                }}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                title="Geser Urutan ke Bawah (Tukar Posisi)"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              {/* Ganti Foto */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReplacePhoto(item.id)
                                }}
                                className="p-1 rounded hover:bg-secondary text-primary hover:text-primary-hover transition-colors"
                                title="Ganti Foto Ini dengan File Baru"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>

                              {/* Crop / Sesuaikan */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCroppingPhoto(item)
                                }}
                                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Potong (Crop) / Sesuaikan"
                              >
                                <Scissors className="w-3 h-3" />
                              </button>

                              {/* Hapus */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removePhoto(item.id)
                                }}
                                className="p-1 rounded hover:bg-secondary text-rose-400 hover:text-rose-300 transition-colors"
                                title="Hapus foto ini"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Caption input */}
                          <input
                            type="text"
                            maxLength={35}
                            placeholder="Teks / Caption di bawah foto..."
                            value={item.caption || ''}
                            onChange={(e) => updatePhotoCaption(item.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-card border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-white/60 placeholder:text-muted-foreground/60"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Style Adjustments persis Pas Foto dengan opsi Semua / Foto Terpilih */}
            {photos.length > 0 && (
              <div className="space-y-2.5 bg-muted/40 p-2.5 rounded border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    STYLE
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRotateStyle}
                      className="p-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                      title={styleScope === 'all' ? 'Putar 90° Semua Foto' : 'Putar 90° Foto Terpilih'}
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
                      title={styleScope === 'all' ? 'Flip Horizontal Semua Foto' : 'Flip Horizontal Foto Terpilih'}
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

                {/* Sliders Persis Pas Foto */}
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

                {/* Tombol Salin Style Foto Ini ke Semua Foto */}
                {photos.length > 1 && selectedPhoto && (
                  <button
                    onClick={() => applyPhotoAdjustmentsToAll(selectedPhoto.id)}
                    className="w-full py-1.5 px-2 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-1"
                    title="Terapkan nilai Style foto terpilih ini ke seluruh foto lainnya"
                  >
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Terapkan Style Ini ke Semua Foto</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Canvas Preview Presisi 1:1 */}
        <main className="flex-1 h-full bg-background relative overflow-hidden select-none flex flex-col">
          {/* Multi-Page Sheet Navigator & Canvas Manager (Tengah Atas) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-card/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-border shadow-2xl z-20">
            {/* Tombol Lembar Sebelumnya */}
            <button
              onClick={() => setActivePageIndex(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-1 rounded bg-secondary hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
              title="Lembar Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* List Tab Nomor Lembar */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePageIndex(idx)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                    activePageIndex === idx
                      ? 'bg-primary text-slate-950 shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  title={`Buka Lembar / Canvas ${idx + 1}`}
                >
                  Lembar {idx + 1}
                </button>
              ))}
            </div>

            {/* Tombol Lembar Selanjutnya */}
            <button
              onClick={() => setActivePageIndex(Math.min(totalPages - 1, activePageIndex + 1))}
              disabled={activePageIndex >= totalPages - 1}
              className="p-1 rounded bg-secondary hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors border border-border"
              title="Lembar Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Tombol Tambah Lembar / Canvas Baru */}
            <button
              onClick={addNewPage}
              className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-xs font-bold transition-colors"
              title="Tambah Halaman / Canvas Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lembar Baru</span>
            </button>

            {/* Tombol Hapus Lembar Aktif (Jika lembar > 1) */}
            {totalPages > 1 && (
              <button
                onClick={() => removePage(activePageIndex)}
                className="p-1 rounded text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                title={`Hapus Lembar ${activePageIndex + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

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
              className={`min-w-full min-h-full p-6 flex items-center justify-center ${
                isZoomed ? 'w-max h-max' : 'w-full h-full'
              }`}
            >
              <div
                className="bg-white shadow-2xl relative border border-slate-700/80 select-none"
                style={{
                  width: `${finalWidthPx}px`,
                  height: `${finalHeightPx}px`,
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
                }}
              >
                {/* Placed Polaroid Slots */}
                {placedSlots.map((slot) => {
                  const cardDims = usePolaroidStore.getState().getCardDimensions(activePageIndex)
                  const cardXPx = mmToPx(slot.xMm)
                  const cardYPx = mmToPx(slot.yMm)
                  const cardWPx = mmToPx(slot.widthMm)
                  const cardHPx = mmToPx(slot.heightMm)

                  const photoMarginPx = mmToPx(cardDims.photoMarginMm)
                  const photoChinPx = mmToPx(cardDims.photoChinMm)

                  const photoXPx = photoMarginPx
                  const photoYPx = photoMarginPx
                  const photoWPx = cardWPx - photoMarginPx * 2
                  const photoHPx = cardHPx - photoMarginPx - photoChinPx

                  const cropZoom = Math.max(1, slot.photo?.crop?.zoom || 1)
                  const cropX = slot.photo?.crop?.xPercent ?? 50
                  const cropY = slot.photo?.crop?.yPercent ?? 50
                  const cropRot = slot.photo?.crop?.rotation || 0

                  // Kompensasi rotasi agar gambar selalu menutupi viewport tanpa celah kosong saat diputar
                  const isSwapped = (cropRot % 180 !== 0)
                  const minCoverScale = isSwapped ? Math.max(photoWPx / photoHPx, photoHPx / photoWPx) : 1
                  const totalZoom = cropZoom * minCoverScale

                  const maxPanXPx = isSwapped
                    ? Math.max(0, (photoHPx * totalZoom - photoWPx) / 2)
                    : Math.max(0, (photoWPx * totalZoom - photoWPx) / 2)

                  const maxPanYPx = isSwapped
                    ? Math.max(0, (photoWPx * totalZoom - photoHPx) / 2)
                    : Math.max(0, (photoHPx * totalZoom - photoHPx) / 2)

                  const panXPx = ((cropX - 50) / 50) * maxPanXPx
                  const panYPx = ((cropY - 50) / 50) * maxPanYPx

                  const isSlotSelected = Boolean(slot.photo && selectedPhotoId === slot.photo.id)

                  return (
                    <div
                      key={`slot-${slot.slotIndex}`}
                      onClick={() => slot.photo && setSelectedPhotoId(slot.photo.id)}
                      onMouseDown={(e) => {
                        if (slot.photo) {
                          handlePhotoMouseDown(
                            e,
                            slot.photo.id,
                            slot.photo.crop,
                            photoWPx,
                            photoHPx
                          )
                        }
                      }}
                      className={`absolute overflow-hidden select-none flex flex-col justify-between ${
                        slot.photo
                          ? isPhotoDragging && photoDragRef.current?.photoId === slot.photo.id
                            ? 'cursor-grabbing'
                            : 'cursor-grab'
                          : 'cursor-default'
                      } ${
                        isSlotSelected
                          ? 'ring-2 ring-primary ring-offset-1 z-10 shadow-lg'
                          : ''
                      }`}
                      style={{
                        left: `${cardXPx}px`,
                        top: `${cardYPx}px`,
                        width: `${cardWPx}px`,
                        height: `${cardHPx}px`,
                        ...getPolaroidBackgroundStyle({
                          bgType,
                          customBgColor: customBgColor || activeFrameStyle.bg,
                          bgPattern,
                          patternColor,
                          patternScale,
                          customBgImage,
                          fallbackColor: activeFrameStyle.bg,
                          canvasScale: scale
                        }),
                        border: 'none',
                        boxShadow: isSlotSelected ? undefined : 'none'
                      }}
                      title={slot.photo ? `Slot #${slot.slotIndex + 1} - Klik tahan & geser mouse untuk mengatur posisi` : `Slot #${slot.slotIndex + 1}`}
                    >
                      {/* Photo Area with direct Click-Hold-Drag Gesture */}
                      <div
                        className="overflow-hidden relative select-none shrink-0"
                        style={{
                          marginTop: `${photoMarginPx}px`,
                          marginLeft: `${photoMarginPx}px`,
                          marginRight: `${photoMarginPx}px`,
                          width: `${photoWPx}px`,
                          height: `${photoHPx}px`,
                          backgroundColor: '#f1f5f9'
                        }}
                      >
                        {slot.photo ? (
                          <img
                            src={slot.photo.base64 || slot.photo.filePath}
                            alt="Polaroid"
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none select-none origin-center"
                            style={{
                              transform: `translate(${panXPx}px, ${panYPx}px) scale(${totalZoom}) rotate(${cropRot}deg)${
                                isPhotoFlipped(slot.photo) ? ' scaleX(-1)' : ''
                              }`,
                              filter: getPhotoFilterStyle(slot.photo)
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-1 text-center select-none">
                            <Camera className="w-5 h-5 opacity-40 mb-1" />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Slot #{slot.slotIndex + 1}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Chin Caption Area */}
                      <div
                        className="flex items-center justify-center px-1 text-center font-medium truncate"
                        style={{
                          height: `${photoChinPx}px`,
                          color: activeFrameStyle.text,
                          fontSize: `${Math.max(8, Math.round(mmToPx(3.2)))}px`
                        }}
                      >
                        {slot.photo?.caption ? slot.photo.caption : ''}
                      </div>
                    </div>
                  )
                })}

                {/* Corner Bracket Crop Marks Overlay */}
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
                        stroke={cropMarkColor || '#000000'}
                        strokeWidth="1.2"
                      />
                    ))}
                  </svg>
                )}

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
              </div>
            </div>
          </div>

          {/* Quick Adjust Toolbar (Sisi Kiri Bawah) */}
          {selectedPhoto && (
            <div className="absolute bottom-3 left-5 flex items-center gap-2 bg-card/95 backdrop-blur-md px-3 py-1.5 rounded border border-border shadow-2xl z-20 cursor-default text-xs">
              {/* Badge Indikator Foto Terpilih */}
              <div className="flex items-center gap-1.5 font-extrabold text-foreground shrink-0 border-r border-border pr-2.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[11px] uppercase tracking-wider">
                  Foto #{selectedIndex + 1}
                </span>
              </div>

              {/* Tombol Ganti Foto Terpilih */}
              <button
                onClick={() => handleReplacePhoto(selectedPhoto.id)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold transition-colors shrink-0"
                title="Ganti Foto Ini dengan File Gambar Lain"
              >
                <RefreshCw className="w-3 h-3 text-primary" />
                <span>Ganti</span>
              </button>

              {/* Tombol Tukar / Geser Posisi Slot */}
              {photos.length > 1 && (
                <div className="flex items-center gap-0.5 bg-muted/60 px-1 py-0.5 rounded border border-border shrink-0" title="Tukar posisi urutan slot foto ini">
                  <span className="text-[10px] text-muted-foreground font-semibold pr-0.5">Tukar:</span>
                  <button
                    disabled={selectedIndex <= 0}
                    onClick={() => swapPhotos(selectedIndex, selectedIndex - 1)}
                    className="p-0.5 px-1 rounded hover:bg-secondary text-foreground disabled:opacity-25 disabled:pointer-events-none transition-colors"
                    title="Tukar Posisi dengan Slot Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={selectedIndex >= photos.length - 1}
                    onClick={() => swapPhotos(selectedIndex, selectedIndex + 1)}
                    className="p-0.5 px-1 rounded hover:bg-secondary text-foreground disabled:opacity-25 disabled:pointer-events-none transition-colors"
                    title="Tukar Posisi dengan Slot Berikutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="w-px h-4 bg-border shrink-0" />

              {/* Slider Zoom Langsung */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  onDoubleClick={() => handleUpdateZoom(1)}
                  className="text-[11px] text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                  title="Zoom Foto (1.0x - 3.0x) - Klik ganda untuk reset (1.0x)"
                >
                  Zoom
                </span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={currentCrop.zoom || 1}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleUpdateZoom(parseFloat(e.target.value))}
                  className="w-16 h-1.5 bg-border rounded cursor-pointer accent-primary"
                />
                <span className="font-mono text-[11px] font-bold text-foreground w-8">
                  {(currentCrop.zoom || 1).toFixed(1)}x
                </span>
              </div>

              <div className="w-px h-4 bg-border shrink-0" />

              {/* Slider Geser Horizontal (H) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  onDoubleClick={() => handleUpdatePosX(50)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                  title="Geser Posisi Horizontal Kiri - Kanan (0% - 100%) - Klik ganda untuk reset (50%)"
                >
                  <MoveHorizontal className="w-3.5 h-3.5" />
                  <span>Geser H</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentCrop.xPercent ?? 50}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleUpdatePosX(parseInt(e.target.value))}
                  className="w-16 h-1.5 bg-border rounded cursor-pointer accent-primary"
                />
                <span className="font-mono text-[11px] font-bold text-foreground w-7">
                  {Math.round(currentCrop.xPercent ?? 50)}%
                </span>
              </div>

              <div className="w-px h-4 bg-border shrink-0" />

              {/* Slider Geser Vertikal (V) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  onDoubleClick={() => handleUpdatePosY(50)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold cursor-pointer hover:text-primary transition-colors"
                  title="Geser Posisi Vertikal Atas - Bawah (0% - 100%) - Klik ganda untuk reset (50%)"
                >
                  <MoveVertical className="w-3.5 h-3.5" />
                  <span>Geser V</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentCrop.yPercent ?? 50}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleUpdatePosY(parseInt(e.target.value))}
                  className="w-16 h-1.5 bg-border rounded cursor-pointer accent-primary"
                />
                <span className="font-mono text-[11px] font-bold text-foreground w-7">
                  {Math.round(currentCrop.yPercent ?? 50)}%
                </span>
              </div>

              <div className="w-px h-4 bg-border shrink-0" />

              {/* Rotasi 90° */}
              <button
                onClick={handleRotate90}
                className="p-1 px-1.5 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                title="Putar Foto 90 Derajat"
              >
                <RotateCw className="w-3 h-3 text-primary" />
                <span>{currentCrop.rotation || 0}°</span>
              </button>

              {/* Terapkan ke Seluruh Foto */}
              {photos.length > 1 && (
                <button
                  onClick={handleApplyToAllPhotos}
                  className="p-1 px-2 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                  title="Terapkan Zoom & Posisi foto ini ke seluruh foto di lembar"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Semua</span>
                </button>
              )}

              {/* Reset Crop */}
              <button
                onClick={handleResetPhotoCrop}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                title="Reset Posisi & Zoom Foto Ini ke Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Canvas Controls (Pojok Kanan Bawah) */}
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
                UKURAN KERTAS CETAK
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

            {/* Pilihan Preset Grid Polaroid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  SUSUNAN GRID
                </span>
                <span className="text-[10px] text-primary font-semibold">
                  {gridInfo.cols} × {gridInfo.rows} ({gridInfo.totalPerSheet} Foto)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: '3x3', label: '3 × 3' },
                  { id: '2x3', label: '2 × 3' },
                  { id: '2x2', label: '2 × 2' },
                  { id: '2x4', label: '2 × 4' },
                  { id: '3x4', label: '3 × 4' }
                ].map((preset) => {
                  const currentGrid = pageConfigs[activePageIndex]?.gridPreset || gridPreset
                  const isActive = currentGrid === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setGridPreset(preset.id as PolaroidGridPreset)}
                      className={`py-1.5 px-0.5 rounded text-center transition-colors border text-[11px] font-bold ${
                        isActive
                          ? 'bg-secondary border-white/70 text-white shadow-sm'
                          : 'bg-muted/40 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title={`Grid ${preset.label}`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pilihan Latar Belakang & Pola Bingkai Polaroid */}
            <div className="space-y-2 bg-muted/40 p-2.5 rounded border border-border text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  LATAR BINGKAI POLAROID
                </span>
                <span className="text-[10px] text-primary font-semibold">
                  {bgType === 'color' ? 'Solid' : bgType === 'pattern' ? 'Pattern' : 'Custom Image'}
                </span>
              </div>

              {/* 3 Opsi Mode: Warna, Pattern, Gambar (Tombol mandiri berjejer sama seperti di bawahnya) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setBgType('color')}
                  className={`h-7 px-2 rounded transition-colors border flex items-center justify-center gap-1.5 ${
                    bgType === 'color'
                      ? 'bg-secondary border-white/70 text-white shadow-sm font-bold'
                      : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] truncate font-medium">Warna</span>
                </button>
                <button
                  onClick={() => setBgType('pattern')}
                  className={`h-7 px-2 rounded transition-colors border flex items-center justify-center gap-1.5 ${
                    bgType === 'pattern'
                      ? 'bg-secondary border-white/70 text-white shadow-sm font-bold'
                      : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] truncate font-medium">Pattern</span>
                </button>
                <button
                  onClick={() => {
                    setBgType('image')
                    if (!customBgImage) handlePickCustomBgImage()
                  }}
                  className={`h-7 px-2 rounded transition-colors border flex items-center justify-center gap-1.5 ${
                    bgType === 'image'
                      ? 'bg-secondary border-white/70 text-white shadow-sm font-bold'
                      : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] truncate font-medium">Gambar</span>
                </button>
              </div>

              {/* KONTEN TAB 1: WARNA SOLID & CUSTOM COLOR PICKER */}
              {bgType === 'color' && (
                <div className="space-y-2 pt-1">
                  {/* Preset Swatches */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {FRAME_COLORS.map((fc) => {
                      const isActive = customBgColor.toLowerCase() === fc.bg.toLowerCase()
                      return (
                        <button
                          key={fc.id}
                          onClick={() => {
                            setFrameColor(fc.id)
                            setCustomBgColor(fc.bg)
                          }}
                          className={`h-7 px-2 rounded text-left transition-colors border flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-secondary border-white/70 text-white shadow-sm font-bold'
                              : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: fc.bg }}
                          />
                          <span className="text-[11px] truncate font-medium">{fc.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Color Picker Row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                    <span className="text-muted-foreground text-[11px] shrink-0">Custom Warna:</span>
                    <div className="flex items-center gap-1.5 flex-1 bg-card border border-border rounded px-2 py-1">
                      <input
                        type="color"
                        value={customBgColor || '#ffffff'}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value)
                          setFrameColor('custom')
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                        title="Pilih Warna Custom"
                      />
                      <input
                        type="text"
                        value={customBgColor}
                        onChange={(e) => {
                          setCustomBgColor(e.target.value)
                          setFrameColor('custom')
                        }}
                        placeholder="#ffffff"
                        className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-none uppercase"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCustomBgColor('#ffffff')
                        setFrameColor('white')
                      }}
                      className="px-2 py-1 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-[10px] shrink-0"
                      title="Reset ke Putih"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* KONTEN TAB 2: TEMA POLA / PATTERN (POLKADOT, STRIPES, GRID, DSB) */}
              {bgType === 'pattern' && (
                <div className="space-y-2.5 pt-1">
                  {/* Pilihan Motif Pola */}
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'dots', label: 'Polkadot', icon: Circle },
                      { id: 'stripes', label: 'Garis-garis', icon: MoveHorizontal },
                      { id: 'grid', label: 'Kotak Grid', icon: Grid },
                      { id: 'hearts', label: 'Hati Love', icon: Heart },
                      { id: 'stars', label: 'Bintang', icon: Star },
                      { id: 'zigzag', label: 'Zigzag', icon: Sparkles }
                    ].map((p) => {
                      const isActive = bgPattern === p.id
                      const IconComp = p.icon
                      return (
                        <button
                          key={p.id}
                          onClick={() => setBgPattern(p.id as PolaroidPatternType)}
                          className={`p-1.5 rounded flex items-center justify-center gap-1 text-[10.5px] font-bold border transition-colors ${
                            isActive
                              ? 'bg-secondary text-white border-white/70 shadow-sm'
                              : 'bg-card hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <IconComp className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Pemilih Warna Latar Belakang & Warna Motif Pola */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                    {/* Warna Dasar */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Warna Dasar:</span>
                      <div className="flex items-center gap-1 bg-card border border-border rounded px-1.5 py-1">
                        <input
                          type="color"
                          value={customBgColor || '#ffffff'}
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                          title="Pilih Warna Dasar"
                        />
                        <span className="font-mono text-[10px] text-foreground uppercase truncate">
                          {customBgColor || '#ffffff'}
                        </span>
                      </div>
                    </div>

                    {/* Warna Motif */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-semibold block">Warna Motif Pola:</span>
                      <div className="flex items-center gap-1 bg-card border border-border rounded px-1.5 py-1">
                        <input
                          type="color"
                          value={patternColor || '#cbd5e1'}
                          onChange={(e) => setPatternColor(e.target.value)}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                          title="Pilih Warna Motif"
                        />
                        <span className="font-mono text-[10px] text-foreground uppercase truncate">
                          {patternColor || '#cbd5e1'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Kombinasi Warna Aesthetic Pola */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Preset Nuansa Pola:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { name: 'Pink Love', bg: '#fdf2f8', pat: '#f43f5e' },
                        { name: 'Blue Sky', bg: '#f0f9ff', pat: '#0284c7' },
                        { name: 'Krem Retro', bg: '#fef3c7', pat: '#d97706' },
                        { name: 'Mint Sage', bg: '#f0fdf4', pat: '#16a34a' },
                        { name: 'Lilac', bg: '#faf5ff', pat: '#9333ea' },
                        { name: 'Monochrome', bg: '#18181b', pat: '#ffffff' },
                        { name: 'Soft Gray', bg: '#ffffff', pat: '#cbd5e1' },
                        { name: 'Golden Glow', bg: '#fffbeb', pat: '#f59e0b' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCustomBgColor(preset.bg)
                            setPatternColor(preset.pat)
                          }}
                          className="p-1 rounded border border-border bg-card hover:bg-muted text-[9.5px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                          title={preset.name}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.bg }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.pat }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slider Skala Ukuran Pola */}
                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        onDoubleClick={() => setPatternScale(1.0)}
                        className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        title="Klik ganda untuk reset ukuran pola (1.0x)"
                      >
                        Ukuran Kerapatan Pola:
                      </span>
                      <span className="font-mono font-bold text-foreground">{patternScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.1"
                      value={patternScale}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPatternScale(parseFloat(e.target.value))}
                      className="w-full bg-border rounded cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* KONTEN TAB 3: UPLOAD GAMBAR / TEKSTUR CUSTOM */}
              {bgType === 'image' && (
                <div className="space-y-2 pt-1">
                  <input
                    type="file"
                    ref={fileInputBgRef}
                    onChange={handleFileInputBgChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {customBgImage ? (
                    <div className="space-y-2">
                      <div className="relative rounded border border-border overflow-hidden h-20 bg-slate-900 flex items-center justify-center">
                        <img
                          src={customBgImage}
                          alt="Background Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={handlePickCustomBgImage}
                            className="px-2 py-1 bg-primary text-slate-950 font-bold rounded text-[10px] shadow"
                          >
                            Ganti
                          </button>
                          <button
                            onClick={() => {
                              setCustomBgImage(null)
                              setBgType('color')
                            }}
                            className="px-2 py-1 bg-destructive text-white font-bold rounded text-[10px] shadow"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={handlePickCustomBgImage}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold transition-colors"
                        >
                          <Upload className="w-3 h-3 text-primary" />
                          <span>Ganti Gambar</span>
                        </button>
                        <button
                          onClick={() => {
                            setCustomBgImage(null)
                            setBgType('color')
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-destructive hover:bg-destructive/10 text-[11px] font-semibold transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handlePickCustomBgImage}
                      className="w-full p-4 rounded border-2 border-dashed border-border hover:border-primary/60 bg-card hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer"
                    >
                      <Upload className="w-6 h-6 text-primary animate-bounce" />
                      <span className="text-xs font-bold text-foreground">Upload Background</span>
                      <span className="text-[10px] text-muted-foreground">Pilih file foto/tekstur (.png, .jpg, .svg)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Terapkan Latar ke Semua Lembar (Selalu Tampil) */}
              <button
                onClick={applyCurrentPageConfigToAll}
                className="w-full py-1.5 px-2.5 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2 shadow-sm"
                title="Salin tema/latar lembar ini ke seluruh lembar lainnya"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span>Terapkan Latar Ini ke Semua Lembar</span>
              </button>
            </div>


            {/* Pengaturan Jarak & Margin */}
            <div className="space-y-2 bg-muted/40 p-2.5 rounded border border-border text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                PENGATURAN MARGIN & JARAK POTONG
              </span>

              {/* Margin Atas (Top) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setMarginTopMm(5)}
                    className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    title="Klik ganda untuk reset Margin Atas (5 mm)"
                  >
                    Margin Atas (Top):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
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

              {/* Margin Bawah (Bottom) */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setMarginBottomMm(5)}
                    className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    title="Klik ganda untuk reset Margin Bawah (5 mm)"
                  >
                    Margin Bawah (Bottom):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={marginBottomMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setMarginBottomMm(parseFloat(e.target.value) || 0)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={marginBottomMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setMarginBottomMm(parseInt(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Posisi Horizontal: Rata Tengah vs Margin Manual */}
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

                {isAutoCenterHorizontal ? (
                  /* Margin Pinggir (Kiri & Kanan Simetris) */
                  <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        onDoubleClick={() => setMarginLeftMm(5)}
                        className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        title="Klik ganda untuk reset Margin Pinggir Kiri & Kanan (5 mm)"
                      >
                        Margin Pinggir (Sisi Kiri & Kanan):
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
                ) : (
                  /* Margin Manual: Kiri & Kanan Terpisah */
                  <div className="space-y-2 pl-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          onDoubleClick={() => setMarginLeftMm(5)}
                          className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          title="Klik ganda untuk reset Margin Kiri (5 mm)"
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

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          onDoubleClick={() => setMarginRightMm(5)}
                          className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                          title="Klik ganda untuk reset Margin Kanan (5 mm)"
                        >
                          Margin Kanan (Right):
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marginRightMm}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onChange={(e) => setMarginRightMm(parseFloat(e.target.value) || 0)}
                            className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                          />
                          <span className="text-muted-foreground">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={marginRightMm}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onChange={(e) => setMarginRightMm(parseInt(e.target.value))}
                        className="w-full bg-border rounded cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Margin Sisi Foto (Kiri, Kanan, Atas ke Crop Marks) */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setPhotoMarginMm(4)}
                    className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    title="Klik ganda untuk reset Margin Sisi Foto (4 mm)"
                  >
                    Margin Sisi Foto (Jarak ke Crop Marks):
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={photoMarginMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPhotoMarginMm(parseFloat(e.target.value) || 4)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={photoMarginMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setPhotoMarginMm(parseFloat(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Tinggi Frame Bawah (Chin Foto) */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    onDoubleClick={() => setPhotoChinMm(14)}
                    className="text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    title="Klik ganda untuk reset Frame Bawah / Chin (14 mm)"
                  >
                    Frame Bawah / Chin Foto:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="2"
                      max="35"
                      step="0.5"
                      value={photoChinMm}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPhotoChinMm(parseFloat(e.target.value) || 14)}
                      className="w-12 bg-card border border-border rounded px-1 py-0.5 font-mono text-center text-xs font-bold"
                    />
                    <span className="text-muted-foreground">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2"
                  max="35"
                  step="0.5"
                  value={photoChinMm}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onChange={(e) => setPhotoChinMm(parseFloat(e.target.value))}
                  className="w-full bg-border rounded cursor-pointer h-1.5"
                />
              </div>

              {/* Garis Batas Potong / Crop Marks */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-medium text-foreground">
                    Crop Marks (Tanda Potong Sudut)
                  </span>
                  <input
                    type="checkbox"
                    checked={includeBorder}
                    onChange={(e) => setIncludeBorder(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </label>

                {includeBorder && (
                  <div className="flex items-center justify-between gap-1 pt-1 pl-1 bg-card/60 p-1.5 rounded border border-border/60">
                    <span className="text-[10px] text-muted-foreground font-semibold">Warna Garis:</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { color: '#000000', label: 'Hitam' },
                        { color: '#64748b', label: 'Abu-abu' },
                        { color: '#ffffff', label: 'Putih' },
                        { color: '#ef4444', label: 'Merah' },
                        { color: '#3b82f6', label: 'Biru' }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => setCropMarkColor(item.color)}
                          className={`w-4 h-4 rounded-full border transition-transform ${
                            cropMarkColor.toLowerCase() === item.color.toLowerCase()
                              ? 'scale-125 border-primary ring-1 ring-primary'
                              : 'border-slate-500/40 hover:scale-110'
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={`Warna ${item.label}`}
                        />
                      ))}
                      <div className="flex items-center gap-1 pl-1 border-l border-border">
                        <input
                          type="color"
                          value={cropMarkColor || '#000000'}
                          onChange={(e) => setCropMarkColor(e.target.value)}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                          title="Pilih Warna Garis Custom"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Crop Foto Polaroid */}
      <PolaroidCropModal
        isOpen={Boolean(croppingPhoto)}
        photo={croppingPhoto}
        onClose={() => setCroppingPhoto(null)}
        onApplyCrop={updatePhotoCrop}
      />
    </div>
  )
}
