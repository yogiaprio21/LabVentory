import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import cls from 'classnames'
import { api } from '../hooks/useApi'
import type { Institution, Lab } from '../types'
import { Button, Field, Icon, SelectField } from '../components/ui'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const [labs, setLabs] = useState<Lab[]>([])
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [labsLoading, setLabsLoading] = useState(true)
  const [labsError, setLabsError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    labId: ''
  })

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword
  const institutionSlug = new URLSearchParams(location.search).get('institution')
    || import.meta.env.VITE_DEFAULT_INSTITUTION_SLUG
    || 'default'

  useEffect(() => {
    setLabsLoading(true)
    setLabsError('')
    api.get(`/public/institutions/${institutionSlug}/labs`)
      .then(r => {
        setInstitution(r.data.institution)
        setLabs(r.data.labs || [])
      })
      .catch(() => setLabsError('Unable to load laboratories for this institution. Please check the registration link.'))
      .finally(() => setLabsLoading(false))
  }, [institutionSlug])

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid) return toast.error('Please enter a valid email address')
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (!form.labId) return toast.error('Please select a laboratory')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        labId: Number(form.labId),
        institutionSlug
      })
      toast.success('Account created successfully! Please sign in.')
      navigate('/login')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const passwordAction = (visible: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
      onClick={onClick}
      aria-label={label}
    >
      <Icon name={visible ? 'eyeOff' : 'eye'} className="h-4 w-4" />
    </button>
  )

  return (
    <main className="auth-page flex items-center justify-center">
      <section className="mx-auto w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Icon name="users" className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Create Account</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm font-semibold text-slate-500">
            {institution ? `Register for ${institution.name}.` : 'Access laboratory equipment and borrowing workflows with your assigned lab.'}
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Full name"
                  icon="user"
                  placeholder="Dr. John Doe"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Academic email"
                  icon="mail"
                  type="email"
                  placeholder="john@university.edu"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  error={form.email.length > 0 && !isEmailValid ? 'Please enter a valid email.' : undefined}
                  className={cls(form.email.length > 0 && isEmailValid && 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20')}
                />
              </div>

              <Field
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 chars"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                minLength={6}
                action={passwordAction(showPassword, () => setShowPassword(v => !v), showPassword ? 'Hide password' : 'Show password')}
              />

              <Field
                label="Confirm password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                required
                error={passwordMismatch ? 'Passwords do not match.' : undefined}
                className={cls(form.confirmPassword.length > 0 && !passwordMismatch && 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20')}
                action={passwordAction(showConfirmPassword, () => setShowConfirmPassword(v => !v), showConfirmPassword ? 'Hide password' : 'Show password')}
              />

              <div className="md:col-span-2">
                <SelectField
                  label="Department laboratory"
                  icon="building"
                  value={form.labId}
                  onChange={e => set('labId', e.target.value)}
                  required
                  disabled={labsLoading || !!labsError}
                  error={labsError || undefined}
                >
                  <option value="">{labsLoading ? 'Loading laboratories...' : '-- Choose Assigned Lab --'}</option>
                  {labs.map(l => (
                    <option key={l.id} value={l.id}>{l.name} {l.location ? `(${l.location})` : ''}</option>
                  ))}
                </SelectField>
                {labsLoading && <p className="mt-2 text-xs font-medium text-slate-500">First load can take a moment while the hosted backend wakes up.</p>}
              </div>
            </div>

            <Button className="h-11 w-full" type="submit" disabled={loading || labsLoading || !!labsError}>
              {loading ? 'Processing...' : 'Initialize Student Profile'}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Member already?</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <Link to="/login" className="btn-secondary w-full">
            <Icon name="arrowLeft" />
            Return to sign in
          </Link>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">&copy; 2026 LabVentory Systems. All rights reserved.</p>
      </section>
    </main>
  )
}
