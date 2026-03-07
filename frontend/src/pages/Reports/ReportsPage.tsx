import { useState, useEffect } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { Borrowing } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Borrowing[]>([])

  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadData = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      // Use the paginated borrowings endpoint for preview
      const res = await api.get(`/borrowings?page=${pageNum}&limit=10`)
      setData(res.data.data)
      setTotalPages(res.data.meta.totalPages)
      setTotalItems(res.data.meta.total)
      setPage(res.data.meta.page)
    } catch {
      toast.error('Failed to load borrowing records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(1) }, [])

  // Date filtering moved to a more efficient client-side filter for the preview
  // or we could add date filters to the borrowings API itself if needed.
  // For now, let's keep the client filter on the fetched page data for simplicity
  // unless the user specifically wants server-side date filtering for the preview.
  const filteredData = data.filter(b => {
    if (!from && !to) return true
    if (!b.borrowDate) return false
    const date = new Date(b.borrowDate)
    const f = from ? new Date(from) : new Date(0)
    const t = to ? new Date(to) : new Date()
    t.setHours(23, 59, 59, 999)
    return date >= f && date <= t
  })

  const downloadReport = async (url: string, filename: string) => {
    try {
      toast.loading('Preparing PDF document...', { id: 'pdf' })
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      toast.success('Report downloaded successfully', { id: 'pdf' })
    } catch (e: any) {
      toast.error('Failed to download report', { id: 'pdf' })
    }
  }

  const downloadBorrowing = () => {
    let url = '/export/borrowing'
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (params.toString()) url += `?${params.toString()}`
    downloadReport(url, 'borrowing_report.pdf')
  }

  const downloadInventory = () => downloadReport('/export/inventory', 'inventory_summary.pdf')

  const statusTags: Record<string, { bg: string, text: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    approved: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
    returned: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    late: { bg: 'bg-red-100', text: 'text-red-900' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export laboratory data for auditing</p>
      </div>

      <div className="card p-6 bg-white shadow-sm border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">From Date</label>
            <input className="input w-full" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">To Date</label>
            <input className="input w-full" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn w-full h-[42px] flex gap-2 font-bold" onClick={downloadBorrowing}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export Borrowings
          </button>
          <button className="btn-secondary w-full h-[42px] flex gap-2 font-bold" onClick={downloadInventory}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Inventory Summary
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">Data Preview</h2>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Latest 10 Records</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Borrower</th>
                    <th className="px-6 py-4">Equipment (Lab)</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Borrow Date</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{b.user?.name}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{b.inventory?.name}</div>
                        <div className="text-[10px] text-indigo-600 italic font-medium">{b.inventory?.lab ? b.inventory.lab.name : 'Central Lab'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{b.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{b.dueDate?.slice(0, 10)}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${statusTags[b.status]?.bg} ${statusTags[b.status]?.text} capitalize`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No records found within the selected date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Showing <span className="text-indigo-600">{filteredData.length}</span> of <span className="text-gray-900">{totalItems}</span> Records
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 transition-all hover:bg-gray-50 active:scale-95"
                  onClick={() => loadData(page - 1)}
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
                  onClick={() => loadData(page + 1)}
                  disabled={page === totalPages || loading}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
