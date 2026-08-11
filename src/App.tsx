import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { RoleHomePage } from '@/pages/RoleHomePage'
import { DrawingRegisterPage } from '@/pages/DrawingRegisterPage'
import { DrawingDetailPage } from '@/pages/DrawingDetailPage'
import { UsersPage } from '@/pages/UsersPage'
import { ClientDashboardPage } from '@/pages/ClientDashboardPage'
import { DraftsmanPage } from '@/pages/DraftsmanPage'
import { DAAAReviewPage } from '@/pages/DAAAReviewPage'
import { GPIReviewPage } from '@/pages/GPIReviewPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/client" element={<ClientDashboardPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleHomePage />} />

          <Route element={<ProtectedRoute allow={['xa_admin', 'draftsman', 'daaa', 'gpi']} />}>
            <Route path="/drawings/:id" element={<DrawingDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute allow={['draftsman']} />}>
            <Route path="/my-drawings" element={<DraftsmanPage />} />
          </Route>

          <Route element={<ProtectedRoute allow={['daaa']} />}>
            <Route path="/daaa-queue" element={<DAAAReviewPage />} />
          </Route>

          <Route element={<ProtectedRoute allow={['gpi']} />}>
            <Route path="/gpi-queue" element={<GPIReviewPage />} />
          </Route>

          <Route element={<ProtectedRoute allow={['daaa', 'gpi', 'landco']} />}>
            <Route path="/progress" element={<ProgressPage />} />
          </Route>

          <Route element={<ProtectedRoute allow={['xa_admin']} />}>
            <Route path="/register" element={<DrawingRegisterPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
