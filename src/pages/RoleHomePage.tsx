import { useAuth } from '@/context/AuthContext'
import { XADashboardPage } from '@/pages/XADashboardPage'
import { DraftsmanPage } from '@/pages/DraftsmanPage'
import { DAAAReviewPage } from '@/pages/DAAAReviewPage'
import { GPIReviewPage } from '@/pages/GPIReviewPage'
import { LandcoDashboardPage } from '@/pages/LandcoDashboardPage'

export function RoleHomePage() {
  const { profile } = useAuth()
  if (!profile) return null

  switch (profile.role) {
    case 'xa_admin':
      return <XADashboardPage />
    case 'draftsman':
      return <DraftsmanPage />
    case 'daaa':
      return <DAAAReviewPage />
    case 'gpi':
      return <GPIReviewPage />
    case 'landco':
      return <LandcoDashboardPage />
  }
}
