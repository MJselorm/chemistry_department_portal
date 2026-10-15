import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, RefreshCw } from 'lucide-react'
import { currentPushSubscription, disablePush, enablePush, pushSupported } from './pushNotifications'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [eventReminders, setEventReminders] = useState(true)
  const [publicDirectory, setPublicDirectory] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushMessage, setPushMessage] = useState('')

  useEffect(() => { currentPushSubscription().then((value) => setPushEnabled(Boolean(value))).catch(() => {}) }, [])

  const handleChange = (setter, val) => {
    setter(val)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Head */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">PREFERENCES</span>
        <h1 className="text-2xl font-bold text-foreground mt-1">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Preview notification and directory preferences for this session.</p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-[var(--success-soft)] border border-[var(--success-border)] text-success text-xs font-semibold">
          Preference changed for this session. Server persistence is not yet available.
        </div>
      )}

      {/* Settings Panel */}
      <section className="bg-surface border border-border rounded-2xl divide-y divide-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 gap-3"><BellRing size={18} className="mt-0.5 shrink-0 text-primary" /><div><strong className="block text-xs font-bold text-foreground">Device push notifications</strong><small className="mt-0.5 block text-[11px] text-muted-foreground">Receive a minimal alert on this device when important updates are published.</small>{pushMessage && <small className="mt-1 block text-[11px] text-muted-foreground" role="status">{pushMessage}</small>}</div></div>
          <button type="button" disabled={pushBusy || !pushSupported()} onClick={async () => { setPushBusy(true); setPushMessage(''); try { if (pushEnabled) { await disablePush(); setPushEnabled(false); setPushMessage('Device notifications disabled.') } else { await enablePush(); setPushEnabled(true); setPushMessage('Device notifications enabled.') } } catch (error) { setPushMessage(error.message) } finally { setPushBusy(false) } }} className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold ${pushEnabled ? 'border border-border text-foreground' : 'bg-primary text-white'} disabled:opacity-50`}>{pushBusy && <RefreshCw size={13} className="animate-spin" />}{pushEnabled ? 'Disable' : 'Enable'}</button>
        </div>
        {/* Email notifications */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-surface-secondary cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-foreground">Email notifications</strong>
            <small className="block text-[11px] text-muted-foreground mt-0.5">
              Receive event announcements and departmental updates directly in your inbox.
            </small>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => handleChange(setEmailNotifications, e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
        </label>

        {/* Event reminders */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-surface-secondary cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-foreground">Event reminders</strong>
            <small className="block text-[11px] text-muted-foreground mt-0.5">
              Get reminders 24 hours before registered seminars and workshops.
            </small>
          </div>
          <input
            type="checkbox"
            checked={eventReminders}
            onChange={(e) => handleChange(setEventReminders, e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
        </label>

        {/* Public directory profile */}
        <label className="flex items-center justify-between gap-4 p-5 hover:bg-surface-secondary cursor-pointer transition-colors">
          <div>
            <strong className="block text-xs font-bold text-foreground">Public directory profile</strong>
            <small className="block text-[11px] text-muted-foreground mt-0.5">
              Allow your basic student name and class level to appear in the department student directory.
            </small>
          </div>
          <input
            type="checkbox"
            checked={publicDirectory}
            onChange={(e) => handleChange(setPublicDirectory, e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
          />
        </label>
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
