import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Protected from './components/ProtectedRoute'
import { defaultPathForUser } from './config/accessControl'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PreviewPage = lazy(() => import('./pages/PreviewPage'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const Labs = lazy(() => import('./pages/Superadmin/Labs'))
const Institutions = lazy(() => import('./pages/Superadmin/Institutions'))
const Analytics = lazy(() => import('./pages/Superadmin/Analytics'))
const Users = lazy(() => import('./pages/Superadmin/Users'))
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage'))
const BorrowingsPage = lazy(() => import('./pages/Borrowings/BorrowingsPage'))
const AuditPage = lazy(() => import('./pages/Audit/AuditPage'))
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AccessControlPage = lazy(() => import('./pages/Superadmin/AccessControl'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={defaultPathForUser(user)} /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Protected permission="dashboard.view"><AdminDashboard /></Protected>} />
          <Route path="/inventory" element={<Protected permission="inventory.view"><InventoryPage /></Protected>} />
          <Route path="/borrowings" element={<Protected permission="borrowing.view"><BorrowingsPage /></Protected>} />
          <Route path="/reports" element={<Protected permission="report.view"><ReportsPage /></Protected>} />
          <Route path="/audit" element={<Protected permission="audit.view"><AuditPage /></Protected>} />
          <Route path="/profile" element={<Protected permission="profile.view"><ProfilePage /></Protected>} />
          <Route path="/superadmin/analytics" element={<Protected permission="platform.analytics.view"><Analytics /></Protected>} />
          <Route path="/superadmin/institutions" element={<Protected permission="institution.view"><Institutions /></Protected>} />
          <Route path="/superadmin/labs" element={<Protected permission="lab.view"><Labs /></Protected>} />
          <Route path="/superadmin/users" element={<Protected permission="user.view"><Users /></Protected>} />
          <Route path="/superadmin/access-control" element={<Protected permission="accessControl.view"><AccessControlPage /></Protected>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <AppRoutes />
      </Suspense>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
