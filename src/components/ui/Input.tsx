import type { InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function Input({ label, value, onChange, hint, id, className = '', ...props }: InputProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined)
  return (
    <label className="block" htmlFor={fieldId}>
      {label ? <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span> : null}
      <input
        id={fieldId}
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 ${className}`}
        {...props}
      />
      {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  )
}
