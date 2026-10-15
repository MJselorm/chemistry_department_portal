import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, RefreshCw } from 'lucide-react'
import { currentPushSubscription, disablePush, enablePush, pushSupported } from './pushNotifications'

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMessage, setPushMessage] = useState('')

  useEffect(() => {
    if (!pushSupported()) {
      setPushMessage('Device notifications are not supported in this browser. In-app notifications remain available.')
      return
    }
    currentPushSubscription().then((value) => setPushEnabled(Boolean(value))).catch(() => setPushMessage('Unable to check device notification status.'))
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Head */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">PREFERENCES</span>
        <h1 className="text-2xl font-bold text-foreground mt-1">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage device notifications and review account-data information.</p>
      </div>

      {/* Settings Panel */}
      <section className="bg-surface border border-border rounded-2xl divide-y divide-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 gap-3"><BellRing size={18} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block text-xs font-bold text-foreground">Device push notifications</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Receive a minimal alert on this device when important updates are published.</small>{pushMessage && <small className="mt-1 block text-[11px] text-muted-foreground" role="status">{pushMessage}</small>}</div></div>
          <button type="button" disabled={pushBusy || !pushSupported()} onClick={async () => { setPushBusy(true); setPushMessage(''); try { if (pushEnabled) { await disablePush(); setPushEnabled(false); setPushMessage('Device notifications disabled.') } else { await enablePush(); setPushEnabled(true); setPushMessage('Device notifications enabled.') } } catch (error) { setPushMessage(error.message) } finally { setPushBusy(false) } }} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${pushEnabled ? 'border border-border text-foreground' : 'bg-primary text-white'} disabled:opacity-50`}>{pushBusy && <RefreshCw size={13} className="animate-spin" />}{pushEnabled ? 'Disable' : 'Enable'}</button>
        </div>
      </section>

      <section className="border-t border-border pt-5">
        <h2 className="text-sm font-bold text-foreground">Privacy and account data</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Review how portal data is handled or contact department administration to request access,
          correction, or deletion after identity verification.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-primary">
          <Link to="/privacy" className="hover:underline">Privacy Notice</Link>
          <Link to="/terms" className="hover:underline">Terms of Use</Link>
        </div>
      </section>
    </div>
  )
}
