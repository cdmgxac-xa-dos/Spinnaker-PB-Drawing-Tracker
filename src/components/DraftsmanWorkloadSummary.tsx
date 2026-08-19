import type { DrawingItem } from '@/types'

export interface DraftsmanWorkloadRow {
  name: string
  assigned: number
  ongoing: number
  completed: number
  total: number
}

export function computeDraftsmanWorkload(items: DrawingItem[]): DraftsmanWorkloadRow[] {
  const byDraftsman = new Map<string, DraftsmanWorkloadRow>()

  for (const item of items) {
    if (!item.assigned_draftsman) continue
    const key = item.assigned_draftsman
    const name = item.assigned_draftsman_name ?? 'Unknown'
    if (!byDraftsman.has(key)) {
      byDraftsman.set(key, { name, assigned: 0, ongoing: 0, completed: 0, total: 0 })
    }
    const row = byDraftsman.get(key)!
    row.total++
    if (item.status === 'assigned') row.assigned++
    else if (['drafting', 'internal_review'].includes(item.status)) row.ongoing++
    else if (['approved', 'completed'].includes(item.status)) row.completed++
  }

  return Array.from(byDraftsman.values()).sort((a, b) => b.total - a.total)
}

export function DraftsmanWorkloadSummary({ items }: { items: DrawingItem[] }) {
  const rows = computeDraftsmanWorkload(items)

  if (rows.length === 0) {
    return <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-brand-slate">No drawings assigned to any draftsman yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-line text-left text-xs font-semibold uppercase tracking-wide text-brand-slate">
            <th className="py-2 pr-2">Draftsman</th>
            <th className="px-2 py-2 text-center">Assigned</th>
            <th className="px-2 py-2 text-center">Ongoing</th>
            <th className="px-2 py-2 text-center">Completed</th>
            <th className="py-2 pl-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-brand-line last:border-0">
              <td className="py-2 pr-2 font-medium text-brand-ink">{r.name}</td>
              <td className="px-2 py-2 text-center text-sky-700">{r.assigned}</td>
              <td className="px-2 py-2 text-center text-indigo-700">{r.ongoing}</td>
              <td className="px-2 py-2 text-center text-green-700">{r.completed}</td>
              <td className="py-2 pl-2 text-right font-semibold text-brand-ink">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
