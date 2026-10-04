import React from 'react'
import { Bell, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Account settings</span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage the account and privacy controls currently supported by Chemistry Hub.</p>
      </header>

      <section className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <Link to="/profile" className="flex items-start gap-3 p-5 transition-colors hover:bg-surface-secondary">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><UserRound size={17} /></span>
          <span><strong className="block text-xs font-bold text-foreground">Profile and photo</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Update your name, student details, and private profile photo.</small></span>
        </Link>
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><Bell size={17} /></span>
          <span><strong className="block text-xs font-bold text-foreground">Portal notifications</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Announcements, published events, and new academic resources appear in the notification menu. Email delivery is not enabled.</small></span>
        </div>
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--success-soft)] text-success"><ShieldCheck size={17} /></span>
          <span><strong className="block text-xs font-bold text-foreground">Privacy and account data</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Account correction or deletion requests require identity verification by department administration.</small></span>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-xs font-bold text-primary">
        <Link to="/privacy" className="hover:underline">Privacy Notice</Link>
        <Link to="/terms" className="hover:underline">Terms of Use</Link>
      </div>
    </div>
  )
}
