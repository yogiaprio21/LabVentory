import { Link } from 'react-router-dom'
import { Button, Icon, StatusBadge } from '../components/ui'

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

const scope = [
  ['Platform admin', 'Manage all institutions and global analytics'],
  ['Institution admin', 'Manage users, labs, inventory, and reports inside one institution'],
  ['Lab admin', 'Operate inventory and borrowing workflows for assigned lab'],
  ['Student', 'Request items and track personal borrowing history']
]

export default function PreviewPage() {
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
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preview mode</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/register" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 sm:inline-flex">Register</Link>
            <Link to="/login">
              <Button icon="lock">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[17rem_1fr] md:px-8">
        <aside className="hidden rounded-lg border border-slate-200 bg-white p-4 md:block">
          <nav className="space-y-1">
            {[
              ['home', 'Dashboard'],
              ['package', 'Inventory'],
              ['bookOpen', 'Borrowings'],
              ['barChart', 'Reports'],
              ['shield', 'Audit Logs'],
              ['users', 'Users & Labs']
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 first:bg-indigo-600 first:text-white">
                <Icon name={icon as any} />
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <StatusBadge tone="indigo">Read-only preview</StatusBadge>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Operational view for multi-institution labs</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  Tampilan ini menunjukkan alur utama aplikasi: dashboard, inventory, peminjaman, laporan, audit, dan pengelolaan role tanpa membutuhkan akun.
                </p>
              </div>
              <Link to="/login">
                <Button variant="dark" icon="arrowRight">Open login</Button>
              </Link>
            </div>
          </div>

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

          <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-extrabold text-slate-950">Inventory snapshot</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Lab</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Condition</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map(row => (
                      <tr key={row[0]} className="font-semibold text-slate-700">
                        {row.map(cell => <td key={cell} className="px-5 py-4 whitespace-nowrap">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Role-based data separation</h2>
              <div className="mt-4 space-y-3">
                {scope.map(([role, desc]) => (
                  <div key={role} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-900">{role}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
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
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-extrabold text-slate-950">Audit and reporting</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['PDF borrowing report', 'Inventory summary', 'Stock alerts', 'Login and CRUD history'].map(item => (
                  <div key={item} className="flex min-h-20 items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">
                    <Icon name="check" className="text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
