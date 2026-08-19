import type { DrawingItem, DrawingStatus } from '@/types'

/**
 * Status-report ordering: most-done first (what's finished, what needs
 * urgent attention) down to not-started backlog last — the reverse of the
 * natural workflow order used elsewhere (e.g. the dashboard doughnut).
 */
export const REPORT_STATUS_BUCKETS: { label: string; statuses: DrawingStatus[] }[] = [
  { label: 'Approved / Completed', statuses: ['approved', 'completed'] },
  { label: 'Revision Required', statuses: ['revision_required'] },
  { label: 'In Client Review', statuses: ['submitted_to_daaa', 'daaa_review', 'gpi_review'] },
  { label: 'In Progress', statuses: ['drafting', 'internal_review'] },
  { label: 'Assigned', statuses: ['assigned'] },
  { label: 'Not Started', statuses: ['not_started'] },
]

export const FINISHED_STATUSES: DrawingStatus[] = ['approved', 'completed']

export function isFinished(item: DrawingItem): boolean {
  return FINISHED_STATUSES.includes(item.status)
}

export interface ReportBatchGroup {
  batch: string
  buckets: { label: string; rows: DrawingItem[] }[]
}

/** Batch (sorted, Batch 1 before Batch 2) > status bucket (fixed order, empty buckets skipped) > items. */
export function groupForReport(items: DrawingItem[]): ReportBatchGroup[] {
  const batchNames = Array.from(new Set(items.map((i) => i.batch || 'Unassigned Batch'))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )

  return batchNames.map((batch) => {
    const batchItems = items.filter((i) => (i.batch || 'Unassigned Batch') === batch)
    const buckets = REPORT_STATUS_BUCKETS.map((b) => ({
      label: b.label,
      rows: batchItems.filter((i) => b.statuses.includes(i.status)),
    })).filter((b) => b.rows.length > 0)
    return { batch, buckets }
  })
}
