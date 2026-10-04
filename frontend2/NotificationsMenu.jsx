import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BookOpen, CalendarDays, Check, FileText, Megaphone, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const ICONS = { announcement: Megaphone, event: CalendarDays, resource: BookOpen }

function timeLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export default function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [feed, setFeed] = useState({ items: [], unread_count: 0 })
  const [status, setStatus] = useState('loading')
  const rootRef = useRef(null)
  const requestRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    if (requestRef.current) return requestRef.current
    setStatus((current) => current === 'ready' ? current : 'loading')
    const request = api.get(`${ENDPOINTS.notifications}?limit=20`)
    requestRef.current = request
    try {
      const result = await request
      setFeed(result)
      setStatus('ready')
    } catch (error) {
      console.error('Notifications could not be loaded.', error)
      setStatus('error')
    } finally {
      requestRef.current = null
    }
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  useEffect(() => {
    if (!isOpen) return undefined
    const close = (event) => {
      if (event.key === 'Escape' || (event.type === 'mousedown' && !rootRef.current?.contains(event.target))) setIsOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [isOpen])

  const toggle = () => {
    setIsOpen((current) => !current)
    if (!isOpen) loadNotifications()
  }

  const markRead = async (item) => {
    if (item.is_read) return
    setFeed((current) => ({
      ...current,
      unread_count: Math.max(0, current.unread_count - 1),
      items: current.items.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry),
    }))
    try {
      await api.post(ENDPOINTS.markNotificationRead(item.id), {})
    } catch (error) {
      console.error('Notification read state could not be saved.', error)
      loadNotifications()
    }
  }

  const markAllRead = async () => {
    const previous = feed
    setFeed((current) => ({ ...current, unread_count: 0, items: current.items.map((item) => ({ ...item, is_read: true })) }))
    try {
      await api.post(ENDPOINTS.markAllNotificationsRead, {})
    } catch (error) {
      console.error('Notification read states could not be saved.', error)
      setFeed(previous)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={feed.unread_count ? `Open notifications, ${feed.unread_count} unread` : 'Open notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)] sm:h-9 sm:w-9"
      >
        <Bell size={16} aria-hidden="true" />
        {feed.unread_count > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[9px] font-bold leading-4 text-white">{feed.unread_count > 99 ? '99+' : feed.unread_count}</span>}
      </button>

      {isOpen && (
        <section role="dialog" aria-label="Notifications" className="fixed left-3 right-3 top-[4.5rem] z-50 max-h-[min(70dvh,34rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[23rem]">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h2 className="text-sm font-bold text-foreground">Notifications</h2><p className="text-[10px] text-muted-foreground">{feed.unread_count} unread</p></div>
            {feed.unread_count > 0 && <button type="button" onClick={markAllRead} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold text-primary hover:bg-[var(--primary-soft)]"><Check size={13} /> Mark all read</button>}
          </header>

          <div className="max-h-[calc(min(70dvh,34rem)-4rem)] overflow-y-auto">
            {status === 'loading' && <div className="grid min-h-40 place-items-center" role="status"><div className="text-center"><RefreshCw size={20} className="mx-auto animate-spin text-primary" /><p className="mt-2 text-xs text-muted-foreground">Loading notifications...</p></div></div>}
            {status === 'error' && <div className="p-6 text-center" role="alert"><FileText size={24} className="mx-auto text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Notifications could not be loaded.</p><button type="button" onClick={loadNotifications} className="mt-3 text-xs font-bold text-primary hover:underline">Try again</button></div>}
            {status === 'ready' && feed.items.length === 0 && <div className="p-8 text-center"><Bell size={26} className="mx-auto text-muted-foreground opacity-60" /><h3 className="mt-2 text-xs font-bold text-foreground">You are all caught up</h3><p className="mt-1 text-[11px] text-muted-foreground">New department updates will appear here.</p></div>}
            {status === 'ready' && feed.items.map((item) => {
              const Icon = ICONS[item.kind] || Bell
              return (
                <Link key={item.id} to={item.url} onClick={() => { markRead(item); setIsOpen(false) }} className={`flex gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-secondary ${item.is_read ? '' : 'bg-[var(--primary-soft)]'}`}>
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-primary"><Icon size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2"><strong className="line-clamp-1 text-xs text-foreground">{item.title}</strong><small className="shrink-0 text-[9px] text-muted-foreground">{timeLabel(item.created_at)}</small></span>
                    <span className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{item.message}</span>
                  </span>
                  {!item.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
