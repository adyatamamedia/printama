import React from 'react'
import { X, Download, CheckCircle2, ArrowRight, RefreshCw, ExternalLink, Sparkles } from 'lucide-react'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion?: string
  releaseTitle?: string
  releaseNotes?: string
  downloadUrl?: string
  htmlUrl?: string
  publishedAt?: string
  error?: string
}

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
  updateInfo: UpdateInfo | null
  isChecking: boolean
  onCheckAgain: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isChecking,
  onCheckAgain
}) => {
  if (!isOpen) return null

  const handleDownload = () => {
    const targetUrl =
      updateInfo?.downloadUrl ||
      updateInfo?.htmlUrl ||
      'https://github.com/adyatamamedia/printama/releases/latest'

    if (window.api?.openExternal) {
      window.api.openExternal(targetUrl)
    } else {
      window.open(targetUrl, '_blank')
    }
  }

  const handleViewGitHub = () => {
    const url =
      updateInfo?.htmlUrl || 'https://github.com/adyatamamedia/printama/releases'
    if (window.api?.openExternal) {
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl overflow-hidden text-foreground flex flex-col">
        {/* Header */}
        <div className="h-10 px-3.5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Pembaruan Aplikasi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {isChecking ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <p className="font-semibold text-xs text-foreground">
                Memeriksa rilis terbaru di GitHub...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Menghubungi repository adyatamamedia/printama
              </p>
            </div>
          ) : updateInfo?.hasUpdate ? (
            <div className="space-y-3">
              {/* Version Comparison Card */}
              <div className="p-3 rounded bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block font-bold">
                    Versi Saat Ini
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    v{updateInfo.currentVersion}
                  </span>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />

                <div className="text-right">
                  <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                    Versi Terbaru
                  </span>
                  <span className="font-mono text-xs font-extrabold text-amber-400">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
              </div>

              {/* Release Title & Date */}
              <div className="px-0.5 space-y-0.5">
                <h4 className="font-bold text-xs text-foreground">
                  {updateInfo.releaseTitle || `Rilis v${updateInfo.latestVersion}`}
                </h4>
                {updateInfo.publishedAt && (
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Rilis pada:{' '}
                    {new Date(updateInfo.publishedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Release Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  CATATAN PEMBARUAN:
                </span>
                <div className="p-2.5 rounded bg-muted/40 border border-border text-[11px] font-mono text-muted-foreground leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {updateInfo.releaseNotes}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-foreground">
                  Aplikasi Anda Sudah Versi Terbaru
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Anda sedang menggunakan Printama{' '}
                  <span className="font-mono font-bold text-foreground">
                    v{updateInfo?.currentVersion || '1.0.0'}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-11 px-3.5 border-t border-border flex items-center justify-between bg-muted/20 shrink-0">
          <button
            onClick={onCheckAgain}
            disabled={isChecking}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Periksa Ulang</span>
          </button>

          <div className="flex items-center gap-2">
            {updateInfo?.hasUpdate ? (
              <>
                <button
                  onClick={handleViewGitHub}
                  className="px-2.5 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>GitHub</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Update</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-3.5 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
