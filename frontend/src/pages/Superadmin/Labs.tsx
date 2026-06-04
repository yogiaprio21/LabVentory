import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { Institution, Lab } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, ConfirmDialog, EmptyState, Field, Icon, PageHeader, Pagination, SelectField, iconButtonLabel } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isPlatformAdmin } from '../../utils/roles'

export default function Labs() {
  const { user } = useAuth()
  const platform = isPlatformAdmin(user)
  const [labs, setLabs] = useState<Lab[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [newInstitutionName, setNewInstitutionName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const [res, inst] = await Promise.all([
        api.get('/labs', { params: { page: pageNum, limit: 10 } }),
        platform ? api.get('/institutions') : Promise.resolve({ data: [] })
      ])
      setLabs(res.data.data)
      setInstitutions(inst.data)
      if (!institutionId && inst.data?.length) setInstitutionId(String(inst.data[0].id))
      setTotalPages(res.data.meta.totalPages)
      setTotalItems(res.data.meta.total)
      setPage(res.data.meta.page)
    } catch {
      toast.error('Failed to fetch laboratory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const reset = () => {
    setEditId(null)
    setName('')
    setLocation('')
    if (institutions[0]) setInstitutionId(String(institutions[0].id))
  }

  const save = async () => {
    if (!name || !location) return toast.error('Please fill in all lab details')
    if (!editId && platform && !institutionId) return toast.error('Please select an institution')
    try {
      if (editId) {
        await api.put(`/labs/${editId}`, { name, location })
        toast.success('Laboratory details updated')
        reset()
        load(page)
      } else {
        await api.post('/labs', { name, location, institutionId: institutionId ? Number(institutionId) : undefined })
        toast.success('Laboratory facility registered')
        reset()
        load(1)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save laboratory')
    }
  }

  const createInstitution = async () => {
    if (!newInstitutionName.trim()) return toast.error('Please enter an institution name')
    try {
      const res = await api.post('/institutions', { name: newInstitutionName.trim() })
      setInstitutions(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
      setInstitutionId(String(res.data.id))
      setNewInstitutionName('')
      toast.success('Institution created')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create institution')
    }
  }

  const remove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/labs/${confirmDelete.id}`)
      toast.success('Laboratory removed')
      setConfirmDelete(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to remove laboratory')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Laboratory Facilities" description="Manage physical lab locations and workspace assignments." />

      <section className="card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{editId ? 'Modify Laboratory' : 'Register New Facility'}</p>
          {editId && <Button variant="ghost" size="sm" onClick={reset}>Cancel edit</Button>}
        </div>
        {platform && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="New institution" placeholder="e.g. Faculty of Engineering" value={newInstitutionName} onChange={e => setNewInstitutionName(e.target.value)} />
            <Button variant="secondary" icon="building" onClick={createInstitution}>Create Institution</Button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          {platform && (
            <SelectField label="Institution" value={institutionId} onChange={e => setInstitutionId(e.target.value)}>
              <option value="">-- Select Institution --</option>
              {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </SelectField>
          )}
          <Field label="Laboratory name" placeholder="e.g. Physics Computing Lab" value={name} onChange={e => setName(e.target.value)} />
          <Field label="Physical location" placeholder="e.g. Building A, 3rd Floor" value={location} onChange={e => setLocation(e.target.value)} />
          <Button icon={editId ? 'check' : 'plus'} onClick={save}>{editId ? 'Update Lab' : 'Add Laboratory'}</Button>
        </div>
      </section>

      <section className="table-shell">
        <div className="hidden overflow-x-auto md:block">
          {loading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : labs.length === 0 ? (
            <EmptyState title="No laboratories registered" description="Create the first facility to assign users and inventory." icon="building" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Laboratory</th>
                  {platform && <th className="px-6 py-4">Institution</th>}
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{l.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-950">{l.name}</td>
                    {platform && <td className="px-6 py-4 font-medium text-slate-600">{l.institution?.name || `Institution ${l.institutionId}`}</td>}
                    <td className="px-6 py-4 font-medium text-slate-600">{l.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="icon" onClick={() => { setEditId(l.id); setName(l.name); setLocation(l.location); setInstitutionId(String(l.institutionId || '')) }} {...iconButtonLabel(`Edit ${l.name}`)}><Icon name="edit" /></Button>
                        <Button variant="secondary" size="icon" onClick={() => setConfirmDelete({ id: l.id, name: l.name })} {...iconButtonLabel(`Delete ${l.name}`)}><Icon name="trash" className="text-rose-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading ? <TableSkeleton rows={5} cols={2} /> : labs.length === 0 ? (
            <EmptyState title="No laboratories registered" description="Create the first facility to assign users and inventory." icon="building" />
          ) : labs.map(l => (
            <article key={l.id} className="mobile-record">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon name="building" /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-slate-950">{l.name}</h3>
                  {platform && <p className="text-xs font-semibold text-indigo-600">{l.institution?.name || `Institution ${l.institutionId}`}</p>}
                  <p className="text-sm text-slate-500">{l.location}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" icon="edit" onClick={() => { setEditId(l.id); setName(l.name); setLocation(l.location); setInstitutionId(String(l.institutionId || '')) }}>Edit</Button>
                <Button variant="secondary" icon="trash" onClick={() => setConfirmDelete({ id: l.id, name: l.name })}>Delete</Button>
              </div>
            </article>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} currentCount={labs.length} label="Labs" loading={loading} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
      </section>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete laboratory?"
        description={`This will remove "${confirmDelete?.name || 'this lab'}". Inventory assigned to this lab may also be affected.`}
        confirmLabel="Delete lab"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </div>
  )
}
