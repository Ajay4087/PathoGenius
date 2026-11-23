import type { StandardRowView } from '../../utils/pagination.ts'
import { BLOCK } from '../../utils/pagination.ts'

export type TableItem =
  | { type: 'head'; key: string }
  | { type: 'group'; key: string; name: string }
  | { type: 'row'; key: string; row: StandardRowView }

const COLUMNS = 'grid-cols-[minmax(0,1.7fr)_92px_88px_minmax(0,1.1fr)]'

function marker(row: StandardRowView): string {
  if (!row.hasValue || row.flag === 'Normal') return ''
  return row.flag === 'High' ? ' H' : ' L'
}

export function StandardTable({ items }: { items: readonly TableItem[] }) {
  return (
    <div role="table" className="w-full text-[12.5px]">
      {items.map((item) => {
        if (item.type === 'head') {
          return (
            <div
              key={item.key}
              role="row"
              className={`grid ${COLUMNS} items-center border-y border-neutral-900 font-semibold`}
              style={{ height: BLOCK.head }}
            >
              <div className="px-1">Investigation</div>
              <div className="text-center">Result</div>
              <div className="text-center">Unit</div>
              <div className="text-center">Reference Range</div>
            </div>
          )
        }
        if (item.type === 'group') {
          return (
            <div
              key={item.key}
              role="row"
              className="flex items-center bg-neutral-100 px-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ height: BLOCK.group }}
            >
              {item.name}
            </div>
          )
        }
        const abnormal = item.row.hasValue && item.row.flag !== 'Normal'
        return (
          <div
            key={item.key}
            role="row"
            className={`grid ${COLUMNS} items-center border-b border-neutral-300 ${abnormal ? 'bg-red-50 font-bold text-red-700' : ''}`}
            style={{ height: BLOCK.row }}
          >
            <div className="truncate px-1">{item.row.name}</div>
            <div className="text-center">
              {item.row.result}
              {marker(item.row)}
            </div>
            <div className="text-center">{item.row.unit}</div>
            <div className="text-center">{item.row.rangeLabel}</div>
          </div>
        )
      })}
    </div>
  )
}
