import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DoughnutChart, DoughnutLegend } from '@/components/DoughnutChart'
import { StatCard } from '@/components/StatCard'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { TargetDateAgenda } from '@/components/TargetDateAgenda'
import { computeStats, listDrawingItems, listMyAssignedItems } from '@/services/drawingService'
import { useAuth } from '@/context/AuthContext'
import type { DrawingItem, DashboardStats } from '@/types'

export function DraftsmanDashboardPage() {
  const { profile } = useAuth()
  const [myItems, setMyItems] = useState<DrawingItem[]>([])
  const [projectStats, setProjectStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([listMyAssignedItems(profile.id), listDrawingItems()])
      .then(([mine, all]) => {
        setMyItems(mine)
        setProjectStats(computeStats(all))
      })
      .finally(() => setLoading(false))
  }, [profile])

  if (loading || !projectStats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-slate" />
      </div>
    )
  }

  const assigned = myItems.filter((i) => i.status === 'assigned').length
  const ongoing = myItems.filter((i) => ['drafting', 'internal_review'].includes(i.status)).length
  const completed = myItems.filter((i) => ['approved', 'completed'].includes(i.status)).length
  const revision = myItems.filter((i) => i.status === 'revision_required').length

  const slices = [
    { label: 'Assigned', value: assigned, color: '#0EA5E9' },
    { label: 'Ongoing', value: ongoing, color: '#6366F1' },
    { label: 'Revision Required', value: revision, color: '#DC2626' },
    { label: 'Completed', value: completed, color: '#16A34A' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">My Dashboard</h1>
        <p className="text-sm text-brand-slate">{profile?.full_name} — Draftsman</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Assigned to Me" value={myItems.length} />
        <StatCard label="Ongoing" value={ongoing} tone={ongoing ? 'warn' : 'default'} />
        <StatCard label="Revision Required" value={revision} tone={revision ? 'bad' : 'default'} />
        <StatCard label="Completed" value={completed} tone="good" />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">My Task Breakdown</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <DoughnutChart slices={slices} centerValue={myItems.length} centerLabel="My Tasks" />
          <div className="w-full flex-1">
            <DoughnutLegend slices={slices} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">My Deadlines</h2>
        <TargetDateAgenda items={myItems} />
      </div>

      <ProjectKpiPanel stats={projectStats} />
    </div>
  )
}
