import React, { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function ProfilePage() {
  const { user, profilePhotoUrl, updateProfile, uploadProfilePhoto, removeProfilePhoto } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    student_id: user?.student_id || '',
    level: user?.level || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [photoAction, setPhotoAction] = useState('')
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setForm({
      full_name: user?.full_name || '',
      student_id: user?.student_id || '',
      level: user?.level || '',
    })
  }, [user?.full_name, user?.student_id, user?.level])

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Portal member'
  const initials = displayName.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'PM'
  const showError = () => setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })

  const handleSave = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)
    try {
      await updateProfile(form)
      setMessage({ type: 'success', text: 'Your profile has been updated.' })
    } catch (error) {
      console.error('Profile update failed.', error)
      showError()
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose a JPEG, PNG, or WebP image no larger than 5 MB.' })
      return
    }
    setPhotoAction('upload')
    setMessage(null)
    try {
      await uploadProfilePhoto(file)
      setMessage({ type: 'success', text: 'Your profile photo has been updated.' })
    } catch (error) {
      console.error('Profile photo upload failed.', error)
      showError()
    } finally {
      setPhotoAction('')
    }
  }

  const handlePhotoRemoval = async () => {
    if (!window.confirm('Remove your current profile photo?')) return
    setPhotoAction('remove')
    setMessage(null)
    try {
      await removeProfilePhoto()
      setMessage({ type: 'success', text: 'Your profile photo has been removed.' })
    } catch (error) {
      console.error('Profile photo removal failed.', error)
      showError()
    } finally {
      setPhotoAction('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Account</span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">My profile</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage your department identity and profile photo.</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative h-20 w-20 shrink-0">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={`${displayName}'s profile`} className="h-20 w-20 rounded-full border border-border object-cover" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--primary-soft)] text-xl font-black text-primary" aria-label={`${displayName} initials`}>
                {initials}
              </div>
            )}
            {photoAction && <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45"><RefreshCw size={20} className="animate-spin text-white" /></span>}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold text-foreground">{displayName}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelected} className="sr-only" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={Boolean(photoAction)} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">
                <Camera size={14} /> {profilePhotoUrl ? 'Change photo' : 'Add photo'}
              </button>
              {profilePhotoUrl && (
                <button type="button" onClick={handlePhotoRemoval} disabled={Boolean(photoAction)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--destructive-border)] px-3 text-xs font-bold text-destructive hover:bg-[var(--destructive-soft)] disabled:opacity-50">
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">JPEG, PNG, or WebP. Maximum 5 MB.</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {message && (
            <div role={message.type === 'error' ? 'alert' : 'status'} className={`mb-5 rounded-lg border p-3 text-xs font-semibold ${message.type === 'success' ? 'border-[var(--success-border)] bg-[var(--success-soft)] text-success' : 'border-[var(--destructive-border)] bg-[var(--destructive-soft)] text-destructive'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Full name</span>
                <input type="text" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} minLength={2} maxLength={200} required autoComplete="name" className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Student ID</span>
                <input type="text" value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} maxLength={50} pattern="[A-Za-z0-9/_-]*" placeholder="Optional" className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Email address</span>
                <input type="email" value={user?.email || ''} disabled className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-secondary px-3.5 py-2.5 text-xs text-muted-foreground" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-foreground">Academic level</span>
                <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none">
                  <option value="">Not specified</option>
                  <option value="100">Level 100</option>
                  <option value="200">Level 200</option>
                  <option value="300">Level 300</option>
                  <option value="400">Level 400</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] text-muted-foreground">Role: {user?.role === 'admin' ? 'Administrator' : 'Student'}</span>
              <button type="submit" disabled={isSaving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50">
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
