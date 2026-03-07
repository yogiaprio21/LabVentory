import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import { AuditLog } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [userId, setUserId] = useState('')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/audit', { params: { page: pageNum, limit, from: from || undefined, to: to || undefined, userId: userId || undefined } })
      setLogs(res.data.data)
      setTotal(res.data.meta.total)
      setTotalPages(res.data.meta.totalPages)
      setPage(res.data.meta.page)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(page) }, [page])

  const apply = () => { setPage(1); load(1) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor system-wide activity and administrative actions</p>
      </div>

      <div className="card p-6 bg-white shadow-sm border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">User ID</label>
            <input className="input w-full" placeholder="Filter by ID..." value={userId} onChange={e => setUserId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Start Date</label>
            <input className="input w-full" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">End Date</label>
            <input className="input w-full" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn h-[42px] flex gap-2 items-center justify-center lg:col-span-2" onClick={apply}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Apply Filters
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={10} cols={5} />
                  </td>
                </tr>
              ) : (
                <>
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {l.timestamp?.slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{l.user?.name || `ID: ${l.userId}`}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-tight w-fit">
                            {l.action}
                          </span>
                          {l.details && (
                            <div className="text-[10px] font-medium text-gray-400 max-w-[200px] truncate">
                              {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        <span className="capitalize">{l.entity}</span>
                        <div className="text-[10px] font-mono text-indigo-600">{l.entityId}</div>
                      </td>
                      <td className="px-6 py-4">
                        {l.details && typeof l.details === 'object' && !Array.isArray(l.details) && (
                          <div className="space-y-1">
                            {Object.entries(l.details).map(([key, val]: [string, any]) => (
                              <div key={key} className="text-[10px] flex gap-2 items-center">
                                <span className="font-bold text-gray-500 uppercase tracking-tighter">{key}:</span>
                                {val && typeof val === 'object' && 'old' in val ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-rose-500 line-through opacity-60">{String(val.old)}</span>
                                    <svg className="w-2.5 h-2.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span className="text-emerald-600 font-bold">{String(val.new)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-900 truncate max-w-[100px]">{String(val)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No audit events match your criteria.</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing <span className="text-indigo-600">{logs.length}</span> of <span className="text-gray-900">{total}</span> Records
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 transition-all hover:bg-gray-50 active:scale-95"
              onClick={() => setPage(page - 1)}
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
              onClick={() => setPage(page + 1)}
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
