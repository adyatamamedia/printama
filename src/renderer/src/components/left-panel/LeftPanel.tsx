import React, { useState } from 'react'
import {
  Upload,
  Sun,
  Contrast,
  Sparkles,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Sliders,
  Crop,
  Trash2,
  Image as ImageIcon,
  ZoomIn,
  Check,
  Palette,
  Plus
} from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { PHOTO_SIZE_PRESETS } from '../../../../shared/constants/presets'
import { PhotoPresetId } from '../../../../shared/types'

export const LeftPanel: React.FC = () => {
  const images = useWorkspaceStore((state) => state.images)
  const selectedImageId = useWorkspaceStore((state) => state.selectedImageId)
  const selectedItemId = useWorkspaceStore((state) => state.selectedItemId)
  const adjustments = useWorkspaceStore((state) => state.adjustments)
  const adjustmentsByImage = useWorkspaceStore((state) => state.adjustmentsByImage)
  const itemAdjustments = useWorkspaceStore((state) => state.itemAdjustments)
  const colorModeByPresetAndImage = useWorkspaceStore((state) => state.colorModeByPresetAndImage)
  const requests = useWorkspaceStore((state) => state.requests)

  const setAdjustments = useWorkspaceStore((state) => state.setAdjustments)
  const resetAdjustments = useWorkspaceStore((state) => state.resetAdjustments)
  const applyCurrentAdjustmentsToAll = useWorkspaceStore((state) => state.applyCurrentAdjustmentsToAll)
  const applyAdjustmentsToPreset = useWorkspaceStore((state) => state.applyAdjustmentsToPreset)
  const setSelectedImageId = useWorkspaceStore((state) => state.setSelectedImageId)
  const removeImage = useWorkspaceStore((state) => state.removeImage)
  const clearAllImages = useWorkspaceStore((state) => state.clearAllImages)
  const updateRequestCrop = useWorkspaceStore((state) => state.updateRequestCrop)

  const recommendations = useWorkspaceStore((state) => state.recommendations)
  const selectedRecommendationIndex = useWorkspaceStore((state) => state.selectedRecommendationIndex)
  const activePageIndex = useWorkspaceStore((state) => state.activePageIndex)

  const [activeCropPreset, setActiveCropPreset] = useState<PhotoPresetId>('3x4')

  const selectedImage = images.find((img) => img.id === selectedImageId) || images[0]
  const currentCropRequest = requests.find((r) => r.presetId === activeCropPreset)

  const currentLayout = recommendations[selectedRecommendationIndex]
  const activePage = currentLayout?.pages?.[activePageIndex] || currentLayout?.pages?.[0]
  const placedItems = activePage?.placedItems || currentLayout?.placedItems || []

  const isPresetMatch = (it: any, presetId: string) => {
    return (
      it.presetId === presetId ||
      it.requestId?.includes(presetId) ||
      it.label?.toLowerCase().includes(presetId.toLowerCase()) ||
      (presetId === '2x3' && ((it.widthMm === 20 && it.heightMm === 30) || (it.widthMm === 30 && it.heightMm === 20))) ||
      (presetId === '3x4' && ((it.widthMm === 30 && it.heightMm === 40) || (it.widthMm === 40 && it.heightMm === 30))) ||
      (presetId === '4x6' && ((it.widthMm === 40 && it.heightMm === 60) || (it.widthMm === 60 && it.heightMm === 40)))
    )
  }

  const getColorModeForPreset = (presetId: PhotoPresetId): 'color' | 'grayscale' | 'vintage' => {
    const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default')
    if (colorModeByPresetAndImage[`${activeId}_${presetId}`]) {
      return colorModeByPresetAndImage[`${activeId}_${presetId}`]
    }
    if (selectedItemId) {
      const it = placedItems.find((p) => p.id === selectedItemId)
      if (it && isPresetMatch(it, presetId) && itemAdjustments[selectedItemId]?.colorMode) {
        return itemAdjustments[selectedItemId].colorMode!
      }
    }
    const matchingItem = placedItems.find((it) =>
      isPresetMatch(it, presetId) && (!selectedImageId || it.imageId === selectedImageId)
    )
    if (matchingItem && itemAdjustments[matchingItem.id]?.colorMode) {
      return itemAdjustments[matchingItem.id].colorMode!
    }
    return adjustmentsByImage[activeId]?.colorMode ?? adjustments.colorMode ?? 'color'
  }

  // Nilai aktif style foto terpilih (tanpa bocor antar foto)
  const activeItemAdj = selectedItemId
    ? itemAdjustments[selectedItemId] || (selectedImageId ? adjustmentsByImage[selectedImageId] : null)
    : (selectedImageId ? adjustmentsByImage[selectedImageId] : null)

  const currentColorMode = activeItemAdj?.colorMode ?? 'color'
  const currentBrightness = activeItemAdj?.brightness ?? 0
  const currentContrast = activeItemAdj?.contrast ?? 0
  const currentSaturation = activeItemAdj?.saturation ?? 0
  const currentSharpen = activeItemAdj?.sharpen ?? 0
  const currentFlipH = activeItemAdj?.flipHorizontal ?? false
  const currentRotation = activeItemAdj?.rotation ?? 0

  const handlePickPhotos = async () => {
    if (!window.api) return
    const photos = await window.api.openImages()
    if (photos && photos.length > 0) {
      useWorkspaceStore.getState().addImages(photos)
    }
  }

  const handleRotate = () => {
    const nextRot = ((currentRotation || 0) + 90) % 360
    setAdjustments({ rotation: nextRot })
  }

  const handleFlipH = () => {
    setAdjustments({ flipHorizontal: !currentFlipH })
  }

  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col h-full overflow-hidden select-none shrink-0">
      {/* Konten Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Dropzone Selector - Hanya Muncul Jika Belum Ada Foto */}
        {images.length === 0 && (
          <div
            onClick={handlePickPhotos}
            className="border border-dashed border-border hover:border-primary bg-muted/30 hover:bg-muted/60 rounded p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
          >
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary mb-2.5 transition-colors border border-border">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-foreground">
              Pilih atau Seret Foto
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              JPG, JPEG, PNG, WebP
            </p>
          </div>
        )}

        {/* Thumbnail Foto Terupload */}
        {images.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                DAFTAR FOTO ({images.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearAllImages}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Hapus semua foto yang di-upload"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handlePickPhotos}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary hover:bg-muted text-foreground border border-border text-[10px] font-semibold transition-colors"
                  title="Tambah foto lainnya dari komputer"
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-muted/40 rounded border border-border">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImageId(img.id)}
                  className={`relative group aspect-[3/4] rounded overflow-hidden border cursor-pointer transition-all ${
                    selectedImageId === img.id
                      ? 'border-primary ring-2 ring-primary/40 shadow-sm'
                      : 'border-border/60 hover:border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.thumbnailUrl}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                    <span className="text-[9px] text-white font-medium truncate block">
                      {img.fileName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(img.id)
                    }}
                    className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KARTU 1: Style & Penyesuaian Warna Foto */}
        {selectedImage && (
          <div className="space-y-2.5 bg-muted/40 p-2.5 rounded border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden pr-1">
                <Sliders className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  STYLE {selectedItemId ? '(Foto di Kanvas)' : images.length > 1 ? `(${selectedImage.fileName})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => resetAdjustments()}
                  className="p-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset Pengaturan Style Foto Ini"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 rounded bg-card hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Putar 90°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleFlipH}
                  className={`p-1 rounded border transition-colors ${
                    currentFlipH
                      ? 'bg-secondary text-white border-[#5B5F65]'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-2 text-[11px]">
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-muted-foreground mb-0.5">
                  <span
                    onDoubleClick={() => setAdjustments({ brightness: 0 })}
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
                  onDoubleClick={() => setAdjustments({ brightness: 0 })}
                  onChange={(e) => setAdjustments({ brightness: parseInt(e.target.value) })}
                  className="w-full bg-border rounded cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-muted-foreground mb-0.5">
                  <span
                    onDoubleClick={() => setAdjustments({ contrast: 0 })}
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
                  onDoubleClick={() => setAdjustments({ contrast: 0 })}
                  onChange={(e) => setAdjustments({ contrast: parseInt(e.target.value) })}
                  className="w-full bg-border rounded cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-muted-foreground mb-0.5">
                  <span
                    onDoubleClick={() => setAdjustments({ saturation: 0 })}
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
                  onDoubleClick={() => setAdjustments({ saturation: 0 })}
                  onChange={(e) => setAdjustments({ saturation: parseInt(e.target.value) })}
                  className="w-full bg-border rounded cursor-pointer"
                />
              </div>

              {/* Sharpen */}
              <div>
                <div className="flex justify-between text-muted-foreground mb-0.5">
                  <span
                    onDoubleClick={() => setAdjustments({ sharpen: 0 })}
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
                  onDoubleClick={() => setAdjustments({ sharpen: 0 })}
                  onChange={(e) => setAdjustments({ sharpen: parseInt(e.target.value) })}
                  className="w-full bg-border rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Tombol Terapkan ke Semua Foto */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={applyCurrentAdjustmentsToAll}
                className="w-full py-1.5 px-2 rounded bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-1"
                title="Terapkan nilai Style foto ini ke seluruh foto lainnya"
              >
                <Check className="w-3 h-3 text-primary" />
                <span>Terapkan Style Ini ke Semua Foto</span>
              </button>
            )}
          </div>
        )}

        {/* KARTU 2: Mode Warna Per Ukuran Cetak */}
        {selectedImage && (
          <div className="space-y-2.5 bg-muted/40 p-2.5 rounded border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden pr-1">
                <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  MODE WARNA {selectedItemId ? '(Foto di Kanvas)' : images.length > 1 ? `(${selectedImage.fileName})` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-0.5">
              {PHOTO_SIZE_PRESETS.map((p) => {
                const activeMode = getColorModeForPreset(p.id)

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-1.5 bg-card rounded border border-border text-[11px]"
                  >
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => applyAdjustmentsToPreset(p.id, { colorMode: 'color' }, selectedImageId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                          activeMode === 'color'
                            ? 'bg-secondary text-white font-bold border-[#5B5F65] shadow-sm'
                            : 'bg-muted/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                        }`}
                        title={`Ubah ukuran ${p.name} foto ini menjadi Warna Asli`}
                      >
                        Warna
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAdjustmentsToPreset(p.id, { colorMode: 'grayscale' }, selectedImageId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                          activeMode === 'grayscale'
                            ? 'bg-secondary text-white font-bold border-[#5B5F65] shadow-sm'
                            : 'bg-muted/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                        }`}
                        title={`Ubah ukuran ${p.name} foto ini menjadi Hitam Putih (B&W)`}
                      >
                        B&W
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAdjustmentsToPreset(p.id, { colorMode: 'vintage' }, selectedImageId)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                          activeMode === 'vintage'
                            ? 'bg-secondary text-white font-bold border-[#5B5F65] shadow-sm'
                            : 'bg-muted/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                        }`}
                        title={`Ubah ukuran ${p.name} foto ini menjadi Vintage Sepia`}
                      >
                        Vintage
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tombol Terapkan Mode Warna Ini ke Semua Foto */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  PHOTO_SIZE_PRESETS.forEach((p) => {
                    const mode = getColorModeForPreset(p.id)
                    applyAdjustmentsToPreset(p.id, { colorMode: mode }, null)
                  })
                }}
                className="w-full py-1.5 px-2 rounded bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-1"
                title="Terapkan konfigurasi mode warna foto ini ke seluruh foto lainnya"
              >
                <Check className="w-3 h-3 text-primary" />
                <span>Terapkan Mode Warna ke Semua Foto</span>
              </button>
            )}
          </div>
        )}

        {/* KARTU 3: Crop Per Ukuran */}
        {selectedImage && (
          <div className="space-y-2.5 bg-muted/40 p-2.5 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-muted-foreground" />
                CROP PER UKURAN
              </span>
            </div>

            {/* Size Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-card p-0.5 rounded border border-border">
              {PHOTO_SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveCropPreset(p.id)}
                  className={`py-1 rounded text-xs transition-colors ${
                    activeCropPreset === p.id
                      ? 'bg-secondary text-white font-bold border border-[#5B5F65] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-semibold'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {currentCropRequest && (
              <div className="space-y-2 text-[11px]">
                {/* Zoom */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => updateRequestCrop(activeCropPreset, { zoom: 1.0 })}
                      className="text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (100%)"
                    >
                      Zoom Crop
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {Math.round(currentCropRequest.crop.zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={currentCropRequest.crop.zoom}
                    onDoubleClick={() => updateRequestCrop(activeCropPreset, { zoom: 1.0 })}
                    onChange={(e) =>
                      updateRequestCrop(activeCropPreset, { zoom: parseFloat(e.target.value) })
                    }
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>

                {/* Horizontal Position (X) */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => updateRequestCrop(activeCropPreset, { xPercent: 50 })}
                      className="text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (50% - Tengah)"
                    >
                      Geser Horizontal
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {Math.round(currentCropRequest.crop.xPercent ?? 50)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={currentCropRequest.crop.xPercent ?? 50}
                    onDoubleClick={() => updateRequestCrop(activeCropPreset, { xPercent: 50 })}
                    onChange={(e) =>
                      updateRequestCrop(activeCropPreset, { xPercent: parseInt(e.target.value) })
                    }
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>

                {/* Vertical Position (Y) */}
                <div>
                  <div className="flex justify-between text-muted-foreground mb-0.5">
                    <span
                      onDoubleClick={() => updateRequestCrop(activeCropPreset, { yPercent: 50 })}
                      className="text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                      title="Klik ganda untuk reset (50% - Tengah)"
                    >
                      Geser Vertikal
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {Math.round(currentCropRequest.crop.yPercent ?? 50)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={currentCropRequest.crop.yPercent ?? 50}
                    onDoubleClick={() => updateRequestCrop(activeCropPreset, { yPercent: 50 })}
                    onChange={(e) =>
                      updateRequestCrop(activeCropPreset, { yPercent: parseInt(e.target.value) })
                    }
                    className="w-full bg-border rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
