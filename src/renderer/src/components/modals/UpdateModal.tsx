import React from 'react'
import { X, Sparkles, Download, CheckCircle2, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#0e141f] border border-border shadow-2xl text-foreground">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-28 bg-primary/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Pembaruan Aplikasi
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                GitHub Releases Channel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {isChecking ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-foreground">
                Memeriksa rilis terbaru di GitHub...
              </p>
              <p className="text-xs text-muted-foreground">
                Menghubungi repository adyatamamedia/printama
              </p>
            </div>
          ) : updateInfo?.hasUpdate ? (
            <div className="space-y-4">
              {/* Version Comparison Banner */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    Versi Saat Ini
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    v{updateInfo.currentVersion}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-primary">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                    Versi Baru Tersedia
                  </span>
                  <span className="font-mono text-sm font-extrabold text-emerald-400">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
              </div>

              {/* Release Title & Date */}
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {updateInfo.releaseTitle || `Rilis v${updateInfo.latestVersion}`}
                </h4>
                {updateInfo.publishedAt && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Dirilis pada:{' '}
                    {new Date(updateInfo.publishedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>

              {/* Release Notes Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  Catatan Pembaruan & Fitur:
                </span>
                <div className="p-3.5 rounded-xl bg-black/40 border border-border/80 text-xs text-muted-foreground font-mono leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap">
                  {updateInfo.releaseNotes}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Aplikasi Anda Sudah Versi Terbaru!
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Saat ini Anda menggunakan Printama versi{' '}
                  <span className="font-mono font-bold text-foreground">
                    v{updateInfo?.currentVersion || '1.0.0'}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-3">
          <button
            onClick={onCheckAgain}
            disabled={isChecking}
            className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Periksa Ulang</span>
          </button>

          <div className="flex items-center gap-2">
            {updateInfo?.hasUpdate ? (
              <>
                <button
                  onClick={handleViewGitHub}
                  className="px-3.5 py-2 rounded-lg border border-border hover:bg-secondary/60 text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat GitHub</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Pembaruan (.exe)</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-colors"
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
