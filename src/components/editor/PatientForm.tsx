import type { AgeUnit, Gender, Patient } from '../../types/report.types.ts'
import { Input } from '../ui/Input.tsx'
import { Select } from '../ui/Select.tsx'

interface PatientFormProps {
  patient: Patient
  onChange: (patch: Partial<Patient>) => void
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const AGE_UNITS: { value: AgeUnit; label: string }[] = [
  { value: 'Years', label: 'Years' },
  { value: 'Months', label: 'Months' },
  { value: 'Days', label: 'Days' },
]

function isGender(value: string): value is Gender {
  return value === 'Male' || value === 'Female' || value === 'Other'
}

function isAgeUnit(value: string): value is AgeUnit {
  return value === 'Years' || value === 'Months' || value === 'Days'
}

export function PatientForm({ patient, onChange }: PatientFormProps) {
  return (
    <section className="border-b border-slate-200 p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <Input label="Patient name" value={patient.name} onChange={(name) => onChange({ name })} />
        </div>
        <Input label="Age" value={patient.age} onChange={(age) => onChange({ age })} inputMode="decimal" />
        <Select
          label="Age unit"
          value={patient.ageUnit}
          options={AGE_UNITS}
          onChange={(value) => {
            if (isAgeUnit(value)) onChange({ ageUnit: value })
          }}
        />
        <Select
          label="Sex"
          value={patient.gender}
          options={GENDERS}
          onChange={(value) => {
            if (isGender(value)) onChange({ gender: value })
          }}
        />
        <Input label="Lab no." value={patient.labNo} onChange={(labNo) => onChange({ labNo })} />
        <Input label="Date" type="date" value={patient.date} onChange={(date) => onChange({ date })} />
        <div className="col-span-2">
          <Input
            label="Referred by"
            value={patient.referredBy}
            onChange={(referredBy) => onChange({ referredBy })}
            placeholder="Dr. name or SELF"
          />
        </div>
      </div>
    </section>
  )
}
