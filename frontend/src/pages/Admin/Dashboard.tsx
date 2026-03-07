import { useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import TableSkeleton from '../../components/TableSkeleton'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await api.get('/dashboard/summary')
        setSummary(res.data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded-lg w-64" />
          <div className="h-4 bg-slate-100 rounded-lg w-48" />
        </div>
        <div className="h-4 bg-slate-100 rounded-lg w-24 hidden sm:block" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[450px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
        <div className="h-[450px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
      </div>
    </div>
  )

  if (summary.isStudent) {
    const statusTags: Record<string, { bg: string, text: string }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
      approved: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
      rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
      returned: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      late: { bg: 'bg-red-100', text: 'text-red-900' }
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Overview of your laboratory activity and rentals</p>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Real-time Status</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 bg-white border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-all duration-500" />
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Total Borrowed</div>
            <div className="text-4xl font-black text-slate-900">{summary.totalBorrowed}</div>
          </div>
          <div className="card p-8 bg-white border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl group-hover:bg-emerald-100/50 transition-all duration-500" />
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Currently Holding</div>
            <div className="text-4xl font-black text-emerald-600">{summary.activeBorrowed}</div>
          </div>
          <div className="card p-8 bg-white border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-all duration-500" />
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Overdue Items</div>
            <div className={`text-4xl font-black ${summary.lateCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{summary.lateCount}</div>
          </div>
        </div>

        <div className="card bg-white border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Recent Activity</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live View</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="text-left font-bold text-slate-400 uppercase tracking-widest text-[9px]">
                    <th className="px-8 py-5">Equipment (Lab)</th>
                    <th className="px-8 py-5">Qty</th>
                    <th className="px-8 py-5">Borrow Date</th>
                    <th className="px-8 py-5">Due Date</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.recentBorrowings?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{b.inventory?.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{b.inventory?.lab?.name || 'Main Lab'}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-600">{b.quantity}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-600 font-bold">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                      <td className="px-8 py-5 text-slate-600 font-bold">{b.dueDate?.slice(0, 10)}</td>
                      <td className="px-8 py-5">
                        <span className={`badge ${statusTags[b.status]?.bg} ${statusTags[b.status]?.text} capitalize font-black text-[10px]`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {summary.recentBorrowings?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic">No borrowing history yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Format daily trends for chart
  const dailyData = summary.dailyTrends?.map((d: any) => ({
    name: new Date(d.day).toLocaleDateString(undefined, { weekday: 'short' }),
    count: d.count
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {user?.role === 'superadmin' ? 'Global Analytics' : 'Admin Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Platform overview and performance metrics</p>
        </div>
        <div className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Updated {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-8 bg-white border-l-[6px] border-l-indigo-600 shadow-xl shadow-indigo-100/50 group hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/40">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Total Items</div>
          <div className="text-4xl font-black text-slate-900">{summary.totalItems}</div>
        </div>
        <div className="card p-8 bg-white border-l-[6px] border-l-cyan-500 shadow-xl shadow-cyan-100/50 group hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-200/40">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Active Borrows</div>
          <div className="text-4xl font-black text-slate-900">{summary.totalBorrowed}</div>
        </div>
        <div className="card p-8 bg-white border-l-[6px] border-l-rose-500 shadow-xl shadow-rose-100/50 group hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-200/40">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">Late Returns</div>
          <div className="text-4xl font-black text-rose-600">{summary.lateCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 bg-white shadow-xl shadow-slate-200/30 border-slate-50 relative overflow-hidden hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">7-Day Borrowing Trends</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Daily loan frequency</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="h-80 w-full ml-[-15px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 bg-white shadow-xl shadow-slate-200/30 border-slate-50 hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest text-[11px]">Stock Composition</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Inventory by categories</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.stockPerCategory}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  cornerRadius={6}
                  animationDuration={1500}
                >
                  {summary.stockPerCategory?.map((_e: any, i: number) => (
                    <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {summary.stockPerCategory?.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][i % 4] }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{c.name} ({c.total})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
