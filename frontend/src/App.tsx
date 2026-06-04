import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Protected from './components/ProtectedRoute'
import { isPlatformAdmin } from './utils/roles'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PreviewPage = lazy(() => import('./pages/PreviewPage'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const Labs = lazy(() => import('./pages/Superadmin/Labs'))
const Analytics = lazy(() => import('./pages/Superadmin/Analytics'))
const Users = lazy(() => import('./pages/Superadmin/Users'))
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage'))
const BorrowingsPage = lazy(() => import('./pages/Borrowings/BorrowingsPage'))
const AuditPage = lazy(() => import('./pages/Audit/AuditPage'))
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
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
      <Route path="/" element={user ? <Navigate to={isPlatformAdmin(user) ? '/superadmin/analytics' : '/dashboard'} /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/borrowings" element={<BorrowingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/superadmin/analytics" element={<Analytics />} />
          <Route path="/superadmin/labs" element={<Labs />} />
          <Route path="/superadmin/users" element={<Users />} />
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
