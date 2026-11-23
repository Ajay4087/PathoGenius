export type Gender = 'Male' | 'Female' | 'Other'

export type ResultFlag = 'Low' | 'Normal' | 'High'

export type FlagSource = 'auto' | 'manual'

export type TestKind = 'standard' | 'widal'

export type TestCategory = 'Haematology' | 'Biochemistry' | 'Serology'

export type AgeUnit = 'Years' | 'Months' | 'Days'

export type UnitSystem = 'conventional' | 'si'

export type WidalDilution = '1:20' | '1:40' | '1:80' | '1:160' | '1:320'

export type WidalAntigen = 'O' | 'H' | 'AH' | 'BH'

export type WidalSign = '+' | '-'

export type DerivedKind =
  | 'mcv'
  | 'mch'
  | 'mchc'
  | 'indirect-bilirubin'
  | 'bun'
  | 'vldl'
  | 'ldl-friedewald'

export const WIDAL_DILUTIONS: readonly WidalDilution[] = ['1:20', '1:40', '1:80', '1:160', '1:320']

export const WIDAL_ANTIGENS: readonly { id: WidalAntigen; label: string; short: string }[] = [
  { id: 'O', label: 'Salmonella typhi O', short: 'S. typhi O' },
  { id: 'H', label: 'Salmonella typhi H', short: 'S. typhi H' },
  { id: 'AH', label: 'Salmonella paratyphi AH', short: 'S. paratyphi AH' },
  { id: 'BH', label: 'Salmonella paratyphi BH', short: 'S. paratyphi BH' },
]

/** CSS px per millimetre at 96 DPI. 96 / 25.4 = 3.779527…, pinned to the lab spec. */
export const MM_TO_PX = 3.7795

export const REPORT_VERSION = 1

export interface ReferenceRange {
  gender: Gender | 'All'
  min?: number
  max?: number
  label?: string
}

export interface UnitConversion {
  siUnit: string
  /** Multiply a conventional result by this factor to get the SI result. */
  toSi: number
  siDecimals: number
}

export interface ParameterDef {
  id: string
  name: string
  unit: string
  ranges: ReferenceRange[]
  sliderMin: number
  sliderMax: number
  step: number
  decimals: number
  group?: string
  isDlc?: boolean
  derivedFrom?: DerivedKind
  conversion?: UnitConversion
}

export interface ParameterValue {
  id: string
  value: number | null
  flag: ResultFlag
  flagSource: FlagSource
  /** When true, a derived analyte keeps the typed value instead of the formula. */
  manualValue: boolean
}

export interface TestTemplate {
  id: string
  name: string
  shortName: string
  category: TestCategory
  kind: TestKind
  keywords: string[]
  parameters: ParameterDef[]
  interpretation?: string
}

export interface WidalCell {
  antigen: WidalAntigen
  dilution: WidalDilution
  sign: WidalSign
}

export interface ActiveTest {
  instanceId: string
  templateId: string
  values: ParameterValue[]
  widal: WidalCell[]
}

export interface Patient {
  name: string
  age: string
  ageUnit: AgeUnit
  gender: Gender
  labNo: string
  date: string
  referredBy: string
}

export interface PrintSettings {
  letterheadMode: boolean
  topMarginMm: number
  bottomMarginMm: number
  showHeader: boolean
  showFooter: boolean
  showAds: boolean
  labName: string
  labTagline: string
  labAddress: string
  labContact: string
  unitSystem: UnitSystem
}

export interface SavedReport {
  version: typeof REPORT_VERSION
  patient: Patient
  tests: ActiveTest[]
  printSettings: PrintSettings
  savedAt: string
}
