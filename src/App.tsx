import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { ParameterEditor } from './components/editor/ParameterEditor.tsx'
import { PatientForm } from './components/editor/PatientForm.tsx'
import { TestSelector } from './components/editor/TestSelector.tsx'
import { AdSlot } from './components/layout/AdSlot.tsx'
import { TopNavbar } from './components/layout/TopNavbar.tsx'
import { LayoutSettings } from './components/preview/LayoutSettings.tsx'
import { ReportPreview } from './components/preview/ReportPreview.tsx'
import { useReportState } from './state/useReportState.ts'
import { exportReportPdf, printReport } from './utils/pdfGenerator.ts'
import { reportBasename } from './utils/reportIO.ts'

type RightTab = 'preview' | 'layout'

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

export default function App() {
  const report = useReportState()
  const [rightTab, setRightTab] = useState<RightTab>('preview')
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(false)
  const platformLabel = window.pathogenius ? 'Desktop' : 'Browser preview'

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        report.saveReport()
      }
      if (key === 'p') {
        event.preventDefault()
        flushSync(() => {
          setRightTab('preview')
          setZoom(1)
        })
        printReport()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [report.saveReport])

  async function handleExport() {
    const previousZoom = zoom
    const previousTab = rightTab
    setBusy(true)
    flushSync(() => {
      setRightTab('preview')
      setZoom(1)
    })
    await nextFrame()
    try {
      await exportReportPdf(reportBasename(report.patient))
      report.setNotice(report.dlcWarning ? `PDF exported. ${report.dlcWarning}` : 'PDF exported.')
    } catch (error) {
      report.setNotice(error instanceof Error ? error.message : 'Could not export the PDF.')
    } finally {
      flushSync(() => {
        setZoom(previousZoom)
        setRightTab(previousTab)
      })
      setBusy(false)
    }
  }

  function handlePrint() {
    const previousZoom = zoom
    flushSync(() => {
      setRightTab('preview')
      setZoom(1)
    })
    printReport()
    setZoom(previousZoom)
  }

  return (
    <div className="app-frame flex h-screen flex-col overflow-hidden bg-[#e7eef1] text-slate-900">
      <TopNavbar
        onExportPdf={() => {
          void handleExport()
        }}
        onPrint={handlePrint}
        onSave={report.saveReport}
        onLoadText={report.loadReportText}
        busy={busy}
        platformLabel={platformLabel}
      />
      {report.notice ? (
        <div className="no-print border-b border-teal-200 bg-teal-50 px-4 py-1.5 text-xs text-teal-900" role="status">
          {report.notice}
        </div>
      ) : null}
      {report.dlcWarning ? (
        <div className="no-print border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-800" role="status">
          {report.dlcWarning}
        </div>
      ) : null}
      <div className="workspace flex min-h-0 flex-1">
        {report.printSettings.showAds ? <AdSlot side="left" /> : null}
        <aside className="no-print flex w-[320px] min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
          <PatientForm patient={report.patient} onChange={report.updatePatient} />
          <TestSelector
            tests={report.tests}
            activeInstanceId={report.activeInstanceId}
            onAdd={report.addTest}
            onRemove={report.removeTest}
            onSelect={report.selectTest}
          />
        </aside>
        <main className="no-print w-[420px] min-h-0 shrink-0 overflow-hidden border-r border-slate-200 bg-slate-50">
          <ParameterEditor
            test={report.activeTest}
            gender={report.patient.gender}
            unitSystem={report.printSettings.unitSystem}
            onValue={(parameterId, value) => {
              if (!report.activeTest) return
              report.updateParameter(report.activeTest.instanceId, parameterId, value)
            }}
            onResetDerived={(parameterId) => {
              if (!report.activeTest) return
              report.resetDerived(report.activeTest.instanceId, parameterId)
            }}
            onFlag={(parameterId, selection) => {
              if (!report.activeTest) return
              report.setParameterFlag(report.activeTest.instanceId, parameterId, selection)
            }}
            onWidal={(antigen, dilution) => {
              if (!report.activeTest) return
              report.toggleWidal(report.activeTest.instanceId, antigen, dilution)
            }}
          />
        </main>
        <section className="print-stage flex min-h-0 min-w-0 flex-1 flex-col bg-[#d5dee3]">
          <div className="no-print flex items-center gap-2 border-b border-slate-300 bg-white px-3 py-2">
            <button
              type="button"
              className={`h-8 rounded-md px-3 text-xs font-semibold ${rightTab === 'preview' ? 'bg-teal-800 text-white' : 'text-slate-700'}`}
              onClick={() => setRightTab('preview')}
            >
              Report preview
            </button>
            <button
              type="button"
              className={`h-8 rounded-md px-3 text-xs font-semibold ${rightTab === 'layout' ? 'bg-teal-800 text-white' : 'text-slate-700'}`}
              onClick={() => setRightTab('layout')}
            >
              Page layout
            </button>
          </div>
          <div className={rightTab === 'preview' ? 'min-h-0 flex-1' : 'hidden print:block'}>
            <ReportPreview
              patient={report.patient}
              tests={report.tests}
              settings={report.printSettings}
              zoom={zoom}
              onZoom={setZoom}
            />
          </div>
          {rightTab === 'layout' ? (
            <div className="no-print min-h-0 flex-1">
              <LayoutSettings settings={report.printSettings} onChange={report.updatePrintSettings} />
            </div>
          ) : null}
        </section>
        {report.printSettings.showAds ? <AdSlot side="right" /> : null}
      </div>
    </div>
  )
}
