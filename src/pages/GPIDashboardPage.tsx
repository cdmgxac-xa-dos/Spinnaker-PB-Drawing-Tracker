import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DoughnutChart, DoughnutLegend } from '@/components/DoughnutChart'
import { StatCard } from '@/components/StatCard'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { TargetDateAgenda } from '@/components/TargetDateAgenda'
import { computeStats, listDrawingItems } from '@/services/drawingService'
import type { DrawingItem, DashboardStats } from '@/types'

export function GPIDashboardPage() {
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
  const pendingFinalReview = items.filter((i) => i.status === 'gpi_review').length
  const finalApproved = items.filter((i) => ['approved', 'completed'].includes(i.status)).length
  const revisionOrRejected = items.filter((i) => i.status === 'revision_required').length

  const slices = [
    { label: 'Pending Final Review', value: pendingFinalReview, color: '#DB2777' },
    { label: 'Final Approved', value: finalApproved, color: '#16A34A' },
    { label: 'Revision Required / Rejected', value: revisionOrRejected, color: '#DC2626' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">GPI Dashboard</h1>
        <p className="text-sm text-brand-slate">Final approval summary</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Pending Final Review" value={pendingFinalReview} tone={pendingFinalReview ? 'warn' : 'default'} />
        <StatCard label="Final Approved" value={finalApproved} tone="good" />
        <StatCard label="Revision / Rejected" value={revisionOrRejected} tone={revisionOrRejected ? 'bad' : 'default'} />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">My Final Review Summary</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <DoughnutChart slices={slices} centerValue={pendingFinalReview} centerLabel="Awaiting Final Review" />
          <div className="w-full flex-1">
            <DoughnutLegend slices={slices} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">Project Deadlines</h2>
        <TargetDateAgenda items={items} />
      </div>

      <ProjectKpiPanel stats={projectStats} />
    </div>
  )
}
