import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import cls from 'classnames'

import NotificationBell from './NotificationBell'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const nav = [
    { to: '/superadmin/analytics', label: 'Global Analytics', roles: ['superadmin'] },
    { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'student'] },
    { to: '/inventory', label: 'Inventory', roles: ['admin', 'superadmin'] },
    { to: '/borrowings', label: 'Borrowings', roles: ['student', 'admin', 'superadmin'] },
    { to: '/audit', label: 'Audit Logs', roles: ['admin', 'superadmin'] },
    { to: '/reports', label: 'Reports', roles: ['admin', 'superadmin'] },
    { to: '/superadmin/labs', label: 'Labs', roles: ['superadmin'] },
    { to: '/superadmin/users', label: 'Users', roles: ['superadmin'] }
  ]

  const filteredNav = nav.filter(n => n.roles.includes(user!.role))

  return (
    <div className="h-full flex bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col hidden md:flex shadow-sm z-30">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
              L
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">LabVentory</span>
          </Link>
          <div className="mt-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authenticated Profile</p>
            <p className="text-sm font-bold text-slate-700 mt-1 truncate">{user?.name}</p>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-tight mt-0.5">{user?.role}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {filteredNav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => cls(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300',
                isActive
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              )}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-500 bg-rose-50/30 hover:bg-rose-50 border border-rose-100/50 transition-all hover:scale-[1.02]"
            onClick={() => { logout(); navigate('/login') }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 md:px-10 z-20">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="md:hidden">
              <Link to="/" className="font-black text-xl text-slate-900 tracking-tight">LabVentory</Link>
            </div>
            <div className="hidden md:block">
              <h2 className="text-lg font-bold text-slate-800">
                Dashboard <span className="text-slate-400 font-medium text-sm ml-2">/ Activity Overview</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
            <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{user?.role}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-700 font-black shadow-sm ring-4 ring-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl animate-slide-in flex flex-col">
              <div className="p-8 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">L</div>
                  <span className="font-black text-2xl text-slate-900">LabVentory</span>
                </div>
                <button className="p-2 text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {filteredNav.map(n => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => cls(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {n.label}
                  </NavLink>
                ))}
              </nav>

              <div className="p-6 border-t border-slate-50">
                <button
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-rose-50 text-rose-600 font-bold"
                  onClick={() => { logout(); navigate('/login') }}
                >
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
