import cls from 'classnames'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { EmptyState, Icon } from './ui'

export type StockCategoryDatum = {
  name: string
  total: number
  available?: number
}

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#e11d48', '#7c3aed']

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function StockTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const total = toNumber(row.total)
  const available = toNumber(row.available)
  const unavailable = Math.max(total - available, 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xl shadow-slate-900/10">
      <p className="font-black text-slate-950">{row.name}</p>
      <div className="mt-2 space-y-1 font-semibold text-slate-600">
        <p>Total units: <span className="text-slate-950">{total}</span></p>
        <p>Available units: <span className="text-emerald-700">{available}</span></p>
        <p>Unavailable: <span className="text-rose-600">{unavailable}</span></p>
      </div>
    </div>
  )
}

export default function StockCompositionPanel({
  title = 'Stock Composition',
  description = 'Total and available units by category',
  data,
  icon = 'package',
  className
}: {
  title?: string
  description?: string
  data: StockCategoryDatum[]
  icon?: Parameters<typeof Icon>[0]['name']
  className?: string
}) {
  const categories = data
    .map(item => ({
      name: item.name || 'Uncategorized',
      total: toNumber(item.total),
      available: toNumber(item.available)
    }))
    .filter(item => item.total > 0)

  const totalUnits = categories.reduce((sum, item) => sum + item.total, 0)
  const availableUnits = categories.reduce((sum, item) => sum + item.available, 0)
  const unavailableUnits = Math.max(totalUnits - availableUnits, 0)
  const largestCategory = categories.reduce((largest, item) => item.total > largest.total ? item : largest, { name: '-', total: 0, available: 0 })
  const percent = (value: number) => totalUnits ? Math.round((value / totalUnits) * 100) : 0

  return (
    <section className={cls('card bg-white p-6', className)}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">{title}</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-400">{description}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="min-h-80">
          <EmptyState title="No stock categories" description="Category composition will appear after inventory is added." icon="package" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total units</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{totalUnits}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Available units</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{availableUnits}</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Unavailable</p>
              <p className="mt-1 text-2xl font-black text-rose-600">{unavailableUnits}</p>
            </div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Categories</p>
              <p className="mt-1 text-2xl font-black text-indigo-700">{categories.length}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="relative h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="total" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={5} cornerRadius={5}>
                    {categories.map((_entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<StockTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <p className="text-3xl font-black text-slate-950">{totalUnits}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">units</p>
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-3" aria-label="Stock composition legend">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Largest category</p>
                <p className="mt-1 truncate text-sm font-black text-slate-950">{largestCategory.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{largestCategory.total} units, {percent(largestCategory.total)}% of stock</p>
              </div>
              {categories.map((category, index) => {
                const categoryPercent = percent(category.total)
                const color = COLORS[index % COLORS.length]
                return (
                  <div key={category.name} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">{category.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500">Available {category.available} of {category.total}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-black text-slate-700">{categoryPercent}%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${categoryPercent}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
