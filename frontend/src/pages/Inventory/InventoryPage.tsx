import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { Inventory, Category } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, ConfirmDialog, EmptyState, Field, Icon, PageHeader, Pagination, SelectField, StatusBadge, iconButtonLabel } from '../../components/ui'

type ConfirmState = { id: number; name: string } | null

export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Inventory>>({})
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [savingCat, setSavingCat] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>(null)
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()

  const load = async (pageNum: number = 1, searchQuery: string = q, categoryId: number | 'all' = cat) => {
    setLoading(true)
    try {
      const [inv, cats] = await Promise.all([
        api.get('/inventory', { params: { page: pageNum, limit: 10, q: searchQuery || undefined, categoryId: categoryId === 'all' ? undefined : categoryId } }),
        api.get('/categories')
      ])
      setItems(inv.data.data)
      setTotalPages(inv.data.meta.totalPages)
      setTotalItems(inv.data.meta.total)
      setPage(inv.data.meta.page)
      setCategories(cats.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => load(1, q, cat), 300)
    return () => clearTimeout(timer)
  }, [q, cat])

  const submit = async () => {
    try {
      if (!form.name || !form.categoryId || form.totalStock == null) {
        toast.error('Please complete item name, category, and total stock')
        return
      }
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        totalStock: Number(form.totalStock),
        availableStock: Number(form.availableStock ?? form.totalStock),
        minStock: Number(form.minStock || 0),
        location: form.location,
        condition: form.condition
      }
      if ((form as any).id) {
        await api.put(`/inventory/${(form as any).id}`, payload)
        toast.success('Item updated successfully')
      } else {
        await api.post('/inventory', payload)
        toast.success('Item added to inventory')
      }
      setOpen(false)
      setForm({})
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save item')
    }
  }

  const saveNewCategory = async () => {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await api.post('/categories', { name: newCatName.trim(), labId: user?.labId || undefined })
      const created: Category = res.data
      setCategories(prev => [...prev, created])
      setForm(f => ({ ...f, categoryId: created.id }))
      setNewCatName('')
      setAddingCat(false)
      toast.success(`Category "${created.name}" created`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to create category')
    } finally {
      setSavingCat(false)
    }
  }

  const remove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/inventory/${confirmDelete.id}`)
      toast.success('Item deleted')
      setConfirmDelete(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete item')
    } finally {
      setDeleting(false)
    }
  }

  const downloadPdf = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' })
      const res = await api.get('/export/inventory', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = 'inventory_summary.pdf'
      link.click()
      toast.success('Downloaded successfully', { id: 'pdf' })
    } catch {
      toast.error('Failed to download PDF', { id: 'pdf' })
    }
  }

  const openModal = () => {
    setForm({})
    setNewCatName('')
    setAddingCat(false)
    setOpen(true)
  }

  const edit = (item: Inventory) => {
    setForm(item)
    setNewCatName('')
    setAddingCat(false)
    setOpen(true)
  }

  const categoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Uncategorized'
  const stockTone = (item: Inventory) => item.availableStock <= 0 ? 'rose' : item.availableStock <= item.minStock ? 'amber' : 'emerald'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Inventory"
        description="Manage equipment, stock levels, QR codes, and storage locations across laboratories."
        actions={
          <>
            {user?.role !== 'student' && <Button icon="plus" onClick={openModal}>Add Item</Button>}
            <Button variant="secondary" icon="download" onClick={downloadPdf}>PDF Report</Button>
          </>
        }
      />

      <section className="card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_16rem]">
          <Field icon="search" placeholder="Search items by name..." value={q} onChange={e => setQ(e.target.value)} aria-label="Search inventory" />
          <SelectField value={String(cat)} onChange={e => setCat(e.target.value === 'all' ? 'all' : Number(e.target.value))} aria-label="Filter category">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        </div>
      </section>

      <section className="table-shell">
        <div className="hidden overflow-x-auto md:block">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : items.length === 0 ? (
            <EmptyState title="No items found" description="Try changing your search or category filter." icon="package" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">QR</th>
                  {user?.role !== 'student' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-950">{item.name}</div>
                      <div className="text-xs font-medium text-slate-500">{item.location || 'No location set'}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge tone="indigo">{categoryName(item.categoryId)}</StatusBadge></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={stockTone(item) as any}>{item.availableStock} / {item.totalStock}</StatusBadge>
                        {item.availableStock <= item.minStock && <span className="text-xs font-bold text-rose-600">Low stock</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.qrCodeUrl ? <img src={item.qrCodeUrl} alt={`${item.name} QR code`} className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1" /> : <span className="text-xs text-slate-400">No QR</span>}
                    </td>
                    {user?.role !== 'student' && (
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="icon" onClick={() => edit(item)} {...iconButtonLabel(`Edit ${item.name}`)}><Icon name="edit" /></Button>
                          <Button variant="secondary" size="icon" onClick={() => setConfirmDelete({ id: item.id, name: item.name })} {...iconButtonLabel(`Delete ${item.name}`)}><Icon name="trash" className="text-rose-600" /></Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading ? (
            <TableSkeleton rows={5} cols={2} />
          ) : items.length === 0 ? (
            <EmptyState title="No items found" description="Try changing your search or category filter." icon="package" />
          ) : items.map(item => (
            <article key={item.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-slate-950">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.location || 'No location set'}</p>
                </div>
                <StatusBadge tone={stockTone(item) as any}>{item.availableStock}/{item.totalStock}</StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge tone="indigo">{categoryName(item.categoryId)}</StatusBadge>
                {item.availableStock <= item.minStock && <StatusBadge tone="rose">Low stock</StatusBadge>}
              </div>
              {user?.role !== 'student' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" icon="edit" onClick={() => edit(item)}>Edit</Button>
                  <Button variant="secondary" icon="trash" onClick={() => setConfirmDelete({ id: item.id, name: item.name })}>Delete</Button>
                </div>
              )}
            </article>
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={items.length}
          label="Items"
          loading={loading}
          onPrev={() => load(page - 1)}
          onNext={() => load(page + 1)}
        />
      </section>

      <Modal open={open} title={form.id ? 'Modify Equipment' : 'Register New Item'} onClose={() => setOpen(false)}>
        <div className="space-y-5">
          <Field label="Item name" placeholder="e.g., Oscilloscope TDS2024" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

          <div>
            <SelectField
              label="Category"
              value={form.categoryId || 0}
              onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
              disabled={addingCat}
            >
              <option value={0} disabled>-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            {!addingCat ? (
              <Button type="button" variant="ghost" size="sm" icon="plus" className="mt-2" onClick={() => setAddingCat(true)}>Create category</Button>
            ) : (
              <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Field className="flex-1" placeholder="Category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveNewCategory()} autoFocus />
                  <Button type="button" onClick={saveNewCategory} disabled={savingCat || !newCatName.trim()}>{savingCat ? 'Saving...' : 'Save'}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setAddingCat(false); setNewCatName('') }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Total stock" type="number" min={0} value={form.totalStock ?? ''} onChange={e => setForm(f => ({ ...f, totalStock: Number(e.target.value) }))} />
            <Field label="Available units" type="number" min={0} value={form.availableStock ?? ''} onChange={e => setForm(f => ({ ...f, availableStock: Number(e.target.value) }))} />
            <Field label="Min threshold" type="number" min={0} value={form.minStock ?? ''} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Storage location" placeholder="e.g., Cabinet B2 / shelf 3" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <Field label="Condition status" placeholder="e.g., Good / Slightly Damaged" value={form.condition || ''} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>Discard</Button>
            <Button onClick={submit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete inventory item?"
        description={`This will permanently delete "${confirmDelete?.name || 'this item'}" from inventory records.`}
        confirmLabel="Delete item"
        loading={deleting}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </div>
  )
}
