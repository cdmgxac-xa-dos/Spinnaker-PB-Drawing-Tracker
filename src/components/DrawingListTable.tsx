import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { DrawingItem } from '@/types'

export function DrawingListTable({
  items,
  selectable = false,
  selectedIds,
  onToggleSelect,
}: {
  items: DrawingItem[]
  /** XA-only: shows a checkbox per row (and per category "select all") for batch actions. */
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  if (items.length === 0) {
    return <p className="rounded-xl bg-white p-6 text-center text-sm text-brand-slate shadow-card">No drawings.</p>
  }

  // Two levels: batch (e.g. "BATCH 1") outer, equipment-type category inner.
  const batches: { batch: string; categories: { category: string; rows: DrawingItem[] }[] }[] = []
  for (const item of items) {
    const batchLabel = item.batch || 'Unassigned Batch'
    let batchGroup = batches.find((b) => b.batch === batchLabel)
    if (!batchGroup) {
      batchGroup = { batch: batchLabel, categories: [] }
      batches.push(batchGroup)
    }
    const cat = item.category || 'Uncategorized'
    let catGroup = batchGroup.categories.find((c) => c.category === cat)
    if (!catGroup) {
      catGroup = { category: cat, rows: [] }
      batchGroup.categories.push(catGroup)
    }
    catGroup.rows.push(item)
  }

  return (
    <div className="space-y-8">
      {batches.map((batchGroup) => (
        <div key={batchGroup.batch}>
          <h2 className="mb-3 px-1 text-sm font-extrabold uppercase tracking-wide text-brand-ink">
            {batchGroup.batch}
          </h2>
          <div className="space-y-6">
            {batchGroup.categories.map((group) => {
              const allSelected = selectable && group.rows.every((r) => selectedIds?.has(r.id))
              const someSelected = selectable && !allSelected && group.rows.some((r) => selectedIds?.has(r.id))
              return (
                <div key={group.category}>
                  <div className="mb-2 flex items-center gap-2 px-1">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected
                        }}
                        onChange={() => group.rows.forEach((r) => onToggleSelect?.(r.id))}
                        className="h-3.5 w-3.5 accent-brand-teal"
                        aria-label={`Select all in ${group.category}`}
                      />
                    )}
                    <h3 className="text-xs font-bold uppercase tracking-wide text-brand-teal">{group.category}</h3>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-card">
                    {group.rows.map((item, idx) => {
                      const overdue =
                        item.target_submission_date &&
                        item.target_submission_date < today &&
                        !['approved', 'completed'].includes(item.status)
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-3 ${
                            idx !== group.rows.length - 1 ? 'border-b border-brand-line' : ''
                          } ${selectable && selectedIds?.has(item.id) ? 'bg-brand-tint' : ''}`}
                        >
                          {selectable && (
                            <input
                              type="checkbox"
                              checked={selectedIds?.has(item.id) ?? false}
                              onChange={() => onToggleSelect?.(item.id)}
                              className="h-3.5 w-3.5 shrink-0 accent-brand-teal"
                              aria-label={`Select ${item.item_no}`}
                            />
                          )}
                          <button
                            onClick={() => navigate(`/drawings/${item.id}`)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
                          >
                            <span className="w-14 shrink-0 font-mono text-xs font-semibold text-brand-slate">
                              {item.item_no}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-brand-ink">{item.description}</p>
                              <p className="truncate text-xs text-brand-slate">
                                {item.assigned_draftsman_name ? `Draftsman: ${item.assigned_draftsman_name}` : 'Unassigned'}
                                {item.target_submission_date ? ` · Target: ${item.target_submission_date}` : ''}
                                {overdue ? ' · OVERDUE' : ''}
                              </p>
                            </div>
                            <StatusBadge status={item.status} className="shrink-0" />
                            <ChevronRight size={16} className="shrink-0 text-brand-slate" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
