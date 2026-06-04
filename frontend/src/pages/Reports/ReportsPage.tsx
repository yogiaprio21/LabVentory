import { useState, useEffect } from 'react'
import { api } from '../../hooks/useApi'
import toast from 'react-hot-toast'
import type { Borrowing, BorrowStatus } from '../../types'
import TableSkeleton from '../../components/TableSkeleton'
import { Button, EmptyState, Field, PageHeader, Pagination, StatusBadge } from '../../components/ui'

const statusTone: Record<BorrowStatus, Parameters<typeof StatusBadge>[0]['tone']> = {
  pending: 'amber',
  approved: 'indigo',
  rejected: 'rose',
  returned: 'emerald',
  late: 'rose',
  damaged: 'orange',
  lost: 'dark'
}

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Borrowing[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadData = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/borrowings', { params: { page: pageNum, limit: 10, from: from || undefined, to: to || undefined } })
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
    } catch {
      toast.error('Failed to download report', { id: 'pdf' })
    }
  }

  const borrowingUrl = () => {
    let url = '/export/borrowing'
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (params.toString()) url += `?${params.toString()}`
    return url
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Reports" description="Preview filtered borrowing data and export audit-ready PDF documents." />

      <section className="card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[12rem_12rem_auto_auto_auto] md:items-end">
          <Field label="From date" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Field label="To date" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Button variant="secondary" icon="filter" onClick={() => loadData(1)}>Apply Preview</Button>
          <Button icon="download" onClick={() => downloadReport(borrowingUrl(), 'borrowing_report.pdf')}>Export Borrowings</Button>
          <Button variant="secondary" icon="download" onClick={() => downloadReport('/export/inventory', 'inventory_summary.pdf')}>Inventory Summary</Button>
        </div>
      </section>

      <section className="table-shell">
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">Filtered Data Preview</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Preview uses the same date range as the borrowing export.</p>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : data.length === 0 ? (
            <EmptyState title="No records in this range" description="Adjust the report dates or export the full dataset." icon="download" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Borrow</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-bold text-slate-950">{b.user?.name}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{b.inventory?.name}</div>
                      <div className="text-xs font-medium text-indigo-600">{b.inventory?.lab ? b.inventory.lab.name : 'Central Lab'}</div>
                    </td>
                    <td className="px-6 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{b.quantity}</span></td>
                    <td className="px-6 py-4 text-slate-600">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{b.dueDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4"><StatusBadge tone={statusTone[b.status]}>{b.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-3 lg:hidden">
          {loading ? <TableSkeleton rows={5} cols={2} /> : data.length === 0 ? (
            <EmptyState title="No records in this range" description="Adjust the report dates or export the full dataset." icon="download" />
          ) : data.map(b => (
            <article key={b.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-slate-950">{b.inventory?.name}</h3>
                  <p className="text-sm text-slate-500">{b.user?.name} - Qty {b.quantity}</p>
                </div>
                <StatusBadge tone={statusTone[b.status]}>{b.status}</StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                <span>Borrow: {b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</span>
                <span>Due: {b.dueDate?.slice(0, 10)}</span>
              </div>
            </article>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} currentCount={data.length} label="Records" loading={loading} onPrev={() => loadData(page - 1)} onNext={() => loadData(page + 1)} />
      </section>
    </div>
  )
}
