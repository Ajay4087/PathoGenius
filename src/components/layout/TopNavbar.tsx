import { FileDown, FlaskConical, FolderOpen, Printer, Save } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '../ui/Button.tsx'

interface TopNavbarProps {
  onExportPdf: () => void
  onPrint: () => void
  onSave: () => void
  onLoadText: (text: string) => void
  busy: boolean
  platformLabel: string
}

export function TopNavbar({ onExportPdf, onPrint, onSave, onLoadText, busy, platformLabel }: TopNavbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-teal-950 bg-[#0b3b3a] px-4 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700">
          <FlaskConical size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">PathoGenius</div>
          <div className="text-[11px] text-teal-100/80">Pathology lab reporting · {platformLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" icon={<Save size={14} />} onClick={onSave} title="Save report JSON (Ctrl+S)">
          Save JSON
        </Button>
        <Button
          variant="secondary"
          icon={<FolderOpen size={14} />}
          onClick={() => fileRef.current?.click()}
          title="Load a saved report"
        >
          Load JSON
        </Button>
        <Button variant="secondary" icon={<Printer size={14} />} onClick={onPrint} title="Print (Ctrl+P)">
          Print
        </Button>
        <Button variant="primary" icon={<FileDown size={14} />} onClick={onExportPdf} disabled={busy}>
          {busy ? 'Exporting…' : 'Export PDF'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            void file.text().then(onLoadText)
          }}
        />
      </div>
    </header>
  )
}
