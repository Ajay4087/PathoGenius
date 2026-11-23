import type { ResultFlag } from '../../types/report.types.ts'

interface BadgeProps {
  flag: ResultFlag
  empty?: boolean
}

const STYLES: Record<ResultFlag, string> = {
  Normal: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  Low: 'bg-blue-50 text-blue-800 ring-blue-200',
  High: 'bg-red-50 text-red-800 ring-red-200',
}

export function Badge({ flag, empty = false }: BadgeProps) {
  if (empty) return null
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${STYLES[flag]}`}>{flag}</span>
}
