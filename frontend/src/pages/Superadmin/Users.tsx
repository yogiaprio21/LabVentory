import { useState, useEffect } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { User, Lab, Role } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, ConfirmDialog, EmptyState, Field, Icon, PageHeader, Pagination, SelectField, StatusBadge, iconButtonLabel } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isPlatformAdmin, roleLabel } from '../../utils/roles'

type EditState = { name: string; email: string; role: Role; labId: number | null }

const roleTone = (role: string) => ['superadmin', 'platform_admin'].includes(role) ? 'purple' : ['admin', 'lab_admin', 'institution_admin'].includes(role) ? 'indigo' : 'emerald'
const roleRequiresLab = (role: string) => ['admin', 'lab_admin', 'student'].includes(role)

export default function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', email: '', role: 'lab_admin', labId: null })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; confirmPassword: string; role: Role; labId: string }>({ name: '', email: '', password: '', confirmPassword: '', role: 'lab_admin', labId: '' })
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const [ur, lr] = await Promise.all([api.get('/users', { params: { page: pageNum, limit: 10 } }), api.get('/labs')])
      setUsers(ur.data.data)
      setTotalPages(ur.data.meta.totalPages)
      setTotalItems(ur.data.meta.total)
      setPage(ur.data.meta.page)
      setLabs(Array.isArray(lr.data) ? lr.data : (lr.data.data || []))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const startEdit = (u: User) => {
    setEditing(u.id)
    setEditState({ name: u.name, email: u.email, role: u.role, labId: u.labId })
  }

  const saveEdit = async (id: number) => {
    try {
      await api.put(`/users/${id}`, { ...editState, labId: editState.labId ? Number(editState.labId) : null })
      toast.success('User profile updated')
      setEditing(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update user')
    }
  }

  const remove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/users/${confirmDelete.id}`)
      toast.success('User deleted')
      setConfirmDelete(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const addUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addForm.email)) return toast.error('Please enter a valid email address')
    if (addForm.password !== addForm.confirmPassword) return toast.error('Passwords do not match')
    if (roleNeedsLabInput(addForm.role) && !addForm.labId) return toast.error('Please assign a laboratory')
    try {
      await api.post('/auth/register/admin', { ...addForm, labId: addForm.labId ? Number(addForm.labId) : null })
      toast.success('New user account created')
      setShowAdd(false)
      setAddForm({ name: '', email: '', password: '', confirmPassword: '', role: 'lab_admin', labId: '' })
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create user')
    }
  }

  const labName = (labId: number | null) => labId ? (labs.find(l => Number(l.id) === Number(labId))?.name ?? `Lab ${labId}`) : 'Unassigned'
  const roleOptions: Role[] = isPlatformAdmin(user)
    ? ['platform_admin', 'institution_admin', 'lab_admin', 'admin', 'student']
    : ['institution_admin', 'lab_admin', 'admin', 'student']
  const roleNeedsLabInput = (role: string) => roleRequiresLab(role) || (isPlatformAdmin(user) && role === 'institution_admin')

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Control access roles and laboratory assignments."
        actions={<Button icon={showAdd ? 'x' : 'plus'} variant={showAdd ? 'secondary' : 'primary'} onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Close' : 'Register User'}</Button>}
      />

      {showAdd && (
        <section className="card p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Icon name="users" />
            Create New Account
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" placeholder="e.g. John Doe" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            <Field label="Email address" type="email" placeholder="john@example.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            <Field label="Password" type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
            <Field label="Confirm password" type="password" value={addForm.confirmPassword} onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))} error={addForm.confirmPassword && addForm.password !== addForm.confirmPassword ? 'Passwords do not match.' : undefined} />
            <SelectField label="Access role" value={addForm.role} onChange={e => {
              const nextRole = e.target.value as Role
              setAddForm(f => ({ ...f, role: nextRole, labId: roleNeedsLabInput(nextRole) ? f.labId : '' }))
            }}>
              {roleOptions.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
            </SelectField>
            {roleNeedsLabInput(addForm.role) && (
              <SelectField label="Assigned laboratory" value={addForm.labId} onChange={e => setAddForm(f => ({ ...f, labId: e.target.value }))}>
                <option value="">-- Select a Laboratory --</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </SelectField>
            )}
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addUser}>Save User</Button>
          </div>
        </section>
      )}

      <section className="table-shell">
        <div className="hidden overflow-x-auto lg:block">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" description="Created accounts will appear here." icon="users" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Lab</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    {editing === u.id ? (
                      <>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{u.id}</td>
                        <td className="px-6 py-4 space-y-2">
                          <Field value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} aria-label="Edit name" />
                          <Field type="email" value={editState.email} onChange={e => setEditState(s => ({ ...s, email: e.target.value }))} aria-label="Edit email" />
                        </td>
                        <td className="px-6 py-4">
                          <SelectField value={editState.role} onChange={e => {
                            const nextRole = e.target.value as Role
                            setEditState(s => ({ ...s, role: nextRole, labId: roleNeedsLabInput(nextRole) ? s.labId : null }))
                          }} aria-label="Edit role">
                            {roleOptions.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                          </SelectField>
                        </td>
                        <td className="px-6 py-4">
                          {roleNeedsLabInput(editState.role) ? (
                            <SelectField value={editState.labId ?? ''} onChange={e => setEditState(s => ({ ...s, labId: e.target.value ? Number(e.target.value) : null }))} aria-label="Edit lab">
                              <option value="">-- None --</option>
                              {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </SelectField>
                          ) : <span className="text-xs font-bold text-slate-400">Institution scope</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => saveEdit(u.id)}>Update</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{u.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-950">{u.name}</div>
                          <div className="text-xs font-medium text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge tone={roleTone(u.role) as any}>{roleLabel(u.role)}</StatusBadge></td>
                        <td className="px-6 py-4 font-medium text-slate-600">{labName(u.labId)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="icon" onClick={() => startEdit(u)} {...iconButtonLabel(`Edit ${u.name}`)}><Icon name="edit" /></Button>
                            <Button variant="secondary" size="icon" onClick={() => setConfirmDelete({ id: u.id, name: u.name })} {...iconButtonLabel(`Delete ${u.name}`)}><Icon name="trash" className="text-rose-600" /></Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-3 lg:hidden">
          {loading ? <TableSkeleton rows={5} cols={2} /> : users.length === 0 ? (
            <EmptyState title="No users found" description="Created accounts will appear here." icon="users" />
          ) : users.map(u => (
            <article key={u.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-slate-950">{u.name}</h3>
                  <p className="truncate text-sm text-slate-500">{u.email}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{labName(u.labId)}</p>
                </div>
                <StatusBadge tone={roleTone(u.role) as any}>{roleLabel(u.role)}</StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" icon="edit" onClick={() => startEdit(u)}>Edit</Button>
                <Button variant="secondary" icon="trash" onClick={() => setConfirmDelete({ id: u.id, name: u.name })}>Delete</Button>
              </div>
            </article>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} currentCount={users.length} label="Users" loading={loading} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
      </section>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete user?"
        description={`This permanently deletes "${confirmDelete?.name || 'this user'}" and removes their access.`}
        confirmLabel="Delete user"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </div>
  )
}
