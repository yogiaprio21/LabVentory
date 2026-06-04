import { Suspense, lazy, useEffect, useState } from 'react'
import { api } from '../../hooks/useApi'
import { useAuth } from '../../hooks/useAuth'
import TableSkeleton from '../../components/TableSkeleton'
import toast from 'react-hot-toast'
import { Borrowing, BorrowStatus, Inventory } from '../../types'
import { Button, ConfirmDialog, EmptyState, Field, Icon, PageHeader, Pagination, SelectField, StatusBadge, iconButtonLabel } from '../../components/ui'
import { can } from '../../config/accessControl'

const QrScanner = lazy(() => import('../../components/QrScanner'))

type ActionState = {
  id: number
  label: string
  endpoint: string
  tone: 'primary' | 'danger'
  description: string
} | null

const statusTone: Record<BorrowStatus, Parameters<typeof StatusBadge>[0]['tone']> = {
  pending: 'amber',
  approved: 'indigo',
  rejected: 'rose',
  returned: 'emerald',
  late: 'rose',
  damaged: 'orange',
  lost: 'dark'
}

export default function BorrowingsPage() {
  const [items, setItems] = useState<Borrowing[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [inventoryId, setInventoryId] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [dueDate, setDueDate] = useState<string>('')
  const [showScanner, setShowScanner] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<ActionState>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { user } = useAuth()

  const load = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const [b, inv] = await Promise.all([
        api.get('/borrowings', { params: { page: pageNum, limit: 10 } }),
        api.get('/inventory', { params: { limit: 100 } })
      ])
      setItems(b.data.data)
      setTotalPages(b.data.meta.totalPages)
      setTotalItems(b.data.meta.total)
      setPage(b.data.meta.page)
      setInventory(Array.isArray(inv.data) ? inv.data : (inv.data.data || []))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const request = async () => {
    try {
      if (!inventoryId || !dueDate) {
        toast.error('Please select an item and due date')
        return
      }
      await api.post('/borrowings', { inventoryId, quantity, dueDate })
      toast.success('Borrowing request submitted')
      setInventoryId(0)
      setQuantity(1)
      setDueDate('')
      load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to submit request')
    }
  }

  const handleQrScan = (text: string) => {
    const match = text.match(/(\d+)/)
    if (match) {
      setInventoryId(parseInt(match[0]))
      toast.success('QR code scanned: item selected')
    } else {
      toast.error('Invalid QR code format')
    }
  }

  const runAction = async () => {
    if (!action) return
    setActionLoading(true)
    try {
      await api.post(action.endpoint)
      toast.success(`${action.label} completed`)
      setAction(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || `Failed to ${action.label.toLowerCase()}`)
    } finally {
      setActionLoading(false)
    }
  }

  const openAction = (b: Borrowing, label: string, endpoint: string, tone: 'primary' | 'danger', description: string) => {
    setAction({ id: b.id, label, endpoint, tone, description })
  }

  const canCreateBorrowing = can(user, 'borrowing.create')
  const canApproveBorrowing = can(user, 'borrowing.approve')
  const canRejectBorrowing = can(user, 'borrowing.reject')
  const canReturnBorrowing = can(user, 'borrowing.return')
  const canMarkDamaged = can(user, 'borrowing.markDamaged')
  const canMarkLost = can(user, 'borrowing.markLost')
  const canManageBorrowings = canApproveBorrowing || canRejectBorrowing || canReturnBorrowing || canMarkDamaged || canMarkLost

  const ActionButtons = ({ b }: { b: Borrowing }) => (
    <div className="flex flex-wrap justify-end gap-2">
      {b.status === 'pending' && (
        <>
          {canApproveBorrowing && <Button size="sm" icon="check" onClick={() => openAction(b, 'Approve', `/borrowings/${b.id}/approve`, 'primary', 'This will approve the request and reduce available stock.')}>Approve</Button>}
          {canRejectBorrowing && <Button size="sm" variant="secondary" icon="x" onClick={() => openAction(b, 'Reject', `/borrowings/${b.id}/reject`, 'danger', 'This will reject the borrowing request.')}>Reject</Button>}
        </>
      )}
      {(b.status === 'approved' || b.status === 'late') && (
        <>
          {canReturnBorrowing && <Button size="sm" variant="secondary" icon="refresh" onClick={() => openAction(b, 'Return', `/borrowings/${b.id}/return`, 'primary', 'This will complete the transaction and restore available stock.')}>Return</Button>}
          {canMarkDamaged && <Button size="sm" variant="secondary" icon="alert" onClick={() => openAction(b, 'Mark damaged', `/borrowings/${b.id}/damaged`, 'danger', 'This marks the borrowed item as damaged and notifies the borrower.')}>Damaged</Button>}
          {canMarkLost && <Button size="sm" variant="secondary" icon="trash" onClick={() => openAction(b, 'Mark lost', `/borrowings/${b.id}/lost`, 'danger', 'This marks the borrowed item as lost and notifies the borrower.')}>Lost</Button>}
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Borrowings" description="Track requests, approvals, returns, and item condition updates." />

      {canCreateBorrowing && <section className="card p-4">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Icon name="plus" />
          New Borrowing Request
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_8rem_11rem_auto_auto] md:items-end">
          <SelectField label="Select item" value={inventoryId} onChange={e => setInventoryId(Number(e.target.value))}>
            <option value={0}>-- Choose an item --</option>
            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} - {i.lab?.name || `Lab ${i.labId}`} (Stock: {i.availableStock})</option>)}
          </SelectField>
          <Field label="Quantity" type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          <Field label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Button icon="plus" onClick={request}>Request</Button>
          <Button variant="dark" icon="qr" onClick={() => setShowScanner(true)}>Scan QR</Button>
        </div>
      </section>}

      {showScanner && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 text-white">Loading scanner...</div>}>
          <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      <section className="table-shell">
        <div className="hidden overflow-x-auto lg:block">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : items.length === 0 ? (
            <EmptyState title="No borrowing records" description="Requests and return history will appear here." icon="bookOpen" />
          ) : (
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Borrow</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Status</th>
                  {canManageBorrowings && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-bold text-slate-950">{b.user?.name}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{b.inventory?.name}</div>
                      <div className="text-xs font-medium text-indigo-600">{b.inventory?.lab?.name}</div>
                    </td>
                    <td className="px-6 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{b.quantity}</span></td>
                    <td className="px-6 py-4 text-slate-600">{b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{b.dueDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4"><StatusBadge tone={statusTone[b.status]}>{b.status}</StatusBadge></td>
                    {canManageBorrowings && <td className="px-6 py-4 text-right"><ActionButtons b={b} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-3 lg:hidden">
          {loading ? (
            <TableSkeleton rows={5} cols={2} />
          ) : items.length === 0 ? (
            <EmptyState title="No borrowing records" description="Requests and return history will appear here." icon="bookOpen" />
          ) : items.map(b => (
            <article key={b.id} className="mobile-record">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-slate-950">{b.inventory?.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{b.user?.name} - Qty {b.quantity}</p>
                </div>
                <StatusBadge tone={statusTone[b.status]}>{b.status}</StatusBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                <span>Borrow: {b.borrowDate ? b.borrowDate.slice(0, 10) : '-'}</span>
                <span>Due: {b.dueDate?.slice(0, 10)}</span>
              </div>
              {canManageBorrowings && <div className="mt-4"><ActionButtons b={b} /></div>}
            </article>
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={items.length}
          label="Borrowings"
          loading={loading}
          onPrev={() => load(page - 1)}
          onNext={() => load(page + 1)}
        />
      </section>

      <ConfirmDialog
        open={!!action}
        title={`${action?.label || 'Confirm'} borrowing?`}
        description={action?.description || ''}
        confirmLabel={action?.label}
        tone={action?.tone || 'primary'}
        loading={actionLoading}
        onCancel={() => setAction(null)}
        onConfirm={runAction}
      />
    </div>
  )
}
