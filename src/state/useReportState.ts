import { useCallback, useEffect, useMemo, useState } from 'react'
import { createActiveTest, getTemplate } from '../data/templates.ts'
import type { ActiveTest, Gender, Patient, PrintSettings, ResultFlag, WidalAntigen, WidalDilution } from '../types/report.types.ts'
import { flagNumeric, referenceFor, reflagValues, roundTo, withDerivedValues } from '../utils/calculations.ts'
import { findDlcWarning } from '../utils/pagination.ts'
import { createPatient, createPrintSettings, downloadJson, parseSavedReport, reportBasename, toSavedReport } from '../utils/reportIO.ts'

function isGender(value: string): value is Gender {
  return value === 'Male' || value === 'Female' || value === 'Other'
}

export function useReportState() {
  const [patient, setPatient] = useState<Patient>(() => createPatient())
  const [tests, setTests] = useState<ActiveTest[]>([])
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => createPrintSettings())
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setTests((current) =>
      current.map((test) => {
        const template = getTemplate(test.templateId)
        if (!template) return test
        return { ...test, values: reflagValues(template.parameters, test.values, patient.gender) }
      }),
    )
  }, [patient.gender])

  const activeTest = useMemo(
    () => tests.find((test) => test.instanceId === activeInstanceId) ?? null,
    [tests, activeInstanceId],
  )

  const dlcWarning = useMemo(() => findDlcWarning(tests), [tests])

  const updatePatient = useCallback((patch: Partial<Patient>) => {
    setPatient((current) => {
      const next = { ...current, ...patch }
      if (patch.gender != null && !isGender(patch.gender)) return current
      return next
    })
  }, [])

  const addTest = useCallback((templateId: string) => {
    const template = getTemplate(templateId)
    if (!template) return
    const existing = tests.find((test) => test.templateId === templateId)
    if (existing) {
      setNotice(`${template.shortName} is already on this report.`)
      setActiveInstanceId(existing.instanceId)
      return
    }
    const created = createActiveTest(templateId)
    if (!created) return
    setTests((current) => (current.some((test) => test.templateId === templateId) ? current : [...current, created]))
    setActiveInstanceId(created.instanceId)
    setNotice(null)
  }, [tests])

  const removeTest = useCallback((instanceId: string) => {
    const remaining = tests.filter((test) => test.instanceId !== instanceId)
    setTests(remaining)
    setActiveInstanceId((selected) => (selected === instanceId ? remaining[0]?.instanceId ?? null : selected))
  }, [tests])

  const selectTest = useCallback((instanceId: string) => {
    setActiveInstanceId(instanceId)
  }, [])

  const updateParameter = useCallback((instanceId: string, parameterId: string, raw: number | null) => {
    setTests((current) =>
      current.map((test) => {
        if (test.instanceId !== instanceId) return test
        const template = getTemplate(test.templateId)
        if (!template) return test
        const edited = test.values.map((entry) => {
          if (entry.id !== parameterId) return entry
          const def = template.parameters.find((parameter) => parameter.id === parameterId)
          const value = raw == null || !def ? raw : roundTo(raw, def.decimals)
          const flag =
            entry.flagSource === 'auto'
              ? value == null || !def
                ? 'Normal'
                : flagNumeric(value, referenceFor(def, patient.gender))
              : entry.flag
          return {
            ...entry,
            value,
            flag,
            manualValue: def?.derivedFrom ? true : entry.manualValue,
          }
        })
        return { ...test, values: withDerivedValues(template.parameters, edited, patient.gender) }
      }),
    )
  }, [patient.gender])

  const resetDerived = useCallback((instanceId: string, parameterId: string) => {
    setTests((current) =>
      current.map((test) => {
        if (test.instanceId !== instanceId) return test
        const template = getTemplate(test.templateId)
        if (!template) return test
        const cleared = test.values.map((entry) =>
          entry.id === parameterId ? { ...entry, manualValue: false } : entry,
        )
        return { ...test, values: reflagValues(template.parameters, cleared, patient.gender) }
      }),
    )
  }, [patient.gender])

  const setParameterFlag = useCallback((instanceId: string, parameterId: string, selection: 'auto' | ResultFlag) => {
    setTests((current) =>
      current.map((test) => {
        if (test.instanceId !== instanceId) return test
        const template = getTemplate(test.templateId)
        if (!template) return test
        const next = test.values.map((entry) => {
          if (entry.id !== parameterId) return entry
          const def = template.parameters.find((parameter) => parameter.id === parameterId)
          if (selection === 'auto') {
            const flag =
              entry.value == null || !def ? 'Normal' : flagNumeric(entry.value, referenceFor(def, patient.gender))
            return { ...entry, flagSource: 'auto' as const, flag }
          }
          return { ...entry, flagSource: 'manual' as const, flag: selection }
        })
        return { ...test, values: next }
      }),
    )
  }, [patient.gender])

  const toggleWidal = useCallback((instanceId: string, antigen: WidalAntigen, dilution: WidalDilution) => {
    setTests((current) =>
      current.map((test) => {
        if (test.instanceId !== instanceId) return test
        return {
          ...test,
          widal: test.widal.map((cell) => {
            if (cell.antigen !== antigen || cell.dilution !== dilution) return cell
            return { ...cell, sign: cell.sign === '+' ? '-' : '+' }
          }),
        }
      }),
    )
  }, [])

  const updatePrintSettings = useCallback((patch: Partial<PrintSettings>) => {
    setPrintSettings((current) => {
      const next = { ...current, ...patch }
      next.topMarginMm = Math.min(80, Math.max(0, next.topMarginMm))
      next.bottomMarginMm = Math.min(70, Math.max(0, next.bottomMarginMm))
      return next
    })
  }, [])

  const saveReport = useCallback(() => {
    const report = toSavedReport(patient, tests, printSettings)
    downloadJson(report, reportBasename(patient))
    setNotice('Report saved as JSON on this computer.')
  }, [patient, tests, printSettings])

  const loadReportText = useCallback((raw: string) => {
    const parsed = parseSavedReport(raw)
    if (!parsed.ok) {
      setNotice(parsed.error)
      return
    }
    setPatient(parsed.report.patient)
    setTests(parsed.report.tests)
    setPrintSettings(parsed.report.printSettings)
    setActiveInstanceId(parsed.report.tests[0]?.instanceId ?? null)
    setNotice('Report loaded.')
  }, [])

  return {
    patient,
    tests,
    activeTest,
    activeInstanceId,
    printSettings,
    notice,
    setNotice,
    dlcWarning,
    updatePatient,
    addTest,
    removeTest,
    selectTest,
    updateParameter,
    resetDerived,
    setParameterFlag,
    toggleWidal,
    updatePrintSettings,
    saveReport,
    loadReportText,
  }
}
