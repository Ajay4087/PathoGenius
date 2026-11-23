import { Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getTemplate, TEST_CATEGORIES, TEST_TEMPLATES } from '../../data/templates.ts'
import type { ActiveTest } from '../../types/report.types.ts'
import { Button } from '../ui/Button.tsx'

interface TestSelectorProps {
  tests: readonly ActiveTest[]
  activeInstanceId: string | null
  onAdd: (templateId: string) => void
  onRemove: (instanceId: string) => void
  onSelect: (instanceId: string) => void
}

export function TestSelector({ tests, activeInstanceId, onAdd, onRemove, onSelect }: TestSelectorProps) {
  const [query, setQuery] = useState('')
  const added = useMemo(() => new Set(tests.map((test) => test.templateId)), [tests])
  const needle = query.trim().toLowerCase()

  const visible = TEST_TEMPLATES.filter((template) => {
    if (!needle) return true
    const haystack = [template.name, template.shortName, template.category, ...template.keywords, ...template.parameters.map((parameter) => parameter.name)]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-200 p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Add test</h2>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search CBC, LFT, Widal…"
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-8 pr-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {TEST_CATEGORIES.map((category) => {
          const items = visible.filter((template) => template.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="mb-3">
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800">{category}</h3>
              <ul className="space-y-1">
                {items.map((template) => {
                  const onReport = added.has(template.id)
                  return (
                    <li key={template.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800">{template.shortName}</div>
                        <div className="truncate text-[11px] text-slate-500">{template.name}</div>
                      </div>
                      <Button
                        variant={onReport ? 'ghost' : 'primary'}
                        icon={<Plus size={13} />}
                        disabled={onReport}
                        onClick={() => onAdd(template.id)}
                      >
                        {onReport ? 'Added' : 'Add'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
        {visible.length === 0 ? <p className="text-sm text-slate-500">No template matches that search.</p> : null}
      </div>
      <div className="border-t border-slate-200 p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">On this report</h2>
        {tests.length === 0 ? <p className="text-sm text-slate-500">No investigations yet.</p> : null}
        <ul className="space-y-1">
          {tests.map((test) => {
            const template = getTemplate(test.templateId)
            const selected = test.instanceId === activeInstanceId
            return (
              <li key={test.instanceId}>
                <div className={`flex items-center gap-1 rounded-md border px-1 py-1 ${selected ? 'border-teal-700 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                  <button type="button" className="min-w-0 flex-1 truncate px-1.5 text-left text-sm" onClick={() => onSelect(test.instanceId)}>
                    <span className="font-semibold">{template?.shortName ?? test.templateId}</span>
                    <span className="ml-1 text-slate-500">{template?.name}</span>
                  </button>
                  <Button variant="danger" aria-label={`Remove ${template?.shortName ?? 'test'}`} onClick={() => onRemove(test.instanceId)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
