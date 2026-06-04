import { useState, useEffect, useRef } from 'react'
import { api } from '../hooks/useApi'
import classNames from 'classnames'
import { Button, Icon, EmptyState } from './ui'

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
    const menuRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const load = async () => {
        try {
            const res = await api.get('/notifications')
            setNotifications(res.data)
        } catch (e) {
            // Silent fail for notifications
        }
    }

    useEffect(() => {
        load()
        const timer = setInterval(load, 30000) // Poll every 30s
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                aria-label="Open notifications"
            >
                <Icon name="bell" className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllRead}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-[10px] uppercase"
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <EmptyState title="No notifications yet" description="New borrowing updates and stock alerts will appear here." icon="bell" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={classNames("px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative", !n.isRead && "bg-indigo-50/30")}
                                        onClick={() => !n.isRead && markRead(n.id)}
                                    >
                                        {!n.isRead && <div className="absolute left-1 top-4 w-1 h-8 bg-indigo-500 rounded-full"></div>}
                                        <div className="font-bold text-gray-900 text-sm leading-tight">{n.title}</div>
                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</div>
                                        <div className="text-[10px] text-gray-400 mt-1.5 font-medium">{new Date(n.createdAt).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
