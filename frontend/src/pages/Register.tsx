import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import type { Lab } from '../types'
import cls from 'classnames'

export default function Register() {
    const navigate = useNavigate()
    const [labs, setLabs] = useState<Lab[]>([])
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

    useEffect(() => {
        api.get('/labs').then(r => setLabs(r.data)).catch(() => { })
    }, [])

    const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }))

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isEmailValid) {
            toast.error('Please enter a valid email address')
            return
        }
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (!form.labId) {
            toast.error('Please select a laboratory')
            return
        }
        setLoading(true)
        try {
            await api.post('/auth/register', {
                name: form.name,
                email: form.email,
                password: form.password,
                labId: Number(form.labId)
            })
            toast.success('Account created successfully! Please sign in.')
            navigate('/login')
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-3xl opacity-60 animate-pulse" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-cyan-100 rounded-full blur-3xl opacity-60 animate-pulse transition-all delay-1000" />

            <div className="w-full max-w-2xl relative z-10 space-y-8 py-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl shadow-xl shadow-indigo-200 mb-6 group transition-transform hover:scale-105 duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
                    <p className="text-slate-500 mt-2 font-medium">Access laboratory equipment & resources today</p>
                </div>

                <div className="card p-8 md:p-10 border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 rounded-3xl">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        className="input w-full pl-11 h-12 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white transition-all outline-none"
                                        placeholder="Dr. John Doe"
                                        value={form.name}
                                        onChange={e => set('name', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        className={cls(
                                            "input w-full pl-11 h-12 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white transition-all outline-none",
                                            form.email.length > 0 && (isEmailValid ? "border-emerald-500 ring-emerald-100 focus:ring-emerald-500/20" : "border-rose-500 ring-rose-100 focus:ring-rose-500/20")
                                        )}
                                        type="email"
                                        placeholder="john@university.edu"
                                        value={form.email}
                                        onChange={e => set('email', e.target.value)}
                                        required
                                    />
                                </div>
                                {form.email.length > 0 && !isEmailValid && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest ml-1 mt-1">Please enter a valid email</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        className="input w-full pr-10 h-12 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white transition-all outline-none"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min. 6 chars"
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <input
                                        className={`input w-full pr-10 h-12 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white transition-all outline-none ${form.confirmPassword.length > 0 ? (form.password === form.confirmPassword ? 'border-emerald-500 focus:ring-emerald-500/20 ring-emerald-100' : 'border-rose-500 focus:ring-rose-500/20 ring-rose-100') : ''}`}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Repeat password"
                                        value={form.confirmPassword}
                                        onChange={e => set('confirmPassword', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {form.confirmPassword.length > 0 && (
                                    <p className={`text-[10px] uppercase font-bold mt-1 ml-1 ${form.password === form.confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Department Laboratory</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <select
                                        className="input w-full pl-11 h-12 bg-slate-50/50 border-slate-100 hover:border-slate-200 focus:bg-white transition-all outline-none appearance-none"
                                        value={form.labId}
                                        onChange={e => set('labId', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Assigned Lab --</option>
                                        {labs.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} {l.location ? `(${l.location})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn w-full h-12 text-base font-bold shadow-lg shadow-indigo-200 mt-4 active:scale-[0.97] transition-all"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Initialize Student Profile'}
                        </button>
                    </form>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Member Already?</span>
                        </div>
                    </div>

                    <Link
                        to="/login"
                        className="group flex items-center justify-center gap-2 w-full h-12 rounded-xl text-indigo-600 font-bold text-sm bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 transition-all hover:scale-[1.01]"
                    >
                        Return to Sign In
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>

                <p className="text-center text-xs text-slate-400 font-medium">
                    &copy; 2026 LabVentory Systems. All rights reserved.
                </p>
            </div>
        </div>
    )
}
