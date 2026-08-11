import { useAuth } from '@/context/AuthContext'
import { XADashboardPage } from '@/pages/XADashboardPage'
import { DraftsmanDashboardPage } from '@/pages/DraftsmanDashboardPage'
import { DAAADashboardPage } from '@/pages/DAAADashboardPage'
import { GPIDashboardPage } from '@/pages/GPIDashboardPage'
import { LandcoDashboardPage } from '@/pages/LandcoDashboardPage'

export function RoleHomePage() {
  const { profile } = useAuth()
  if (!profile) return null

  switch (profile.role) {
    case 'xa_admin':
      return <XADashboardPage />
    case 'draftsman':
      return <DraftsmanDashboardPage />
    case 'daaa':
      return <DAAADashboardPage />
    case 'gpi':
      return <GPIDashboardPage />
    case 'landco':
      return <LandcoDashboardPage />
  }
}
