import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const relativeTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000))
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [state, setState] = useState('idle')
  const rootRef = useRef(null)
  const navigate = useNavigate()

  const loadCount = useCallback(() => api.get(ENDPOINTS.notificationUnreadCount).then((data) => setUnread(data.unread_count || 0)).catch(() => {}), [])
  const load = useCallback(() => {
    setState('loading')
    return Promise.all([api.get(ENDPOINTS.notifications), api.get(ENDPOINTS.notificationUnreadCount)])
      .then(([notifications, count]) => { setItems(notifications); setUnread(count.unread_count || 0); setState('ready') })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => { loadCount(); const id = window.setInterval(loadCount, 60000); return () => clearInterval(id) }, [loadCount])
  useEffect(() => {
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openItem = async (item) => {
    if (!item.is_read) {
      try { await api.post(ENDPOINTS.notificationRead(item.id)); setUnread((value) => Math.max(0, value - 1)) } catch { /* navigation remains available */ }
    }
    setOpen(false)
    navigate(item.destination_path || '/announcements')
  }
  const dismiss = async (event, id) => {
    event.stopPropagation()
    try {
      await api.post(ENDPOINTS.notificationDismiss(id))
      setItems((value) => value.filter((item) => item.id !== id))
      loadCount()
    } catch {
      setState('error')
    }
  }
  const readAll = async () => {
    try {
      await api.post(ENDPOINTS.notificationReadAll)
      setItems((value) => value.map((item) => ({ ...item, is_read: true })))
      setUnread(0)
    } catch {
      setState('error')
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => { const next = !open; setOpen(next); if (next) load() }} className="relative grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)] sm:h-9 sm:w-9" aria-label={`Open notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
        <Bell size={16} aria-hidden="true" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && <section className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-lg border border-border bg-surface shadow-card sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-96" aria-label="Notifications">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><strong className="text-sm text-foreground">Notifications</strong><button type="button" onClick={readAll} disabled={!unread} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary disabled:opacity-40"><CheckCheck size={14} />Mark all read</button></div>
        <div className="max-h-[60vh] overflow-y-auto">
          {state === 'loading' && <div className="flex items-center justify-center gap-2 p-8 text-xs text-muted-foreground"><RefreshCw size={15} className="animate-spin" />Loading…</div>}
          {state === 'error' && <div className="p-6 text-center text-xs text-muted-foreground">Unable to load notifications.<button type="button" onClick={load} className="ml-1 font-bold text-primary">Retry</button></div>}
          {state === 'ready' && items.length === 0 && <p className="p-8 text-center text-xs text-muted-foreground">You’re all caught up.</p>}
          {state === 'ready' && items.map((item) => <div key={item.id} className={`relative border-b border-border hover:bg-surface-secondary ${item.is_read ? '' : 'bg-[var(--primary-soft)]'}`}>
            <button type="button" onClick={() => openItem(item)} className="block w-full px-4 py-3 pr-11 text-left"><span className="block text-xs font-bold text-foreground">{item.title}</span><span className="mt-1 line-clamp-2 block text-[11px] text-muted-foreground">{item.message}</span><span className="mt-1 block text-[10px] font-semibold text-primary">{relativeTime(item.published_at || item.created_at)}</span></button>
            <button type="button" onClick={(event) => dismiss(event, item.id)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded hover:bg-surface" aria-label="Dismiss notification"><X size={13} /></button>
          </div>)}
        </div>
      </section>}
    </div>
  )
}
