import { blankValues, getTemplate } from '../data/templates.ts'
import type {
  ActiveTest,
  AgeUnit,
  FlagSource,
  Gender,
  Patient,
  PrintSettings,
  ResultFlag,
  SavedReport,
  UnitSystem,
  WidalCell,
  WidalSign,
} from '../types/report.types.ts'
import { REPORT_VERSION, WIDAL_ANTIGENS, WIDAL_DILUTIONS } from '../types/report.types.ts'
import { reflagValues } from './calculations.ts'

const GENDERS = ['Male', 'Female', 'Other'] as const
const AGE_UNITS = ['Years', 'Months', 'Days'] as const
const FLAGS = ['Low', 'Normal', 'High'] as const
const FLAG_SOURCES = ['auto', 'manual'] as const
const UNIT_SYSTEMS = ['conventional', 'si'] as const
const SIGNS = ['+', '-'] as const

export function createPatient(): Patient {
  return {
    name: '',
    age: '',
    ageUnit: 'Years',
    gender: 'Male',
    labNo: '',
    date: todayIso(),
    referredBy: 'SELF',
  }
}

export function createPrintSettings(): PrintSettings {
  return {
    letterheadMode: false,
    topMarginMm: 40,
    bottomMarginMm: 32,
    showHeader: true,
    showFooter: true,
    showAds: false,
    labName: 'PathoGenius Diagnostic Laboratory',
    labTagline: 'Clinical Pathology & Biochemistry',
    labAddress: '123 Medical College Road, New Delhi 110001',
    labContact: 'Ph: 011-4000-0000   ·   reports@pathogenius.lab',
    unitSystem: 'conventional',
  }
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | null {
  if (typeof value !== 'string') return null
  return options.includes(value as T) ? (value as T) : null
}

function clip(value: unknown, fallback: string, max: number): string {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, max)
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function parsePatient(value: unknown, fallback: Patient): Patient | null {
  if (!isRecord(value)) return null
  const gender = oneOf<Gender>(value.gender, GENDERS)
  const ageUnit = oneOf<AgeUnit>(value.ageUnit, AGE_UNITS)
  if (!gender || !ageUnit) return null
  const date = clip(value.date, fallback.date, 10)
  return {
    name: clip(value.name, '', 120),
    age: clip(value.age, '', 12),
    ageUnit,
    gender,
    labNo: clip(value.labNo, '', 40),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fallback.date,
    referredBy: clip(value.referredBy, 'SELF', 120),
  }
}

function parseWidal(value: unknown): WidalCell[] {
  const saved = Array.isArray(value) ? value : []
  return WIDAL_ANTIGENS.flatMap((antigen) =>
    WIDAL_DILUTIONS.map((dilution) => {
      const match = saved.find(
        (cell) => isRecord(cell) && cell.antigen === antigen.id && cell.dilution === dilution,
      )
      const sign = match && isRecord(match) ? oneOf<WidalSign>(match.sign, SIGNS) : null
      return { antigen: antigen.id, dilution, sign: sign ?? '-' }
    }),
  )
}

function parseTest(value: unknown, gender: Gender): ActiveTest | null {
  if (!isRecord(value) || typeof value.templateId !== 'string' || typeof value.instanceId !== 'string') return null
  const template = getTemplate(value.templateId)
  if (!template) return null
  const savedValues = Array.isArray(value.values) ? value.values : []
  const seeded = blankValues(template.parameters).map((entry) => {
    const saved = savedValues.find((item) => isRecord(item) && item.id === entry.id)
    if (!isRecord(saved)) return entry
    const numeric = typeof saved.value === 'number' && Number.isFinite(saved.value) ? saved.value : null
    const flag = oneOf<ResultFlag>(saved.flag, FLAGS) ?? 'Normal'
    const flagSource = oneOf<FlagSource>(saved.flagSource, FLAG_SOURCES) ?? 'auto'
    return {
      id: entry.id,
      value: numeric,
      flag,
      flagSource,
      manualValue: saved.manualValue === true,
    }
  })
  const widal = template.kind === 'widal' ? parseWidal(value.widal) : []
  return {
    instanceId: clip(value.instanceId, '', 80) || crypto.randomUUID(),
    templateId: template.id,
    values: reflagValues(template.parameters, seeded, gender),
    widal,
  }
}

function parseSettings(value: unknown, fallback: PrintSettings): PrintSettings {
  if (!isRecord(value)) return fallback
  const unitSystem = oneOf<UnitSystem>(value.unitSystem, UNIT_SYSTEMS) ?? fallback.unitSystem
  return {
    letterheadMode: value.letterheadMode === true,
    topMarginMm: readNumber(value.topMarginMm, fallback.topMarginMm, 0, 80),
    bottomMarginMm: readNumber(value.bottomMarginMm, fallback.bottomMarginMm, 0, 70),
    showHeader: value.showHeader !== false,
    showFooter: value.showFooter !== false,
    showAds: value.showAds === true,
    labName: clip(value.labName, fallback.labName, 160),
    labTagline: clip(value.labTagline, fallback.labTagline, 160),
    labAddress: clip(value.labAddress, fallback.labAddress, 240),
    labContact: clip(value.labContact, fallback.labContact, 240),
    unitSystem,
  }
}

export function parseSavedReport(raw: unknown): { ok: true; report: SavedReport } | { ok: false; error: string } {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      return { ok: false, error: 'This file is not valid JSON.' }
    }
  }
  if (!isRecord(parsed) || parsed.version !== REPORT_VERSION) {
    return { ok: false, error: 'This file is not a PathoGenius report.' }
  }
  const patient = parsePatient(parsed.patient, createPatient())
  if (!patient || !Array.isArray(parsed.tests)) {
    return { ok: false, error: 'The report is missing patient details.' }
  }
  const tests: ActiveTest[] = []
  const seen = new Set<string>()
  for (const item of parsed.tests) {
    const test = parseTest(item, patient.gender)
    if (!test || seen.has(test.templateId)) continue
    seen.add(test.templateId)
    tests.push(test)
  }
  return {
    ok: true,
    report: {
      version: REPORT_VERSION,
      patient,
      tests,
      printSettings: parseSettings(parsed.printSettings, createPrintSettings()),
      savedAt: new Date().toISOString(),
    },
  }
}

export function toSavedReport(patient: Patient, tests: readonly ActiveTest[], printSettings: PrintSettings): SavedReport {
  return {
    version: REPORT_VERSION,
    patient,
    tests: tests.map((test) => ({ ...test, values: test.values.map((value) => ({ ...value })), widal: test.widal.map((cell) => ({ ...cell })) })),
    printSettings: { ...printSettings },
    savedAt: new Date().toISOString(),
  }
}

export function reportBasename(patient: Patient): string {
  const raw = patient.labNo || patient.name || 'report'
  const safe = raw.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '')
  return `PathoGenius_${safe || 'report'}`
}

export function downloadJson(report: SavedReport, basename: string): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${basename}.json`
  link.click()
  URL.revokeObjectURL(url)
}

