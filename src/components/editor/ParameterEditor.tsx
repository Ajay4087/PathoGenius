import { useEffect, useState } from 'react'
import { getTemplate } from '../../data/templates.ts'
import type { ActiveTest, Gender, ParameterDef, ParameterValue, ResultFlag, UnitSystem, WidalAntigen, WidalDilution } from '../../types/report.types.ts'
import { DERIVED_HINT, parseNumeric, referenceFor, roundTo, sliderAnchor, summarizeDlc, widalInterpretation } from '../../utils/calculations.ts'
import { Badge } from '../ui/Badge.tsx'
import { Select } from '../ui/Select.tsx'
import { Slider } from '../ui/Slider.tsx'
import { WidalTable } from '../preview/WidalTable.tsx'

interface ParameterEditorProps {
  test: ActiveTest | null
  gender: Gender
  unitSystem: UnitSystem
  onValue: (parameterId: string, value: number | null) => void
  onResetDerived: (parameterId: string) => void
  onFlag: (parameterId: string, selection: 'auto' | ResultFlag) => void
  onWidal: (antigen: WidalAntigen, dilution: WidalDilution) => void
}

const FLAG_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
  { value: 'High', label: 'High' },
]

function NumericField({
  value,
  decimals,
  labelledBy,
  onCommit,
}: {
  value: number | null
  decimals: number
  labelledBy: string
  onCommit: (value: number | null) => void
}) {
  const [text, setText] = useState(value == null ? '' : String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value == null ? '' : String(value))
  }, [value, focused])

  return (
    <input
      value={text}
      inputMode="decimal"
      aria-label={labelledBy}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const parsed = parseNumeric(text)
        onCommit(parsed == null ? null : roundTo(parsed, decimals))
        setText(parsed == null ? '' : String(roundTo(parsed, decimals)))
      }}
      onChange={(event) => {
        const next = event.target.value
        if (next !== '' && !/^\d*\.?\d*$/.test(next)) return
        setText(next)
        if (next === '' ) {
          onCommit(null)
          return
        }
        if (next.endsWith('.')) return
        const parsed = parseNumeric(next)
        if (parsed != null) onCommit(parsed)
      }}
      className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
    />
  )
}

function ParameterCard({
  def,
  entry,
  gender,
  onValue,
  onResetDerived,
  onFlag,
}: {
  def: ParameterDef
  entry: ParameterValue
  gender: Gender
  onValue: (value: number | null) => void
  onResetDerived: () => void
  onFlag: (selection: 'auto' | ResultFlag) => void
}) {
  const range = referenceFor(def, gender)
  const rangeLabel = range.label ?? '—'
  return (
    <article className={`rounded-lg border bg-white p-3 ${def.derivedFrom && !entry.manualValue ? 'border-teal-200 bg-teal-50/40' : 'border-slate-200'}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{def.name}</h3>
          <p className="text-[11px] text-slate-500">
            Ref. {rangeLabel} {def.unit}
            {def.derivedFrom ? ` · ${entry.manualValue ? 'Manual value' : DERIVED_HINT[def.derivedFrom]}` : ''}
          </p>
        </div>
        <Badge flag={entry.flag} empty={entry.value == null} />
      </div>
      <Slider
        min={def.sliderMin}
        max={def.sliderMax}
        step={def.step}
        value={sliderAnchor(def, entry.value, gender)}
        muted={entry.value == null}
        ariaLabel={`${def.name} slider`}
        onChange={(value) => onValue(roundTo(value, def.decimals))}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <NumericField value={entry.value} decimals={def.decimals} labelledBy={`${def.name} result`} onCommit={onValue} />
        <span className="text-xs text-slate-500">{def.unit}</span>
        <div className="w-28">
          <Select
            aria-label={`${def.name} flag`}
            value={entry.flagSource === 'manual' ? entry.flag : 'auto'}
            options={FLAG_OPTIONS}
            disabled={entry.value == null}
            onChange={(value) => {
              if (value === 'auto' || value === 'Low' || value === 'Normal' || value === 'High') onFlag(value)
            }}
          />
        </div>
        {def.derivedFrom ? (
          <button
            type="button"
            className="text-xs font-medium text-teal-800 disabled:text-slate-400"
            disabled={!entry.manualValue}
            onClick={onResetDerived}
          >
            Use calculated
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function ParameterEditor({ test, gender, unitSystem, onValue, onResetDerived, onFlag, onWidal }: ParameterEditorProps) {
  const template = test ? getTemplate(test.templateId) : undefined
  if (!test || !template) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        Select a test from the left pane. Sliders and keyboard entry both update the live report.
      </div>
    )
  }

  const dlcDefs = template.parameters.filter((parameter) => parameter.isDlc)
  const dlc = dlcDefs.length
    ? summarizeDlc(
        dlcDefs.map((parameter) => ({
          value: test.values.find((entry) => entry.id === parameter.id)?.value ?? null,
        })),
      )
    : null
  const dlcTone =
    !dlc || dlc.entered === 0
      ? 'border-slate-200 bg-slate-50 text-slate-600'
      : dlc.balanced
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-red-200 bg-red-50 text-red-800'

  let lastGroup: string | undefined

  return (
    <div className="h-full overflow-auto p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{template.name}</h2>
          <p className="text-xs text-slate-500">{template.category}</p>
        </div>
        {unitSystem === 'si' ? (
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Report prints in SI
          </span>
        ) : null}
      </div>
      {dlc ? (
        <div className={`mb-3 rounded-md border px-3 py-2 text-sm ${dlcTone}`}>
          <span className="font-semibold">{dlc.sum == null ? 'DLC' : `${dlc.sum}%`}</span>
          <span className="ml-2">{dlc.message}</span>
        </div>
      ) : null}
      {template.kind === 'widal' ? (
        <div className="space-y-3">
          <WidalTable cells={test.widal} mode="edit" onToggle={onWidal} />
          <p className="text-xs leading-relaxed text-slate-600">{widalInterpretation(test.widal)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {template.parameters.map((parameter) => {
            const entry = test.values.find((value) => value.id === parameter.id)
            if (!entry) return null
            const showGroup = parameter.group && parameter.group !== lastGroup
            if (parameter.group) lastGroup = parameter.group
            return (
              <div key={parameter.id}>
                {showGroup ? <h3 className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{parameter.group}</h3> : null}
                <ParameterCard
                  def={parameter}
                  entry={entry}
                  gender={gender}
                  onValue={(value) => onValue(parameter.id, value)}
                  onResetDerived={() => onResetDerived(parameter.id)}
                  onFlag={(selection) => onFlag(parameter.id, selection)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
