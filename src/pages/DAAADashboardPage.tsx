import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DoughnutChart, DoughnutLegend } from '@/components/DoughnutChart'
import { StatCard } from '@/components/StatCard'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { TargetDateAgenda } from '@/components/TargetDateAgenda'
import { DraftsmanWorkloadSummary } from '@/components/DraftsmanWorkloadSummary'
import { computeStats, listDrawingItems } from '@/services/drawingService'
import type { DrawingItem, DashboardStats } from '@/types'

export function DAAADashboardPage() {
  const [items, setItems] = useState<DrawingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDrawingItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-slate" />
      </div>
    )
  }

  const projectStats: DashboardStats = computeStats(items)
  const pendingReview = items.filter((i) => ['submitted_to_daaa', 'daaa_review'].includes(i.status)).length
  const forwardedToGpi = items.filter((i) =>
    ['gpi_review', 'approved', 'completed'].includes(i.status)
  ).length
  const revisionRequested = items.filter((i) => i.status === 'revision_required').length

  const slices = [
    { label: 'Pending My Review', value: pendingReview, color: '#9333EA' },
    { label: 'Approved — Forwarded to GPI', value: forwardedToGpi, color: '#16A34A' },
    { label: 'Revision Required', value: revisionRequested, color: '#DC2626' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">DAAA Dashboard</h1>
        <p className="text-sm text-brand-slate">Technical review summary</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Pending My Review" value={pendingReview} tone={pendingReview ? 'warn' : 'default'} />
        <StatCard label="Forwarded to GPI" value={forwardedToGpi} tone="good" />
        <StatCard label="Revision Required" value={revisionRequested} tone={revisionRequested ? 'bad' : 'default'} />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">My Review Summary</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <DoughnutChart slices={slices} centerValue={pendingReview} centerLabel="Awaiting Review" />
          <div className="w-full flex-1">
            <DoughnutLegend slices={slices} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">Draftsman Workload</h2>
        <DraftsmanWorkloadSummary items={items} />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">Project Deadlines</h2>
        <TargetDateAgenda items={items} />
      </div>

      <ProjectKpiPanel stats={projectStats} />
    </div>
  )
}
