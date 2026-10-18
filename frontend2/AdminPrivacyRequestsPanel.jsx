import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import SelectField from './SelectField'
import { useToast } from './directory/Toast'

const STATUSES = ['pending', 'in_review', 'completed', 'rejected', 'cancelled']

export default function AdminPrivacyRequestsPanel() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('')
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const suffix = filter ? `?status=${encodeURIComponent(filter)}` : ''
      const result = await api.get(`${ENDPOINTS.adminPrivacyRequests}${suffix}`)
      const values = Array.isArray(result) ? result : []
      setRequests(values)
      setDrafts(Object.fromEntries(values.map((item) => [item.id, { status: item.status, resolution_note: item.resolution_note || '' }])))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load privacy requests.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateDraft = (id, changes) => setDrafts((current) => ({ ...current, [id]: { ...current[id], ...changes } }))

  const save = async (request) => {
    const draft = drafts[request.id]
    if (['completed', 'rejected'].includes(draft.status) && !draft.resolution_note.trim()) {
      showToast('Add a resolution note before completing or rejecting a request.', 'warning')
      return
    }
    setSavingId(request.id)
    try {
      const updated = await api.patch(ENDPOINTS.adminPrivacyRequest(request.id), {
        status: draft.status,
        resolution_note: draft.resolution_note.trim() || null,
      })
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item))
      showToast('Privacy request updated.', 'success')
    } catch (requestError) {
      showToast(requestError.message || 'Unable to update the privacy request.', 'error')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">PRIVACY OPERATIONS</span><h2 className="mt-0.5 text-xl font-bold text-foreground">Personal-data requests</h2><p className="mt-1 text-xs text-muted-foreground">Review authenticated requests. Status changes do not automatically delete Firebase accounts or shared resources.</p></div>
        <div className="flex items-center gap-2"><SelectField aria-label="Filter privacy requests by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg py-2 pl-3 text-xs"><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</SelectField><button type="button" onClick={load} disabled={loading} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-surface-secondary disabled:opacity-50" aria-label="Refresh privacy requests"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button></div>
      </div>

      {error && <div className="flex items-center justify-between rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-4 text-xs text-destructive" role="alert"><span>{error}</span><button type="button" onClick={load} className="font-bold underline">Retry</button></div>}
      {loading && requests.length === 0 && <div className="rounded-lg border border-border bg-surface py-12 text-center text-xs text-muted-foreground"><RefreshCw size={18} className="mx-auto mb-2 animate-spin text-primary" />Loading privacy requests…</div>}
      {!loading && !error && requests.length === 0 && <div className="rounded-lg border border-border bg-surface py-12 text-center"><ShieldCheck size={26} className="mx-auto text-muted-foreground" /><p className="mt-2 text-sm font-bold text-foreground">No privacy requests</p><p className="mt-1 text-xs text-muted-foreground">There are no requests matching this status.</p></div>}

      <div className="space-y-3">
        {requests.map((request) => {
          const draft = drafts[request.id] || { status: request.status, resolution_note: request.resolution_note || '' }
          const changed = draft.status !== request.status || draft.resolution_note !== (request.resolution_note || '')
          return <article key={request.id} className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-foreground">{request.request_type === 'data_export' ? 'Data export' : 'Account deletion'}</strong><span className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-bold capitalize text-muted-foreground">{request.status.replace('_', ' ')}</span></div><p className="mt-1 break-all text-xs text-muted-foreground">{request.requester_name || 'Name not provided'} · {request.requester_email}</p><p className="mt-1 text-[10px] text-muted-foreground">Requested {new Date(request.created_at).toLocaleString()} · Ref {request.id}</p>{request.reason && <p className="mt-3 rounded-lg bg-surface-secondary p-3 text-xs leading-5 text-foreground">{request.reason}</p>}</div></div><div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[180px_1fr_auto] sm:items-end"><div><label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Status</label><SelectField value={draft.status} onChange={(event) => updateDraft(request.id, { status: event.target.value })} className="rounded-lg py-2 pl-3 text-xs" wrapperClassName="w-full">{STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</SelectField></div><div><label htmlFor={`resolution-${request.id}`} className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Resolution note</label><input id={`resolution-${request.id}`} value={draft.resolution_note} maxLength={2000} onChange={(event) => updateDraft(request.id, { resolution_note: event.target.value })} className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Required when completed or rejected" /></div><button type="button" onClick={() => save(request)} disabled={!changed || savingId === request.id} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">{savingId === request.id ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}Save</button></div></article>
        })}
      </div>
    </section>
  )
}
