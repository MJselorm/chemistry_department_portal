import { useEffect, useState } from 'react'
import { AlertTriangle, Download, Loader2, ShieldCheck, X } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import useDialogAccessibility from './useDialogAccessibility'

function downloadExport(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `chemistry-hub-data-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function PrivacyRequestModal({ action, onClose, onCompleted }) {
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const dialogRef = useDialogAccessibility(onClose, Boolean(action), busy)

  useEffect(() => {
    setBusy(false)
    setConfirmed(false)
    setReason('')
    setMessage('')
    setError('')
  }, [action])

  if (!action) return null
  const deleting = action === 'deletion'

  const submit = async () => {
    if (deleting && !confirmed) return
    setBusy(true)
    setError('')
    try {
      if (deleting) {
        const request = await api.post(ENDPOINTS.privacyDeletion, { reason: reason.trim() || null })
        setMessage(`Your deletion request is ${request.status.replace('_', ' ')}. Reference: ${request.id}`)
      } else {
        const exported = await api.post(ENDPOINTS.privacyExport, {})
        downloadExport(exported)
        setMessage('Your personal-data export has been downloaded as JSON.')
      }
      onCompleted?.()
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete this request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button type="button" disabled={busy} className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} aria-label="Close privacy request" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="privacy-action-title" tabIndex={-1} className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-raised sm:p-6">
        <button type="button" disabled={busy} onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-secondary disabled:opacity-50" aria-label="Close"><X size={17} /></button>
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${deleting ? 'bg-[var(--destructive-soft)] text-destructive' : 'bg-[var(--primary-soft)] text-primary'}`}>{deleting ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}</span>
        <h2 id="privacy-action-title" className="mt-4 text-base font-bold text-foreground">{deleting ? 'Request account deletion' : 'Download a copy of my data'}</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{deleting ? 'This creates a tracked request for administrator review. Retention requirements may prevent immediate removal, and shared academic resources will not be deleted.' : 'Chemistry Hub will create an audit record and download the personal account data associated with your verified session. Authentication secrets and other users are excluded.'}</p>

        {deleting && !message && <div className="mt-4 space-y-3"><div><label htmlFor="deletion-reason" className="text-[11px] font-bold text-foreground">Reason <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="deletion-reason" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none" placeholder="Add information for the reviewing administrator" /></div><label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-xs leading-5 text-foreground"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" /><span>I understand this is a reviewed request and does not immediately delete my account.</span></label></div>}

        {error && <div className="mt-4 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-xs text-destructive" role="alert">{error}</div>}
        {message && <div className="mt-4 break-words rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] p-3 text-xs leading-5 text-success" role="status">{message}</div>}

        <div className="mt-5 flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:justify-end">
          <button type="button" disabled={busy} onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-xs font-bold text-foreground hover:bg-surface-secondary disabled:opacity-50">{message ? 'Close' : 'Cancel'}</button>
          {!message && <button type="button" disabled={busy || (deleting && !confirmed)} onClick={submit} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold text-white disabled:opacity-50 ${deleting ? 'bg-destructive hover:opacity-90' : 'bg-primary hover:bg-primary-hover'}`}>{busy ? <Loader2 size={14} className="animate-spin" /> : deleting ? <AlertTriangle size={14} /> : <Download size={14} />}{busy ? 'Processing…' : deleting ? 'Submit request' : 'Download JSON'}</button>}
        </div>
      </section>
    </div>
  )
}
