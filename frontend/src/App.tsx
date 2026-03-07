import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/Admin/Dashboard'
import Labs from './pages/Superadmin/Labs'
import Analytics from './pages/Superadmin/Analytics'
import Users from './pages/Superadmin/Users'
import InventoryPage from './pages/Inventory/InventoryPage'
import BorrowingsPage from './pages/Borrowings/BorrowingsPage'
import AuditPage from './pages/Audit/AuditPage'
import ReportsPage from './pages/Reports/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Protected from './components/ProtectedRoute'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'superadmin' ? '/superadmin/analytics' : '/dashboard'} /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
      <AppRoutes />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}
