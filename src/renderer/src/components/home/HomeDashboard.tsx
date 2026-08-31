import React, { useState, useEffect } from 'react'
import { Image, CreditCard, Camera, ArrowRight, Heart, Sparkles } from 'lucide-react'
import logoDark from '../../assets/logo-dark.png'
import { UpdateModal, UpdateInfo } from '../modals/UpdateModal'

interface HomeDashboardProps {
  onSelectModule: (module: 'pas-foto' | 'ktp-id' | 'polaroid') => void
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onSelectModule }) => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('1.0.0')

  // Muat versi aplikasi lokal & auto-check rilis terbaru di GitHub
  const performCheckUpdate = async (showModalOnDone = false) => {
    if (window.api?.getAppVersion) {
      try {
        const v = await window.api.getAppVersion()
        if (v) setAppVersion(v)
      } catch (_) {}
    }

    if (!window.api?.checkForUpdates) return
    try {
      setIsCheckingUpdate(true)
      const res = await window.api.checkForUpdates()
      setUpdateInfo(res)
      if (res.currentVersion) setAppVersion(res.currentVersion)
      if (showModalOnDone) {
        setIsUpdateModalOpen(true)
      }
    } catch (err) {
      console.error('Check update failed:', err)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  useEffect(() => {
    performCheckUpdate(false)
  }, [])

  const openUrl = (url: string) => {
    if (window.api?.openExternal) {
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const openDocUrl = (page: 'docs' | 'changelog' | 'update') => {
    if (page === 'update') {
      setIsUpdateModalOpen(true)
      if (!updateInfo) {
        performCheckUpdate(true)
      }
      return
    }

    openUrl(`https://print.tama.my.id/${page}`)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto select-none justify-between">
      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center gap-6">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <img
            src={logoDark}
            alt="Printama"
            className="h-9 md:h-10 object-contain mx-auto mb-1"
          />
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
            Apa yang ingin Anda cetak hari ini?
          </h2>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Pas Foto */}
          <div
            onClick={() => onSelectModule('pas-foto')}
            className="bg-card hover:bg-card/90 border border-border hover:border-primary/50 rounded-lg p-4 flex flex-col justify-between transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Image className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  Layout Pas Foto
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Cetak pas foto 2×3, 3×4, 4×6, 2R single & campur di kertas A4/F4.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-border/70 flex items-center justify-between font-bold text-xs text-muted-foreground hover:text-primary transition-colors">
              <span>Buka Modul</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Fotokopi KTP / ID Card */}
          <div
            onClick={() => onSelectModule('ktp-id')}
            className="bg-card hover:bg-card/90 border border-border hover:border-cyan-500/50 rounded-lg p-4 flex flex-col justify-between transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CreditCard className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  FC KTP & ID Card
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Scan langsung & tata letak KTP depan-belakang skala 1:1 presisi fisik.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-border/70 flex items-center justify-between font-bold text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
              <span>Buka Modul</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Layout Foto & Polaroid */}
          <div
            onClick={() => onSelectModule('polaroid')}
            className="bg-card hover:bg-card/90 border border-border hover:border-purple-500/50 rounded-lg p-4 flex flex-col justify-between transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Camera className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-foreground">
                  Foto & Polaroid
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Cetak foto polaroid aesthetic default 9 foto/lembar di kertas A4 & F4.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-border/70 flex items-center justify-between font-bold text-xs text-muted-foreground hover:text-purple-400 transition-colors">
              <span>Buka Modul</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Credit & Links */}
      <footer className="w-full px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground">
          {/* Links & Version */}
          <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={() => openDocUrl('docs')}
              className="hover:text-foreground transition-colors font-medium hover:underline"
            >
              Documentation
            </button>
            <span className="text-border/60">|</span>
            <button
              onClick={() => openDocUrl('changelog')}
              className="hover:text-foreground transition-colors font-medium hover:underline"
            >
              Changelog
            </button>
            <span className="text-border/60">|</span>

            {/* Dynamic Update Button / Badge */}
            {updateInfo?.hasUpdate ? (
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 font-bold transition-all shadow-sm group"
                title="Versi baru tersedia! Klik untuk melihat rincian pembaruan."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px]">Update Tersedia (v{updateInfo.latestVersion})</span>
              </button>
            ) : (
              <button
                onClick={() => openDocUrl('update')}
                className="hover:text-foreground transition-colors font-medium hover:underline"
              >
                Update
              </button>
            )}

            <span className="text-border/60">|</span>
            <span
              className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-foreground font-semibold border border-border/60"
              title={`Versi aplikasi saat ini: v${appVersion}`}
            >
              v{appVersion}
            </span>
          </div>

          <div className="hidden sm:block text-border/60">•</div>

          {/* Action Buttons: Telegram Support & Saweria Donation */}
          <div className="flex items-center flex-wrap justify-center gap-2">
            {/* Telegram Support & Developer */}
            <button
              onClick={() => openUrl('https://t.me/dstama')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/80 hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors group shadow-sm"
              title="Hubungi Dukungan & Pengembang via Telegram @dstama"
            >
              <svg className="w-3.5 h-3.5 fill-[#229ED9] shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span className="text-muted-foreground group-hover:text-foreground">Support:</span>
              <span className="text-primary font-bold">@dstama</span>
            </button>

            {/* Saweria Donation */}
            <button
              onClick={() => openUrl('https://saweria.co/adyatamatech')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors group shadow-sm"
              title="Dukung Pengembangan Aplikasi Printama via Saweria"
            >
              <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Saweria</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Notifikasi Update Menarik */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        isChecking={isCheckingUpdate}
        onCheckAgain={() => performCheckUpdate(true)}
      />
    </div>
  )
}
