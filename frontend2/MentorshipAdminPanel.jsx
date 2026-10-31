import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Check, Clock3, RefreshCw, Users } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useToast } from './directory/Toast'

const cardClass = 'rounded-xl border border-border bg-surface p-4 shadow-sm'
const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-surface-secondary disabled:opacity-60'

function Stat({ label, value }) {
  return (
    <article className={cardClass}>
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-2xl font-black text-foreground">{value ?? '—'}</strong>
    </article>
  )
}

export default function MentorshipAdminPanel() {
  const { showToast } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [applications, setApplications] = useState([])
  const [waitingList, setWaitingList] = useState([])
  const [matches, setMatches] = useState([])
  const [reassignments, setReassignments] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, pendingApps, waiting, programmeMatches, reassignmentRequests] = await Promise.all([
        api.get(ENDPOINTS.mentorshipAdminAnalytics),
        api.get(ENDPOINTS.mentorshipAdminMentorApplications),
        api.get(ENDPOINTS.mentorshipAdminWaitingList),
        api.get(ENDPOINTS.mentorshipAdminMatches),
        api.get(ENDPOINTS.mentorshipAdminReassignments),
      ])
      setAnalytics(summary)
      setApplications(Array.isArray(pendingApps) ? pendingApps : [])
      setWaitingList(Array.isArray(waiting) ? waiting : [])
      setMatches(Array.isArray(programmeMatches) ? programmeMatches : [])
      setReassignments(Array.isArray(reassignmentRequests) ? reassignmentRequests : [])
    } catch (requestError) {
      setError(requestError.message || 'Mentorship programme information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleAction = async (id, action, successMessage) => {
    setActionId(id)
    try {
      await action()
      showToast(successMessage, 'success')
      await refresh()
    } catch (requestError) {
      showToast(requestError.message || 'The programme action could not be completed.', 'error')
    } finally {
      setActionId('')
    }
  }

  const decideApplication = (application, decision) => {
    const name = application.user.name
    if (!window.confirm(`${decision === 'approved' ? 'Approve' : 'Reject'} ${name} as a mentor?`)) return
    const note = window.prompt('Optional review note:')
    handleAction(
      application.id,
      () => api.post(ENDPOINTS.mentorshipAdminMentorDecision(application.id), { decision, note: note?.trim() || null }),
      `Mentor application ${decision}.`,
    )
  }

  const decideReassignment = (request, decision) => {
    if (!window.confirm(`${decision === 'approved' ? 'Approve' : 'Reject'} this reassignment request?`)) return
    const resolution_note = window.prompt('Optional resolution note:')
    handleAction(
      request.id,
      () => api.post(ENDPOINTS.mentorshipAdminReassignmentDecision(request.id, decision), { resolution_note: resolution_note?.trim() || null }),
      `Reassignment request ${decision}.`,
    )
  }

  const filteredApplications = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return applications
    return applications.filter((item) =>
      item.user.name?.toLowerCase().includes(term)
      || item.user.email?.toLowerCase().includes(term)
      || item.subjects.some((subject) => subject.toLowerCase().includes(term)),
    )
  }, [applications, query])
  const filteredWaiting = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return waitingList
    return waitingList.filter((item) =>
      item.user.name?.toLowerCase().includes(term)
      || item.subjects.some((subject) => subject.toLowerCase().includes(term)),
    )
  }, [waitingList, query])
  const maxTrend = Math.max(1, ...(analytics?.trends || []).map((item) => item.matches))

  if (loading && !analytics) {
    return <p className="content-panel rounded-xl p-8 text-center text-sm text-muted-foreground" role="status">Loading mentorship analytics…</p>
  }

  return (
    <div className="space-y-5">
      <header className="content-panel flex flex-col gap-3 rounded-xl p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">PROGRAMME OVERSIGHT</span>
          <h2 className="mt-1 text-xl font-bold text-foreground">Mentorship Management</h2>
          <p className="mt-1 text-xs text-muted-foreground">Review eligibility, monitor matches, and resolve participant requests. Private progress notes are not shown here.</p>
        </div>
        <button type="button" className={buttonClass} onClick={refresh} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {error && <p className="rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-sm text-destructive" role="alert">{error}</p>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Stat label="Approved mentors" value={analytics?.total_mentors} />
        <Stat label="Registered mentees" value={analytics?.total_mentees} />
        <Stat label="Pending applications" value={analytics?.pending_applications} />
        <Stat label="Active matches" value={analytics?.active_matches} />
        <Stat label="Waiting-list participants" value={analytics?.waiting_list} />
        <Stat label="Completed mentorships" value={analytics?.completed_mentorships} />
        <Stat label="Completed sessions" value={analytics?.completed_sessions} />
        <Stat label="Reassignment requests" value={reassignments.length} />
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-primary" aria-hidden="true" />
          <h3 className="font-bold text-foreground">Programme participation trend</h3>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12" aria-label="Monthly mentorship match totals">
          {(analytics?.trends || []).map((item) => (
            <div key={item.month} className="flex min-w-0 flex-col items-center gap-1" title={`${item.month}: ${item.matches} matches`}>
              <span className="text-[9px] font-semibold text-muted-foreground">{item.matches}</span>
              <div className="flex h-20 w-full items-end rounded bg-surface-secondary p-1">
                <span className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(4, (item.matches / maxTrend) * 100)}%` }} />
              </div>
              <span className="truncate text-[9px] text-muted-foreground">{item.month.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${cardClass} space-y-3`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-bold text-foreground">Mentor applications</h3><p className="text-xs text-muted-foreground">Applications require an eligibility decision before matching.</p></div>
            <input className="rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground" placeholder="Search name, email or subject" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {filteredApplications.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No pending mentor applications.</p> : (
            <div className="space-y-2">
              {filteredApplications.map((application) => (
                <article key={application.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 text-xs">
                      <strong className="block text-foreground">{application.user.name}</strong>
                      <span className="text-muted-foreground">{application.user.email} · Level {application.academic_level}</span>
                      <p className="mt-1 text-foreground">Subjects: {application.subjects.join(', ')}</p>
                      <p className="text-muted-foreground">Availability: {application.availability.join(', ')} · capacity {application.preferred_capacity}</p>
                      {application.introduction && <p className="mt-1 text-muted-foreground">{application.introduction}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-white disabled:opacity-60" disabled={Boolean(actionId)} onClick={() => decideApplication(application, 'approved')}>
                        <Check size={12} /> {actionId === application.id ? 'Saving…' : 'Approve'}
                      </button>
                      <button className={buttonClass} disabled={Boolean(actionId)} onClick={() => decideApplication(application, 'rejected')}>Reject</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${cardClass} space-y-3`}>
          <div className="flex items-center gap-2"><Users size={16} className="text-primary" /><h3 className="font-bold text-foreground">Waiting list</h3></div>
          {filteredWaiting.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No unmatched participants.</p> : (
            <div className="max-h-80 divide-y divide-border overflow-auto">
              {filteredWaiting.map((item) => (
                <article key={item.id} className="py-3 text-xs">
                  <strong className="text-foreground">{item.user.name}</strong>
                  <span className="ml-2 text-muted-foreground">Level {item.academic_level}</span>
                  <p className="mt-1 text-muted-foreground">Needs help with: {item.subjects.join(', ')}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Waiting since {new Date(item.created_at).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={`${cardClass} space-y-3`}>
        <h3 className="font-bold text-foreground">Reassignment requests</h3>
        {reassignments.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No unresolved reassignment requests.</p> : (
          <div className="space-y-2">
            {reassignments.map((request) => (
              <article key={request.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs">
                  <strong className="text-foreground">{request.requester.name}</strong>
                  <p className="mt-1 text-muted-foreground">Match: {request.mentor.name} ↔ {request.mentee.name}</p>
                  {request.reason && <p className="mt-1 text-foreground">{request.reason}</p>}
                  <small className="text-muted-foreground">{new Date(request.created_at).toLocaleString()}</small>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-white disabled:opacity-60" disabled={Boolean(actionId)} onClick={() => decideReassignment(request, 'approved')}>
                    <Check size={12} /> {actionId === request.id ? 'Saving…' : 'Approve'}
                  </button>
                  <button className={buttonClass} disabled={Boolean(actionId)} onClick={() => decideReassignment(request, 'rejected')}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={`${cardClass} space-y-3`}>
        <div className="flex items-center gap-2"><Clock3 size={16} className="text-primary" /><h3 className="font-bold text-foreground">Match oversight</h3></div>
        {matches.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No mentorship matches yet.</p> : (
          <div className="max-h-96 divide-y divide-border overflow-auto">
            {matches.map((match) => (
              <article key={match.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
                <div>
                  <strong className="text-foreground">{match.mentor.name} ↔ {match.mentee.name}</strong>
                  <p className="mt-1 text-muted-foreground">{match.shared_subjects.join(', ')} · updated {new Date(match.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {match.inactive && <span className="rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--warning)]">Inactive 30+ days</span>}
                  <span className="rounded-full border border-border px-2 py-1 text-[9px] font-bold uppercase text-muted-foreground">{match.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
