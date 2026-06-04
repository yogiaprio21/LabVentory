import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import { api } from '../hooks/useApi'
import { Button, Icon } from './ui'

interface Notification {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const filtered = useMemo(
    () => unreadOnly ? notifications.filter(n => !n.isRead) : notifications,
    [notifications, unreadOnly]
  )
  const visibleNotifications = filtered.slice(0, visibleCount)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/notifications')
      setNotifications(Array.isArray(res.data) ? res.data : [])
    } catch (e: any) {
      setNotifications([])
      setError(e?.response?.data?.error || 'Unable to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setVisibleCount(6)
      setUnreadOnly(false)
    }
  }, [open])

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (e) { }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) { }
  }

  const panel = open ? (
    <div
      ref={panelRef}
      className="fixed right-3 top-16 z-[140] w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12 sm:right-4"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Notifications</h3>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} variant="ghost" size="sm" className="h-8 px-2 text-[10px] uppercase">
            Mark read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={classNames('rounded-md px-2.5 py-1.5 text-xs font-bold transition', !unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50')}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={classNames('rounded-md px-2.5 py-1.5 text-xs font-bold transition', unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50')}
        >
          Unread
        </button>
      </div>

      <div className="max-h-[min(20rem,calc(100vh-12rem))] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-4 text-sm font-semibold text-slate-500">Loading notifications...</div>
        ) : error ? (
          <div className="p-4 text-sm font-semibold text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Icon name="bell" className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">No notifications yet</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Borrowing updates and stock alerts will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleNotifications.map(notification => (
              <button
                key={notification.id}
                type="button"
                className={classNames(
                  'relative block w-full px-4 py-3 text-left transition hover:bg-slate-50',
                  !notification.isRead && 'bg-indigo-50/40'
                )}
                onClick={() => !notification.isRead && markRead(notification.id)}
              >
                {!notification.isRead && <span className="absolute left-1.5 top-4 h-8 w-1 rounded-full bg-indigo-500" />}
                <span className="block pr-2 text-sm font-bold leading-tight text-slate-950">{notification.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-medium text-slate-600">{notification.message}</span>
                <span className="mt-1.5 block text-[10px] font-semibold text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length > visibleCount && (
        <div className="border-t border-slate-100 p-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setVisibleCount(count => count + 6)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(value => !value)}
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>
      {panel && createPortal(panel, document.body)}
    </>
  )
}
