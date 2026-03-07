import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import TableSkeleton from '../../components/TableSkeleton'
import toast from 'react-hot-toast'
import { Borrowing, Inventory } from '../../types'
import QrScanner from '../../components/QrScanner'

export default function BorrowingsPage() {
  const [items, setItems] = useState<Borrowing[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [inventoryId, setInventoryId] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [dueDate, setDueDate] = useState<string>('')
  const [showScanner, setShowScanner] = useState(false)
  const { user } = useAuth()

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const [b, inv] = await Promise.all([
        api.get(`/borrowings?page=${pageNum}&limit=10`),
        api.get('/inventory') // Inventory list still needed for the request form dropdown
      ])
      setItems(b.data.data)
      setTotalPages(b.data.meta.totalPages)
      setTotalItems(b.data.meta.total)
      setPage(b.data.meta.page)

      // Handle legacy inventory response or new paginated one for dropdown
      setInventory(Array.isArray(inv.data) ? inv.data : (inv.data.data || []))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(1) }, [])

  const request = async () => {
    try {
      if (!inventoryId || !dueDate) return
      await api.post('/borrowings', { inventoryId, quantity, dueDate })
      toast.success('Borrowing request submitted')
      setInventoryId(0); setQuantity(1); setDueDate('')
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to submit request')
    }
  }

  const handleQrScan = (text: string) => {
    // Expecting ID or specific format, e.g., "labventory:123"
    const match = text.match(/(\d+)/);
    if (match) {
      const id = parseInt(match[0]);
      setInventoryId(id);
      toast.success('QR Code scanned: Item selected');
    } else {
      toast.error('Invalid QR Code format');
    }
  }
  const approve = async (id: number) => {
    try {
      await api.post(`/borrowings/${id}/approve`);
      toast.success('Approved successfully');
      load(page);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to approve')
    }
  }
  const reject = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Reject this borrowing request?</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.post(`/borrowings/${id}/reject`);
              toast.success('Rejected');
              load(page);
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to reject')
            }
          }}>Reject</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `rej-bor-${id}` })
  }
  const ret = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Confirm item return and complete transaction?</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.post(`/borrowings/${id}/return`);
              toast.success('Item returned');
              load(page);
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to process return')
            }
          }}>Return</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `ret-bor-${id}` })
  }
  const markDamaged = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Mark this item as damaged?</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold shadow-sm hover:bg-orange-700 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.post(`/borrowings/${id}/damaged`);
              toast.success('Marked as damaged');
              load(page);
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to update status')
            }
          }}>Confirm</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `dmg-bor-${id}` })
  }
  const markLost = (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span className="font-medium text-gray-800 text-sm">Mark this item as lost?</span>
        <div className="flex gap-2 justify-end mt-1">
          <button className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold shadow-sm hover:bg-zinc-800 transition-all" onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.post(`/borrowings/${id}/lost`);
              toast.success('Marked as lost');
              load(page);
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'Failed to update status')
            }
          }}>Confirm</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all" onClick={() => toast.dismiss(t.id)}>Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, id: `lst-bor-${id}` })
  }

  const statusTags: Record<string, { bg: string, text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    approved: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
    returned: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    late: { bg: 'bg-red-100', text: 'text-red-900' },
    damaged: { bg: 'bg-orange-100', text: 'text-orange-900' },
    lost: { bg: 'bg-gray-800', text: 'text-white' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Borrowings</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage equipment borrowing requests</p>
      </div>

      <div className="card p-6 bg-white/50 backdrop-blur-sm border-gray-100 shadow-sm space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Borrowing Request</p>
        <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-4">
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Select Item (Lab)</label>
            <select className="input w-full" value={inventoryId} onChange={e => setInventoryId(Number(e.target.value))}>
              <option value={0}>-- Choose an item --</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name} • {i.lab?.name || `Lab ${i.labId}`} (Stock: {i.availableStock})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Quantity</label>
            <input className="input w-full" type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5 ml-1">Due Date</label>
            <input className="input w-full" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <button className="btn w-full h-[42px] flex gap-2" onClick={request}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request Borrowing
          </button>
          <button className="btn bg-gray-900 hover:bg-black w-full h-[42px] flex gap-2" onClick={() => setShowScanner(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m4 4h1m-5 10v1m-5-10H4m0 4h1m11 0h1m-5 10h1m4-15V4m0 4h-1m-5 10h-1m-5 10v1m0-10V9m4 5V4m0 4h1m-9 14v1h1m5 10h1m4 15V4m0 4h-1m-5 10h-1m-5 10v1m0-10V9m4 5V4m0 4h1m-9 14v1h1m5 10h1m4 15V4m0 4h-1m-5 10h-1m-5 10v1m0-10V9m4 5V4m0 4h1m-9 14v1h1m5 10h1" />
            </svg>
            Scan QR
          </button>
        </div>
      </div>

      {showScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{b.user?.name}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{b.inventory?.name}</div>
                      <div className="text-xs text-indigo-600 italic">{b.inventory?.lab?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{b.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{b.dueDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusTags[b.status]?.bg} ${statusTags[b.status]?.text} capitalize`}>
                        {b.status}
                      </span>
                    </td>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <td className="px-6 py-4 text-right space-x-3">
                        {b.status === 'pending' && (
                          <>
                            <button className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors text-xs uppercase tracking-tight" onClick={() => approve(b.id)}>Approve</button>
                            <button className="text-rose-500 font-bold hover:text-rose-700 transition-colors text-xs uppercase tracking-tight" onClick={() => reject(b.id)}>Reject</button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <>
                            <button className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors text-xs uppercase tracking-tight" onClick={() => ret(b.id)}>Return</button>
                            <button className="text-orange-500 font-bold hover:text-orange-700 transition-colors text-xs uppercase tracking-tight" onClick={() => markDamaged(b.id)}>Damaged</button>
                            <button className="text-gray-900 font-bold hover:text-black transition-colors text-xs uppercase tracking-tight" onClick={() => markLost(b.id)}>Lost</button>
                          </>
                        )}
                        {b.status === 'late' && (
                          <>
                            <button className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors text-xs uppercase tracking-tight" onClick={() => ret(b.id)}>Return</button>
                            <button className="text-orange-500 font-bold hover:text-orange-700 transition-colors text-xs uppercase tracking-tight" onClick={() => markDamaged(b.id)}>Damaged</button>
                            <button className="text-gray-900 font-bold hover:text-black transition-colors text-xs uppercase tracking-tight" onClick={() => markLost(b.id)}>Lost</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No borrowing records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing <span className="text-indigo-600">{items.length}</span> of <span className="text-gray-900">{totalItems}</span> Borrowings
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
