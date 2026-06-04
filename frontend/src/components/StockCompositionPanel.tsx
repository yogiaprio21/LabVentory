import cls from 'classnames'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { EmptyState, Icon } from './ui'

export type StockCategoryDatum = {
  name: string
  total: number
  available?: number
}

type StockCompositionDensity = 'compact' | 'regular' | 'wide'

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
  density = 'regular',
  className
}: {
  title?: string
  description?: string
  data: StockCategoryDatum[]
  icon?: Parameters<typeof Icon>[0]['name']
  density?: StockCompositionDensity
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
  const compact = density === 'compact'
  const wide = density === 'wide'
  const chartHeight = compact ? 'h-44' : wide ? 'h-72' : 'h-60'
  const innerRadius = compact ? 48 : wide ? 78 : 64
  const outerRadius = compact ? 76 : wide ? 118 : 98
  const visibleCategories = compact ? categories.slice(0, 4) : categories
  const hiddenCategoryCount = Math.max(categories.length - visibleCategories.length, 0)
  const metrics = [
    { label: compact ? 'Total' : 'Total units', fullLabel: 'Total units', value: totalUnits, tone: 'border-slate-100 bg-slate-50 text-slate-950', labelTone: 'text-slate-400' },
    { label: compact ? 'Ready' : 'Available units', fullLabel: 'Available units', value: availableUnits, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700', labelTone: 'text-emerald-600' },
    { label: compact ? 'Unavail.' : 'Unavailable', fullLabel: 'Unavailable', value: unavailableUnits, tone: 'border-rose-100 bg-rose-50 text-rose-600', labelTone: 'text-rose-500' },
    { label: compact ? 'Types' : 'Categories', fullLabel: 'Categories', value: categories.length, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700', labelTone: 'text-indigo-500' }
  ]

  return (
    <section className={cls('card self-start overflow-hidden bg-white', compact ? 'p-5' : 'p-6', className)} data-density={density}>
      <div className={cls('flex items-center justify-between gap-4', compact ? 'mb-4' : 'mb-6')}>
        <div className="min-w-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">{title}</h2>
          <p className="mt-1 text-[10px] font-bold leading-4 text-slate-400">{description}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className={compact ? 'min-h-56' : 'min-h-72'}>
          <EmptyState title="No stock categories" description="Category composition will appear after inventory is added." icon="package" />
        </div>
      ) : (
        <div className={compact ? 'space-y-4' : 'space-y-5'}>
          <div className={cls('grid gap-2', compact ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4')}>
            {metrics.map(metric => (
              <div key={metric.fullLabel} className={cls('min-w-0 rounded-lg border', compact ? 'p-2.5' : 'p-3', metric.tone)} aria-label={metric.fullLabel}>
                <p className={cls('break-words font-black uppercase leading-3', compact ? 'text-[8px] tracking-normal' : 'text-[9px] tracking-wider', metric.labelTone)} title={metric.fullLabel}>{metric.label}</p>
                <p className={cls('mt-1 font-black', compact ? 'text-lg' : 'text-2xl')}>{metric.value}</p>
              </div>
            ))}
          </div>

          <div className={cls('grid min-w-0 gap-4', wide ? '2xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]' : 'grid-cols-1')}>
            <div className={cls('relative min-w-0', chartHeight)}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="total" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={5} cornerRadius={5}>
                    {categories.map((_entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<StockTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <p className={cls('font-black text-slate-950', compact ? 'text-2xl' : 'text-3xl')}>{totalUnits}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">units</p>
                </div>
              </div>
            </div>

            <div className={cls('min-w-0 space-y-3', compact && 'max-h-44 overflow-y-auto pr-1')} aria-label="Stock composition legend">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase leading-3 tracking-wider text-slate-400">Largest category</p>
                    <p className="mt-1 truncate text-sm font-black text-slate-950" title={largestCategory.name}>{largestCategory.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-600">{percent(largestCategory.total)}%</span>
                </div>
                <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">{largestCategory.total} units of {totalUnits} total stock</p>
              </div>
              {visibleCategories.map((category, index) => {
                const categoryPercent = percent(category.total)
                const color = COLORS[index % COLORS.length]
                return (
                  <div key={category.name} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800" title={category.name}>{category.name}</p>
                          <p className="break-words text-[11px] font-semibold leading-4 text-slate-500">Available {category.available} of {category.total}</p>
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
              {hiddenCategoryCount > 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs font-bold text-slate-500">
                  +{hiddenCategoryCount} more categories
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
