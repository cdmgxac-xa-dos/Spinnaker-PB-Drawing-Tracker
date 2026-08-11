import { ClientProgressView } from '@/components/ClientProgressView'

export function LandcoDashboardPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-brand-ink">Project Progress</h1>
        <p className="text-sm text-brand-slate">The Spinnaker at Club Laiya — CP19 Contract Package</p>
      </div>
      <ClientProgressView />
    </div>
  )
}
