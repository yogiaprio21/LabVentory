import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { can, type Permission } from '../config/accessControl'
import { Button, Icon } from './ui'

function Forbidden() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <Icon name="lock" className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-950">Access denied</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your current role does not include the permission required for this page or function.</p>
        <Button className="mt-5" variant="secondary" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ permission, children }: { permission?: Permission; children?: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
  if (!user) return <Navigate to="/login" />
  if (permission && !can(user, permission)) return <Forbidden />
  return children ? <>{children}</> : <Outlet />
}
