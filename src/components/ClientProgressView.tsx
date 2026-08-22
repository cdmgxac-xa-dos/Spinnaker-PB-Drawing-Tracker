import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { StatCard } from '@/components/StatCard'
import {
  fetchClientApprovedPdfs,
  fetchClientDrawings,
  getPublicSignedUrl,
  type ClientDrawingRow,
  type ClientPdfRow,
} from '@/services/clientDashboardService'
import type { DrawingStatus } from '@/types'
import { DRAFTSMAN_ACTIVE_STATUSES, DRAWING_STATUSES, STATUS_LABELS } from '@/types'

/**
 * The read-only progress view: stats and a drawing list grouped by batch
 * then category, with approved-PDF links. Shared by the public Client
 * Transparency Dashboard (/client, no login) and every authenticated
 * read-only role (DAAA/GPI's Progress tab, Landco) — all read the exact
 * same curated client_dashboard_* views, so they always show identical data.
 */
export function ClientProgressView() {
  const [drawings, setDrawings] = useState<ClientDrawingRow[]>([])
  const [pdfs, setPdfs] = useState<ClientPdfRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DrawingStatus | 'all'>('all')

  useEffect(() => {
    Promise.all([fetchClientDrawings(), fetchClientApprovedPdfs()])
      .then(([d, p]) => {
        setDrawings(d)
        setPdfs(p)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return drawings.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        d.item_no.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.category ?? '').toLowerCase().includes(q)
      )
    })
  }, [drawings, query, statusFilter])

  const pdfByItem = useMemo(() => new Map(pdfs.map((p) => [p.drawing_item_id, p])), [pdfs])

  const total = drawings.length
  const approvedOrCompleted = drawings.filter((d) => ['approved', 'completed'].includes(d.status)).length
  const revisionRequired = drawings.filter((d) => d.status === 'revision_required').length
  const today = new Date().toISOString().slice(0, 10)
  const overdue = drawings.filter(
    (d) => d.target_submission_date && d.target_submission_date < today && DRAFTSMAN_ACTIVE_STATUSES.includes(d.status)
  ).length
  const progressPct = total > 0 ? Math.round((approvedOrCompleted / total) * 100) : 0

  async function openPdf(path: string) {
    const url = await getPublicSignedUrl(path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-slate" />
      </div>
    )
  }

  const batches: { batch: string; categories: { category: string; rows: ClientDrawingRow[] }[] }[] = []
  for (const item of filtered) {
    const batchLabel = item.batch || 'Unassigned Batch'
    let batchGroup = batches.find((b) => b.batch === batchLabel)
    if (!batchGroup) {
      batchGroup = { batch: batchLabel, categories: [] }
      batches.push(batchGroup)
    }
    const cat = item.category || 'Uncategorized'
    let g = batchGroup.categories.find((x) => x.category === cat)
    if (!g) {
      g = { category: cat, rows: [] }
      batchGroup.categories.push(g)
    }
    g.rows.push(item)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Drawings" value={total} />
        <StatCard label="Overall Progress" value={`${progressPct}%`} tone="good" />
        <StatCard label="Revision Required" value={revisionRequired} tone={revisionRequired ? 'warn' : 'default'} />
        <StatCard label="Overdue" value={overdue} tone={overdue ? 'bad' : 'default'} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-brand-line bg-white px-3 py-2">
          <Search size={15} className="text-brand-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item no, description, category…"
            className="flex-1 text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DrawingStatus | 'all')}
          className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {DRAWING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-8">
        {batches.map((batchGroup) => (
          <div key={batchGroup.batch}>
            <h2 className="mb-3 px-1 text-sm font-extrabold uppercase tracking-wide text-brand-ink">
              {batchGroup.batch}
            </h2>
            <div className="space-y-6">
              {batchGroup.categories.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-brand-teal">
                    {group.category}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-card">
                    {group.rows.map((d, idx) => {
                      const pdf = pdfByItem.get(d.id)
                      return (
                        <div
                          key={d.id}
                          className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                            idx !== group.rows.length - 1 ? 'border-b border-brand-line' : ''
                          }`}
                        >
                          <span className="w-14 shrink-0 font-mono text-xs font-semibold text-brand-slate">
                            {d.item_no}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-brand-ink">{d.description}</p>
                            <p className="truncate text-xs text-brand-slate">
                              {d.target_submission_date ? `Target: ${d.target_submission_date}` : ''}
                              {d.submission_date ? ` · Submitted: ${d.submission_date}` : ''}
                              {d.approval_date ? ` · Approved: ${d.approval_date}` : ''}
                            </p>
                          </div>
                          <StatusBadge status={d.status} className="shrink-0" />
                          {pdf && (
                            <button
                              onClick={() => openPdf(pdf.storage_path)}
                              className="flex shrink-0 items-center gap-1 rounded-lg border border-brand-teal px-2.5 py-1 text-xs font-semibold text-brand-teal hover:bg-brand-tint"
                            >
                              <ExternalLink size={12} /> Approved PDF
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
