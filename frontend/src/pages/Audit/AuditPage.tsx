import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import { AuditLog } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, EmptyState, Field, Icon, PageHeader, Pagination, StatusBadge } from '../../components/ui'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [userId, setUserId] = useState('')
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

  const detailText = (details: any) => {
    if (!details) return 'No details'
    return typeof details === 'string' ? details : JSON.stringify(details)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security Audit Logs" description="Monitor system-wide activity and administrative actions." />

      <section className="card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_12rem_12rem_auto] md:items-end">
          <Field label="User ID" placeholder="Filter by ID..." value={userId} onChange={e => setUserId(e.target.value)} />
          <Field label="Start date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Field label="End date" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Button icon="filter" onClick={() => load(1)}>Apply Filters</Button>
        </div>
      </section>

      <section className="table-shell">
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-0"><TableSkeleton rows={10} cols={5} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5}><EmptyState title="No audit events found" description="Try broadening your filters." icon="shield" /></td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{l.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                  <td className="px-6 py-4 font-bold text-slate-950">{l.user?.name || `ID: ${l.userId}`}</td>
                  <td className="px-6 py-4"><StatusBadge>{l.action}</StatusBadge></td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    <span className="capitalize">{l.entity}</span>
                    <div className="text-xs font-mono text-indigo-600">{l.entityId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate text-xs font-medium text-slate-500">{detailText(l.details)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {loading ? <TableSkeleton rows={5} cols={2} /> : logs.length === 0 ? (
            <EmptyState title="No audit events found" description="Try broadening your filters." icon="shield" />
          ) : logs.map(l => (
            <article key={l.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-950">{l.user?.name || `ID: ${l.userId}`}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">{l.timestamp?.slice(0, 19).replace('T', ' ')}</p>
                </div>
                <StatusBadge>{l.action}</StatusBadge>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-bold capitalize text-slate-800"><Icon name="activity" />{l.entity} #{l.entityId}</div>
                <p className="mt-2 line-clamp-3 text-xs">{detailText(l.details)}</p>
              </div>
            </article>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={total} currentCount={logs.length} label="Records" loading={loading} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
      </section>
    </div>
  )
}
