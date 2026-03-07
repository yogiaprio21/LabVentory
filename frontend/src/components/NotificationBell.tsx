import { useState, useEffect, useRef } from 'react'
import { api } from '../hooks/useApi'
import classNames from 'classnames'

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
                className="relative p-2 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transform origin-top-right transition-all">
                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 italic text-sm">
                                No notifications yet.
                            </div>
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
