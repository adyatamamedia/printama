import React, { useState } from 'react'
import { Compass, X, Download, CheckCircle2, Ruler } from 'lucide-react'

interface CalibrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false)
  const [filePath, setFilePath] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSaveCalibrationSheet = async () => {
    if (!window.api) return
    setIsSaving(true)
    try {
      const res = await window.api.saveCalibrationSheet()
      if (res.success && res.filePath) {
        setFilePath(res.filePath)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="h-10 px-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Kalibrasi Ukuran Fisik Printer
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
        <div className="p-3.5 space-y-3 text-xs">
          <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1">
            <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Ruler className="w-3.5 h-3.5 text-primary" />
              Lembar Uji Kalibrasi
            </h4>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Lembar uji berisi kotak pas foto resmi (21,6×27,9 mm, 27,9×38,1 mm, 38,1×55,9 mm)
              dan penggaris uji 100.0 mm horizontal dan vertikal 300 DPI.
            </p>
          </div>

          <div className="space-y-1 text-muted-foreground">
            <h5 className="font-bold text-foreground text-[11px] uppercase tracking-wider">
              Petunjuk Pengujian:
            </h5>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] leading-normal">
              <li>
                Cetak lembar uji dengan skala tepat <strong className="text-foreground">100%</strong> (matikan Fit to Page).
              </li>
              <li>
                Ukur kotak dan penggaris dengan penggaris milimeter fisik.
              </li>
              <li>
                Hasil cetak presisi jika selisih ukuran fisik berada dalam batas toleransi{' '}
                <strong className="text-emerald-400">±0.5 mm</strong>.
              </li>
            </ol>
          </div>

          {filePath && (
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Lembar kalibrasi berhasil disimpan!</p>
                <p className="text-[10px] text-emerald-300/80 break-all">{filePath}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-11 px-3 border-t border-border flex items-center justify-end gap-2 bg-muted/20">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border"
          >
            Tutup
          </button>
          <button
            disabled={isSaving}
            onClick={handleSaveCalibrationSheet}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-extrabold bg-primary hover:bg-primary-hover text-slate-950 disabled:opacity-40 transition-colors border border-primary/80 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Simpan Lembar Uji</span>
          </button>
        </div>
      </div>
    </div>
  )
}
