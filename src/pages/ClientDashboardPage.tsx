import { ClientProgressView } from '@/components/ClientProgressView'

export function ClientDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <header className="border-b border-brand-line bg-brand-ink text-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-2">
            <img src="/favicon-192x192.png" alt="" className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="text-lg font-bold">Shop Drawing Transparency Dashboard</h1>
              <p className="text-sm text-white/70">The Spinnaker at Club Laiya — CP19 Contract Package</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <ClientProgressView />
      </main>
    </div>
  )
}
