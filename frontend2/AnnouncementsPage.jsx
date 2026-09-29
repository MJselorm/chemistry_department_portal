import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pin, Trash2, Plus, RefreshCw, Megaphone, ChevronUp, Search, CheckCircle2, AlertCircle, Sparkles, Users, X } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useAuth } from './AuthContext'

const badgeClass = (category) => {
  const value = (category || '').toLowerCase()
  if (value === 'urgent') return 'bg-[var(--destructive-soft)] text-destructive border border-[var(--destructive-border)]'
  if (value === 'academic') return 'bg-[#e7f5f7] text-primary border border-[#b8dfe1]'
  return 'bg-[var(--success-soft)] text-success border border-[var(--success-border)]'
}

const timeAgo = (date) => {
  if (!date) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000))
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const isAdmin = user?.role === 'admin'

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true')
  const [publishing, setPublishing] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'Academic',
    audience: 'All students',
    issuer: user?.full_name || 'Chemistry Board of Studies',
    is_pinned: false,
  })

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const loadAnnouncements = () => {
    setLoading(true)
    setError('')
    api.get(ENDPOINTS.announcements)
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Unable to load announcements:', err)
        setError('Unable to load announcements right now. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateForm(true)
    }
  }, [searchParams])

  const showToast = (type, message) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    setPublishing(true)
    try {
      const created = await api.post(ENDPOINTS.adminPostAnnouncement, {
        title: form.title,
        body: form.body,
        category: form.category,
        audience: form.audience,
        issuer: form.issuer,
        is_pinned: form.is_pinned,
      })
      showToast('success', 'Announcement published and now live in this tab!')
      setForm({
        title: '',
        body: '',
        category: 'Academic',
        audience: 'All students',
        issuer: user?.full_name || 'Chemistry Board of Studies',
        is_pinned: false,
      })
      setShowCreateForm(false)
      if (created?.id) {
        setAnnouncements((prev) => {
          const next = [created, ...prev.filter((a) => a.id !== created.id)]
          return next.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
        })
      } else {
        loadAnnouncements()
      }
    } catch (err) {
      console.error('Failed to publish announcement:', err)
      showToast('error', 'The announcement could not be published. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    setDeletingId(id)
    try {
      await api.del(ENDPOINTS.adminDeleteAnnouncement(id))
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      showToast('success', 'Announcement deleted successfully.')
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      showToast('error', 'The announcement could not be deleted. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesCategory =
      categoryFilter === 'All' ||
      item.category?.toLowerCase() === categoryFilter.toLowerCase()
    const matchesSearch =
      !searchQuery.trim() ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.audience?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            DEPARTMENT UPDATES
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Announcements</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Official notices, timetables, and broadcasts from the Chemistry Department.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAnnouncements}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-muted-foreground transition-colors shadow-xs disabled:opacity-50"
            title="Refresh announcements"
            aria-label="Refresh announcements"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {showCreateForm ? (
                <>
                  <ChevronUp size={14} />
                  <span>Hide Form</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Post Announcement</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Global Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-success'
              : 'bg-[var(--destructive-soft)] border-[var(--destructive-border)] text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold text-xs p-1" aria-label="Dismiss message">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Admin Inline Creation Form */}
      {isAdmin && showCreateForm && (
        <section className="bg-surface border-2 border-[var(--primary-border)] rounded-2xl p-6 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f5] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#e7f5f7] text-primary grid place-items-center font-black text-sm">
                <Sparkles size={15} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Publish New Announcement</h2>
                <p className="text-[11px] text-muted-foreground">
                  Write an official notice to be published immediately to this tab and the student portal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-bold p-1"
              aria-label="Close announcement form"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Headline / Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                aria-label="Announcement headline"
                required
                placeholder="e.g. Schedule for 2026/2027 Analytical Chemistry Practicals"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Message Body <span className="text-destructive">*</span>
              </label>
              <textarea
                aria-label="Announcement message"
                rows="4"
                required
                placeholder="Detail the announcement, important deadlines, instructions, and office hours..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Category</label>
                <select
                  aria-label="Announcement category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                >
                  <option value="Academic">Academic</option>
                  <option value="Department">Department</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Target Audience</label>
                <select
                  aria-label="Announcement target audience"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                >
                  <option value="All students">All students</option>
                  <option value="Level 100">Level 100</option>
                  <option value="Level 200">Level 200</option>
                  <option value="Level 300">Level 300</option>
                  <option value="Level 400">Level 400</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Issued by</label>
                <input
                  type="text"
                  aria-label="Announcement issuer"
                  required
                  placeholder="e.g. Chemistry Board of Studies"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer bg-[#f7fafb] px-3.5 py-2 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <Pin size={13} className={form.is_pinned ? 'text-primary' : 'text-[#8a999d]'} />
                <span>Pin announcement to top of feed & dashboard</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#f4f7f8]">
              <button
                type="submit"
                disabled={publishing}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
              >
                {publishing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Publishing…</span>
                  </>
                ) : (
                  <>
                    <Megaphone size={13} />
                    <span>Publish Announcement</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-muted-foreground text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Academic', 'Department', 'Urgent'].map((cat) => {
            const count =
              cat === 'All'
                ? announcements.length
                : announcements.filter((a) => a.category?.toLowerCase() === cat.toLowerCase()).length
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface border border-border text-muted-foreground hover:border-[var(--primary-border)]'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            aria-label="Search announcements"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Clear announcement search"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Announcement List */}
      <div className="space-y-4">
        {loading && announcements.length === 0 && (
          <div className="py-12 bg-surface rounded-2xl border border-border text-center">
            <RefreshCw size={20} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading announcements…</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[var(--destructive-soft)] border border-[var(--destructive-border)] rounded-2xl text-xs text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadAnnouncements} className="font-bold underline ml-2">
              Retry
            </button>
          </div>
        )}

        {!loading && filteredAnnouncements.length === 0 && (
          <div className="py-12 bg-surface rounded-2xl border border-border text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f0f7f8] text-primary grid place-items-center mx-auto text-xl font-bold">
              <Megaphone size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">No announcements found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || categoryFilter !== 'All'
                  ? 'No announcements match your search or filter criteria.'
                  : 'No announcements have been published yet.'}
              </p>
            </div>
            {searchQuery || categoryFilter !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('All')
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear search & filters
              </button>
            ) : isAdmin ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                + Create first announcement
              </button>
            ) : null}
          </div>
        )}

        {filteredAnnouncements.map((item) => (
          <article
            key={item.id}
            className={`bg-surface border rounded-2xl p-6 shadow-sm transition-all ${
              item.is_pinned
                ? 'border-[#f2d89f] bg-gradient-to-r from-[#fffdfa] to-white ring-1 ring-[#f2d89f]/40'
                : 'border-border hover:border-[var(--primary-border)]'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${badgeClass(item.category)}`}
                >
                  {item.category}
                </span>

                {item.audience && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f1f5f6] text-[#55696e] border border-[#e2e9eb] inline-flex items-center gap-1">
                    <Users size={10} aria-hidden="true" />
                    {item.audience}
                  </span>
                )}

                {item.is_pinned && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#fff4db] text-[#975c03] border border-[#edd7a4] flex items-center gap-1">
                    <Pin size={10} />
                    PINNED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <small className="text-[11px] text-muted-foreground font-medium">{timeAgo(item.published_at)}</small>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    className="text-[#b64a4a] hover:text-[#8e2929] hover:bg-[var(--destructive-soft)] p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    title="Delete announcement"
                  >
                    <Trash2 size={13} className={deletingId === item.id ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-foreground mb-2">{item.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">{item.body}</p>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-[#f4f7f8] pt-3">
              <div className="flex items-center gap-2">
                <span>Department Official Notice</span>
                <span>•</span>
                <span className="font-semibold text-foreground">{item.issuer}</span>
              </div>
              {item.published_at && (
                <span>
                  {new Date(item.published_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
