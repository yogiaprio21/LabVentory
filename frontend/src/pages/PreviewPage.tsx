import { Link, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { Button, Icon, SelectField, StatusBadge } from '../components/ui'

type PreviewTab = 'dashboard' | 'inventory' | 'borrowings' | 'reports' | 'audit' | 'workspace'

const tabs: Array<{ id: PreviewTab; label: string; icon: any; description: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', description: 'Operational KPIs and stock trends' },
  { id: 'inventory', label: 'Inventory', icon: 'package', description: 'Equipment stock, QR, and condition' },
  { id: 'borrowings', label: 'Borrowings', icon: 'bookOpen', description: 'Request approval and return flow' },
  { id: 'reports', label: 'Reports', icon: 'barChart', description: 'Exportable inventory and borrowing reports' },
  { id: 'audit', label: 'Audit Logs', icon: 'shield', description: 'Traceable changes and login events' },
  { id: 'workspace', label: 'Users & Labs', icon: 'users', description: 'Institution, lab, and role management' }
]

const stats = [
  { label: 'Inventory items', value: '248', icon: 'package' as const },
  { label: 'Active borrowings', value: '37', icon: 'bookOpen' as const },
  { label: 'Low stock alerts', value: '12', icon: 'alert' as const },
  { label: 'Audit events', value: '1.2k', icon: 'shield' as const }
]

const inventory = [
  ['Oscilloscope Tektronix', 'Electronics Lab', '18 / 24', 'Good'],
  ['Microscope CX23', 'Biology Lab', '9 / 14', 'Service due'],
  ['Arduino Starter Kit', 'Computer Lab', '42 / 60', 'Good']
]

const borrowings = [
  ['Alya Pratama', 'Oscilloscope Tektronix', 'Pending'],
  ['Rizky Ananda', 'Arduino Starter Kit', 'Approved'],
  ['Dina Maharani', 'Microscope CX23', 'Returned']
]

const auditRows = [
  ['09:12', 'institution_admin', 'created invitation', 'Computer Lab'],
  ['10:35', 'lab_admin', 'updated stock', 'Oscilloscope Tektronix'],
  ['13:48', 'student', 'submitted borrowing', 'Arduino Starter Kit']
]

function DashboardPreview() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
              <Icon name={stat.icon} className="text-indigo-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-slate-950">7-day borrowing trend</h2>
          <div className="mt-5 flex h-48 items-end gap-3">
            {[32, 52, 38, 74, 60, 88, 68].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t bg-indigo-600" style={{ height: `${height}%` }} />
                <span className="text-[10px] font-bold text-slate-400">D{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-slate-950">Tenant scope snapshot</h2>
          <div className="mt-4 space-y-3">
            {['Platform sees all institutions', 'Institution admin sees one institution', 'Lab admin sees assigned lab', 'Student sees own requests'].map(item => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <Icon name="check" className="text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryPreview() {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-extrabold text-slate-950">Inventory snapshot</h2>
        <StatusBadge tone="emerald">Tenant-scoped</StatusBadge>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Lab</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Condition</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map(row => (
              <tr key={row[0]} className="font-semibold text-slate-700">
                {row.map(cell => <td key={cell} className="whitespace-nowrap px-5 py-4">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function BorrowingsPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-extrabold text-slate-950">Borrowing flow</h2>
      <div className="mt-4 space-y-3">
        {borrowings.map(([name, item, status]) => (
          <div key={`${name}-${item}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
            <div>
              <p className="text-sm font-bold text-slate-800">{item}</p>
              <p className="text-xs font-semibold text-slate-500">{name}</p>
            </div>
            <StatusBadge tone={status === 'Pending' ? 'amber' : status === 'Approved' ? 'emerald' : 'slate'}>{status}</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportsPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {['Borrowing report PDF', 'Inventory summary PDF', 'Stock threshold alerts', 'Tenant-separated export'].map(item => (
        <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Icon name="download" className="h-6 w-6 text-indigo-600" />
          <h2 className="mt-4 font-extrabold text-slate-950">{item}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Preview of report output and export controls available after login.</p>
        </div>
      ))}
    </div>
  )
}

function AuditPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-extrabold text-slate-950">Audit activity</h2>
      <div className="mt-4 space-y-3">
        {auditRows.map(row => (
          <div key={`${row[0]}-${row[2]}`} className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600 sm:grid-cols-[4rem_10rem_1fr_10rem]">
            {row.map(cell => <span key={cell}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkspacePreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        ['Platform admin', 'Creates institutions, first admins, and reviews global analytics'],
        ['Institution admin', 'Creates lab invites, manages users, and sees only one institution'],
        ['Lab admin', 'Runs daily inventory and borrowing operations for assigned lab'],
        ['Student', 'Registers by invite, requests items, and tracks personal history']
      ].map(([role, desc]) => (
        <div key={role} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <StatusBadge tone="indigo">{role}</StatusBadge>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{desc}</p>
        </div>
      ))}
    </div>
  )
}

export default function PreviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('section') as PreviewTab | null
  const activeTab = tabs.some(tab => tab.id === section) ? section as PreviewTab : 'dashboard'
  const current = useMemo(() => tabs.find(tab => tab.id === activeTab) || tabs[0], [activeTab])
  const setActiveTab = (tab: PreviewTab) => setSearchParams(tab === 'dashboard' ? {} : { section: tab })

  const content = {
    dashboard: <DashboardPreview />,
    inventory: <InventoryPreview />,
    borrowings: <BorrowingsPreview />,
    reports: <ReportsPreview />,
    audit: <AuditPreview />,
    workspace: <WorkspacePreview />
  }[activeTab]

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
        <aside className="hidden rounded-lg border border-slate-200 bg-white p-4 md:block">
          <nav className="space-y-1" aria-label="Preview sections">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold transition ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <StatusBadge tone="indigo">Read-only preview</StatusBadge>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{current.label}</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">{current.description}</p>
              </div>
              <Link to="/login"><Button variant="dark" icon="arrowRight">Open login</Button></Link>
            </div>
          </div>

          <div className="md:hidden">
            <SelectField value={activeTab} onChange={e => setActiveTab(e.target.value as PreviewTab)} aria-label="Preview section">
              {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
            </SelectField>
          </div>

          {content}
        </div>
      </section>
    </main>
  )
}
