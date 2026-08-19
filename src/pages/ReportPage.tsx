import { useEffect, useMemo, useState } from 'react'
import { Loader2, Download, CheckSquare, Square, PenLine } from 'lucide-react'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { DraftsmanWorkloadSummary, computeDraftsmanWorkload } from '@/components/DraftsmanWorkloadSummary'
import { StatusBadge } from '@/components/StatusBadge'
import { SignaturePad } from '@/components/SignaturePad'
import { computeStats, listDrawingItems } from '@/services/drawingService'
import { groupForReport, isFinished } from '@/lib/reportBuckets'
import type { DrawingItem } from '@/types'

// Remembered locally per browser/device, per the "prepared by" prompt-once flow.
const SIGNATURE_STORAGE_KEY = 'xa-dos-report-prepared-by-signature'

export function ReportPage() {
  const [items, setItems] = useState<DrawingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [preparedSignature, setPreparedSignature] = useState<string | null>(() =>
    localStorage.getItem(SIGNATURE_STORAGE_KEY)
  )

  useEffect(() => {
    listDrawingItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const generatedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const overallStats = useMemo(() => computeStats(items), [items])

  const batchStats = useMemo(() => {
    const names = Array.from(new Set(items.map((item) => item.batch || 'Unassigned Batch'))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    )
    return names.map((name) => ({
      name,
      stats: computeStats(items.filter((item) => (item.batch || 'Unassigned Batch') === name)),
    }))
  }, [items])

  const draftsmanRows = useMemo(() => computeDraftsmanWorkload(items), [items])

  const itemGroups = useMemo(() => groupForReport(items), [items])

  function handleExportClick() {
    if (!preparedSignature) {
      setShowSignaturePad(true)
      return
    }
    generatePdf(preparedSignature)
  }

  function handleSignatureSaved(dataUrl: string) {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, dataUrl)
    setPreparedSignature(dataUrl)
    setShowSignaturePad(false)
    generatePdf(dataUrl)
  }

  async function generatePdf(signature: string | null) {
    setExporting(true)
    try {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/ReportPdfDocument'),
      ])
      const blob = await pdf(
        <ReportPdfDocument
          generatedDate={generatedDate}
          overallStats={overallStats}
          batchStats={batchStats}
          draftsmanRows={draftsmanRows}
          itemGroups={itemGroups}
          preparedBySignature={signature}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Spinnaker-Shop-Drawing-Status-Report-${today}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-slate" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Status Report</h1>
          <p className="text-sm text-brand-slate">The Spinnaker at Club Laiya — CP19 · As of {generatedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          {preparedSignature && (
            <button
              onClick={() => setShowSignaturePad(true)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-slate hover:text-brand-teal hover:underline"
            >
              <PenLine size={12} /> Change signature
            </button>
          )}
          <button
            onClick={handleExportClick}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-brand-ink px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export PDF
          </button>
        </div>
      </div>

      {showSignaturePad && (
        <SignaturePad
          title="Attach your signature"
          description='Sign below — this appears in the "Prepared by" block on every report you export, remembered on this device.'
          onCancel={() => setShowSignaturePad(false)}
          onSave={handleSignatureSaved}
        />
      )}

      <ProjectKpiPanel stats={overallStats} title="Overall Summary" />

      <div className="grid gap-4 md:grid-cols-2">
        {batchStats.map((b) => (
          <ProjectKpiPanel key={b.name} stats={b.stats} title={`${b.name} Summary`} />
        ))}
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-bold text-brand-ink">Draftsman Workload</h2>
        <DraftsmanWorkloadSummary items={items} />
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-brand-ink">Full Item Status</h2>
        {itemGroups.map((batchGroup) => (
          <div key={batchGroup.batch} className="space-y-4">
            <h3 className="px-1 text-sm font-extrabold uppercase tracking-wide text-brand-ink">{batchGroup.batch}</h3>
            {batchGroup.buckets.map((bucket) => (
              <div key={bucket.label}>
                <h4 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-brand-teal">
                  {bucket.label} <span className="text-brand-slate">({bucket.rows.length})</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-brand-line bg-white shadow-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-line text-left text-xs font-semibold uppercase tracking-wide text-brand-slate">
                        <th className="px-3 py-2">Item No.</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Draftsman</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Target</th>
                        <th className="px-3 py-2 text-center">Finished</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bucket.rows.map((item) => {
                        const overdue =
                          item.target_submission_date &&
                          item.target_submission_date < today &&
                          !['approved', 'completed'].includes(item.status)
                        const finished = isFinished(item)
                        return (
                          <tr key={item.id} className="border-b border-brand-line last:border-0">
                            <td className="px-3 py-2 font-mono text-xs text-brand-slate">{item.item_no}</td>
                            <td className="px-3 py-2 text-brand-ink">{item.description}</td>
                            <td className="px-3 py-2 text-brand-slate">{item.category ?? 'Uncategorized'}</td>
                            <td className="px-3 py-2 text-brand-slate">
                              {item.assigned_draftsman_name ?? 'Unassigned'}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className={`px-3 py-2 ${overdue ? 'font-semibold text-red-600' : 'text-brand-slate'}`}>
                              {item.target_submission_date ?? '—'}
                              {overdue ? ' (OVERDUE)' : ''}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {finished ? (
                                <CheckSquare size={16} className="mx-auto text-green-600" />
                              ) : (
                                <Square size={16} className="mx-auto text-brand-slate" />
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
