import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BellRing, ChevronRight, Cookie, FileJson, RefreshCw, ShieldCheck, UserRound, UserX, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { openCookiePreferences } from './cookiePreferences'
import { currentPushSubscription, disablePush, enablePush, pushSupported } from './pushNotifications'
import useDialogAccessibility from './useDialogAccessibility'

const legalLinks = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Use' },
  { to: '/cookies', label: 'Cookie Policy' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMessage, setPushMessage] = useState('')
  const [privacyAction, setPrivacyAction] = useState(null)

  useEffect(() => {
    if (!pushSupported()) {
      setPushMessage('Device notifications are not supported in this browser. In-app notifications remain available.')
      return
    }
    currentPushSubscription().then((value) => setPushEnabled(Boolean(value))).catch(() => setPushMessage('Unable to check device notification status.'))
  }, [])

  const togglePush = async () => {
    setPushBusy(true)
    setPushMessage('')
    try {
      if (pushEnabled) {
        await disablePush()
        setPushEnabled(false)
        setPushMessage('Device notifications disabled.')
      } else {
        await enablePush()
        setPushEnabled(true)
        setPushMessage('Device notifications enabled.')
      }
    } catch (error) {
      setPushMessage(error.message || 'Unable to update device notifications. Please try again.')
    } finally {
      setPushBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">ACCOUNT & PREFERENCES</span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage your account shortcuts, privacy choices, and supported device preferences.</p>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="account-settings-title">
        <div className="border-b border-border px-5 py-4"><h2 id="account-settings-title" className="text-sm font-bold text-foreground">Account</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Your email and role are managed by authentication and portal administrators.</p></div>
        <Link to="/profile" className="flex items-center gap-3 p-5 transition-colors hover:bg-surface-secondary">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><UserRound size={18} /></span>
          <span className="min-w-0 flex-1"><strong className="block text-xs text-foreground">Profile and display name</strong><small className="block truncate text-[11px] text-muted-foreground">{user?.full_name || user?.email || 'View your portal profile'}</small></span>
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="privacy-settings-title">
        <div className="border-b border-border px-5 py-4"><h2 id="privacy-settings-title" className="text-sm font-bold text-foreground">Privacy & Data</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Review portal policies and available personal-data controls.</p></div>
        <nav aria-label="Privacy policies" className="divide-y divide-border">
          {legalLinks.map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs font-semibold text-foreground hover:bg-surface-secondary"><span>{item.label}</span><ChevronRight size={15} className="text-muted-foreground" /></Link>)}
          <button type="button" onClick={openCookiePreferences} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-xs font-semibold text-foreground hover:bg-surface-secondary"><span className="inline-flex items-center gap-2"><Cookie size={15} className="text-primary" />Manage Cookie Preferences</span><ChevronRight size={15} className="text-muted-foreground" /></button>
        </nav>
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">
          <button type="button" onClick={() => setPrivacyAction('export')} className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-[var(--primary-border)] hover:bg-surface-secondary"><FileJson size={18} className="mt-0.5 shrink-0 text-primary" /><span><strong className="block text-xs text-foreground">Request My Data</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Request a structured copy tied to your verified account.</small></span></button>
          <button type="button" onClick={() => setPrivacyAction('deletion')} className="flex items-start gap-3 rounded-lg border border-[var(--destructive-border)] p-4 text-left transition-colors hover:bg-[var(--destructive-soft)]"><UserX size={18} className="mt-0.5 shrink-0 text-destructive" /><span><strong className="block text-xs text-foreground">Request Account Deletion</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Start a reviewed request; this never deletes shared materials automatically.</small></span></button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="preference-settings-title">
        <div className="border-b border-border px-5 py-4"><h2 id="preference-settings-title" className="text-sm font-bold text-foreground">Preferences</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Theme controls remain available in the top navigation.</p></div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 gap-3"><BellRing size={18} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block text-xs font-bold text-foreground">Device push notifications</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Receive a minimal alert on this device for important updates.</small>{pushMessage && <small className="mt-1 block text-[11px] text-muted-foreground" role="status">{pushMessage}</small>}</div></div>
          <button type="button" disabled={pushBusy || !pushSupported()} onClick={togglePush} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${pushEnabled ? 'border border-border text-foreground' : 'bg-primary text-white'} disabled:opacity-50`}>{pushBusy && <RefreshCw size={13} className="animate-spin" />}{pushEnabled ? 'Disable' : 'Enable'}</button>
        </div>
      </section>

      <PrivacyActionModal action={privacyAction} onClose={() => setPrivacyAction(null)} />
    </div>
  )
}

function PrivacyActionModal({ action, onClose }) {
  const dialogRef = useDialogAccessibility(onClose, Boolean(action))
  if (!action) return null
  const deleting = action === 'deletion'
  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button type="button" className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} aria-label="Close privacy request information" />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="privacy-action-title" tabIndex={-1} className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-raised sm:p-6">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-secondary" aria-label="Close"><X size={17} /></button>
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${deleting ? 'bg-[var(--destructive-soft)] text-destructive' : 'bg-[var(--primary-soft)] text-primary'}`}>{deleting ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}</span>
        <h2 id="privacy-action-title" className="mt-4 text-base font-bold text-foreground">{deleting ? 'Request account deletion' : 'Request a copy of my data'}</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{deleting ? 'Deletion requires identity verification and administrator review. Applicable institutional retention requirements may prevent immediate removal, and shared academic resources will not be deleted.' : 'A complete export must be generated by the backend from your authenticated identity and must exclude other users, authentication secrets, and private service credentials.'}</p>
        <div className="mt-4 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-xs leading-5 text-[var(--warning)]" role="status"><strong className="block">Backend setup required</strong>This portal cannot securely submit or track this request yet. No request has been created. Contact department administration until the privacy-request API is deployed.</div>
        <div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="h-10 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover">Close</button></div>
      </section>
    </div>
  )
}
