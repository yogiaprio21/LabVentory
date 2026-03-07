import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../hooks/useApi'
import toast from 'react-hot-toast'

export default function ProfilePage() {
    const { user } = useAuth()
    const [name, setName] = useState(user?.name || '')

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loading, setLoading] = useState(false)

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.put('/users/profile', { name })
            toast.success('Profile updated. Please sign in again to reflect all changes if needed.')
            // In a real app we might want to update the context/localStorage too
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match')
        }
        setLoading(true)
        try {
            await api.put('/users/change-password', { currentPassword, newPassword })
            toast.success('Password changed successfully')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your personal information and security settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Settings */}
                <div className="card p-8 bg-white shadow-xl shadow-slate-200/50 border-slate-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest text-[11px]">Personal Information</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6 flex-1">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Full Name</label>
                            <input
                                className="input-premium w-full text-sm py-4"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Email Address</label>
                            <input
                                className="input-premium w-full text-sm py-4 bg-slate-50 opacity-60 cursor-not-allowed"
                                value={user?.email}
                                disabled
                            />
                            <p className="text-[10px] text-slate-400 mt-2 italic">* Email cannot be changed</p>
                        </div>
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-premium w-full py-4 text-sm font-black shadow-indigo-100 disabled:opacity-50"
                            >
                                {loading ? 'Gardening...' : 'Update Profile Info'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security / Password */}
                <div className="card p-8 bg-white shadow-xl shadow-slate-200/50 border-slate-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest text-[11px]">Security Settings</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6 flex-1">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Current Password</label>
                            <input
                                type="password"
                                className="input-premium w-full text-sm py-4"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">New Password</label>
                            <input
                                type="password"
                                className="input-premium w-full text-sm py-4"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Confirm New Password</label>
                            <input
                                type="password"
                                className="input-premium w-full text-sm py-4"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-rose w-full py-4 text-sm font-black shadow-rose-100 disabled:opacity-50"
                            >
                                {loading ? 'Securing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
