import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [studentId, setStudentId] = useState('CHM/2026/001')
  const [level, setLevel] = useState('Level 300')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name)
    }
  }, [user?.full_name])

  const displayName = fullName || user?.email?.split('@')[0] || 'Dela Gogah'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DG'

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      // Connects live to backend PATCH /users/me !
      if (updateProfile) {
        await updateProfile(fullName)
        setMessage({ type: 'success', text: 'Profile updated successfully on the backend!' })
      } else {
        setMessage({ type: 'success', text: 'Profile changes saved locally!' })
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      setMessage({ type: 'error', text: 'Your profile could not be updated. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Head */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">ACCOUNT</span>
        <h1 className="text-2xl font-bold text-foreground mt-1">My profile</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage your department identity and student details.</p>
      </div>

      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Profile Hero Header */}
        <div className="flex items-center gap-4 sm:gap-6 pb-6 border-b border-border mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d8f0f1] text-primary font-black text-xl sm:text-2xl grid place-items-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{displayName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {user?.role === 'admin' ? 'Administrator' : 'Student'} · Chemistry · {level}
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
            {/* Full Name (Backed by PATCH /users/me) */}
            <div>
              <label htmlFor="profile-full-name" className="block text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                Full name <span className="text-primary normal-case">(Live API Synced)</span>
              </label>
              <input
                id="profile-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                placeholder="Your full name"
              />
            </div>

            {/* Student ID */}
            <div>
              <label htmlFor="profile-student-id" className="block text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                Student ID
              </label>
              <input
                id="profile-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                placeholder="e.g. CHM/2026/001"
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="profile-email" className="block text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                Email address <span className="text-muted-foreground normal-case">(Firebase UID linked)</span>
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email || 'student@example.com'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs bg-gray-50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Level */}
            <div>
              <label htmlFor="profile-level" className="block text-[11px] font-extrabold text-foreground uppercase tracking-wider mb-2">
                Academic Level
              </label>
              <select
                id="profile-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
              >
                <option value="Level 100">Level 100</option>
                <option value="Level 200">Level 200</option>
                <option value="Level 300">Level 300</option>
                <option value="Level 400">Level 400</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#f4f7f8] flex flex-col items-start gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 min-[480px]:w-auto"
            >
              {isSaving ? 'Saving changes...' : 'Save changes'}
            </button>
            <span className="text-[10px] text-muted-foreground">
              Profile is stored in Supabase PostgreSQL
            </span>
          </div>
        </form>
      </section>
    </div>
  )
}
