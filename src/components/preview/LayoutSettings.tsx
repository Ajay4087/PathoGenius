import type { PrintSettings, UnitSystem } from '../../types/report.types.ts'
import { pageChrome } from '../../utils/pagination.ts'
import { Input } from '../ui/Input.tsx'
import { Select } from '../ui/Select.tsx'
import { Slider } from '../ui/Slider.tsx'

interface LayoutSettingsProps {
  settings: PrintSettings
  onChange: (patch: Partial<PrintSettings>) => void
}

function Toggle({
  checked,
  label,
  description,
  disabled = false,
  onChange,
}: {
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-md px-1 py-1 text-left disabled:opacity-50"
    >
      <span className={`mt-0.5 h-5 w-9 shrink-0 rounded-full ${checked ? 'bg-teal-700' : 'bg-slate-300'}`}>
        <span className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </button>
  )
}

export function LayoutSettings({ settings, onChange }: LayoutSettingsProps) {
  const room = pageChrome(settings, 0).contentHeight
  return (
    <div className="h-full overflow-auto bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Page layout</h2>
      <p className="mb-4 mt-1 max-w-xl text-sm text-slate-600">
        Pre-printed letterhead mode hides the digital header and footer and reserves the top and bottom of the A4 sheet.
        One millimetre is 3.7795 px at 96 DPI, so the typed results land in the blank middle of the stationery.
      </p>
      <div className="max-w-xl space-y-4">
        <Toggle
          checked={settings.letterheadMode}
          label="Pre-printed letterhead mode"
          description="Hide the on-screen header and footer. Dashed guides show the reserved zones and disappear on print and PDF."
          onChange={(letterheadMode) => onChange({ letterheadMode })}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span>Top margin</span>
              <span>{settings.topMarginMm.toFixed(0)} mm</span>
            </div>
            <Slider
              min={0}
              max={80}
              step={1}
              value={settings.topMarginMm}
              ariaLabel="Top letterhead margin"
              onChange={(topMarginMm) => onChange({ topMarginMm })}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span>Bottom margin</span>
              <span>{settings.bottomMarginMm.toFixed(0)} mm</span>
            </div>
            <Slider
              min={0}
              max={70}
              step={1}
              value={settings.bottomMarginMm}
              ariaLabel="Bottom letterhead margin"
              onChange={(bottomMarginMm) => onChange({ bottomMarginMm })}
            />
          </div>
        </div>
        {room < 220 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">These margins leave little room for results. Reduce the top or bottom reserve.</p>
        ) : null}
        <Toggle
          checked={settings.showHeader}
          disabled={settings.letterheadMode}
          label="Show digital header"
          description="Laboratory name, address, and contact. Turned off automatically while letterhead mode is on."
          onChange={(showHeader) => onChange({ showHeader })}
        />
        <Toggle
          checked={settings.showFooter}
          disabled={settings.letterheadMode}
          label="Show digital footer"
          description="End-of-report line, signature space, and disclaimer."
          onChange={(showFooter) => onChange({ showFooter })}
        />
        <Toggle
          checked={settings.showAds}
          label="Show advertisement rails"
          description="Optional vertical slots on both sides of the workspace. Off by default, and never printed."
          onChange={(showAds) => onChange({ showAds })}
        />
        <Select
          label="Report units"
          value={settings.unitSystem}
          options={[
            { value: 'conventional', label: 'Conventional (entry units)' },
            { value: 'si', label: 'SI on the printed report' },
          ]}
          onChange={(value) => {
            const unitSystem: UnitSystem = value === 'si' ? 'si' : 'conventional'
            onChange({ unitSystem })
          }}
        />
        <Input label="Laboratory name" value={settings.labName} onChange={(labName) => onChange({ labName })} />
        <Input label="Tagline" value={settings.labTagline} onChange={(labTagline) => onChange({ labTagline })} />
        <Input label="Address" value={settings.labAddress} onChange={(labAddress) => onChange({ labAddress })} />
        <Input label="Contact" value={settings.labContact} onChange={(labContact) => onChange({ labContact })} />
      </div>
    </div>
  )
}
