import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, ChevronRight, Cookie, FileJson, RefreshCw, UserRound, UserX } from 'lucide-react'
import { useAuth } from './AuthContext'
import { api } from './client'
import { openCookiePreferences } from './cookiePreferences'
import { ENDPOINTS } from './endpoints'
import PrivacyRequestModal from './PrivacyRequestModal'
import { currentPushSubscription, disablePush, enablePush, pushSupported } from './pushNotifications'

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
  const [privacyRequests, setPrivacyRequests] = useState([])
  const [privacyLoading, setPrivacyLoading] = useState(true)
  const [privacyError, setPrivacyError] = useState('')

  const loadPrivacyRequests = useCallback(async () => {
    setPrivacyLoading(true)
    setPrivacyError('')
    try {
      const result = await api.get(ENDPOINTS.privacyRequests)
      setPrivacyRequests(Array.isArray(result) ? result : [])
    } catch (error) {
      setPrivacyError(error.message || 'Unable to load privacy-request history.')
    } finally {
      setPrivacyLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!pushSupported()) {
      setPushMessage('Device notifications are not supported in this browser. In-app notifications remain available.')
      return
    }
    currentPushSubscription().then((value) => setPushEnabled(Boolean(value))).catch(() => setPushMessage('Unable to check device notification status.'))
  }, [])

  useEffect(() => { loadPrivacyRequests() }, [loadPrivacyRequests])

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
      <div className="page-intro">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">ACCOUNT & PREFERENCES</span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage your account shortcuts, privacy choices, and supported device preferences.</p>
      </div>

      <section className="settings-section overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="account-settings-title">
        <header className="border-b border-border px-5 py-4"><h2 id="account-settings-title" className="text-sm font-bold text-foreground">Account</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Your email and role are managed by authentication and portal administrators.</p></header>
        <Link to="/profile" className="flex items-center gap-3 p-5 transition-colors hover:bg-surface-secondary">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><UserRound size={18} /></span>
          <span className="min-w-0 flex-1"><strong className="block text-xs text-foreground">Profile and display name</strong><small className="block truncate text-[11px] text-muted-foreground">{user?.full_name || user?.email || 'View your portal profile'}</small></span>
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </section>

      <section className="settings-section overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="privacy-settings-title">
        <header className="border-b border-border px-5 py-4"><h2 id="privacy-settings-title" className="text-sm font-bold text-foreground">Privacy & Data</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Review portal policies and available personal-data controls.</p></header>
        <nav aria-label="Privacy policies" className="divide-y divide-border">
          {legalLinks.map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs font-semibold text-foreground hover:bg-surface-secondary"><span>{item.label}</span><ChevronRight size={15} className="text-muted-foreground" /></Link>)}
          <button type="button" onClick={openCookiePreferences} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-xs font-semibold text-foreground hover:bg-surface-secondary"><span className="inline-flex items-center gap-2"><Cookie size={15} className="text-primary" />Manage Cookie Preferences</span><ChevronRight size={15} className="text-muted-foreground" /></button>
        </nav>
        <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2">
          <button type="button" onClick={() => setPrivacyAction('export')} className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-[var(--primary-border)] hover:bg-surface-secondary"><FileJson size={18} className="mt-0.5 shrink-0 text-primary" /><span><strong className="block text-xs text-foreground">Request My Data</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Request a structured copy tied to your verified account.</small></span></button>
          <button type="button" onClick={() => setPrivacyAction('deletion')} className="flex items-start gap-3 rounded-lg border border-[var(--destructive-border)] p-4 text-left transition-colors hover:bg-[var(--destructive-soft)]"><UserX size={18} className="mt-0.5 shrink-0 text-destructive" /><span><strong className="block text-xs text-foreground">Request Account Deletion</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Start a reviewed request; this never deletes shared materials automatically.</small></span></button>
        </div>
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-bold text-foreground">Request history</h3>{privacyError && <button type="button" onClick={loadPrivacyRequests} className="text-[11px] font-bold text-primary hover:underline">Retry</button>}</div>
          {privacyLoading ? <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-muted-foreground"><RefreshCw size={12} className="animate-spin" />Loading requests…</p> : privacyError ? <p className="mt-2 text-[11px] text-destructive" role="alert">{privacyError}</p> : privacyRequests.length === 0 ? <p className="mt-2 text-[11px] text-muted-foreground">No personal-data requests have been created.</p> : <ul className="mt-2 divide-y divide-border">{privacyRequests.slice(0, 5).map((request) => <li key={request.id} className="flex items-center justify-between gap-3 py-2 text-[11px]"><span className="text-foreground">{request.request_type === 'data_export' ? 'Data export' : 'Account deletion'}<small className="ml-2 text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</small></span><span className="rounded-full bg-surface-secondary px-2 py-0.5 font-bold capitalize text-muted-foreground">{request.status.replace('_', ' ')}</span></li>)}</ul>}
        </div>
      </section>

      <section className="settings-section overflow-hidden rounded-lg border border-border bg-surface shadow-sm" aria-labelledby="preference-settings-title">
        <header className="border-b border-border px-5 py-4"><h2 id="preference-settings-title" className="text-sm font-bold text-foreground">Preferences</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Theme controls remain available in the top navigation.</p></header>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 gap-3"><BellRing size={18} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block text-xs font-bold text-foreground">Device push notifications</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Receive a minimal alert on this device for important updates.</small>{pushMessage && <small className="mt-1 block text-[11px] text-muted-foreground" role="status">{pushMessage}</small>}</div></div>
          <button type="button" disabled={pushBusy || !pushSupported()} onClick={togglePush} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${pushEnabled ? 'border border-border text-foreground' : 'bg-primary text-white'} disabled:opacity-50`}>{pushBusy && <RefreshCw size={13} className="animate-spin" />}{pushEnabled ? 'Disable' : 'Enable'}</button>
        </div>
      </section>

      <PrivacyRequestModal action={privacyAction} onClose={() => setPrivacyAction(null)} onCompleted={loadPrivacyRequests} />
    </div>
  )
}
