import { useState, useEffect } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { User, Lab } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'

type EditState = { name: string; email: string; role: string; labId: number | null }

export default function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [labs, setLabs] = useState<Lab[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<number | null>(null)
    const [editState, setEditState] = useState<EditState>({ name: '', email: '', role: 'admin', labId: null })

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // New user form
    const [showAdd, setShowAdd] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'admin', labId: '' })

    const load = async (pageNum: number = 1) => {
        setLoading(true)
        try {
            const [ur, lr] = await Promise.all([
                api.get(`/users?page=${pageNum}&limit=10`),
                api.get('/labs')
            ])
            setUsers(ur.data.data)
            setTotalPages(ur.data.meta.totalPages)
            setTotalItems(ur.data.meta.total)
            setPage(ur.data.meta.page)
            setLabs(lr.data)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load(1) }, [])

    const startEdit = (u: User) => {
        setEditing(u.id)
        setEditState({ name: u.name, email: u.email, role: u.role, labId: u.labId })
    }

    const cancelEdit = () => setEditing(null)

    const saveEdit = async (id: number) => {
        try {
            await api.put(`/users/${id}`, {
                ...editState,
                labId: editState.labId ? Number(editState.labId) : null
            })
            toast.success('User profile updated')
            setEditing(null)
            load(page)
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to update user')
        }
    }

    const remove = (id: number, name: string) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-medium text-gray-800 text-sm">Permanently delete user "{name}"?</span>
                <div className="flex gap-2 justify-end mt-1">
                    <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 transition-all" onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await api.delete(`/users/${id}`)
                            toast.success('User deleted')
                            load(page)
                        } catch (e: any) {
                            toast.error(e?.response?.data?.error || 'Failed to delete user')
                        }
                    }}>Delete</button>
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                </div>
            </div>
        ), { duration: Infinity, id: `del-user-${id}` })
    }

    const addUser = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(addForm.email)) {
            toast.error('Please enter a valid email address')
            return
        }
        if (addForm.password !== addForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        try {
            await api.post('/auth/register/admin', {
                ...addForm,
                labId: addForm.labId ? Number(addForm.labId) : null
            })
            toast.success('New user account created')
            setShowAdd(false)
            setAddForm({ name: '', email: '', password: '', confirmPassword: '', role: 'admin', labId: '' })
            load(1)
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to create user')
        }
    }

    const roleBadge = (role: string) => {
        const map: Record<string, { bg: string, text: string }> = {
            superadmin: { bg: 'bg-purple-50', text: 'text-purple-700 font-bold' },
            admin: { bg: 'bg-indigo-50', text: 'text-indigo-700 font-bold' },
            student: { bg: 'bg-emerald-50', text: 'text-emerald-700 font-bold' }
        }
        return map[role] || { bg: 'bg-gray-50', text: 'text-gray-500' }
    }

    if (loading) return (
        <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded-lg w-48" />
                <div className="h-10 bg-gray-200 rounded-lg w-32" />
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Control access roles and laboratory assignments</p>
                </div>
                <button className={`btn transition-all ${showAdd ? 'bg-gray-100 !text-gray-600 hover:bg-gray-200 shadow-none' : ''}`} onClick={() => setShowAdd(v => !v)}>
                    {showAdd ? 'Close' : '+ Register User'}
                </button>
            </div>

            {/* Add User Form */}
            {showAdd && (
                <div className="card p-6 border-indigo-100 bg-indigo-50/10 shadow-lg shadow-indigo-900/5">
                    <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-6">Create New Account</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Full Name</label>
                            <input className="input w-full" placeholder="e.g. John Doe" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Email Address</label>
                            <input className="input w-full" type="email" placeholder="john@example.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Password</label>
                            <div className="relative">
                                <input
                                    className="input w-full pr-10"
                                    type={showPassword ? "text" : "password"}
                                    value={addForm.password}
                                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    className={`input w-full pr-10 ${addForm.confirmPassword.length > 0 ? (addForm.password === addForm.confirmPassword ? 'border-emerald-500 focus:ring-emerald-500 ring-emerald-100' : 'border-rose-500 focus:ring-rose-500 ring-rose-100') : ''}`}
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={addForm.confirmPassword}
                                    onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                            {addForm.confirmPassword.length > 0 && (
                                <p className={`text-[10px] uppercase font-bold mt-1 ${addForm.password === addForm.confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {addForm.password === addForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Access Role</label>
                            <select className="input w-full" value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                                <option value="superadmin">Superadmin</option>
                                <option value="admin">Administrator</option>
                                <option value="student">Student</option>
                            </select>
                        </div>
                        {addForm.role !== 'superadmin' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-1">Assigned Laboratory</label>
                                <select className="input w-full" value={addForm.labId} onChange={e => setAddForm(f => ({ ...f, labId: e.target.value }))}>
                                    <option value="">-- Select a Laboratory --</option>
                                    {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button className="btn px-8" onClick={addUser}>Save User</button>
                        <button className="btn-secondary px-8" onClick={() => setShowAdd(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-left font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Access Level</th>
                                <th className="px-6 py-4">Department/Lab</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                    {editing === u.id ? (
                                        <>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{u.id}</td>
                                            <td className="px-6 py-4 space-y-2">
                                                <input className="input w-full" value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} />
                                                <input className="input w-full text-xs" type="email" value={editState.email} onChange={e => setEditState(s => ({ ...s, email: e.target.value }))} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select className="input w-full py-1 text-xs" value={editState.role} onChange={e => setEditState(s => ({ ...s, role: e.target.value }))}>
                                                    <option value="superadmin">Superadmin</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="student">Student</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select className="input w-full py-1 text-xs" value={editState.labId ?? ''} onChange={e => setEditState(s => ({ ...s, labId: e.target.value ? Number(e.target.value) : null }))}>
                                                    <option value="">-- None --</option>
                                                    {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-3 justify-end items-center">
                                                    <button className="text-emerald-600 font-bold text-xs uppercase hover:underline" onClick={() => saveEdit(u.id)}>Update</button>
                                                    <button className="text-gray-400 font-bold text-xs uppercase hover:underline" onClick={cancelEdit}>Cancel</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{u.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{u.name}</div>
                                                <div className="text-xs text-gray-500 font-medium">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${roleBadge(u.role).bg} ${roleBadge(u.role).text} capitalize text-[10px]`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-600">
                                                {u.labId ? (labs.find(l => Number(l.id) === Number(u.labId))?.name ?? `Lab ${u.labId}`) : <span className="text-gray-300 italic">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-4 justify-end">
                                                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-tight" onClick={() => startEdit(u)}>Edit</button>
                                                    <button className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase tracking-tight" onClick={() => remove(u.id, u.name)}>Delete</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No system users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Showing <span className="text-indigo-600">{users.length}</span> of <span className="text-gray-900">{totalItems}</span> Users
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 transition-all hover:bg-gray-50 active:scale-95"
                            onClick={() => load(page - 1)}
                            disabled={page === 1 || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <span className="text-xs font-bold text-indigo-600 tracking-tighter">Page {page}</span>
                            <span className="text-xs font-bold text-gray-400 capitalize">of {totalPages}</span>
                        </div>
                        <button
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 transition-all hover:bg-gray-50 active:scale-95"
                            onClick={() => load(page + 1)}
                            disabled={page === totalPages || loading}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
