import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { TargetDateAgenda } from '@/components/TargetDateAgenda'
import { computeStats, listDrawingItems } from '@/services/drawingService'
import type { DrawingItem } from '@/types'

export function XADashboardPage() {
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

  const stats = computeStats(items)

  const batchNames = Array.from(new Set(items.map((item) => item.batch || 'Unassigned Batch'))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
  const batchStats = batchNames.map((name) => ({
    name,
    stats: computeStats(items.filter((item) => (item.batch || 'Unassigned Batch') === name)),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">XA Dashboard</h1>
        <p className="text-sm text-brand-slate">CP19 — Panel Boards, Breakers, Meter Center & Switch Gear</p>
      </div>

      <ProjectKpiPanel stats={stats} title="Overall Project Progress" />

      {batchStats.map((b) => (
        <ProjectKpiPanel key={b.name} stats={b.stats} title={`${b.name} Progress`} />
      ))}

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">Deadlines</h2>
        <TargetDateAgenda items={items} />
      </div>

      <div className="flex justify-end">
        <Link to="/register" className="text-sm font-semibold text-brand-teal hover:underline">
          View full drawing register →
        </Link>
      </div>
    </div>
  )
}
