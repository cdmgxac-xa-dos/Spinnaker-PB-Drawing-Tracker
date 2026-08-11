import { DoughnutChart, DoughnutLegend, type DoughnutSlice } from '@/components/DoughnutChart'
import { StatCard } from '@/components/StatCard'
import type { DashboardStats } from '@/types'

/** Groups the 10 workflow statuses into 6 visually meaningful buckets for the doughnut. */
export function statusBuckets(stats: DashboardStats): DoughnutSlice[] {
  const b = stats.byStatus
  return [
    { label: 'Not Started', value: b.not_started, color: '#94A3B8' },
    { label: 'Assigned', value: b.assigned, color: '#0EA5E9' },
    { label: 'In Progress (Drafting/Internal Review)', value: b.drafting + b.internal_review, color: '#6366F1' },
    {
      label: 'In Client Review (DAAA/GPI)',
      value: b.submitted_to_daaa + b.daaa_review + b.gpi_review,
      color: '#9333EA',
    },
    { label: 'Revision Required', value: b.revision_required, color: '#DC2626' },
    { label: 'Approved / Completed', value: b.approved + b.completed, color: '#16A34A' },
  ]
}

export function ProjectKpiPanel({ stats, title = 'Overall Project Progress' }: { stats: DashboardStats; title?: string }) {
  const progressPct = stats.total > 0 ? Math.round(((stats.approved + stats.completed) / stats.total) * 100) : 0
  const slices = statusBuckets(stats)

  return (
    <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-bold text-brand-ink">{title}</h2>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Drawings" value={stats.total} />
        <StatCard label="Approved / Completed" value={`${progressPct}%`} tone="good" />
        <StatCard
          label="Revision Required"
          value={stats.revisionRequired}
          tone={stats.revisionRequired ? 'warn' : 'default'}
        />
        <StatCard label="Overdue" value={stats.overdue} tone={stats.overdue ? 'bad' : 'default'} />
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <DoughnutChart slices={slices} centerValue={`${progressPct}%`} centerLabel="Complete" />
        <div className="w-full flex-1">
          <DoughnutLegend slices={slices} />
        </div>
      </div>
    </div>
  )
}
