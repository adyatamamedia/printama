import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export const BottomBar: React.FC = () => {
  const recommendations = useWorkspaceStore((state) => state.recommendations)
  const selectedIndex = useWorkspaceStore((state) => state.selectedRecommendationIndex)
  const images = useWorkspaceStore((state) => state.images)

  const currentLayout = recommendations[selectedIndex]
  const hasImages = images.length > 0

  if (!hasImages || !currentLayout) {
    return (
      <footer className="h-8 border-t border-border bg-card px-3 flex items-center justify-between text-xs text-muted-foreground select-none z-20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Siap memuat foto...</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>300 DPI Native</span>
          <span>Offline</span>
        </div>
      </footer>
    )
  }

  const { totalItemsPlaced, efficiencyPercent, usedAreaMm } = currentLayout

  return (
    <footer className="h-8 border-t border-border bg-card px-3 flex items-center justify-between select-none z-20 text-xs text-muted-foreground">
      {/* Left: Info Total Foto & Area Terpakai */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span>Total:</span>
          <span className="font-mono font-bold text-foreground">{totalItemsPlaced} Pas Foto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Area Terpakai:</span>
          <span className="font-mono font-bold text-foreground">
            {efficiencyPercent}% ({Math.round(usedAreaMm.width)} × {Math.round(usedAreaMm.height)} mm)
          </span>
        </div>
      </div>

      {/* Right: Info DPI */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>300 DPI Presisi Fisik</span>
      </div>
    </footer>
  )
}
