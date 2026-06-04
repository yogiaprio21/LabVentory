import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import cls from 'classnames'
import { useAuth } from '../hooks/useAuth'
import NotificationBell from './NotificationBell'
import { ConfirmDialog, Icon, iconButtonLabel } from './ui'
import { roleLabel } from '../utils/roles'

type NavItem = {
  to: string
  label: string
  description: string
  icon: Parameters<typeof Icon>[0]['name']
  roles: string[]
}

const nav: NavItem[] = [
  { to: '/superadmin/analytics', label: 'Analytics', description: 'Global platform metrics', icon: 'barChart', roles: ['superadmin', 'platform_admin'] },
  { to: '/dashboard', label: 'Dashboard', description: 'Activity overview', icon: 'home', roles: ['admin', 'lab_admin', 'institution_admin', 'student'] },
  { to: '/inventory', label: 'Inventory', description: 'Equipment and stock', icon: 'package', roles: ['admin', 'lab_admin', 'institution_admin', 'superadmin', 'platform_admin'] },
  { to: '/borrowings', label: 'Borrowings', description: 'Requests and returns', icon: 'bookOpen', roles: ['student', 'admin', 'lab_admin', 'institution_admin', 'superadmin', 'platform_admin'] },
  { to: '/audit', label: 'Audit Logs', description: 'Security activity', icon: 'shield', roles: ['admin', 'lab_admin', 'institution_admin', 'superadmin', 'platform_admin'] },
  { to: '/reports', label: 'Reports', description: 'PDF exports', icon: 'download', roles: ['admin', 'lab_admin', 'institution_admin', 'superadmin', 'platform_admin'] },
  { to: '/superadmin/labs', label: 'Labs', description: 'Facilities', icon: 'building', roles: ['institution_admin', 'superadmin', 'platform_admin'] },
  { to: '/superadmin/users', label: 'Users', description: 'Accounts and roles', icon: 'users', roles: ['institution_admin', 'superadmin', 'platform_admin'] }
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
        <Icon name="package" className="h-5 w-5" strokeWidth={2.3} />
      </div>
      <div>
        <span className="block text-xl font-black tracking-tight text-slate-950">LabVentory</span>
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lab operations</span>
      </div>
    </Link>
  )
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => cls(
            'group flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
            isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          )}
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} className={cls('h-5 w-5', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')} />
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className={cls('block truncate text-[11px] font-semibold', isActive ? 'text-indigo-100' : 'text-slate-400')}>{item.description}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const filteredNav = useMemo(() => nav.filter(n => n.roles.includes(user!.role)), [user])
  const activePage = filteredNav.find(n => location.pathname === n.to) || filteredNav.find(n => location.pathname.startsWith(n.to))

  const handleLogout = () => {
    logout()
    setConfirmLogout(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 p-6">
          <Brand />
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Signed in</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800">{user?.name}</p>
            <p className="text-xs font-bold capitalize text-indigo-600">{roleLabel(user?.role)}</p>
            {user?.institution?.name && <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{user.institution.name}</p>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavList items={filteredNav} />
        </div>
        <div className="border-t border-slate-100 p-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
            onClick={() => setConfirmLogout(true)}
          >
            <Icon name="logOut" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              {...iconButtonLabel('Open navigation')}
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-slate-950 md:text-lg">{activePage?.label || 'Workspace'}</p>
              <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block">{activePage?.description || 'Manage laboratory operations'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <Link to="/profile" className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-slate-100">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-none text-slate-900">{user?.name}</p>
                <p className="mt-1 text-[11px] font-bold capitalize text-slate-500">{roleLabel(user?.role)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-sm font-black text-indigo-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <Brand />
                <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setIsMobileMenuOpen(false)} {...iconButtonLabel('Close navigation')}>
                  <Icon name="x" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavList items={filteredNav} onNavigate={() => setIsMobileMenuOpen(false)} />
              </div>
              <div className="border-t border-slate-100 p-4">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"
                  onClick={() => setConfirmLogout(true)}
                >
                  <Icon name="logOut" />
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Sign out of LabVentory?"
        description="You will return to the login page and need to sign in again to access protected pages."
        confirmLabel="Sign Out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
