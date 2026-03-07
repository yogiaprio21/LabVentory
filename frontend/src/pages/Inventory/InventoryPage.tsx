import { useEffect, useMemo, useState } from 'react'
import { api } from '../../hooks/useApi'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { Inventory, Category } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import TableSkeleton from '../../components/TableSkeleton'

export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | 'all'>('all')

  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Inventory>>({})

  // Category creation state
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [savingCat, setSavingCat] = useState(false)

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

      if (pageNum !== 1 || searchQuery || categoryId !== 'all') {
        window.scrollTo({ top: 300, behavior: 'smooth' })
      }
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
      if (!form.name || !form.categoryId || form.totalStock == null) return
      if ((form as any).id) {
        await api.put(`/inventory/${(form as any).id}`, {
          name: form.name, categoryId: form.categoryId, totalStock: form.totalStock, availableStock: form.availableStock ?? form.totalStock, minStock: form.minStock || 0, location: form.location, condition: form.condition
        })
        toast.success('Item updated successfully')
      } else {
        await api.post('/inventory', {
          name: form.name, categoryId: form.categoryId, totalStock: form.totalStock, availableStock: form.availableStock ?? form.totalStock, minStock: form.minStock || 0, location: form.location, condition: form.condition
        })
        toast.success('Item added to inventory')
      }
      setOpen(false); setForm({})
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save item')
    }
  }

  const { user } = useAuth()

  // Save new category then auto-select it
  const saveNewCategory = async () => {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await api.post('/categories', {
        name: newCatName.trim(),
        labId: user?.labId || undefined
      })
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

  const openModal = () => {
    setForm({})
    setNewCatName('')
    setAddingCat(false)
    setOpen(true)
  }

  const edit = (i: Inventory) => { setForm(i); setNewCatName(''); setAddingCat(false); setOpen(true) }
  const remove = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Are you sure you want to delete this item?</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/inventory/${id}`)
              toast.success('Item deleted')
              load(page)
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to delete item')
            }
          }}>Delete</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `del-inv-${id}` })
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
    } catch (e: any) {
      toast.error('Failed to download PDF', { id: 'pdf' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all equipment across laboratories</p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'student' && (
            <button className="btn flex gap-2" onClick={openModal}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )}
          <button className="btn-secondary flex gap-2" onClick={downloadPdf}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF Report
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4 bg-white/50 backdrop-blur-sm border-gray-100">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            className="input w-full pl-10"
            placeholder="Search items by name..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <select
            className="input w-full"
            value={String(cat)}
            onChange={e => setCat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left">
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Item Name</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Category</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Stock</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">QR Code</th>
                  {user?.role !== 'student' && <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px] text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{i.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{i.location || 'No location set'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge bg-indigo-50 text-indigo-700">
                        {categories.find(c => c.id === i.categoryId)?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${i.availableStock > i.minStock ? 'bg-green-500' : i.availableStock > 0 ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className={`font-medium ${i.availableStock <= i.minStock ? 'text-red-600 font-black' : ''}`}>{i.availableStock}</span>
                        <span className="text-gray-400">/ {i.totalStock}</span>
                        {i.availableStock <= i.minStock && (
                          <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Low</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {i.qrCodeUrl ? (
                        <div className="w-10 h-10 border border-gray-100 rounded-lg p-1 bg-white shadow-sm overflow-hidden hover:scale-150 transition-transform cursor-pointer origin-left">
                          <img src={i.qrCodeUrl} alt="qr" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">No QR</span>
                      )}
                    </td>
                    {user?.role !== 'student' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-3 justify-end">
                          <button className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors" onClick={() => edit(i)}>Edit</button>
                          <button className="text-red-500 font-bold hover:text-red-700 transition-colors" onClick={() => remove(i.id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No items found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing <span className="text-indigo-600">{items.length}</span> of <span className="text-gray-900">{totalItems}</span> Items
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

      <Modal open={open} title={form.id ? 'Modify Equipment' : 'Register New Item'} onClose={() => setOpen(false)}>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Item Name</label>
            <input className="input w-full mt-1.5" placeholder="e.g., Oscilloscope TDS2024" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Category</label>
            {!addingCat ? (
              <div className="flex gap-2 mt-1.5">
                <select
                  className="input flex-1"
                  value={form.categoryId || 0}
                  onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
                >
                  <option value={0} disabled>-- Select Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-colors h-[42px]"
                  onClick={() => setAddingCat(true)}
                >
                  New
                </button>
              </div>
            ) : (
              <div className="mt-1.5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Create New Category</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Category name..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveNewCategory()}
                    autoFocus
                  />
                  <button type="button" className="btn h-full py-1 px-4" onClick={saveNewCategory} disabled={savingCat || !newCatName.trim()}>
                    {savingCat ? '...' : 'Save'}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 italic">Press Enter to save Category.</span>
                  <button type="button" className="text-xs font-bold text-gray-400 hover:text-gray-600" onClick={() => { setAddingCat(false); setNewCatName('') }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 ml-1">Total Stock</label>
              <input className="input w-full mt-1.5" type="number" placeholder="0" value={form.totalStock ?? ''} onChange={e => setForm(f => ({ ...f, totalStock: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 ml-1">Available Units</label>
              <input className="input w-full mt-1.5" type="number" placeholder="0" value={form.availableStock ?? ''} onChange={e => setForm(f => ({ ...f, availableStock: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 ml-1">Min Threshold</label>
              <input className="input w-full mt-1.5" type="number" placeholder="0" value={form.minStock ?? ''} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 ml-1">Storage Location</label>
              <input className="input w-full mt-1.5" placeholder="e.g., Cabinet B2 / shelf 3" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 ml-1">Condition Status</label>
              <input className="input w-full mt-1.5" placeholder="e.g., Good / Slightly Damaged" value={form.condition || ''} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button className="btn-secondary px-8 font-bold" onClick={() => setOpen(false)}>Discard</button>
            <button className="btn px-8 font-bold" onClick={submit}>Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
