import type { WidalAntigen, WidalCell, WidalDilution } from '../../types/report.types.ts'
import { WIDAL_ANTIGENS, WIDAL_DILUTIONS } from '../../types/report.types.ts'

interface WidalTableProps {
  cells: readonly WidalCell[]
  mode: 'edit' | 'print'
  onToggle?: (antigen: WidalAntigen, dilution: WidalDilution) => void
}

function signOf(cells: readonly WidalCell[], antigen: WidalAntigen, dilution: WidalDilution): '+' | '-' {
  return cells.find((cell) => cell.antigen === antigen && cell.dilution === dilution)?.sign ?? '-'
}

export function WidalTable({ cells, mode, onToggle }: WidalTableProps) {
  const print = mode === 'print'
  return (
    <table className={`w-full border-collapse ${print ? 'text-[12px]' : 'text-xs'}`}>
      <thead>
        <tr>
          <th className={`border border-neutral-900 px-2 text-left font-semibold ${print ? 'h-8' : 'h-9 bg-slate-50'}`}>Antigen</th>
          {WIDAL_DILUTIONS.map((dilution) => (
            <th key={dilution} className={`border border-neutral-900 text-center font-semibold ${print ? 'h-8' : 'h-9 bg-slate-50'}`}>
              {dilution}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {WIDAL_ANTIGENS.map((antigen) => (
          <tr key={antigen.id}>
            <td className={`border border-neutral-300 px-2 ${print ? 'h-8' : 'h-11'}`}>{print ? antigen.short : antigen.label}</td>
            {WIDAL_DILUTIONS.map((dilution) => {
              const sign = signOf(cells, antigen.id, dilution)
              if (print) {
                return (
                  <td key={dilution} className={`border border-neutral-300 text-center ${sign === '+' ? 'font-bold' : ''}`}>
                    {sign}
                  </td>
                )
              }
              const positive = sign === '+'
              return (
                <td key={dilution} className="border border-slate-200 text-center">
                  <button
                    type="button"
                    aria-label={`${antigen.short} ${dilution} ${positive ? 'positive' : 'negative'}`}
                    aria-pressed={positive}
                    onClick={() => onToggle?.(antigen.id, dilution)}
                    className={`mx-auto h-8 w-10 rounded font-semibold ${positive ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {sign}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
