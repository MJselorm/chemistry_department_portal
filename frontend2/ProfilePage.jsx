import React, { useState, useEffect } from 'react'
import { Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useToast } from './directory/Toast'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setFullName(user?.full_name || '')
  }, [user?.full_name])

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Student'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST'

  const handleSave = async (e) => {
    e.preventDefault()
    const normalizedName = fullName.trim().replace(/\s+/g, ' ')
    if (normalizedName.length < 2) {
      const text = 'Enter a display name with at least 2 characters.'
      setMessage({ type: 'error', text })
      showToast(text, 'error')
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      await updateProfile(normalizedName)
      setFullName(normalizedName)
      setMessage({ type: 'success', text: 'Display name updated successfully.' })
      showToast('Display name updated successfully.', 'success')
    } catch (err) {
      setMessage({ type: 'error', text: 'Your profile could not be updated. Please try again.' })
      showToast('Your profile could not be updated. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Head */}
      <div className="page-intro">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">ACCOUNT</span>
        <h1 className="text-2xl font-bold text-foreground mt-1">My profile</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage the name associated with your portal account.</p>
      </div>

      <section className="content-panel overflow-hidden rounded-lg">
        {/* Profile Hero Header */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 sm:p-7">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary text-primary-foreground font-black text-xl sm:text-2xl grid place-items-center flex-shrink-0 ring-4 ring-[var(--surface)] shadow-raised">
            {initials}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{displayName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2 inline-flex items-center gap-1.5">
              <ShieldCheck size={13} aria-hidden="true" />
              {user?.role === 'admin' ? 'Administrator' : 'Student'} · Chemistry Hub
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--success-soft)] text-success">
                Active account
              </span>
              {user?.role && (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
                  Role: {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        <div className="p-5 sm:p-7">
        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`p-3 rounded-xl mb-6 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-[var(--success-soft)] border border-[var(--success-border)] text-success'
                : 'bg-[var(--destructive-soft)] border border-[var(--destructive-border)] text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-full-name" className="flex items-center gap-1.5 text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                <UserRound size={13} aria-hidden="true" /> Full name
              </label>
              <input
                id="profile-full-name"
                type="text"
                minLength="2"
                maxLength="200"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="flex items-center gap-1.5 text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                <Mail size={13} aria-hidden="true" /> Email address
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs bg-surface-secondary text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#f4f7f8] flex flex-col items-start gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <button
              type="submit"
              disabled={isSaving || fullName.trim().length < 2 || fullName.trim().replace(/\s+/g, ' ') === (user?.full_name || '')}
              className="w-full px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 min-[480px]:w-auto inline-flex items-center justify-center gap-2"
            >
              <Save size={14} aria-hidden="true" />
              {isSaving ? 'Saving changes...' : 'Save changes'}
            </button>
            <span className="text-[10px] text-muted-foreground">
              Email and role changes require administrator action.
            </span>
          </div>
        </form>
        </div>
      </section>
    </div>
  )
}
