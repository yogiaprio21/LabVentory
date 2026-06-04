import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../hooks/useApi'
import type { Institution } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, EmptyState, Field, Icon, PageHeader, SelectField, StatusBadge, iconButtonLabel } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { can } from '../../config/accessControl'

type InstitutionRow = Institution & { _count?: { labs: number; users: number } }

const emptyCreate = {
  name: '',
  slug: '',
  domain: '',
  registrationMode: 'invite',
  adminName: '',
  adminEmail: '',
  adminPassword: ''
}

export default function Institutions() {
  const { user } = useAuth()
  const canCreateInstitution = can(user, 'institution.create')
  const canUpdateInstitution = can(user, 'institution.update')
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', domain: '', status: 'active', registrationMode: 'invite' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/institutions')
      setInstitutions(res.data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to load institutions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createInstitution = async () => {
    if (!createForm.name.trim()) return toast.error('Institution name is required')
    try {
      const payload: any = {
        name: createForm.name.trim(),
        slug: createForm.slug.trim() || undefined,
        domain: createForm.domain.trim() || null,
        registrationMode: createForm.registrationMode
      }
      if (createForm.adminName && createForm.adminEmail && createForm.adminPassword) {
        payload.admin = {
          name: createForm.adminName,
          email: createForm.adminEmail,
          password: createForm.adminPassword
        }
      }
      await api.post('/institutions', payload)
      toast.success('Institution created')
      setCreateForm(emptyCreate)
      setShowCreate(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create institution')
    }
  }

  const startEdit = (institution: InstitutionRow) => {
    setEditingId(institution.id)
    setEditForm({
      name: institution.name,
      slug: institution.slug,
      domain: institution.domain || '',
      status: institution.status || 'active',
      registrationMode: institution.registrationMode || 'invite'
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      await api.put(`/institutions/${editingId}`, {
        name: editForm.name,
        slug: editForm.slug,
        domain: editForm.domain || null,
        status: editForm.status,
        registrationMode: editForm.registrationMode
      })
      toast.success('Institution updated')
      setEditingId(null)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update institution')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Create and maintain tenant workspaces before adding labs, admins, users, or invitations."
        actions={canCreateInstitution && <Button icon={showCreate ? 'x' : 'plus'} variant={showCreate ? 'secondary' : 'primary'} onClick={() => setShowCreate(v => !v)}>{showCreate ? 'Close' : 'Create Institution'}</Button>}
      />

      {showCreate && canCreateInstitution && (
        <section className="card p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Icon name="building" />
            New tenant workspace
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Institution name" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
            <Field label="Slug" placeholder="auto from name" value={createForm.slug} onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))} />
            <Field label="Domain" placeholder="example.ac.id" value={createForm.domain} onChange={e => setCreateForm(f => ({ ...f, domain: e.target.value }))} />
            <SelectField label="Registration mode" value={createForm.registrationMode} onChange={e => setCreateForm(f => ({ ...f, registrationMode: e.target.value }))}>
              <option value="invite">Invite only</option>
              <option value="public">Public registration</option>
            </SelectField>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="First admin name" placeholder="Optional" value={createForm.adminName} onChange={e => setCreateForm(f => ({ ...f, adminName: e.target.value }))} />
            <Field label="First admin email" type="email" placeholder="admin@example.ac.id" value={createForm.adminEmail} onChange={e => setCreateForm(f => ({ ...f, adminEmail: e.target.value }))} />
            <Field label="First admin password" type="password" placeholder="Min. 6 chars" value={createForm.adminPassword} onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button icon="building" onClick={createInstitution}>Save Institution</Button>
          </div>
        </section>
      )}

      <section className="table-shell">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : institutions.length === 0 ? (
            <EmptyState title="No institutions yet" description="Create an institution first, then add labs, admins, users, and invitations." icon="building" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Institution</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Usage</th>
                  {canUpdateInstitution && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map(institution => (
                  <tr key={institution.id} className="hover:bg-slate-50/80">
                    {editingId === institution.id ? (
                      <>
                        <td className="px-6 py-4 space-y-2">
                          <Field value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} aria-label="Edit institution name" />
                          <Field value={editForm.domain} onChange={e => setEditForm(f => ({ ...f, domain: e.target.value }))} aria-label="Edit domain" placeholder="Domain" />
                        </td>
                        <td className="px-6 py-4"><Field value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} aria-label="Edit slug" /></td>
                        <td className="px-6 py-4">
                          <SelectField value={editForm.registrationMode} onChange={e => setEditForm(f => ({ ...f, registrationMode: e.target.value }))} aria-label="Edit registration mode">
                            <option value="invite">Invite only</option>
                            <option value="public">Public</option>
                          </SelectField>
                        </td>
                        <td className="px-6 py-4">
                          <SelectField value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} aria-label="Edit status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="archived">Archived</option>
                          </SelectField>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{institution._count?.labs || 0} labs / {institution._count?.users || 0} users</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={saveEdit}>Save</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-950">{institution.name}</p>
                          <p className="text-xs font-medium text-slate-500">{institution.domain || 'No domain set'}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{institution.slug}</td>
                        <td className="px-6 py-4"><StatusBadge tone={institution.registrationMode === 'public' ? 'emerald' : 'indigo'}>{institution.registrationMode || 'invite'}</StatusBadge></td>
                        <td className="px-6 py-4"><StatusBadge tone={institution.status === 'active' ? 'emerald' : 'slate'}>{institution.status || 'active'}</StatusBadge></td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{institution._count?.labs || 0} labs / {institution._count?.users || 0} users</td>
                        {canUpdateInstitution && <td className="px-6 py-4 text-right">
                          <Button variant="secondary" size="icon" onClick={() => startEdit(institution)} {...iconButtonLabel(`Edit ${institution.name}`)}><Icon name="edit" /></Button>
                        </td>}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
