import { Link, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import StockCompositionPanel from '../components/StockCompositionPanel'
import { Button, Icon, SelectField, StatusBadge } from '../components/ui'

type PreviewTab =
  | 'analytics'
  | 'dashboard'
  | 'inventory'
  | 'borrowings'
  | 'reports'
  | 'audit'
  | 'institutions'
  | 'labs'
  | 'users'
  | 'access-control'

type IconName = Parameters<typeof Icon>[0]['name']

const navGroups: Array<{
  section: 'Platform' | 'Operations' | 'Administration' | 'Governance'
  items: Array<{ id: PreviewTab; label: string; icon: IconName; description: string }>
}> = [
  {
    section: 'Platform',
    items: [
      { id: 'analytics', label: 'Analytics', icon: 'barChart', description: 'Cross-tenant health, usage, and inventory distribution.' },
      { id: 'institutions', label: 'Institutions', icon: 'building', description: 'Tenant workspace onboarding with registration mode and first admin.' }
    ]
  },
  {
    section: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', description: 'Role-scoped inventory, borrowing, and stock health summary.' },
      { id: 'inventory', label: 'Inventory', icon: 'package', description: 'Equipment stock, QR preview, filters, and export actions.' },
      { id: 'borrowings', label: 'Borrowings', icon: 'bookOpen', description: 'Request approval, return, damage, lost, and QR-assisted borrowing.' }
    ]
  },
  {
    section: 'Administration',
    items: [
      { id: 'labs', label: 'Labs', icon: 'home', description: 'Facility records, tenant transfer, and lab status management.' },
      { id: 'users', label: 'Users', icon: 'users', description: 'Platform admins, institution users, invitations, and role assignment.' },
      { id: 'reports', label: 'Reports', icon: 'download', description: 'PDF exports and tenant-scoped operational reporting.' }
    ]
  },
  {
    section: 'Governance',
    items: [
      { id: 'audit', label: 'Audit Logs', icon: 'shield', description: 'Readable change history with raw JSON available on demand.' },
      { id: 'access-control', label: 'Access Control', icon: 'key', description: 'Role-permission matrix for pages and sensitive actions.' }
    ]
  }
]

const tabs = navGroups.flatMap(group => group.items)

const platformMetrics = [
  { label: 'Active institutions', value: '2', icon: 'building' as const, tone: 'border-l-indigo-600' },
  { label: 'Active labs', value: '9', icon: 'home' as const, tone: 'border-l-cyan-600' },
  { label: 'Active users', value: '3', icon: 'users' as const, tone: 'border-l-emerald-600' },
  { label: 'Late borrowings', value: '0', icon: 'alert' as const, tone: 'border-l-rose-500' }
]

const operationsMetrics = [
  { label: 'Inventory items', value: '248', icon: 'package' as const },
  { label: 'Active borrows', value: '37', icon: 'bookOpen' as const },
  { label: 'Low stock alerts', value: '12', icon: 'alert' as const }
]

const stockComposition = [
  { name: 'Alat Ukur', total: 28, available: 23 },
  { name: 'Komponen Digital', total: 16, available: 12 },
  { name: 'Sensor', total: 11, available: 8 },
  { name: 'Power Supply', total: 9, available: 7 }
]

const tenantDistribution = [
  ['Default Institution', 3, 8, 2],
  ['Electrical Engineering', 14, 3, 1],
  ['Biology Research', 7, 2, 0]
]

const topLabs = [
  ['Lab Pengukuran Besaran Listrik', 'Default Institution', '3', '28', '0'],
  ['Lab Teknik Tegangan Tinggi', 'Default Institution', '8', '16', '2'],
  ['Lab Konversi', 'Electrical Engineering', '5', '11', '1']
]

const inventoryRows = [
  ['Analog Multimeter', 'Lab Pengukuran Besaran Listrik', 'Alat Ukur', '15 / 15'],
  ['Clamp Meter AC/DC', 'Lab Teknik Tegangan Tinggi', 'Alat Ukur', '8 / 8'],
  ['Phase Sequence Indicator', 'Lab Konversi', 'Alat Ukur', '5 / 5']
]

const borrowingRows = [
  ['Alya Pratama', 'Analog Multimeter', 'Pending', '2 days'],
  ['Rizky Ananda', 'Clamp Meter AC/DC', 'Approved', '4 days'],
  ['Dina Maharani', 'Phase Sequence Indicator', 'Returned', 'Closed']
]

const auditRows = [
  ['03:18', 'Super Admin', 'Update', 'Lab 4', 'Name: Lab Konversi -> Lab Teknik Tegangan Tinggi'],
  ['03:18', 'Super Admin', 'Create', 'Institution 3', 'Registration mode: invite; First admin: lab-admin@demo.test'],
  ['23:47', 'Yogi Aprio', 'Create', 'Inventory 3', 'Item: Phase Sequence Indicator; Lab: Lab Pengukuran Besaran Listrik']
]

function PreviewMetric({ label, value, icon, tone = 'border-l-indigo-600' }: { label: string; value: string; icon: IconName; tone?: string }) {
  return (
    <div className={`card border-l-4 bg-white p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-slate-600"><Icon name={icon} className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

function TrendBars({ labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }: { labels?: string[] }) {
  return (
    <div className="flex h-52 items-end gap-3">
      {[28, 52, 36, 74, 60, 88, 68].map((height, index) => (
        <div key={labels[index]} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t bg-indigo-600" style={{ height: `${height}%` }} />
          <span className="text-[10px] font-bold text-slate-400">{labels[index]}</span>
        </div>
      ))}
    </div>
  )
}

function AnalyticsPreview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformMetrics.map(metric => <PreviewMetric key={metric.label} {...metric} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Global Borrowing Trend</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Last 7 days across all tenants</p>
            </div>
            <Icon name="activity" className="h-5 w-5 text-indigo-600" />
          </div>
          <TrendBars />
        </section>

        <section className="card bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Tenant Inventory Distribution</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Inventory records per institution</p>
            </div>
            <Icon name="barChart" className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="space-y-4">
            {tenantDistribution.map(([name, items, labs, active]) => (
              <div key={name} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-bold">
                  <span className="truncate text-slate-800">{name}</span>
                  <span className="text-slate-500">{items} items</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Number(items) * 6}%` }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-500">{labs} labs, {active} active borrowings</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <StockCompositionPanel data={stockComposition} title="Stock Composition" description="Total and available units by category" density="compact" />
        <TopLabsPreview />
      </div>
    </div>
  )
}

function TopLabsPreview() {
  return (
    <section className="table-shell overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Top Labs</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-400">Ranked by active borrowing and stock depth</p>
        </div>
        <StatusBadge tone="indigo">3 labs</StatusBadge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr><th className="px-6 py-4">Lab</th><th className="px-6 py-4">Institution</th><th className="px-6 py-4">Items</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Active</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topLabs.map(row => (
              <tr key={row[0]} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-bold text-slate-950">{row[0]}</td>
                <td className="px-6 py-4 text-slate-600">{row[1]}</td>
                <td className="px-6 py-4"><StatusBadge>{row[2]}</StatusBadge></td>
                <td className="px-6 py-4"><StatusBadge tone="emerald">{row[3]}</StatusBadge></td>
                <td className="px-6 py-4"><StatusBadge tone="indigo">{row[4]}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {operationsMetrics.map(metric => <PreviewMetric key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">7-Day Borrowing Trend</h2>
              <p className="mt-1 text-[10px] font-bold text-slate-400">Daily approved request activity</p>
            </div>
            <Icon name="activity" className="h-5 w-5 text-indigo-600" />
          </div>
          <TrendBars />
        </section>
        <StockCompositionPanel data={stockComposition} title="Stock Units by Category" description="Total and available units in your scope" icon="barChart" density="compact" />
      </div>
    </div>
  )
}

function InventoryPreview() {
  return (
    <div className="space-y-5">
      <div className="card bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto]">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <div className="input flex min-h-11 items-center pl-10 text-sm font-semibold text-slate-400">Search items by name...</div>
          </div>
          <div className="input flex min-h-11 items-center justify-between text-sm font-semibold text-slate-600">All Categories <Icon name="chevronRight" className="rotate-90" /></div>
          <Button icon="download">PDF Report</Button>
        </div>
      </div>

      <section className="table-shell overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Lab</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">QR</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryRows.map(row => (
                <tr key={row[0]}>
                  <td className="px-6 py-4 font-bold text-slate-950">{row[0]}</td>
                  <td className="px-6 py-4 text-slate-600">{row[1]}</td>
                  <td className="px-6 py-4"><StatusBadge tone="indigo">{row[2]}</StatusBadge></td>
                  <td className="px-6 py-4"><StatusBadge tone="emerald">{row[3]}</StatusBadge></td>
                  <td className="px-6 py-4">
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm" aria-label="Open QR Code">
                      <Icon name="qr" className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card grid gap-5 bg-white p-6 lg:grid-cols-[12rem_1fr]">
        <div className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <Icon name="qr" className="h-24 w-24 text-slate-900" strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
          <div>
            <StatusBadge tone="emerald">QR Code</StatusBadge>
            <h2 className="mt-3 text-xl font-black text-slate-950">Analog Multimeter</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Payload: inventory:1</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon="download">Download QR</Button>
            <Button variant="secondary" icon="printer">Print</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function BorrowingsPreview() {
  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-slate-950">Borrowing flow</h2>
          <p className="text-sm font-semibold text-slate-500">Request, approve, reject, return, mark damaged, or mark lost based on role permission.</p>
        </div>
        <div className="flex gap-2"><Button icon="plus">New Request</Button><Button variant="secondary" icon="qr">Scan QR</Button></div>
      </div>
      <section className="table-shell overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr><th className="px-6 py-4">Borrower</th><th className="px-6 py-4">Item</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Due</th><th className="px-6 py-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowingRows.map(([name, item, status, due]) => (
                <tr key={`${name}-${item}`}>
                  <td className="px-6 py-4 font-bold text-slate-950">{name}</td>
                  <td className="px-6 py-4 text-slate-600">{item}</td>
                  <td className="px-6 py-4"><StatusBadge tone={status === 'Pending' ? 'amber' : status === 'Approved' ? 'emerald' : 'slate'}>{status}</StatusBadge></td>
                  <td className="px-6 py-4 text-slate-600">{due}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" icon="check">Approve</Button>
                      <Button size="sm" variant="secondary" icon="refresh">Return</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ReportsPreview() {
  return (
    <div className="space-y-5">
      <div className="card grid gap-3 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Report type: Inventory</div>
        <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Date range: This month</div>
        <Button icon="download">Export PDF</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {['Inventory summary PDF', 'Borrowing status PDF', 'Low stock alert report', 'Tenant-separated export'].map(item => (
          <div key={item} className="card bg-white p-5">
            <Icon name="download" className="h-6 w-6 text-indigo-600" />
            <h2 className="mt-4 font-extrabold text-slate-950">{item}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Export follows the active tenant scope and selected filters.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuditPreview() {
  return (
    <section className="table-shell overflow-hidden bg-white">
      <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Security Audit Logs</h2>
        <p className="mt-1 text-[10px] font-bold text-slate-400">Change Details are rendered as readable fields, not raw arrays.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Actor</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Resource</th><th className="px-6 py-4">Change Details</th><th className="px-6 py-4">Raw</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditRows.map(row => (
              <tr key={`${row[0]}-${row[3]}`}>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">{row[0]}</td>
                <td className="px-6 py-4 font-bold text-slate-950">{row[1]}</td>
                <td className="px-6 py-4"><StatusBadge tone={row[2] === 'Create' ? 'emerald' : 'slate'}>{row[2]}</StatusBadge></td>
                <td className="px-6 py-4 text-slate-700">{row[3]}</td>
                <td className="px-6 py-4 text-slate-600">{row[4]}</td>
                <td className="px-6 py-4"><div className="flex gap-2"><Button size="sm" variant="secondary" icon="eye">View details</Button><Button size="sm" variant="ghost" icon="download">Copy JSON</Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function InstitutionsPreview() {
  return (
    <div className="space-y-5">
      <div className="card bg-white p-6">
        <h2 className="text-lg font-black text-slate-950">New tenant workspace</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Institution name</div>
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">First admin email</div>
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Registration mode: invite</div>
        </div>
      </div>
      <section className="table-shell overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="table-head"><tr><th className="px-6 py-4">Institution</th><th className="px-6 py-4">Labs</th><th className="px-6 py-4">Users</th><th className="px-6 py-4">Mode</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {tenantDistribution.map(([name, items, labs]) => (
              <tr key={name}><td className="px-6 py-4 font-bold text-slate-950">{name}</td><td className="px-6 py-4">{labs}</td><td className="px-6 py-4">{items}</td><td className="px-6 py-4"><StatusBadge tone="indigo">Invite</StatusBadge></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function LabsPreview() {
  return (
    <div className="space-y-5">
      <div className="card bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Institution context: Default Institution</div>
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Lab status: Active</div>
          <Button icon="plus">New Lab</Button>
        </div>
        <p className="mt-3 text-xs font-semibold text-amber-700">Changing institution transfers this lab and updates related invitations.</p>
      </div>
      <TopLabsPreview />
    </div>
  )
}

function UsersPreview() {
  return (
    <div className="space-y-5">
      <div className="card bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Institution context: Electrical Engineering</div>
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Invitee email: lab-admin@demo.test</div>
          <Button icon="mail">Send invite</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ['Platform admins', 'Create institutions, manage global ACL, and view cross-tenant analytics.'],
          ['Institution users', 'See only users, labs, inventory, and borrowings inside their institution.'],
          ['Lab admins', 'Operate assigned lab inventory and borrowing workflows.'],
          ['Students', 'Register by invitation, request items, and track personal borrowings.']
        ].map(([title, description]) => (
          <div key={title} className="card bg-white p-5">
            <StatusBadge tone="indigo">{title}</StatusBadge>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccessControlPreview() {
  const permissions = [
    ['Dashboard', 'dashboard.view', 'All roles'],
    ['Inventory', 'inventory.create / inventory.update / inventory.delete', 'Admin roles'],
    ['Borrowings', 'borrowing.approve / borrowing.return / borrowing.markLost', 'Lab admin'],
    ['Institutions', 'institution.create / institution.update', 'Platform admin'],
    ['Access Control', 'accessControl.view', 'Platform admin']
  ]

  return (
    <div className="space-y-5">
      <div className="card bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <div className="input flex min-h-11 items-center pl-10 text-sm font-semibold text-slate-400">Search permission</div>
          </div>
          <div className="input flex min-h-11 items-center text-sm font-semibold text-slate-500">Module: All</div>
        </div>
      </div>
      <section className="table-shell overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="table-head"><tr><th className="px-6 py-4">Module</th><th className="px-6 py-4">Permissions</th><th className="px-6 py-4">Allowed roles</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {permissions.map(row => (
              <tr key={row[0]}><td className="px-6 py-4 font-bold text-slate-950">{row[0]}</td><td className="px-6 py-4 text-slate-600">{row[1]}</td><td className="px-6 py-4"><StatusBadge tone="purple">{row[2]}</StatusBadge></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default function PreviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('section') as PreviewTab | null
  const activeTab: PreviewTab = tabs.some(tab => tab.id === section) ? section as PreviewTab : 'analytics'
  const current = useMemo(() => tabs.find(tab => tab.id === activeTab) || tabs[0], [activeTab])
  const setActiveTab = (tab: PreviewTab) => setSearchParams(tab === 'analytics' ? {} : { section: tab })

  const content: Record<PreviewTab, JSX.Element> = {
    analytics: <AnalyticsPreview />,
    dashboard: <DashboardPreview />,
    inventory: <InventoryPreview />,
    borrowings: <BorrowingsPreview />,
    reports: <ReportsPreview />,
    audit: <AuditPreview />,
    institutions: <InstitutionsPreview />,
    labs: <LabsPreview />,
    users: <UsersPreview />,
    'access-control': <AccessControlPreview />
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Icon name="package" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">LabVentory</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interactive preview</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/register" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:inline-flex">Register</Link>
            <Link to="/login"><Button icon="lock">Sign in</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[17rem_1fr] md:px-8">
        <aside className="hidden h-fit rounded-lg border border-slate-200 bg-white p-4 md:block">
          <nav className="space-y-5" aria-label="Preview sections">
            {navGroups.map(group => (
              <div key={group.section}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.section}</p>
                <div className="space-y-1">
                  {group.items.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Icon name={tab.icon} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <StatusBadge tone="indigo">Read-only preview</StatusBadge>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{current.label === 'Analytics' ? 'Platform Analytics' : current.label === 'Dashboard' ? 'Operations Dashboard' : current.label}</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">{current.description}</p>
              </div>
              <Link to="/login"><Button variant="dark" icon="arrowRight">Open login</Button></Link>
            </div>
          </div>

          <div className="md:hidden">
            <SelectField value={activeTab} onChange={e => setActiveTab(e.target.value as PreviewTab)} aria-label="Preview section">
              {navGroups.map(group => (
                <optgroup key={group.section} label={group.section}>
                  {group.items.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                </optgroup>
              ))}
            </SelectField>
          </div>

          {content[activeTab]}
        </div>
      </section>
    </main>
  )
}
