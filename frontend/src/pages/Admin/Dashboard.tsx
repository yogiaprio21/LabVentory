import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { api } from '../../hooks/useApi'
import TableSkeleton from '../../components/TableSkeleton'
import { EmptyState, Icon, PageHeader, StatusBadge } from '../../components/ui'

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#e11d48', '#7c3aed']

const fillLastSevenDays = (rows: Array<{ day: string; count: number }> = []) => {
  const counts = new Map(rows.map(row => [new Date(row.day).toISOString().slice(0, 10), Number(row.count) || 0]))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      day: key,
      name: date.toLocaleDateString(undefined, { weekday: 'short' }),
      count: counts.get(key) || 0
    }
  })
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-48 rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-lg border border-slate-100 bg-white shadow-sm" />)}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-[420px] rounded-lg border border-slate-100 bg-white shadow-sm" />
        <div className="h-[420px] rounded-lg border border-slate-100 bg-white shadow-sm" />
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'indigo' | 'emerald' | 'rose' }) {
  const toneClass = {
    slate: 'border-l-slate-500 text-slate-950',
    indigo: 'border-l-indigo-600 text-slate-950',
    emerald: 'border-l-emerald-600 text-emerald-700',
    rose: 'border-l-rose-500 text-rose-600'
  }[tone]

  return (
    <div className={`card border-l-4 bg-white p-6 ${toneClass}`}>
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</div>
      <div className="text-4xl font-black">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/dashboard/summary')
        if (mounted) setSummary(res.data)
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.error || 'Unable to load dashboard summary')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const dailyData = useMemo(() => fillLastSevenDays(summary?.dailyTrends), [summary?.dailyTrends])
  const hasBorrowingTrend = dailyData.some(row => row.count > 0)
  const stockData = Array.isArray(summary?.stockPerCategory) ? summary.stockPerCategory : []
  const hasStockData = stockData.some((row: any) => Number(row.total) > 0)

  if (loading) return <LoadingState />

  if (error || !summary) {
    return <EmptyState title="Dashboard unavailable" description={error || 'Summary data could not be loaded.'} icon="alert" />
  }

  if (summary.isStudent) {
    const statusTags: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
      approved: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
      rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
      returned: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      late: { bg: 'bg-red-100', text: 'text-red-900' }
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <PageHeader title="Student Dashboard" description="Overview of your laboratory activity and rentals." actions={<StatusBadge tone="indigo">Real-time status</StatusBadge>} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard label="Total Borrowed" value={summary.totalBorrowed || 0} />
          <MetricCard label="Currently Holding" value={summary.activeBorrowed || 0} tone="emerald" />
          <MetricCard label="Overdue Items" value={summary.lateCount || 0} tone={summary.lateCount > 0 ? 'rose' : 'slate'} />
        </div>

        <div className="table-shell overflow-hidden bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Recent Activity</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live View</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentBorrowings?.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-950">{b.inventory?.name}</div>
                      <div className="text-xs font-medium text-slate-500">{b.inventory?.lab?.name || 'Main Lab'}</div>
                    </td>
                    <td className="px-6 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold">{b.quantity}</span></td>
                    <td className="px-6 py-4 text-slate-600">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{b.dueDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusTags[b.status]?.bg} ${statusTags[b.status]?.text} text-[10px] font-black capitalize`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {summary.recentBorrowings?.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-14 text-center text-sm font-medium text-slate-400">No borrowing history yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Operations Dashboard"
        description="Role-scoped inventory, borrowing, and stock health summary."
        actions={<StatusBadge tone="slate">Updated {new Date().toLocaleTimeString()}</StatusBadge>}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Inventory Items" value={summary.totalItems || 0} tone="indigo" />
        <MetricCard label="Active Borrows" value={summary.totalBorrowed || 0} />
        <MetricCard label="Late Returns" value={summary.lateCount || 0} tone={summary.lateCount > 0 ? 'rose' : 'slate'} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card bg-white p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">7-Day Borrowing Trend</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Daily approved request activity</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Icon name="activity" className="h-5 w-5" /></div>
          </div>
          <div className="h-80 w-full">
            {hasBorrowingTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgb(15 23 42 / 0.08)' }} />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#4f46e5', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#4f46e5' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No borrowing activity" description="Borrowing trends will appear once requests are created in this scope." icon="activity" />
            )}
          </div>
        </div>

        <div className="card bg-white p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Stock Units by Category</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Total and available units in your scope</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Icon name="barChart" className="h-5 w-5" /></div>
          </div>
          <div className="h-80">
            {hasStockData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockData} dataKey="total" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={6} cornerRadius={5}>
                    {stockData.map((_entry: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgb(15 23 42 / 0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No stock data" description="Category composition will appear after inventory is added." icon="package" />
            )}
          </div>
          {hasStockData && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {stockData.slice(0, 6).map((category: any, index: number) => (
                <div key={category.name} className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate text-[10px] font-bold uppercase tracking-tight text-slate-500">{category.name} ({category.available}/{category.total})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
