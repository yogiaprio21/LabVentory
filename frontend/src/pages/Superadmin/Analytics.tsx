import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { api } from '../../hooks/useApi'
import { EmptyState, Icon, PageHeader, StatusBadge } from '../../components/ui'
import StockCompositionPanel from '../../components/StockCompositionPanel'

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

function AnalyticsCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: Parameters<typeof Icon>[0]['name']; tone: string }) {
  return (
    <div className={`card border-l-4 bg-white p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-slate-600"><Icon name={icon} className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/analytics/summary')
        if (mounted) setSummary(res.data)
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.error || 'Unable to load platform analytics')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const totals = summary?.totals || {}
  const dailyData = useMemo(() => fillLastSevenDays(summary?.dailyTrends), [summary?.dailyTrends])
  const tenantDistribution = Array.isArray(summary?.tenantDistribution) ? summary.tenantDistribution : []
  const stockData = Array.isArray(summary?.stockPerCategory) ? summary.stockPerCategory : []
  const topLabs = Array.isArray(summary?.topLabs) ? summary.topLabs : []
  const hasBorrowingTrend = dailyData.some(row => row.count > 0)
  const hasTenantData = tenantDistribution.some((row: any) => row.items > 0 || row.labs > 0 || row.users > 0)

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-72 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 rounded-lg bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-lg border border-slate-100 bg-white" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="h-[360px] rounded-lg border border-slate-100 bg-white" />
          <div className="h-[360px] rounded-lg border border-slate-100 bg-white" />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return <EmptyState title="Analytics unavailable" description={error || 'Platform analytics could not be loaded.'} icon="alert" />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Platform Analytics"
        description="Cross-tenant health, usage, and inventory distribution across LabVentory."
        actions={<StatusBadge tone="slate">Updated {new Date(summary.generatedAt).toLocaleTimeString()}</StatusBadge>}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Active Institutions" value={totals.activeInstitutions || 0} detail={`${totals.totalInstitutions || 0} total tenants`} icon="building" tone="border-l-indigo-600" />
        <AnalyticsCard label="Active Labs" value={totals.activeLabs || 0} detail={`${totals.totalLabs || 0} total facilities`} icon="home" tone="border-l-cyan-600" />
        <AnalyticsCard label="Active Users" value={totals.activeUsers || 0} detail={`${totals.totalUsers || 0} registered accounts`} icon="users" tone="border-l-emerald-600" />
        <AnalyticsCard label="Late Borrowings" value={totals.lateBorrowings || 0} detail={`${totals.activeBorrowings || 0} active borrows`} icon="alert" tone="border-l-rose-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Global Borrowing Trend</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Last 7 days across all tenants</p>
            </div>
            <Icon name="activity" className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="h-72">
            {hasBorrowingTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgb(15 23 42 / 0.08)' }} />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#4f46e5', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No global activity" description="Borrowing trends will appear after tenants create requests." icon="activity" />
            )}
          </div>
        </section>

        <section className="card bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Tenant Inventory Distribution</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Inventory records per institution</p>
            </div>
            <Icon name="barChart" className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="h-72">
            {hasTenantData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenantDistribution} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgb(15 23 42 / 0.08)' }} />
                  <Bar dataKey="items" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No tenant inventory" description="Institution distribution will appear when labs add inventory." icon="building" />
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <StockCompositionPanel data={stockData} title="Stock Composition" description="Total and available units by category" />

        <section className="table-shell overflow-hidden bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Top Labs</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Ranked by active borrowing and stock depth</p>
            </div>
            <StatusBadge tone="indigo">{topLabs.length} labs</StatusBadge>
          </div>
          {topLabs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-6 py-4">Lab</th>
                    <th className="px-6 py-4">Institution</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topLabs.map((lab: any) => (
                    <tr key={lab.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-950">{lab.name}</td>
                      <td className="px-6 py-4 text-slate-600">{lab.institutionName}</td>
                      <td className="px-6 py-4"><StatusBadge tone="slate">{lab.items}</StatusBadge></td>
                      <td className="px-6 py-4"><StatusBadge tone="emerald">{lab.totalStock}</StatusBadge></td>
                      <td className="px-6 py-4"><StatusBadge tone={lab.activeBorrowings > 0 ? 'indigo' : 'slate'}>{lab.activeBorrowings}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No lab activity" description="Labs will be ranked after tenants add inventory or borrowing activity." icon="home" />
          )}
        </section>
      </div>
    </div>
  )
}
