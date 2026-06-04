import React from 'react'
import cls from 'classnames'

type IconName =
  | 'activity'
  | 'alert'
  | 'archive'
  | 'arrowLeft'
  | 'arrowRight'
  | 'barChart'
  | 'bell'
  | 'bookOpen'
  | 'building'
  | 'calendar'
  | 'check'
  | 'chevronLeft'
  | 'chevronRight'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eyeOff'
  | 'filter'
  | 'home'
  | 'key'
  | 'lock'
  | 'logOut'
  | 'mail'
  | 'menu'
  | 'package'
  | 'plus'
  | 'qr'
  | 'refresh'
  | 'search'
  | 'shield'
  | 'trash'
  | 'user'
  | 'users'
  | 'x'

const paths: Record<IconName, React.ReactNode> = {
  activity: <path d="M22 12h-4l-3 8-6-16-3 8H2" />,
  alert: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="m10.3 3.9-8.1 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /></>,
  archive: <><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" /><path d="M10 12h4" /><path d="M22 3H2v5h20V3Z" /></>,
  arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  barChart: <><path d="M3 3v18h18" /><path d="M8 17V9" /><path d="M13 17V5" /><path d="M18 17v-3" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  bookOpen: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M9 7h1" /><path d="M14 7h1" /><path d="M9 12h1" /><path d="M14 12h1" /><path d="M10 21v-4h4v4" /></>,
  calendar: <><path d="M8 2v4" /><path d="M16 2v4" /><path d="M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></>,
  check: <path d="m20 6-11 11-5-5" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" /><path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.3" /><path d="M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.4-.9" /></>,
  filter: <path d="M3 4h18l-7 8v6l-4 2v-8Z" />,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  key: <><circle cx="7.5" cy="14.5" r="4.5" /><path d="m11 11 8-8" /><path d="m16 3 3 3" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
  package: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  qr: <><path d="M4 4h6v6H4Z" /><path d="M14 4h6v6h-6Z" /><path d="M4 14h6v6H4Z" /><path d="M14 14h2" /><path d="M20 14v2" /><path d="M16 18h4" /><path d="M18 16v4" /></>,
  refresh: <><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><path d="M16 21a6 6 0 0 0-12 0" /><circle cx="10" cy="8" r="4" /><path d="M22 21a6 6 0 0 0-4-5.7" /><path d="M17 4a4 4 0 0 1 0 8" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
}

export function Icon({ name, className, strokeWidth = 2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={cls('h-4 w-4 shrink-0', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
  size?: 'sm' | 'md' | 'icon'
  icon?: IconName
}

export function Button({ className, variant = 'primary', size = 'md', icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cls(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'icon' && 'h-9 w-9 p-0',
        variant === 'primary' && 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        variant === 'danger' && 'bg-rose-600 text-white shadow-sm shadow-rose-100 hover:bg-rose-700',
        variant === 'dark' && 'bg-slate-900 text-white hover:bg-slate-800',
        className
      )}
      {...props}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  icon?: IconName
  action?: React.ReactNode
}

export function Field({ label, error, icon, action, className, ...props }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>}
      <span className="relative block">
        {icon && <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <input className={cls('input min-h-11 w-full', icon && 'pl-10', action && 'pr-11', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', className)} {...props} />
        {action}
      </span>
      {error && <span className="ml-1 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  )
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  icon?: IconName
}

export function SelectField({ label, error, icon, className, children, ...props }: SelectFieldProps) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="ml-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>}
      <span className="relative block">
        {icon && <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <select className={cls('input min-h-11 w-full appearance-none bg-white pr-9', icon && 'pl-10', error && 'border-rose-400', className)} {...props}>
          {children}
        </select>
        <Icon name="chevronRight" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
      </span>
      {error && <span className="ml-1 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatusBadge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'orange' | 'dark' | 'purple' }) {
  return (
    <span
      className={cls(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize leading-none',
        tone === 'slate' && 'bg-slate-100 text-slate-700',
        tone === 'indigo' && 'bg-indigo-50 text-indigo-700',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'rose' && 'bg-rose-50 text-rose-700',
        tone === 'orange' && 'bg-orange-50 text-orange-700',
        tone === 'purple' && 'bg-purple-50 text-purple-700',
        tone === 'dark' && 'bg-slate-900 text-white'
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({ title, description, icon = 'archive' }: { title: string; description?: string; icon?: IconName }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="font-bold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  currentCount,
  label,
  loading,
  onPrev,
  onNext
}: {
  page: number
  totalPages: number
  totalItems: number
  currentCount: number
  label: string
  loading?: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Showing <span className="text-indigo-600">{currentCount}</span> of <span className="text-slate-900">{totalItems}</span> {label}
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button variant="secondary" size="icon" onClick={onPrev} disabled={page <= 1 || loading} aria-label="Previous page">
          <Icon name="chevronLeft" className="h-5 w-5" />
        </Button>
        <div className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold shadow-sm">
          <span className="text-indigo-600">Page {page}</span>
          <span className="text-slate-400">of {Math.max(totalPages, 1)}</span>
        </div>
        <Button variant="secondary" size="icon" onClick={onNext} disabled={page >= totalPages || loading} aria-label="Next page">
          <Icon name="chevronRight" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
  onCancel,
  onConfirm
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={cls('mb-4 flex h-10 w-10 items-center justify-center rounded-lg', tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600')}>
          <Icon name={tone === 'danger' ? 'alert' : 'check'} className="h-5 w-5" />
        </div>
        <h2 id="confirm-title" className="text-lg font-extrabold text-slate-950">{title}</h2>
        <p id="confirm-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function iconButtonLabel(label: string) {
  return { 'aria-label': label, title: label }
}
