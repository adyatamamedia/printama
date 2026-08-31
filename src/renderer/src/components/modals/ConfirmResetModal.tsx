import React from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'

interface ConfirmResetModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose }) => {
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace)

  if (!isOpen) return null

  const handleConfirm = () => {
    resetWorkspace()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded w-full max-w-sm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="h-10 px-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-destructive" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Bersihkan Workspace
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
        <div className="p-3.5 space-y-2 text-xs">
          <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 flex items-start gap-2 text-destructive-foreground">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-tight">
              <p className="font-bold text-white">Kosongkan antrian cetak?</p>
              <p className="text-muted-foreground">
                Tindakan ini menghapus layout aktif dan cache temporary. File foto asli di komputer <strong className="text-white">tetap aman dan tidak diubah</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 px-3 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-destructive hover:bg-destructive/90 text-white transition-colors border border-destructive/80"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Bersihkan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
