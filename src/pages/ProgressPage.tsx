import { ClientProgressView } from '@/components/ClientProgressView'

/**
 * Read-only project overview (batch -> category -> items, approved PDFs,
 * timeline) — same curated data and component as the public Client
 * Transparency Dashboard, just reused inside the authenticated app shell
 * for roles that want the bird's-eye view without editing anything
 * (DAAA, GPI, Landco).
 */
export function ProgressPage() {
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
