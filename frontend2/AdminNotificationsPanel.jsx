import { useEffect, useState } from 'react'
import { BellPlus, RefreshCw } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const emptyForm = { title: '', message: '', category: 'general', priority: 'normal', audience_type: 'all_students', target_email: '', destination_path: '', scheduled_for: '' }

export default function AdminNotificationsPanel() {
  const [items, setItems] = useState([]); const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = () => { setLoading(true); return api.get(ENDPOINTS.adminNotifications).then(setItems).catch(() => setError('Unable to load notification history.')).finally(() => setLoading(false)) }
  const act = async (endpoint) => { setError(''); try { await api.post(endpoint); await load() } catch { setError('Unable to update this notification. Please try again.') } }
  useEffect(load, [])
  const create = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try { await api.post(ENDPOINTS.adminNotifications, { ...form, target_email: form.audience_type === 'individual' ? form.target_email : null, destination_path: form.destination_path || null, scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null }); setForm(emptyForm); load() }
    catch (err) { setError(err.message || 'Unable to create notification.') } finally { setBusy(false) }
  }
  return <section className="rounded-lg border border-border bg-surface p-4 shadow-xs">
    <div className="mb-4 flex items-center gap-2"><BellPlus size={17} className="text-primary" /><h2 className="text-sm font-bold text-foreground">Standalone notifications</h2></div>
    <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
      <input required maxLength="200" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" aria-label="Notification title" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" />
      <input value={form.destination_path} onChange={(e) => setForm({ ...form, destination_path: e.target.value })} placeholder="Destination, e.g. /events" aria-label="Notification destination" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" />
      <textarea required maxLength="2000" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" aria-label="Notification message" rows="3" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs sm:col-span-2" />
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" aria-label="Notification priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select>
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" aria-label="Notification category"><option value="general">General</option><option value="academic">Academic</option><option value="deadline">Deadline</option><option value="maintenance">Maintenance</option><option value="system">System</option></select>
      <select value={form.audience_type} onChange={(e) => setForm({ ...form, audience_type: e.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" aria-label="Notification audience"><option value="all_students">All students</option><option value="individual">Individual student</option></select>
      {form.audience_type === 'individual' && <input required type="email" value={form.target_email} onChange={(e) => setForm({ ...form, target_email: e.target.value })} placeholder="Student email" aria-label="Student email" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" />}
      <input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} aria-label="Schedule notification" className="rounded-lg border border-border bg-surface px-3 py-2 text-xs" />
      <button disabled={busy} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-50 sm:col-span-2">{busy && <RefreshCw size={13} className="animate-spin" />}{form.scheduled_for ? 'Schedule notification' : 'Publish notification'}</button>
    </form>
    {error && <p className="mt-3 text-xs text-destructive" role="alert">{error}</p>}
    {loading && <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><RefreshCw size={13} className="animate-spin" />Loading notification history…</p>}
    {!loading && !error && items.length === 0 && <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">No standalone notifications yet.</p>}
    {!loading && items.length > 0 && <div className="mt-4 divide-y divide-border border-t border-border">{items.slice(0, 8).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div className="min-w-0"><strong className="block truncate text-foreground">{item.title}</strong><span className="text-muted-foreground">{item.status} · {item.read_count}/{item.eligible_recipients} read · {item.push_accepted}/{item.push_attempts} push accepted</span></div><div className="flex gap-2">{item.status === 'scheduled' && <button type="button" onClick={() => act(ENDPOINTS.adminNotificationCancel(item.id))} className="font-bold text-destructive">Cancel</button>}{item.status === 'published' && <button type="button" onClick={() => act(ENDPOINTS.adminNotificationResend(item.id))} className="font-bold text-primary">Resend</button>}{item.status !== 'archived' && <button type="button" onClick={() => act(ENDPOINTS.adminNotificationArchive(item.id))} className="font-bold text-muted-foreground">Archive</button>}</div></div>)}</div>}
  </section>
}
