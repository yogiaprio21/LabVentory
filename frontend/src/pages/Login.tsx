import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import cls from 'classnames'
import { useAuth } from '../hooks/useAuth'
import { Button, Field, Icon } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const showEmailError = email.length > 0 && !isEmailValid

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Login successful')
      navigate('/')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page flex items-center justify-center">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_26rem]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm">
              <Icon name="shield" />
              Multi-lab inventory system
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-950">LabVentory</h1>
            <p className="mt-4 max-w-lg text-lg font-medium leading-8 text-slate-600">
              Workspace inventaris lab multi-instansi dengan pemisahan data, invite registration, dan audit trail yang siap dipresentasikan sebagai portfolio.
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
              {[
                ['Tenant-safe', 'Data separated by institution'],
                ['Preview mode', 'Explore without an account'],
                ['QR inventory', 'Traceable lab equipment'],
                ['PDF reports', 'Export scoped reports']
              ].map(([label, desc]) => (
                <div key={label} className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-black text-slate-950">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Icon name="package" className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">LabVentory</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-slate-500">Precision management for modern labs</p>
          </div>

          <form onSubmit={onSubmit} className="auth-card">
            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                <Icon name="shield" />
                Secure workspace
              </div>
              <h2 className="text-2xl font-extrabold text-slate-950">Sign in to LabVentory</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Gunakan akun dari institusi/lab Anda. Reviewer portfolio bisa membuka preview tanpa login.</p>
            </div>

            <div className="space-y-5">
              <Field
                label="Work email"
                icon="mail"
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                error={showEmailError ? 'Please enter a valid email.' : undefined}
                className={cls(email.length > 0 && (isEmailValid ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20' : ''))}
              />

              <Field
                label="Secure password"
                icon="lock"
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                action={
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
                  </button>
                }
              />

              <Button className="h-11 w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </Button>
            </div>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Explore or join</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link className="btn-secondary w-full" to="/preview">
                <Icon name="eye" />
                Preview
              </Link>
              <Link className="btn-secondary w-full" to="/register">
                Register
                <Icon name="arrowRight" />
              </Link>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
              Registrasi terbaik menggunakan invite link dari admin instansi. Link umum hanya aktif untuk institusi yang membuka mode public registration.
            </p>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">&copy; 2026 LabVentory Systems. All rights reserved.</p>
        </section>
      </div>
    </main>
  )
}
