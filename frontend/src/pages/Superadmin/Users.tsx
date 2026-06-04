import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { User, Lab, Role, Institution } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, ConfirmDialog, EmptyState, Field, Icon, PageHeader, Pagination, SelectField, StatusBadge, iconButtonLabel } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isPlatformAdmin, roleLabel } from '../../utils/roles'
import { can } from '../../config/accessControl'

type EditState = { name: string; email: string; role: Role; labId: number | null }
type Invitation = {
  id: number
  code: string
  inviteeEmail?: string | null
  role: Role
  status: string
  maxUses: number
  usedCount: number
  expiresAt: string
  institution?: { id: number; name: string }
  lab?: Lab | null
}

const roleTone = (role: string) => ['superadmin', 'platform_admin'].includes(role) ? 'purple' : ['admin', 'lab_admin', 'institution_admin'].includes(role) ? 'indigo' : 'emerald'
const roleRequiresLab = (role: string) => ['admin', 'lab_admin', 'student'].includes(role)
const tenantRoles: Role[] = ['institution_admin', 'lab_admin', 'admin', 'student']
const inviteRoles: Role[] = ['student', 'lab_admin', 'admin', 'institution_admin']

export default function Users() {
  const { user } = useAuth()
  const platform = isPlatformAdmin(user)
  const canCreateUser = can(user, 'user.create')
  const canUpdateUser = can(user, 'user.update')
  const canDeactivateUser = can(user, 'user.deactivate')
  const canCreatePlatformUser = can(user, 'platformUser.create')
  const canManagePlatformUser = can(user, 'platformUser.manage')
  const canCreateInvitation = can(user, 'invitation.create')
  const [users, setUsers] = useState<User[]>([])
  const [platformAdmins, setPlatformAdmins] = useState<User[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [platformLoading, setPlatformLoading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', email: '', role: 'lab_admin', labId: null })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; confirmPassword: string; role: Role; labId: string }>({ name: '', email: '', password: '', confirmPassword: '', role: 'lab_admin', labId: '' })
  const [platformForm, setPlatformForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPlatformForm, setShowPlatformForm] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteForm, setInviteForm] = useState<{ role: Role; labId: string; maxUses: number; inviteeEmail: string }>({ role: 'student', labId: '', maxUses: 1, inviteeEmail: '' })
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [copiedInviteUrl, setCopiedInviteUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const selectedInstitution = institutions.find(i => String(i.id) === selectedInstitutionId)
  const hasTenantContext = !platform || !!selectedInstitutionId
  const inviteRoleNeedsLab = (role: string) => roleRequiresLab(role)
  const labName = (labId: number | null) => labId ? (labs.find(l => Number(l.id) === Number(labId))?.name ?? `Lab ${labId}`) : 'Unassigned'

  const loadPlatformAdmins = async () => {
    if (!platform) return
    setPlatformLoading(true)
    try {
      const res = await api.get('/users', { params: { scope: 'platform', page: 1, limit: 50 } })
      setPlatformAdmins(res.data.data || [])
    } finally {
      setPlatformLoading(false)
    }
  }

  const loadInstitutions = async () => {
    if (!platform) return
    const res = await api.get('/institutions')
    const data = res.data || []
    setInstitutions(data)
    if (!data.length) setLoading(false)
    setSelectedInstitutionId(current => current || (data[0]?.id ? String(data[0].id) : ''))
  }

  const load = async (pageNum: number = 1) => {
    if (!hasTenantContext) {
      setLoading(false)
      setUsers([])
      setLabs([])
      setInvitations([])
      return
    }
    setLoading(true)
    try {
      const params = platform ? { institutionId: Number(selectedInstitutionId) } : {}
      const [ur, lr, ir] = await Promise.all([
        api.get('/users', { params: { page: pageNum, limit: 10, ...params } }),
        api.get('/labs', { params }),
        api.get('/invitations', { params })
      ])
      setUsers(ur.data.data)
      setTotalPages(ur.data.meta.totalPages)
      setTotalItems(ur.data.meta.total)
      setPage(ur.data.meta.page)
      setLabs(Array.isArray(lr.data) ? lr.data : (lr.data.data || []))
      setInvitations(ir.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (platform) {
      Promise.all([loadInstitutions(), loadPlatformAdmins()]).catch(() => toast.error('Failed to load platform workspace'))
    }
  }, [platform])

  useEffect(() => {
    if (!platform || selectedInstitutionId) load(1).catch(() => toast.error('Failed to load tenant users'))
  }, [platform, selectedInstitutionId])

  const startEdit = (u: User) => {
    setEditing(u.id)
    setEditState({ name: u.name, email: u.email, role: u.role, labId: u.labId })
  }

  const saveEdit = async (id: number) => {
    try {
      await api.put(`/users/${id}`, { ...editState, labId: editState.labId ? Number(editState.labId) : null, institutionId: platform ? Number(selectedInstitutionId) : undefined })
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
      toast.success('User deactivated')
      setConfirmDelete(null)
      load(page)
      loadPlatformAdmins()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to deactivate user')
    } finally {
      setDeleting(false)
    }
  }

  const addUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!hasTenantContext) return toast.error('Create or select an institution first')
    if (!emailRegex.test(addForm.email)) return toast.error('Please enter a valid email address')
    if (addForm.password !== addForm.confirmPassword) return toast.error('Passwords do not match')
    if (roleRequiresLab(addForm.role) && !addForm.labId) return toast.error('Please assign a laboratory')
    try {
      await api.post('/auth/register/admin', {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        labId: addForm.labId ? Number(addForm.labId) : null,
        institutionId: platform ? Number(selectedInstitutionId) : undefined
      })
      toast.success('New tenant user account created')
      setShowAdd(false)
      setAddForm({ name: '', email: '', password: '', confirmPassword: '', role: 'lab_admin', labId: '' })
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create user')
    }
  }

  const addPlatformAdmin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(platformForm.email)) return toast.error('Please enter a valid platform admin email')
    if (platformForm.password !== platformForm.confirmPassword) return toast.error('Passwords do not match')
    try {
      await api.post('/auth/register/admin', {
        name: platformForm.name,
        email: platformForm.email,
        password: platformForm.password,
        role: 'platform_admin'
      })
      toast.success('Platform admin created')
      setShowPlatformForm(false)
      setPlatformForm({ name: '', email: '', password: '', confirmPassword: '' })
      loadPlatformAdmins()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create platform admin')
    }
  }

  const createInvite = async () => {
    if (!hasTenantContext) return toast.error('Create or select an institution first')
    if (inviteRoleNeedsLab(inviteForm.role) && !inviteForm.labId) return toast.error('Please select a lab for this invite role')
    setCreatingInvite(true)
    try {
      const res = await api.post('/invitations', {
        role: inviteForm.role,
        institutionId: platform ? Number(selectedInstitutionId) : undefined,
        labId: inviteForm.labId ? Number(inviteForm.labId) : null,
        inviteeEmail: inviteForm.inviteeEmail.trim() || undefined,
        maxUses: Number(inviteForm.maxUses || 1)
      })
      setInvitations(prev => [res.data, ...prev])
      setInviteForm({ role: 'student', labId: '', maxUses: 1, inviteeEmail: '' })
      toast.success('Invitation link created')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create invitation')
    } finally {
      setCreatingInvite(false)
    }
  }

  const copyInvite = async (code: string) => {
    const url = `${window.location.origin}/register?invite=${code}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedInviteUrl('')
      toast.success('Invite link copied')
    } catch {
      setCopiedInviteUrl(url)
      toast.error('Clipboard blocked. Copy the link from the fallback field.')
    }
  }

  const setUserStatus = async (id: number, status: 'active' | 'inactive', platformScope = false) => {
    try {
      await api.put(`/users/${id}`, { status })
      toast.success(status === 'active' ? 'User activated' : 'User deactivated')
      platformScope ? loadPlatformAdmins() : load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update user status')
    }
  }

  const renderTenantContext = () => platform && (
    <section className="card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <SelectField
          label="Institution context"
          icon="building"
          value={selectedInstitutionId}
          onChange={e => {
            setSelectedInstitutionId(e.target.value)
            setEditing(null)
            setAddForm({ name: '', email: '', password: '', confirmPassword: '', role: 'lab_admin', labId: '' })
            setInviteForm({ role: 'student', labId: '', maxUses: 1, inviteeEmail: '' })
          }}
        >
          <option value="">-- Select Institution --</option>
          {institutions.map(i => <option key={i.id} value={i.id}>{i.name} ({i.registrationMode || 'invite'})</option>)}
        </SelectField>
        <Link to="/superadmin/institutions" className="btn-secondary h-10 px-4">
          <Icon name="building" />
          Manage Institutions
        </Link>
      </div>
      {!institutions.length && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Create an institution first</p>
          <p className="mt-1 text-sm font-medium text-amber-800">Tenant users and invitations need an institution context before they can be created.</p>
        </div>
      )}
    </section>
  )

  const renderStatusActions = (u: User, platformScope = false) => (
    <div className="flex justify-end gap-2">
      {!platformScope && canUpdateUser && <Button variant="secondary" size="icon" onClick={() => startEdit(u)} {...iconButtonLabel(`Edit ${u.name}`)}><Icon name="edit" /></Button>}
      {u.status === 'inactive' ? (
        (platformScope ? canManagePlatformUser : canDeactivateUser) &&
        <Button variant="secondary" size="icon" onClick={() => setUserStatus(u.id, 'active', platformScope)} {...iconButtonLabel(`Activate ${u.name}`)}><Icon name="refresh" className="text-emerald-600" /></Button>
      ) : (
        (platformScope ? canManagePlatformUser : canDeactivateUser) &&
        <Button variant="secondary" size="icon" onClick={() => setConfirmDelete({ id: u.id, name: u.name })} {...iconButtonLabel(`Deactivate ${u.name}`)}><Icon name="trash" className="text-rose-600" /></Button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={platform ? 'Choose an institution before managing tenant users and invitations.' : 'Control access roles and laboratory assignments for your institution.'}
        actions={canCreateUser && <Button icon={showAdd ? 'x' : 'plus'} variant={showAdd ? 'secondary' : 'primary'} disabled={!hasTenantContext} onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Close' : 'Register Tenant User'}</Button>}
      />

      {renderTenantContext()}

      {platform && (
        <section className="card p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Platform admins</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Global operators are separate from tenant users and do not need institution or lab assignment.</p>
            </div>
            {canCreatePlatformUser && <Button variant={showPlatformForm ? 'secondary' : 'primary'} icon={showPlatformForm ? 'x' : 'plus'} onClick={() => setShowPlatformForm(v => !v)}>{showPlatformForm ? 'Close' : 'Add Platform Admin'}</Button>}
          </div>
          {showPlatformForm && canCreatePlatformUser && (
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Name" value={platformForm.name} onChange={e => setPlatformForm(f => ({ ...f, name: e.target.value }))} />
              <Field label="Email" type="email" value={platformForm.email} onChange={e => setPlatformForm(f => ({ ...f, email: e.target.value }))} />
              <Field label="Password" type="password" value={platformForm.password} onChange={e => setPlatformForm(f => ({ ...f, password: e.target.value }))} />
              <Field label="Confirm" type="password" value={platformForm.confirmPassword} onChange={e => setPlatformForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              <Button icon="shield" onClick={addPlatformAdmin}>Save Admin</Button>
            </div>
          )}
          {platformLoading ? <TableSkeleton rows={2} cols={4} /> : (
            <div className="grid gap-2 lg:grid-cols-2">
              {platformAdmins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{admin.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={admin.status === 'inactive' ? 'slate' : 'emerald'}>{admin.status || 'active'}</StatusBadge>
                    {renderStatusActions(admin, true)}
                  </div>
                </div>
              ))}
              {!platformAdmins.length && <EmptyState title="No platform admins found" description="Create a global operator only for trusted maintainers." icon="shield" />}
            </div>
          )}
        </section>
      )}

      {showAdd && canCreateUser && (
        <section className="card p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Icon name="users" />
            Create Tenant Account {selectedInstitution?.name ? `for ${selectedInstitution.name}` : ''}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" placeholder="e.g. John Doe" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            <Field label="Email address" type="email" placeholder="john@example.com" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            <Field label="Password" type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
            <Field label="Confirm password" type="password" value={addForm.confirmPassword} onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))} error={addForm.confirmPassword && addForm.password !== addForm.confirmPassword ? 'Passwords do not match.' : undefined} />
            <SelectField label="Tenant role" value={addForm.role} onChange={e => {
              const nextRole = e.target.value as Role
              setAddForm(f => ({ ...f, role: nextRole, labId: roleRequiresLab(nextRole) ? f.labId : '' }))
            }}>
              {tenantRoles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
            </SelectField>
            {roleRequiresLab(addForm.role) && (
              <SelectField label="Assigned laboratory" value={addForm.labId} onChange={e => setAddForm(f => ({ ...f, labId: e.target.value }))}>
                <option value="">-- Select a Laboratory --</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </SelectField>
            )}
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={addUser}>Save Tenant User</Button>
          </div>
        </section>
      )}

      <section className="card p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Invitation registration</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Create tenant-safe registration links tied to {selectedInstitution?.name || 'the selected institution'}.</p>
          </div>
          <StatusBadge tone="indigo">{invitations.length} active/history</StatusBadge>
        </div>
        {!canCreateInvitation ? (
          <EmptyState title="Invitation creation unavailable" description="Your role can view tenant users but cannot create registration invitations." icon="key" />
        ) : !hasTenantContext ? (
          <EmptyState title="Select an institution first" description="Invitations must belong to one institution so new users land in the right tenant." icon="key" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)_8rem_auto] md:items-end">
              <SelectField label="Invite role" value={inviteForm.role} onChange={e => {
                const role = e.target.value as Role
                setInviteForm(f => ({ ...f, role, labId: inviteRoleNeedsLab(role) ? f.labId : '' }))
              }}>
                {inviteRoles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
              </SelectField>
              <SelectField label="Lab scope" value={inviteForm.labId} disabled={!inviteRoleNeedsLab(inviteForm.role)} onChange={e => setInviteForm(f => ({ ...f, labId: e.target.value }))}>
                <option value="">{inviteRoleNeedsLab(inviteForm.role) ? '-- Select Lab --' : 'Institution scope'}</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </SelectField>
              <Field label="Invitee email" type="email" placeholder="Optional, recommended for admins" value={inviteForm.inviteeEmail} onChange={e => setInviteForm(f => ({ ...f, inviteeEmail: e.target.value }))} />
              <Field label="Max uses" type="number" min={1} max={500} value={inviteForm.maxUses} onChange={e => setInviteForm(f => ({ ...f, maxUses: Number(e.target.value) }))} />
              <Button icon="key" onClick={createInvite} disabled={creatingInvite}>{creatingInvite ? 'Creating...' : 'Create Invite'}</Button>
            </div>

            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {invitations.slice(0, 6).map(invite => (
                <div key={invite.id} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{roleLabel(invite.role)} - {invite.lab?.name || invite.institution?.name || 'Institution scope'}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{invite.inviteeEmail ? `${invite.inviteeEmail} - ` : ''}{invite.usedCount}/{invite.maxUses} used - expires {invite.expiresAt.slice(0, 10)}</p>
                  </div>
                  <Button variant="secondary" size="sm" icon="key" onClick={() => copyInvite(invite.code)}>Copy Link</Button>
                </div>
              ))}
            </div>
            {copiedInviteUrl && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Field label="Copy invite link" value={copiedInviteUrl} readOnly onFocus={e => e.currentTarget.select()} />
              </div>
            )}
          </>
        )}
      </section>

      <section className="table-shell">
        <div className="hidden overflow-x-auto lg:block">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : users.length === 0 ? (
            <EmptyState title={hasTenantContext ? 'No tenant users found' : 'Select an institution first'} description={hasTenantContext ? 'Created tenant accounts will appear here.' : 'Create an institution before adding tenant users.'} icon="users" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
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
                            setEditState(s => ({ ...s, role: nextRole, labId: roleRequiresLab(nextRole) ? s.labId : null }))
                          }} aria-label="Edit role">
                            {tenantRoles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
                          </SelectField>
                        </td>
                        <td className="px-6 py-4"><StatusBadge tone={u.status === 'inactive' ? 'slate' : 'emerald'}>{u.status || 'active'}</StatusBadge></td>
                        <td className="px-6 py-4">
                          {roleRequiresLab(editState.role) ? (
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
                        <td className="px-6 py-4"><StatusBadge tone={u.status === 'inactive' ? 'slate' : 'emerald'}>{u.status || 'active'}</StatusBadge></td>
                        <td className="px-6 py-4 font-medium text-slate-600">{labName(u.labId)}</td>
                        <td className="px-6 py-4">{renderStatusActions(u)}</td>
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
            <EmptyState title={hasTenantContext ? 'No tenant users found' : 'Select an institution first'} description={hasTenantContext ? 'Created tenant accounts will appear here.' : 'Create an institution before adding tenant users.'} icon="users" />
          ) : users.map(u => (
            <article key={u.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-slate-950">{u.name}</h3>
                  <p className="truncate text-sm text-slate-500">{u.email}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{labName(u.labId)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge tone={roleTone(u.role) as any}>{roleLabel(u.role)}</StatusBadge>
                  <StatusBadge tone={u.status === 'inactive' ? 'slate' : 'emerald'}>{u.status || 'active'}</StatusBadge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {canUpdateUser && <Button variant="secondary" icon="edit" onClick={() => startEdit(u)}>Edit</Button>}
                {u.status === 'inactive' ? (
                  canDeactivateUser && <Button variant="secondary" icon="refresh" onClick={() => setUserStatus(u.id, 'active')}>Activate</Button>
                ) : (
                  canDeactivateUser && <Button variant="secondary" icon="trash" onClick={() => setConfirmDelete({ id: u.id, name: u.name })}>Deactivate</Button>
                )}
              </div>
            </article>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} currentCount={users.length} label="Tenant Users" loading={loading} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
      </section>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Deactivate user?"
        description={`This will remove access for "${confirmDelete?.name || 'this user'}" while keeping audit and borrowing history.`}
        confirmLabel="Deactivate user"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </div>
  )
}
