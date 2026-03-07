import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import TableSkeleton from '../../components/TableSkeleton'

export default function Labs() {
  const [labs, setLabs] = useState<any[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [editId, setEditId] = useState<number | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const res = await api.get(`/labs?page=${pageNum}&limit=10`)
      setLabs(res.data.data)
      setTotalPages(res.data.meta.totalPages)
      setTotalItems(res.data.meta.total)
      setPage(res.data.meta.page)
    } catch (e: any) {
      toast.error('Failed to fetch laboratory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const add = async () => {
    if (!name || !location) {
      toast.error('Please fill in all lab details')
      return
    }
    try {
      await api.post('/labs', { name, location })
      setName(''); setLocation('')
      toast.success('Laboratory facility registered')
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to add laboratory')
    }
  }

  const update = async () => {
    try {
      if (!editId) return
      await api.put(`/labs/${editId}`, { name, location })
      setEditId(null); setName(''); setLocation('')
      toast.success('Laboratory details updated')
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to update laboratory')
    }
  }

  const startEdit = (l: any) => {
    setEditId(l.id)
    setName(l.name)
    setLocation(l.location)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setName('')
    setLocation('')
  }

  const remove = (id: number, labName: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Delete laboratory "{labName}"? This affects all inventory assigned to it.</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/labs/${id}`)
              toast.success('Laboratory removed')
              load(page)
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to remove laboratory')
            }
          }}>Delete</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `del-lab-${id}` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratory Facilities</h1>
        <p className="text-sm text-gray-500 mt-1">Manage physical locations and workspace assignments</p>
      </div>

      <div className={`card p-6 border-indigo-100 transition-all ${editId ? 'bg-indigo-50/20 shadow-lg shadow-indigo-900/5' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {editId ? 'Modify Laboratory' : 'Register New Facility'}
          </p>
          {editId && <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase">Editing ID: {editId}</div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Laboratory Name</label>
            <input className="input w-full" placeholder="e.g. Physics Computing Lab" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Physical Location</label>
            <input className="input w-full" placeholder="e.g. Building A, 3rd Floor" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="flex gap-2 items-end pb-[2px]">
            {editId ? (
              <>
                <button className="btn flex-1 h-[42px]" onClick={update}>Update Lab</button>
                <button className="btn-secondary flex-1 h-[42px]" onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <button className="btn w-full h-[42px] flex gap-2" onClick={add}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Laboratory
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Laboratory Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {labs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{l.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{l.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{l.location}</td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-tight" onClick={() => startEdit(l)}>Edit</button>
                      <button className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase tracking-tight" onClick={() => remove(l.id, l.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {labs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No laboratories registered in the system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing <span className="text-indigo-600">{labs.length}</span> of <span className="text-gray-900">{totalItems}</span> Labs
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
