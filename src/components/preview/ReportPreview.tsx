import type { ReactNode } from 'react'
import type { ActiveTest, Patient, PrintSettings } from '../../types/report.types.ts'
import { formatReportDate } from '../../utils/calculations.ts'
import { A4_HEIGHT_PX, A4_WIDTH_PX, buildReportPages, CHROME, pageChrome, type Block } from '../../utils/pagination.ts'
import { StandardTable, type TableItem } from './StandardTable.tsx'
import { WidalTable } from './WidalTable.tsx'

interface ReportPreviewProps {
  patient: Patient
  tests: readonly ActiveTest[]
  settings: PrintSettings
  zoom: number
  onZoom: (zoom: number) => void
}

function ageSex(patient: Patient): string {
  const age = patient.age.trim()
  const unit = patient.ageUnit === 'Years' ? 'Y' : patient.ageUnit === 'Months' ? 'M' : 'D'
  const sex = patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'Other'
  return `${age ? `${age} ${unit}` : '—'} / ${sex}`
}

function renderBlocks(blocks: readonly Block[]): ReactNode[] {
  const nodes: ReactNode[] = []
  let tableItems: TableItem[] = []
  let tableKey = 'table'

  const flushTable = () => {
    if (tableItems.length === 0) return
    nodes.push(<StandardTable key={tableKey} items={tableItems} />)
    tableItems = []
  }

  for (const block of blocks) {
    if (block.type === 'table-head') {
      if (tableItems.length > 0) flushTable()
      tableKey = block.key
      tableItems.push({ type: 'head', key: block.key })
      continue
    }
    if (block.type === 'group') {
      tableItems.push({ type: 'group', key: block.key, name: block.name })
      continue
    }
    if (block.type === 'row') {
      tableItems.push({ type: 'row', key: block.key, row: block.row })
      continue
    }
    flushTable()
    if (block.type === 'section-header') {
      nodes.push(
        <div key={block.key} className="flex items-end justify-between" style={{ height: block.height }}>
          <h2 className="text-[15px] font-bold tracking-wide">
            {block.title}
            {block.continued ? ' (contd.)' : ''}
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">{block.category}</span>
        </div>,
      )
    } else if (block.type === 'widal') {
      nodes.push(
        <div key={block.key} className="overflow-hidden" style={{ height: block.height }}>
          <WidalTable cells={block.cells} mode="print" />
        </div>,
      )
    } else if (block.type === 'dlc') {
      nodes.push(
        <p key={block.key} className="text-[11px] font-bold leading-none text-red-700" style={{ height: block.height }}>
          {block.summary.message}
        </p>,
      )
    } else if (block.type === 'note') {
      nodes.push(
        <p key={block.key} className="overflow-hidden text-[11px] leading-[14px] text-neutral-800" style={{ height: block.height }}>
          {block.text}
        </p>,
      )
    }
  }
  flushTable()
  return nodes
}

export function ReportPreview({ patient, tests, settings, zoom, onZoom }: ReportPreviewProps) {
  const pages = buildReportPages(tests, patient.gender, settings)
  const stackHeight = pages.length * A4_HEIGHT_PX + Math.max(0, pages.length - 1) * 24

  return (
    <div className="preview-scroll h-full overflow-auto px-6 py-4">
      <div className="no-print mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-600">A4 preview · 794 × 1123 px</p>
        <div className="flex items-center gap-1">
          {[0.8, 1, 1.15].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onZoom(level)}
              className={`h-7 rounded px-2 text-xs font-medium ${zoom === level ? 'bg-teal-800 text-white' : 'bg-white text-slate-700'}`}
            >
              {Math.round(level * 100)}%
            </button>
          ))}
        </div>
      </div>
      <div className="preview-zoom mx-auto" style={{ width: A4_WIDTH_PX * zoom, height: stackHeight * zoom }}>
        <div className="preview-zoom-inner" style={{ width: A4_WIDTH_PX, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          {pages.map((page, pageIndex) => {
            const chrome = pageChrome(settings, pageIndex)
            return (
              <div key={page.index} className="page-frame mx-auto mb-6 shadow-xl last:mb-0">
                <article className="a4-page" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  {settings.letterheadMode ? (
                    <>
                      <div className="letterhead-guide pointer-events-none absolute inset-x-0 top-0 overflow-hidden border-b border-dashed border-amber-600/80 bg-amber-100/60" style={{ height: chrome.topPad }}>
                        <span className="absolute bottom-1 left-3 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                          Reserved header {settings.topMarginMm} mm
                        </span>
                      </div>
                      <div className="letterhead-guide pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden border-t border-dashed border-amber-600/80 bg-amber-100/60" style={{ height: chrome.bottomPad }}>
                        <span className="absolute left-3 top-1 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                          Reserved footer {settings.bottomMarginMm} mm
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div
                    className="box-border flex h-full flex-col"
                    style={{
                      paddingTop: chrome.topPad,
                      paddingBottom: chrome.bottomPad,
                      paddingLeft: 36,
                      paddingRight: 36,
                    }}
                  >
                    {chrome.showHeader ? (
                      <header className="overflow-hidden text-center" style={{ height: CHROME.header }}>
                        <div className="text-[22px] font-bold leading-tight">{settings.labName}</div>
                        <div className="text-[12px]">{settings.labTagline}</div>
                        <div className="text-[11px]">{settings.labAddress}</div>
                        <div className="text-[11px]">{settings.labContact}</div>
                        <div className="mt-1 border-b-2 border-neutral-900" />
                        <div className="mt-px border-b border-neutral-900" />
                      </header>
                    ) : null}
                    {chrome.showPatient ? (
                      <section className="overflow-hidden py-1" style={{ height: CHROME.patient }}>
                        <div className="grid h-full grid-cols-2 border border-neutral-900 text-[12.5px]">
                          <div className="border-b border-r border-neutral-900 px-2 py-1">
                            <span className="font-semibold">Patient Name: </span>
                            {patient.name || '—'}
                          </div>
                          <div className="border-b border-neutral-900 px-2 py-1">
                            <span className="font-semibold">Age / Sex: </span>
                            {ageSex(patient)}
                          </div>
                          <div className="border-b border-r border-neutral-900 px-2 py-1">
                            <span className="font-semibold">Lab No.: </span>
                            {patient.labNo || '—'}
                          </div>
                          <div className="border-b border-neutral-900 px-2 py-1">
                            <span className="font-semibold">Date: </span>
                            {formatReportDate(patient.date)}
                          </div>
                          <div className="col-span-2 px-2 py-1">
                            <span className="font-semibold">Referred By: </span>
                            {patient.referredBy || '—'}
                          </div>
                        </div>
                      </section>
                    ) : null}
                    {chrome.showContinuation ? (
                      <div className="flex items-center border-b border-neutral-900 text-[11px]" style={{ height: CHROME.continuation }}>
                        <span className="font-semibold">Patient: </span>
                        <span className="ml-1">{patient.name || '—'}</span>
                        <span className="ml-4 font-semibold">Lab No.: </span>
                        <span className="ml-1">{patient.labNo || '—'}</span>
                        <span className="ml-4">{formatReportDate(patient.date)}</span>
                      </div>
                    ) : null}
                    <div className="overflow-hidden" style={{ height: chrome.contentHeight }}>
                      {page.blocks.length === 0 ? (
                        <p className="pt-6 text-center text-[13px]">No investigations added.</p>
                      ) : (
                        renderBlocks(page.blocks)
                      )}
                    </div>
                    <div className="text-right text-[10px]" style={{ height: CHROME.pageNumber }}>
                      Page {pageIndex + 1} of {pages.length}
                    </div>
                    {chrome.showFooter ? (
                      <footer className="overflow-hidden text-[10px]" style={{ height: CHROME.footer }}>
                        <div className="text-center font-semibold">— End of Report —</div>
                        <div className="mt-3 flex justify-between">
                          <span>Technician</span>
                          <span>Pathologist</span>
                        </div>
                        <p className="mt-1 text-[9px] leading-tight text-neutral-700">
                          Results are for clinical correlation by the referring physician. This report is not valid for medico-legal use.
                        </p>
                      </footer>
                    ) : null}
                  </div>
                </article>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
