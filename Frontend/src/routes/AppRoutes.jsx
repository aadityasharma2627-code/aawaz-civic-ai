import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import HomePage from '../pages/HomePage'
import ReportPage from '../pages/ReportPage'
import ReportSuccessPage from '../pages/ReportSuccessPage'
import TrackPage from '../pages/TrackPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminQueuePage from '../pages/admin/AdminQueuePage'
import NotFoundPage from '../pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="report/success" element={<ReportSuccessPage />} />
        <Route path="track" element={<TrackPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="queue" element={<AdminQueuePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
