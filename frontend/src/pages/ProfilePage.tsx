import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../hooks/useApi'
import toast from 'react-hot-toast'
import { Button, Field, Icon, PageHeader } from '../components/ui'
import { roleLabel } from '../utils/roles'

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await api.put('/users/profile', { name })
      toast.success('Profile updated. Please sign in again if the header still shows old data.')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setPasswordLoading(true)
    try {
      await api.put('/users/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your personal information and account security." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-600 text-2xl font-black text-white shadow-sm shadow-indigo-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-slate-950">{user?.name}</p>
              <p className="truncate text-sm font-medium text-slate-500">{user?.email}</p>
              <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold capitalize text-indigo-700">{roleLabel(user?.role)}</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-bold text-slate-800">Account scope</p>
            <p className="mt-1">Institution: {user?.institution?.name || 'Platform scope'}</p>
            <p className="mt-1">Lab: {user?.lab?.name || (user?.labId ? `Lab ${user.labId}` : 'All assigned scope')}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <form onSubmit={handleUpdateProfile} className="card p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon name="user" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-950">Personal Information</h2>
                <p className="text-sm text-slate-500">Update your display name.</p>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Full name" value={name} onChange={e => setName(e.target.value)} required />
              <Field label="Email address" value={user?.email || ''} disabled />
              <Button type="submit" className="w-full" disabled={profileLoading}>
                {profileLoading ? 'Updating...' : 'Update Profile Info'}
              </Button>
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="card p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <Icon name="lock" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-950">Security Settings</h2>
                <p className="text-sm text-slate-500">Change your password safely.</p>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Current password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
              <Field label="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              <Field
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match.' : undefined}
              />
              <Button type="submit" variant="danger" className="w-full" disabled={passwordLoading}>
                {passwordLoading ? 'Securing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
