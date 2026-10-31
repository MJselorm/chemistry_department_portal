import React, { useCallback, useEffect, useState } from 'react'
import { BookOpen, Check, Clock3, GraduationCap, Handshake, RefreshCw } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useAuth } from './AuthContext'
import { useToast } from './directory/Toast'

const LEVELS = [
  ['100', 'Level 100'],
  ['200', 'Level 200'],
  ['300', 'Level 300'],
  ['400', 'Level 400'],
  ['postgraduate', 'Postgraduate'],
]

const splitItems = (value) => value.split(/\n|,/).map((part) => part.trim()).filter(Boolean)

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5 text-xs font-semibold text-foreground">
      <span>{label}</span>
      {children}
      {hint && <small className="block font-normal text-muted-foreground">{hint}</small>}
    </label>
  )
}

const inputClass = 'w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--primary-border)]'
const secondaryButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-surface-secondary disabled:opacity-60'
const primaryButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-60'

export default function MentorshipPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mentorForm, setMentorForm] = useState({
    academic_level: '100',
    subjects: '',
    availability: '',
    preferred_capacity: '1',
    introduction: '',
  })
  const [menteeForm, setMenteeForm] = useState({
    academic_level: '100',
    subjects: '',
    learning_goals: '',
    availability: '',
    preferences: '',
  })
  const [goalTitle, setGoalTitle] = useState({})
  const [progressText, setProgressText] = useState({})
  const [sessionForm, setSessionForm] = useState({})

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const result = await api.get(ENDPOINTS.mentorshipMe)
      setData(result)
    } catch (error) {
      setLoadError(error.message || 'Mentorship details could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const runAction = async (action, message) => {
    setBusy(true)
    try {
      await action()
      showToast(message, 'success')
      await refresh()
      return true
    } catch (error) {
      showToast(error.message || 'The mentorship action could not be completed.', 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const submitMentor = (event) => {
    event.preventDefault()
    runAction(() => api.post(ENDPOINTS.mentorshipMentorApplications, {
      ...mentorForm,
      preferred_capacity: Number(mentorForm.preferred_capacity),
      subjects: splitItems(mentorForm.subjects),
      availability: splitItems(mentorForm.availability),
    }), 'Mentor application submitted for review.')
  }

  const submitMentee = (event) => {
    event.preventDefault()
    runAction(() => api.post(ENDPOINTS.mentorshipMenteeApplications, {
      ...menteeForm,
      subjects: splitItems(menteeForm.subjects),
      learning_goals: splitItems(menteeForm.learning_goals),
      availability: splitItems(menteeForm.availability),
    }), 'Mentee application submitted.')
  }

  const changePreference = (enabled) => runAction(
    () => api.patch(ENDPOINTS.mentorshipNotificationPreferences, { in_app_enabled: enabled }),
    'Notification preference updated.',
  )

  const submitGoal = (event, matchId) => {
    event.preventDefault()
    const title = goalTitle[matchId]?.trim()
    if (!title) return
    runAction(
      () => api.post(ENDPOINTS.mentorshipGoals(matchId), { title }),
      'Learning goal added.',
    ).then((succeeded) => {
      if (succeeded) setGoalTitle((value) => ({ ...value, [matchId]: '' }))
    })
  }

  const submitProgress = (event, matchId) => {
    event.preventDefault()
    const body = progressText[matchId]?.trim()
    if (!body) return
    runAction(
      () => api.post(ENDPOINTS.mentorshipProgressNotes(matchId), { body }),
      'Progress note added.',
    ).then((succeeded) => {
      if (succeeded) setProgressText((value) => ({ ...value, [matchId]: '' }))
    })
  }

  const submitSession = (event, matchId) => {
    event.preventDefault()
    const form = sessionForm[matchId] || {}
    if (!form.session_date || !form.topic?.trim()) return
    runAction(() => api.post(ENDPOINTS.mentorshipSessions(matchId), {
      submission_key: crypto.randomUUID(),
      session_date: form.session_date,
      topic: form.topic.trim(),
      notes: form.notes?.trim() || null,
    }), 'Study session recorded; awaiting the other participant’s confirmation.')
      .then((succeeded) => {
        if (succeeded) setSessionForm((value) => ({ ...value, [matchId]: {} }))
      })
  }

  const handleMatchDecision = (match, decision) => {
    const verb = decision === 'accept' ? 'accept this mentorship proposal' : 'decline this proposal'
    if (!window.confirm(`Are you sure you want to ${verb}?`)) return
    runAction(
      () => api.post(ENDPOINTS.mentorshipMatchDecision(match.id), { decision }),
      decision === 'accept' ? 'Your response was recorded.' : 'Proposal declined.',
    )
  }

  const completeMentorship = (match) => {
    if (!window.confirm('Mark this mentorship as complete? The other participant must also confirm.')) return
    const feedback = window.prompt('Optional private programme feedback (leave blank to skip):')
    runAction(
      () => api.post(ENDPOINTS.mentorshipCompletion(match.id), { feedback: feedback?.trim() || null }),
      'Completion confirmation recorded.',
    )
  }

  const requestReassignment = (match) => {
    if (!window.confirm('Send a reassignment request to the mentorship administrators?')) return
    const reason = window.prompt('Optional reason for the request:')
    runAction(
      () => api.post(ENDPOINTS.mentorshipReassignment(match.id), { reason: reason?.trim() || null }),
      'Reassignment request sent for review.',
    )
  }

  const withdraw = (match) => {
    if (!window.confirm('Withdraw from this mentorship? This will end the current match.')) return
    runAction(() => api.post(ENDPOINTS.mentorshipWithdraw(match.id), {}), 'You have withdrawn from this mentorship.')
  }

  const matchList = data?.matches || []
  const activeMatches = matchList.filter((match) => match.status === 'active')
  const proposals = matchList.filter((match) => match.status === 'proposed')
  const history = matchList.filter((match) => !['active', 'proposed'].includes(match.status))
  const mentorApplication = data?.mentor_application
  const menteeApplication = data?.mentee_application
  const menteeOpen = menteeApplication && ['waiting', 'matched'].includes(menteeApplication.status)
  const mentorCanApply = !mentorApplication || mentorApplication.status === 'rejected'

  if (loading) {
    return <p className="content-panel rounded-xl p-8 text-center text-sm text-muted-foreground" role="status">Loading Mentorship Programme…</p>
  }

  return (
    <div className="space-y-6">
      <header className="content-panel flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">STUDENT SUPPORT</span>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Mentorship Programme</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Share what you know or get support with Chemistry courses. Matches are based on subject fit, study level, availability, and mentor capacity.
          </p>
          {user?.full_name && <p className="mt-2 text-xs text-muted-foreground">Profile: {user.full_name}</p>}
        </div>
        <button type="button" className={secondaryButton} onClick={refresh} disabled={busy}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </header>

      {loadError && (
        <div className="rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-sm text-destructive" role="alert">
          {loadError}
          <button type="button" onClick={refresh} className="ml-3 font-bold underline">Try again</button>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="content-panel rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><GraduationCap size={20} /></span>
            <div><h2 className="font-bold text-foreground">Become a Mentor</h2><p className="text-xs text-muted-foreground">Support students in subjects you know well.</p></div>
          </div>
          {mentorApplication && !mentorCanApply ? (
            <div className="rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <p className="font-semibold text-foreground">Application status: <span className="capitalize">{mentorApplication.status}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{mentorApplication.subjects.join(', ')} · up to {mentorApplication.preferred_capacity} mentee(s)</p>
              {mentorApplication.review_note && <p className="mt-2 text-xs text-muted-foreground">Review note: {mentorApplication.review_note}</p>}
            </div>
          ) : (
            <form onSubmit={submitMentor} className="space-y-3">
              <Field label="Academic level">
                <select className={inputClass} value={mentorForm.academic_level} onChange={(event) => setMentorForm({ ...mentorForm, academic_level: event.target.value })}>
                  {LEVELS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Courses / subjects of expertise" hint="Separate subjects with commas or new lines.">
                <textarea className={inputClass} rows={2} required value={mentorForm.subjects} onChange={(event) => setMentorForm({ ...mentorForm, subjects: event.target.value })} />
              </Field>
              <Field label="Availability" hint="For example: weekday evenings, Saturday mornings.">
                <textarea className={inputClass} rows={2} required value={mentorForm.availability} onChange={(event) => setMentorForm({ ...mentorForm, availability: event.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Preferred mentee capacity">
                  <select className={inputClass} value={mentorForm.preferred_capacity} onChange={(event) => setMentorForm({ ...mentorForm, preferred_capacity: event.target.value })}>
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Short introduction (optional)">
                  <input className={inputClass} maxLength={500} value={mentorForm.introduction} onChange={(event) => setMentorForm({ ...mentorForm, introduction: event.target.value })} />
                </Field>
              </div>
              <button className={primaryButton} disabled={busy}>{busy ? 'Submitting…' : 'Apply to mentor'}</button>
            </form>
          )}
        </article>

        <article className="content-panel rounded-xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-foreground)]"><BookOpen size={20} /></span>
            <div><h2 className="font-bold text-foreground">Find a Mentor</h2><p className="text-xs text-muted-foreground">Tell us what you are studying and what support would help.</p></div>
          </div>
          {menteeOpen ? (
            <div className="rounded-lg border border-border bg-surface-secondary p-3 text-sm">
              <p className="font-semibold text-foreground">Application status: <span className="capitalize">{menteeApplication.status === 'waiting' ? 'Waiting list' : menteeApplication.status}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Courses: {menteeApplication.subjects.join(', ')}</p>
              <p className="mt-1 text-xs text-muted-foreground">Goals: {menteeApplication.learning_goals.join(' · ')}</p>
            </div>
          ) : (
            <form onSubmit={submitMentee} className="space-y-3">
              <Field label="Academic level">
                <select className={inputClass} value={menteeForm.academic_level} onChange={(event) => setMenteeForm({ ...menteeForm, academic_level: event.target.value })}>
                  {LEVELS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Courses needing support">
                <textarea className={inputClass} rows={2} required value={menteeForm.subjects} onChange={(event) => setMenteeForm({ ...menteeForm, subjects: event.target.value })} />
              </Field>
              <Field label="Learning goals" hint="Add one goal per line or separate with commas.">
                <textarea className={inputClass} rows={2} required value={menteeForm.learning_goals} onChange={(event) => setMenteeForm({ ...menteeForm, learning_goals: event.target.value })} />
              </Field>
              <Field label="Availability">
                <textarea className={inputClass} rows={2} required value={menteeForm.availability} onChange={(event) => setMenteeForm({ ...menteeForm, availability: event.target.value })} />
              </Field>
              <Field label="Preferences (optional)">
                <input className={inputClass} maxLength={500} value={menteeForm.preferences} onChange={(event) => setMenteeForm({ ...menteeForm, preferences: event.target.value })} />
              </Field>
              <button className={primaryButton} disabled={busy}>{busy ? 'Submitting…' : 'Join matching'}</button>
            </form>
          )}
        </article>
      </section>

      {mentorApplication?.status === 'approved' && (
        <p className="rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] p-3 text-sm text-success">
          Your mentor application is approved. You will be notified when a suitable mentee is matched with you.
        </p>
      )}

      <section className="space-y-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">YOUR PROGRAMME</span>
          <h2 className="mt-1 text-xl font-bold text-foreground">My Mentorship</h2>
        </div>
        {proposals.length === 0 && activeMatches.length === 0 && history.length === 0 && (
          <div className="content-panel rounded-xl p-8 text-center">
            <Handshake size={26} className="mx-auto text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-foreground">No match yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Submit an application to get started. Suitable mentees are automatically matched with eligible mentors.</p>
          </div>
        )}
        {proposals.map((match) => (
          <article key={match.id} className="content-panel rounded-xl border-l-4 border-l-[var(--warning)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[var(--warning)]"><Clock3 size={12} /> Match proposal</span>
                <h3 className="mt-2 font-bold text-foreground">{match.partner.name}</h3>
                <p className="text-xs text-muted-foreground">{match.partner_role} · shared subjects: {match.shared_subjects.join(', ')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {match.my_accepted_at ? 'You accepted' : 'Your response needed'} · {match.partner_accepted_at ? 'the other participant accepted' : 'waiting for the other participant'}
                </p>
              </div>
              {!match.my_accepted_at && <div className="flex gap-2">
                <button className={primaryButton} disabled={busy} onClick={() => handleMatchDecision(match, 'accept')}><Check size={14} /> Accept</button>
                <button className={secondaryButton} disabled={busy} onClick={() => handleMatchDecision(match, 'decline')}>Decline</button>
              </div>}
            </div>
          </article>
        ))}

        {activeMatches.map((match) => (
          <article key={match.id} className="content-panel space-y-5 rounded-xl p-5">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[10px] font-extrabold uppercase text-success">Active mentorship</span>
                <h3 className="mt-2 text-lg font-bold text-foreground">{match.partner.name}</h3>
                <p className="text-xs capitalize text-muted-foreground">Your {match.partner_role} · {match.shared_subjects.join(', ')}</p>
                {match.partner.email && <a className="mt-1 block text-xs text-primary underline" href={`mailto:${match.partner.email}`}>{match.partner.email}</a>}
                {match.partner_introduction && <p className="mt-2 text-sm text-muted-foreground">{match.partner_introduction}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Learning objectives: {match.learning_goals.join(' · ') || 'Add goals below.'}</p>
                <p className="mt-1 text-xs text-muted-foreground">Availability — mentor: {match.availability.mentor.join(', ')} · mentee: {match.availability.mentee.join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={secondaryButton} disabled={busy} onClick={() => requestReassignment(match)}>Request reassignment</button>
                <button className={secondaryButton} disabled={busy} onClick={() => withdraw(match)}>Withdraw</button>
                <button className={primaryButton} disabled={busy} onClick={() => completeMentorship(match)}>Complete mentorship</button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Study goals</h4>
                {match.goals.length ? match.goals.map((goal) => (
                  <div key={goal.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                    <span className={`text-sm ${goal.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{goal.title}</span>
                    {goal.status === 'active' ? <button className="text-xs font-bold text-primary underline" disabled={busy} onClick={() => runAction(() => api.post(ENDPOINTS.mentorshipGoalComplete(match.id, goal.id), {}), 'Goal marked complete.')}>Mark complete</button> : <span className="text-[10px] font-bold uppercase text-success">Done</span>}
                  </div>
                )) : <p className="text-xs text-muted-foreground">No goals have been added.</p>}
                <form onSubmit={(event) => submitGoal(event, match.id)} className="flex gap-2">
                  <input className={inputClass} placeholder="Add a study goal" maxLength={250} value={goalTitle[match.id] || ''} onChange={(event) => setGoalTitle((value) => ({ ...value, [match.id]: event.target.value }))} required />
                  <button className={primaryButton} disabled={busy}>Add</button>
                </form>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Progress notes</h4>
                <form onSubmit={(event) => submitProgress(event, match.id)} className="space-y-2">
                  <textarea className={inputClass} rows={2} maxLength={1000} placeholder="Brief update on your progress" value={progressText[match.id] || ''} onChange={(event) => setProgressText((value) => ({ ...value, [match.id]: event.target.value }))} required />
                  <button className={secondaryButton} disabled={busy}>Add note</button>
                </form>
                {match.progress_notes.length === 0 ? <p className="text-xs text-muted-foreground">No progress notes yet.</p> : (
                  <div className="max-h-44 space-y-2 overflow-auto">
                    {match.progress_notes.map((note) => <p key={note.id} className="rounded-lg bg-surface-secondary p-2.5 text-xs"><strong>{note.author}</strong><span className="ml-2 text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span><span className="mt-1 block text-foreground">{note.body}</span></p>)}
                  </div>
                )}
              </section>
            </div>

            <section className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-bold text-foreground">Study session history</h4>
              <form onSubmit={(event) => submitSession(event, match.id)} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input className={inputClass} type="date" max={new Date().toISOString().slice(0, 10)} value={sessionForm[match.id]?.session_date || ''} onChange={(event) => setSessionForm((value) => ({ ...value, [match.id]: { ...value[match.id], session_date: event.target.value } }))} required aria-label="Session date" />
                <input className={inputClass} placeholder="Course or topic" maxLength={200} value={sessionForm[match.id]?.topic || ''} onChange={(event) => setSessionForm((value) => ({ ...value, [match.id]: { ...value[match.id], topic: event.target.value } }))} required />
                <input className={inputClass} placeholder="Optional notes" maxLength={1000} value={sessionForm[match.id]?.notes || ''} onChange={(event) => setSessionForm((value) => ({ ...value, [match.id]: { ...value[match.id], notes: event.target.value } }))} />
                <button className={primaryButton} disabled={busy}>Record session</button>
              </form>
              {match.sessions.length === 0 ? <p className="text-xs text-muted-foreground">No study sessions recorded yet.</p> : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {match.sessions.map((studySession) => {
                    const isMentor = match.partner_role === 'mentee'
                    const confirmed = isMentor ? studySession.mentor_confirmed_at : studySession.mentee_confirmed_at
                    return (
                      <div key={studySession.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
                        <div><strong className="text-foreground">{studySession.topic}</strong><span className="ml-2 text-muted-foreground">{new Date(`${studySession.session_date}T00:00:00`).toLocaleDateString()}</span>{studySession.notes && <p className="mt-1 text-muted-foreground">{studySession.notes}</p>}</div>
                        <div className="flex items-center gap-3">
                          <span className={studySession.status === 'completed' ? 'font-bold text-success' : 'text-[var(--warning)]'}>{studySession.status === 'completed' ? 'Completed' : 'Awaiting confirmation'}</span>
                          {studySession.status === 'awaiting_confirmation' && !confirmed && <button className="font-bold text-primary underline" disabled={busy} onClick={() => runAction(() => api.post(ENDPOINTS.mentorshipSessionConfirm(match.id, studySession.id), {}), 'Session confirmation recorded.')}>Confirm completion</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </article>
        ))}

        {history.length > 0 && (
          <section className="content-panel rounded-xl p-5">
            <h3 className="font-bold text-foreground">Mentorship history</h3>
            <div className="mt-3 divide-y divide-border">
              {history.map((match) => <div key={match.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="text-foreground">{match.partner.name} · {match.shared_subjects.join(', ')}</span><span className="rounded-full border border-border px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">{match.status}</span></div>)}
            </div>
          </section>
        )}
      </section>

      <section className="content-panel flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-bold text-foreground">Mentorship notifications</h2><p className="text-xs text-muted-foreground">Control in-app updates about applications and matches.</p></div>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={data?.notification_preferences?.in_app_enabled ?? true} onChange={(event) => changePreference(event.target.checked)} disabled={busy} />
          In-app notifications
        </label>
      </section>

      {menteeApplication?.status === 'waiting' && (
        <p className="flex items-center gap-2 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">
          <Clock3 size={16} aria-hidden="true" /> You are on the matching waiting list. We will notify you when an eligible mentor with capacity is available.
        </p>
      )}
      {!mentorCanApply && mentorApplication?.status === 'pending' && <p className="text-xs text-muted-foreground">Mentor applications are reviewed by the programme administrators before matching.</p>}
    </div>
  )
}
