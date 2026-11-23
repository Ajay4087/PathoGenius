import type {
  DerivedKind,
  Gender,
  ParameterDef,
  ParameterValue,
  ReferenceRange,
  ResultFlag,
  UnitSystem,
  WidalAntigen,
  WidalCell,
  WidalDilution,
} from '../types/report.types.ts'


const TITRE: Record<WidalDilution, number> = {
  '1:20': 20,
  '1:40': 40,
  '1:80': 80,
  '1:160': 160,
  '1:320': 320,
}

export const DERIVED_HINT: Record<DerivedKind, string> = {
  mcv: 'Calculated from PCV ÷ RBC × 10',
  mch: 'Calculated from Hb ÷ RBC × 10',
  mchc: 'Calculated from Hb ÷ PCV × 100',
  'indirect-bilirubin': 'Calculated as total − direct bilirubin',
  bun: 'Calculated as blood urea ÷ 2.14',
  vldl: 'Calculated as triglycerides ÷ 5',
  'ldl-friedewald': 'Calculated as cholesterol − HDL − (triglycerides ÷ 5)',
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function parseNumeric(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function formatNumber(value: number | null, decimals: number): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatReportDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso || '—'
  return `${match[3]}-${match[2]}-${match[1]}`
}

function formatSpan(min: number | undefined, max: number | undefined, decimals: number): string {
  if (min != null && max != null) return `${formatNumber(min, decimals)} – ${formatNumber(max, decimals)}`
  if (max != null) return `< ${formatNumber(max, decimals)}`
  if (min != null) return `≥ ${formatNumber(min, decimals)}`
  return '—'
}

export function formatRangeLabel(range: ReferenceRange, decimals: number): string {
  if (range.label) return range.label
  return formatSpan(range.min, range.max, decimals)
}

export function referenceFor(def: ParameterDef, gender: Gender): ReferenceRange {
  const exact = def.ranges.find((item) => item.gender === gender)
  if (exact) return exact
  const all = def.ranges.find((item) => item.gender === 'All')
  if (all) return all
  if (gender === 'Other') {
    const male = def.ranges.find((item) => item.gender === 'Male')
    const female = def.ranges.find((item) => item.gender === 'Female')
    if (male && female) {
      const mins = [male.min, female.min].filter((value): value is number => value != null)
      const maxes = [male.max, female.max].filter((value): value is number => value != null)
      const min = mins.length > 0 ? Math.min(...mins) : undefined
      const max = maxes.length > 0 ? Math.max(...maxes) : undefined
      const span: ReferenceRange = { gender: 'Other', label: formatSpan(min, max, def.decimals) }
      if (min != null) span.min = min
      if (max != null) span.max = max
      return span
    }
  }
  return def.ranges[0] ?? { gender: 'All', label: '—' }
}

export function flagNumeric(value: number, range: ReferenceRange): ResultFlag {
  if (range.min != null && value < range.min) return 'Low'
  if (range.max != null && value > range.max) return 'High'
  // Labels such as "< 200" treat the printed cut-off as already abnormal.
  if (range.max != null && range.label?.trim().startsWith('<') && value >= range.max) return 'High'
  return 'Normal'
}

export function presentParameter(
  def: ParameterDef,
  value: number | null,
  gender: Gender,
  unitSystem: UnitSystem,
): { result: string; unit: string; rangeLabel: string } {
  const range = referenceFor(def, gender)
  if (unitSystem === 'si' && def.conversion) {
    const factor = def.conversion.toSi
    const decimals = def.conversion.siDecimals
    const converted = value == null ? null : value * factor
    const siRange: ReferenceRange = { gender: range.gender }
    if (range.min != null) siRange.min = range.min * factor
    if (range.max != null) siRange.max = range.max * factor
    return {
      result: formatNumber(converted, decimals),
      unit: def.conversion.siUnit,
      rangeLabel: formatRangeLabel(siRange, decimals),
    }
  }
  return {
    result: formatNumber(value, def.decimals),
    unit: def.unit,
    rangeLabel: range.label ?? formatRangeLabel(range, def.decimals),
  }
}

export function sliderAnchor(def: ParameterDef, value: number | null, gender: Gender): number {
  if (value != null) return Math.min(def.sliderMax, Math.max(def.sliderMin, value))
  const range = referenceFor(def, gender)
  let anchor = def.sliderMin
  if (range.min != null && range.max != null) anchor = (range.min + range.max) / 2
  else if (range.max != null) anchor = range.max
  else if (range.min != null) anchor = range.min
  return Math.min(def.sliderMax, Math.max(def.sliderMin, anchor))
}

function lookupValue(values: readonly ParameterValue[], id: string): number | null {
  return values.find((entry) => entry.id === id)?.value ?? null
}

export function derivedValue(kind: DerivedKind, values: readonly ParameterValue[]): number | null {
  const hb = lookupValue(values, 'hb')
  const rbc = lookupValue(values, 'rbc')
  const pcv = lookupValue(values, 'pcv')
  const total = lookupValue(values, 'tbil')
  const direct = lookupValue(values, 'dbil')
  const urea = lookupValue(values, 'urea')
  const chol = lookupValue(values, 'chol')
  const hdl = lookupValue(values, 'hdl')
  const tg = lookupValue(values, 'tg')

  switch (kind) {
    case 'mcv':
      if (pcv == null || rbc == null || rbc === 0) return null
      return (pcv / rbc) * 10
    case 'mch':
      if (hb == null || rbc == null || rbc === 0) return null
      return (hb / rbc) * 10
    case 'mchc':
      if (hb == null || pcv == null || pcv === 0) return null
      return (hb / pcv) * 100
    case 'indirect-bilirubin':
      if (total == null || direct == null) return null
      return Math.max(0, total - direct)
    case 'bun':
      if (urea == null) return null
      return urea / 2.14
    case 'vldl':
      if (tg == null || tg >= 400) return null
      return tg / 5
    case 'ldl-friedewald': {
      if (chol == null || hdl == null || tg == null || tg >= 400) return null
      return Math.max(0, chol - hdl - tg / 5)
    }
    default:
      return null
  }
}

export function withDerivedValues(
  parameters: readonly ParameterDef[],
  values: readonly ParameterValue[],
  gender: Gender,
): ParameterValue[] {
  return values.map((entry) => {
    const def = parameters.find((parameter) => parameter.id === entry.id)
    if (!def?.derivedFrom || entry.manualValue) return entry
    const nextRaw = derivedValue(def.derivedFrom, values)
    const next = nextRaw == null ? null : roundTo(nextRaw, def.decimals)
    if (entry.flagSource === 'manual') {
      return next === entry.value ? entry : { ...entry, value: next }
    }
    const flag = next == null ? 'Normal' : flagNumeric(next, referenceFor(def, gender))
    if (next === entry.value && flag === entry.flag) return entry
    return { ...entry, value: next, flag }
  })
}

export function reflagValues(
  parameters: readonly ParameterDef[],
  values: readonly ParameterValue[],
  gender: Gender,
): ParameterValue[] {
  const derived = withDerivedValues(parameters, values, gender)
  return derived.map((entry) => {
    if (entry.flagSource === 'manual') return entry
    const def = parameters.find((parameter) => parameter.id === entry.id)
    if (!def || entry.value == null) {
      return entry.flag === 'Normal' ? entry : { ...entry, flag: 'Normal' }
    }
    const flag = flagNumeric(entry.value, referenceFor(def, gender))
    return flag === entry.flag ? entry : { ...entry, flag }
  })
}

export interface DlcSummary {
  sum: number | null
  entered: number
  expected: number
  complete: boolean
  balanced: boolean
  message: string
}

export function summarizeDlc(items: readonly { value: number | null }[]): DlcSummary {
  const expected = items.length
  const enteredValues = items.flatMap((item) => (item.value == null ? [] : [item.value]))
  if (enteredValues.length === 0) {
    return {
      sum: null,
      entered: 0,
      expected,
      complete: false,
      balanced: false,
      message: 'Enter the differential. The five cell lines must total 100%.',
    }
  }
  const sum = roundTo(
    enteredValues.reduce((total, value) => total + value, 0),
    0,
  )
  const complete = enteredValues.length === expected
  const balanced = complete && sum === 100
  let message = `DLC total ${sum}%.`
  if (!complete) {
    message = `DLC total ${sum}%. ${expected - enteredValues.length} cell line(s) still empty.`
  } else if (!balanced) {
    message = `DLC total ${sum}%. Differential must equal 100%.`
  }
  return { sum, entered: enteredValues.length, expected, complete, balanced, message }
}

export function highestPositiveTitre(cells: readonly WidalCell[], antigen: WidalAntigen): WidalDilution | null {
  let best: WidalDilution | null = null
  let bestTitre = 0
  for (const cell of cells) {
    if (cell.antigen !== antigen || cell.sign !== '+') continue
    const titre = TITRE[cell.dilution]
    if (titre >= bestTitre) {
      bestTitre = titre
      best = cell.dilution
    }
  }
  return best
}

export function widalInterpretation(cells: readonly WidalCell[]): string {
  const o = highestPositiveTitre(cells, 'O')
  const h = highestPositiveTitre(cells, 'H')
  const ah = highestPositiveTitre(cells, 'AH')
  const bh = highestPositiveTitre(cells, 'BH')
  const oTitre = o ? TITRE[o] : 0
  const hTitre = h ? TITRE[h] : 0
  const summary = `TO ${o ?? 'negative'}, TH ${h ?? 'negative'}, AH ${ah ?? 'negative'}, BH ${bh ?? 'negative'}.`
  if (oTitre >= 80 && hTitre >= 160) {
    return `${summary} Titres are suggestive of enteric fever. Correlate with clinical findings and blood culture.`
  }
  if (oTitre >= 80 || hTitre >= 160 || ah || bh) {
    return `${summary} Significant titre present. A single Widal test is not diagnostic.`
  }
  return `${summary} No significant titre. A negative slide test does not exclude early enteric fever.`
}

