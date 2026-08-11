import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ProjectKpiPanel } from '@/components/ProjectKpiPanel'
import { TargetDateAgenda } from '@/components/TargetDateAgenda'
import { fetchClientDrawings, computeClientStats, type ClientDrawingRow } from '@/services/clientDashboardService'

export function LandcoDashboardPage() {
  const [rows, setRows] = useState<ClientDrawingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientDrawings()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-brand-slate" />
      </div>
    )
  }

  const stats = computeClientStats(rows)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-ink">Project Dashboard</h1>
        <p className="text-sm text-brand-slate">The Spinnaker at Club Laiya — CP19 Contract Package</p>
      </div>

      <ProjectKpiPanel stats={stats} title="Overall Progress" />

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-brand-ink">Upcoming Target Dates</h2>
        <TargetDateAgenda items={rows} clickable={false} />
      </div>
    </div>
  )
}
