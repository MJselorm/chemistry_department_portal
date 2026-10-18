import { useEffect, useState } from 'react'
import { Cookie, Settings2, ShieldCheck, X } from 'lucide-react'
import { getCookiePreferences, saveCookiePreferences } from './cookiePreferences'
import useDialogAccessibility from './useDialogAccessibility'

export default function CookieConsent() {
  const [preferences, setPreferences] = useState(() => getCookiePreferences())
  const [customizing, setCustomizing] = useState(false)
  const [functional, setFunctional] = useState(() => getCookiePreferences()?.functional ?? false)
  const dialogRef = useDialogAccessibility(() => setCustomizing(false), customizing)

  useEffect(() => {
    const open = () => {
      setFunctional(getCookiePreferences()?.functional ?? false)
      setCustomizing(true)
    }
    window.addEventListener('chemhub:open-cookie-preferences', open)
    return () => window.removeEventListener('chemhub:open-cookie-preferences', open)
  }, [])

  const choose = (allowFunctional) => {
    const saved = saveCookiePreferences(allowFunctional)
    setPreferences(saved)
    setFunctional(saved.functional)
    setCustomizing(false)
  }

  return (
    <>
      {!preferences && !customizing && (
        <aside className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-4xl rounded-lg border border-border bg-surface p-4 shadow-raised sm:bottom-5 sm:flex sm:items-center sm:gap-5 sm:p-5" aria-labelledby="cookie-banner-title">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><Cookie size={18} aria-hidden="true" /></span>
            <div>
              <h2 id="cookie-banner-title" className="text-sm font-bold text-foreground">Your privacy choices</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Chemistry Hub uses essential browser storage for secure sign-in. Optional storage can remember your theme and navigation layout. We do not use analytics or advertising trackers.</p>
            </div>
          </div>
          <div className="mt-4 grid shrink-0 grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:mt-0 sm:flex">
            <button type="button" onClick={() => choose(false)} className="h-9 rounded-lg border border-border px-3 text-xs font-bold text-foreground hover:bg-surface-secondary">Reject Optional</button>
            <button type="button" onClick={() => setCustomizing(true)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold text-foreground hover:bg-surface-secondary"><Settings2 size={13} />Customize Preferences</button>
            <button type="button" onClick={() => choose(true)} className="h-9 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover">Accept Optional</button>
          </div>
        </aside>
      )}

      {customizing && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-4">
          <button type="button" className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setCustomizing(false)} aria-label="Close cookie preferences" />
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-raised sm:p-6">
            <button type="button" onClick={() => setCustomizing(false)} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-secondary hover:text-foreground" aria-label="Close"><X size={17} /></button>
            <div className="flex items-start gap-3 pr-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><ShieldCheck size={20} /></span>
              <div><h2 id="cookie-preferences-title" className="text-base font-bold text-foreground">Cookie preferences</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose whether this browser may remember convenience settings. Essential sign-in storage cannot be disabled while using the portal.</p></div>
            </div>
            <div className="mt-5 divide-y divide-border rounded-lg border border-border">
              <div className="flex items-center justify-between gap-4 p-4"><div><strong className="text-xs text-foreground">Essential storage</strong><p className="mt-0.5 text-[11px] text-muted-foreground">Authentication, security, consent choice, and requested push notifications.</p></div><span className="text-[10px] font-bold uppercase text-success">Always active</span></div>
              <label className="flex cursor-pointer items-center justify-between gap-4 p-4"><div><strong className="text-xs text-foreground">Functional preferences</strong><p className="mt-0.5 text-[11px] text-muted-foreground">Remember theme and sidebar layout on this device.</p></div><input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} className="h-4 w-4 shrink-0" /></label>
              <div className="flex items-center justify-between gap-4 p-4"><div><strong className="text-xs text-foreground">Analytics and advertising</strong><p className="mt-0.5 text-[11px] text-muted-foreground">Chemistry Hub does not initialize analytics or advertising trackers.</p></div><span className="text-[10px] font-bold uppercase text-muted-foreground">Not used</span></div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:justify-end"><button type="button" onClick={() => choose(false)} className="h-10 rounded-lg border border-border px-4 text-xs font-bold text-foreground hover:bg-surface-secondary">Reject Optional</button><button type="button" onClick={() => choose(functional)} className="h-10 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover">Save Preferences</button></div>
          </section>
        </div>
      )}
    </>
  )
}
