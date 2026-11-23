import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
}

export function Select({ label, value, options, onChange, id, className = '', ...props }: SelectProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined)
  return (
    <label className="block" htmlFor={fieldId}>
      {label ? <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span> : null}
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
