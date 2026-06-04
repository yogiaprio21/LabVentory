import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../hooks/useApi'
import { AuditLog } from '../../types'
import Modal from '../../components/Modal'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, EmptyState, Field, Icon, PageHeader, Pagination, StatusBadge } from '../../components/ui'
import { formatAuditDetails, formatAuditValue, type AuditDetailRow } from '../../utils/auditDetails'

const actionTone: Record<string, Parameters<typeof StatusBadge>[0]['tone']> = {
  create: 'emerald',
  update: 'indigo',
  transfer: 'purple',
  deactivate: 'rose',
  delete: 'rose',
  failed: 'rose',
  login: 'slate',
  approve: 'emerald',
  reject: 'rose',
  return: 'indigo',
  resolve: 'slate',
  mark_damaged: 'orange',
  mark_lost: 'dark'
}

const actionLabel = (action: string) => action.replace(/_/g, ' ')
const formatTimestamp = (value?: string) => value ? value.slice(0, 19).replace('T', ' ') : '-'

function DetailRow({ row }: { row: AuditDetailRow }) {
  if (row.type === 'change') {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500">{row.label}</div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <span className="rounded-md bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700">{row.oldValue}</span>
          <Icon name="arrowRight" className="hidden text-slate-400 sm:block" />
          <span className="rounded-md bg-emerald-50 px-2.5 py-1.5 font-semibold text-emerald-700">{row.newValue}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs font-black uppercase tracking-wider text-slate-500">{row.label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">{row.value}</div>
    </div>
  )
}

function AuditDetailSummary({ details, onView }: { details: unknown; onView: () => void }) {
  const formatted = formatAuditDetails(details)
  const previewRows = formatted.rows.slice(0, 2)

  return (
    <div className="max-w-xl space-y-2">
      <p className="line-clamp-2 text-xs font-semibold text-slate-700">{formatted.summary}</p>
      {previewRows.length > 0 && (
        <div className="space-y-1">
          {previewRows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="font-bold text-slate-600">{row.label}:</span>
              {row.type === 'change' ? (
                <>
                  <span className="max-w-[8rem] truncate rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">{row.oldValue}</span>
                  <Icon name="arrowRight" className="h-3 w-3" />
                  <span className="max-w-[8rem] truncate rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">{row.newValue}</span>
                </>
              ) : (
                <span className="max-w-[18rem] truncate">{row.value}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {formatted.hasDetails && (
        <button
          type="button"
          onClick={onView}
          className="text-xs font-bold text-indigo-600 transition hover:text-indigo-800"
        >
          View details
        </button>
      )}
    </div>
  )
}

function AuditDetailModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null
  const formatted = formatAuditDetails(log.details)

  const copyRaw = async () => {
    try {
      await navigator.clipboard.writeText(formatted.rawJson || 'No details recorded')
      toast.success('Audit JSON copied')
    } catch {
      toast.error('Unable to copy audit JSON')
    }
  }

  return (
    <Modal open={!!log} title="Audit Event Details" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actor</p>
            <p className="mt-1 font-bold text-slate-950">{log.user?.name || (log.userId ? `User #${log.userId}` : 'System')}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action</p>
            <p className="mt-1 font-bold capitalize text-slate-950">{actionLabel(log.action)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource</p>
            <p className="mt-1 font-bold capitalize text-slate-950">{log.entity} #{log.entityId}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-700">{formatTimestamp(log.timestamp)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-extrabold text-slate-950">{formatted.summary}</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {formatted.rows.length ? formatted.rows.map((row, index) => (
              <DetailRow key={`${row.label}-${index}`} row={row} />
            )) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">No structured details were recorded for this event.</div>
            )}
          </div>
        </div>

        <details className="rounded-lg border border-slate-200 bg-slate-950 text-slate-100">
          <summary className="cursor-pointer px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300">Raw JSON</summary>
          <pre className="max-h-64 overflow-auto border-t border-slate-800 p-4 text-xs leading-relaxed">{formatted.rawJson || 'No details recorded'}</pre>
        </details>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={copyRaw}>Copy JSON</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

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
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-6 py-4 font-bold text-slate-950">{log.user?.name || (log.userId ? `User #${log.userId}` : 'System')}</td>
                  <td className="px-6 py-4"><StatusBadge tone={actionTone[log.action] || 'slate'}>{actionLabel(log.action)}</StatusBadge></td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    <span className="capitalize">{log.entity}</span>
                    <div className="text-xs font-mono text-indigo-600">{log.entityId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <AuditDetailSummary details={log.details} onView={() => setSelectedLog(log)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 xl:hidden">
          {loading ? <TableSkeleton rows={5} cols={2} /> : logs.length === 0 ? (
            <EmptyState title="No audit events found" description="Try broadening your filters." icon="shield" />
          ) : logs.map(log => {
            const formatted = formatAuditDetails(log.details)
            return (
              <article key={log.id} className="mobile-record">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-950">{log.user?.name || (log.userId ? `User #${log.userId}` : 'System')}</h3>
                    <p className="mt-1 font-mono text-xs text-slate-500">{formatTimestamp(log.timestamp)}</p>
                  </div>
                  <StatusBadge tone={actionTone[log.action] || 'slate'}>{actionLabel(log.action)}</StatusBadge>
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-bold capitalize text-slate-800"><Icon name="activity" />{log.entity} #{log.entityId}</div>
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600">{formatted.summary}</p>
                  {formatted.rows[0] && (
                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-bold">{formatted.rows[0].label}:</span>{' '}
                      {formatted.rows[0].type === 'change'
                        ? `${formatAuditValue(formatted.rows[0].oldValue)} -> ${formatAuditValue(formatted.rows[0].newValue)}`
                        : formatted.rows[0].value}
                    </p>
                  )}
                  {formatted.hasDetails && (
                    <button type="button" className="mt-3 text-xs font-bold text-indigo-600" onClick={() => setSelectedLog(log)}>View details</button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={total} currentCount={logs.length} label="Records" loading={loading} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
      </section>

      <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}
