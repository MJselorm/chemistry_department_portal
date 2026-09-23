import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Pin, RefreshCw, Search, Megaphone, ChevronDown, ChevronUp, Bell } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useAuth } from './AuthContext'
import { MOCK_ADMIN_USERS, MOCK_ADMIN_ACTIVITY } from './mocks'

export default function AdminPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromQuery = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    tabFromQuery && ['overview', 'events', 'resources', 'users', 'announcements'].includes(tabFromQuery)
      ? tabFromQuery
      : 'overview'
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'events', 'resources', 'users', 'announcements'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }
  const [adminTestResult, setAdminTestResult] = useState(null)
  const [testingRole, setTestingRole] = useState(false)

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', type: 'Seminar', datetime: '', venue: '', description: '' })
  const [resourceForm, setResourceForm] = useState({ title: '', category: 'Past Questions', course: '', year: '2026/2027' })
  const [announcementForm, setAnnouncementForm] = useState({
    headline: '',
    message: '',
    category: 'Academic',
    audience: 'All students',
    issuer: 'Chemistry Board of Studies',
    pin: false,
  })
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Announcements list state
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState('')
  const [announcementSearch, setAnnouncementSearch] = useState('')
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState('All')
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true)
    setAnnouncementsError('')
    try {
      const data = await api.get(ENDPOINTS.announcements)
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (err) {
      setAnnouncementsError(err.message || 'Failed to load announcements.')
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleAdminTest = async () => {
    setTestingRole(true)
    setAdminTestResult(null)
    try {
      // Calls live backend GET /admin/test !
      const res = await api.get(ENDPOINTS.adminTest)
      setAdminTestResult({ success: true, message: res.message || 'Admin authorization confirmed by FastAPI!' })
    } catch (err) {
      setAdminTestResult({
        success: false,
        message: err.message || 'Failed: You do not have the admin role in the database.'
      })
    } finally {
      setTestingRole(false)
    }
  }

  const showFeedback = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 4000)
  }

  const publishAnnouncement = async (event) => {
    event.preventDefault()
    setPublishingAnnouncement(true)
    try {
      const created = await api.post(ENDPOINTS.adminPostAnnouncement, {
        title: announcementForm.headline,
        body: announcementForm.message,
        category: announcementForm.category,
        audience: announcementForm.audience,
        issuer: announcementForm.issuer,
        is_pinned: announcementForm.pin,
      })
      showFeedback('Announcement published! It is now visible in the tab and to all portal users.')
      setAnnouncementForm({
        headline: '',
        message: '',
        category: 'Academic',
        audience: 'All students',
        issuer: 'Chemistry Board of Studies',
        pin: false,
      })
      setShowCreateAnnouncement(false)
      if (created && created.id) {
        setAnnouncements((prev) => {
          const updated = [created, ...prev.filter((a) => a.id !== created.id)]
          return updated.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
        })
      } else {
        fetchAnnouncements()
      }
    } catch (err) {
      showFeedback(err.message || 'Unable to publish announcement.')
    } finally {
      setPublishingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }
    setDeletingId(id)
    try {
      await api.delete(ENDPOINTS.adminDeleteAnnouncement(id))
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      showFeedback('Announcement deleted successfully.')
    } catch (err) {
      showFeedback(err.message || 'Failed to delete announcement.')
    } finally {
      setDeletingId(null)
    }
  }

  const timeAgo = (date) => {
    if (!date) return ''
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000))
    if (minutes < 60) return `${Math.max(1, minutes)}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const categoryBadgeClass = (category) => {
    const value = (category || '').toLowerCase()
    if (value === 'urgent') return 'bg-[#fdecec] text-[#c84b4b] border border-[#f5b3b3]'
    if (value === 'academic') return 'bg-[#e7f5f7] text-[#087f8c] border border-[#b8dfe1]'
    return 'bg-[#e7f5ed] text-[#27805a] border border-[#a6dec1]'
  }

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesCategory =
      announcementCategoryFilter === 'All' ||
      item.category?.toLowerCase() === announcementCategoryFilter.toLowerCase()
    const matchesSearch =
      !announcementSearch.trim() ||
      item.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      item.body?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      item.issuer?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      item.audience?.toLowerCase().includes(announcementSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7652b8]">
            ADMINISTRATION CONSOLE
          </span>
          <h1 className="text-2xl font-bold text-[#102a2f] mt-1">Admin Dashboard</h1>
          <p className="text-xs text-[#64777d] mt-1">
            Manage portal content, events, academic resources, and user accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdminTest}
            disabled={testingRole}
            className="px-3.5 py-2 rounded-xl bg-[#eee7fa] hover:bg-[#e4d8f8] text-[#7652b8] text-xs font-bold border border-[#d6c3f3] transition-colors"
          >
            {testingRole ? 'Verifying...' : '⚡ Test Live Admin Endpoint'}
          </button>
          <button
            onClick={() => handleTabChange('events')}
            className="px-4 py-2 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors"
          >
            Create event
          </button>
        </div>
      </div>

      {/* Live Admin Endpoint Test Banner */}
      {adminTestResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between ${
            adminTestResult.success
              ? 'bg-[#e7f5ed] border-[#a6dec1] text-[#27805a]'
              : 'bg-[#fdecec] border-[#f5b3b3] text-[#c84b4b]'
          }`}
        >
          <span>
            <strong>FastAPI Response (/admin/test):</strong> {adminTestResult.message}
          </span>
          <button onClick={() => setAdminTestResult(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Global Action Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-[#e7f5ed] border border-[#a6dec1] text-[#27805a] text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#e4ecee] pb-3">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'events', label: 'Create Event' },
          { id: 'resources', label: 'Upload Resource' },
          { id: 'users', label: 'Students & Users' },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#102a2f] text-white'
                : 'bg-white border border-[#e4ecee] text-[#64777d] hover:border-[#b7dfe2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: OVERVIEW ────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm">
              <span className="w-8 h-8 rounded-lg bg-[#f1ebfb] text-[#7652b8] text-sm grid place-items-center mb-3 font-bold">
                ◷
              </span>
              <strong className="block text-2xl font-black text-[#102a2f]">08</strong>
              <span className="block text-xs text-[#64777d] mt-1">Published events</span>
            </div>
            <div className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm">
              <span className="w-8 h-8 rounded-lg bg-[#eaf4fb] text-[#2776a5] text-sm grid place-items-center mb-3 font-bold">
                ▣
              </span>
              <strong className="block text-2xl font-black text-[#102a2f]">126</strong>
              <span className="block text-xs text-[#64777d] mt-1">Resources</span>
            </div>
            <div className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm">
              <span className="w-8 h-8 rounded-lg bg-[#eaf7f0] text-[#27805a] text-sm grid place-items-center mb-3 font-bold">
                ◎
              </span>
              <strong className="block text-2xl font-black text-[#102a2f]">342</strong>
              <span className="block text-xs text-[#64777d] mt-1">Students</span>
            </div>
            <div
              onClick={() => handleTabChange('announcements')}
              className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#087f8c] transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#fff6df] text-[#a66b08] text-sm grid place-items-center mb-3 font-bold">
                ▤
              </span>
              <strong className="block text-2xl font-black text-[#102a2f] group-hover:text-[#087f8c] transition-colors">
                {String(announcements.length).padStart(2, '0')}
              </strong>
              <span className="block text-xs text-[#64777d] mt-1">Announcements</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Management Shortcuts */}
            <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">CONTENT</span>
              <h2 className="text-base font-bold text-[#102a2f] mt-0.5 mb-3">Quick management</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleTabChange('events')}
                  className="w-full text-left p-3 rounded-xl border border-[#e4ecee] hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                      Manage events
                    </strong>
                    <small className="block text-[10px] text-[#64777d]">Create, edit and publish seminars</small>
                  </div>
                  <span className="text-[#087f8c] font-bold text-xs">→</span>
                </button>
                <button
                  onClick={() => handleTabChange('resources')}
                  className="w-full text-left p-3 rounded-xl border border-[#e4ecee] hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                      Upload resources
                    </strong>
                    <small className="block text-[10px] text-[#64777d]">Add notes, manuals and past questions</small>
                  </div>
                  <span className="text-[#087f8c] font-bold text-xs">→</span>
                </button>
                <button
                  onClick={() => handleTabChange('announcements')}
                  className="w-full text-left p-3 rounded-xl border border-[#e4ecee] hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                      Manage announcements
                    </strong>
                    <small className="block text-[10px] text-[#64777d]">Create, pin, and view department notices</small>
                  </div>
                  <span className="text-[#087f8c] font-bold text-xs">→</span>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className="w-full text-left p-3 rounded-xl border border-[#e4ecee] hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                      Manage students
                    </strong>
                    <small className="block text-[10px] text-[#64777d]">Accounts, roles and directory data</small>
                  </div>
                  <span className="text-[#087f8c] font-bold text-xs">→</span>
                </button>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">ACTIVITY</span>
              <h2 className="text-base font-bold text-[#102a2f] mt-0.5 mb-3">Recent activity</h2>
              <div className="divide-y divide-[#eef2f3]">
                {MOCK_ADMIN_ACTIVITY.map((act) => (
                  <div key={act.id} className="py-3 flex items-start gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: act.dotColor }}
                    />
                    <div className="flex-1">
                      <strong className="block text-xs font-bold text-[#102a2f]">{act.text}</strong>
                      <p className="text-[11px] text-[#64777d] mt-0.5">{act.desc}</p>
                    </div>
                    <time className="text-[10px] text-[#a1adb0]">{act.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── Tab: CREATE EVENT ───────────────────────────────────── */}
      {activeTab === 'events' && (
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-6 shadow-sm max-w-3xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
            EVENT MANAGEMENT
          </span>
          <h2 className="text-xl font-bold text-[#102a2f] mt-0.5 mb-4">Create an event</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              showFeedback(`Event "${eventForm.title}" drafted! (Placeholder API: POST /admin/events)`)
              setEventForm({ title: '', type: 'Seminar', datetime: '', venue: '', description: '' })
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Event title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chemistry Research Forum"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Event type</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] bg-white"
                >
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Social">Social</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Date & time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.datetime}
                  onChange={(e) => setEventForm({ ...eventForm, datetime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="Main Auditorium"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Description</label>
                <textarea
                  rows="4"
                  placeholder="Event description..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#f4f7f8]">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors"
              >
                Publish event
              </button>
              <button
                type="button"
                onClick={() => showFeedback('Draft saved locally.')}
                className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-[#496066] text-xs font-bold hover:bg-gray-50"
              >
                Save draft
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Tab: UPLOAD RESOURCES ────────────────────────────────── */}
      {activeTab === 'resources' && (
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-6 shadow-sm max-w-3xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
            RESOURCE MANAGEMENT
          </span>
          <h2 className="text-xl font-bold text-[#102a2f] mt-0.5 mb-4">Academic resources</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              showFeedback(`Resource "${resourceForm.title}" submitted! (Placeholder API: POST /admin/resources)`)
              setResourceForm({ title: '', category: 'Past Questions', course: '', year: '2026/2027' })
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Resource title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CHEM301 Lecture Notes"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Category</label>
                <select
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] bg-white"
                >
                  <option value="Past Questions">Past Questions</option>
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Lab Manuals">Lab Manuals</option>
                  <option value="Course Outlines">Course Outlines</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Course / Level</label>
                <input
                  type="text"
                  placeholder="CHEM 301 · Level 300"
                  value={resourceForm.course}
                  onChange={(e) => setResourceForm({ ...resourceForm, course: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Academic year</label>
                <input
                  type="text"
                  placeholder="2026/2027"
                  value={resourceForm.year}
                  onChange={(e) => setResourceForm({ ...resourceForm, year: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#102a2f] mb-1">File upload</label>
                <div className="border-2 border-dashed border-[#dce6e8] rounded-xl p-8 bg-[#f9fbfb] text-center flex flex-col items-center justify-center">
                  <span className="text-3xl text-[#91a0a4] mb-1">⇧</span>
                  <strong className="text-xs text-[#5b6f74]">Drop a file here or browse</strong>
                  <small className="text-[10px] text-[#91a0a4] mt-1">PDF, DOCX up to 25MB (Placeholder upload)</small>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#f4f7f8]">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors"
              >
                Upload resource
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Tab: STUDENTS & USERS ───────────────────────────────── */}
      {activeTab === 'users' && (
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
                USER MANAGEMENT
              </span>
              <h2 className="text-xl font-bold text-[#102a2f]">Student accounts</h2>
            </div>
            <input
              type="text"
              placeholder="Search students"
              className="px-3.5 py-2 rounded-xl border border-[#e4ecee] text-xs focus:outline-none focus:border-[#087f8c]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f3] text-[9px] uppercase tracking-wider text-[#94a1a5]">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Student ID</th>
                  <th className="py-2.5">Level</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f2]">
                {MOCK_ADMIN_USERS.map((usr) => (
                  <tr key={usr.id} className="py-3">
                    <td className="py-3">
                      <strong className="block text-xs font-bold text-[#102a2f]">{usr.name}</strong>
                      <small className="text-[10px] text-[#98a5a8]">{usr.status}</small>
                    </td>
                    <td className="py-3 text-[#64777d]">{usr.studentId}</td>
                    <td className="py-3 text-[#64777d]">{usr.level}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          usr.badgeColor === 'blue'
                            ? 'bg-[#e7f5f7] text-[#087f8c]'
                            : usr.badgeColor === 'green'
                            ? 'bg-[#e7f5ed] text-[#27805a]'
                            : 'bg-[#f0eafb] text-[#7652b8]'
                        }`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => showFeedback(`Selected user: ${usr.name}`)}
                        className="text-xs font-bold text-[#087f8c] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Tab: ANNOUNCEMENTS MANAGEMENT ──────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Header Card with Actions */}
          <div className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7652b8]">
                COMMUNICATIONS
              </span>
              <h2 className="text-xl font-bold text-[#102a2f] mt-0.5">Department Announcements</h2>
              <p className="text-xs text-[#64777d] mt-0.5">
                Broadcast notices to students, pin urgent advisories, and manage live feeds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAnnouncements}
                disabled={loadingAnnouncements}
                className="p-2.5 rounded-xl border border-[#d9e3e5] bg-white hover:bg-gray-50 text-[#496066] transition-colors shadow-xs disabled:opacity-50"
                title="Refresh announcements"
              >
                <RefreshCw size={14} className={loadingAnnouncements ? 'animate-spin text-[#087f8c]' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setShowCreateAnnouncement(!showCreateAnnouncement)}
                className="px-4 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                {showCreateAnnouncement ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Hide form</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>New announcement</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create Announcement Form */}
          {showCreateAnnouncement && (
            <section className="bg-white border-2 border-[#bce4e8] rounded-2xl p-6 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f5] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#e7f5f7] text-[#087f8c] grid place-items-center font-bold text-xs">
                    ✦
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102a2f]">Create announcement</h3>
                    <p className="text-[11px] text-[#64777d]">This will be published live to all signed-in portal users.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="text-xs text-[#9aa7aa] hover:text-[#102a2f] font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={publishAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#102a2f] mb-1">
                    Headline / Title <span className="text-[#c84b4b]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid-Semester Examination Timetable Release"
                    value={announcementForm.headline}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102a2f] mb-1">
                    Message Body <span className="text-[#c84b4b]">*</span>
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Provide full details, instructions, venue info or deadlines..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-[#102a2f] mb-1">Category</label>
                    <select
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] bg-white shadow-xs"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Department">Department</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102a2f] mb-1">Audience</label>
                    <select
                      value={announcementForm.audience}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] bg-white shadow-xs"
                    >
                      <option value="All students">All students</option>
                      <option value="Level 100">Level 100</option>
                      <option value="Level 200">Level 200</option>
                      <option value="Level 300">Level 300</option>
                      <option value="Level 400">Level 400</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102a2f] mb-1">Issued by</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chemistry Board of Studies"
                      value={announcementForm.issuer}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, issuer: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-[#102a2f] cursor-pointer bg-[#f7fafb] px-3.5 py-2 rounded-xl border border-[#e4ecee]">
                    <input
                      type="checkbox"
                      checked={announcementForm.pin}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, pin: e.target.checked })}
                      className="w-4 h-4 rounded text-[#087f8c] focus:ring-[#087f8c]"
                    />
                    <Pin size={13} className={announcementForm.pin ? 'text-[#087f8c]' : 'text-[#8a999d]'} />
                    <span>Pin announcement to top of feed & dashboard</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#f4f7f8]">
                  <button
                    type="submit"
                    disabled={publishingAnnouncement}
                    className="px-5 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
                  >
                    {publishingAnnouncement ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Publishing…</span>
                      </>
                    ) : (
                      <>
                        <Megaphone size={13} />
                        <span>Publish announcement</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAnnouncement(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-[#496066] text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Search & Category Filter Controls */}
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
                    onClick={() => setAnnouncementCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      announcementCategoryFilter === cat
                        ? 'bg-[#102a2f] text-white shadow-xs'
                        : 'bg-white border border-[#e4ecee] text-[#64777d] hover:border-[#b7dfe2]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-3 text-[#9aa7aa]" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e4ecee] bg-white text-xs text-[#102a2f] placeholder-[#9ba8ac] focus:outline-none focus:border-[#087f8c] shadow-xs"
              />
              {announcementSearch && (
                <button
                  type="button"
                  onClick={() => setAnnouncementSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-[#9aa7aa] hover:text-[#102a2f]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Announcements Feed / View List */}
          {loadingAnnouncements && announcements.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-[#e4ecee] text-center">
              <RefreshCw size={20} className="animate-spin text-[#087f8c] mx-auto mb-2" />
              <p className="text-xs text-[#64777d]">Loading announcements feed…</p>
            </div>
          ) : announcementsError ? (
            <div className="p-4 bg-[#fdecec] border border-[#f5b3b3] rounded-2xl text-xs text-[#c84b4b] flex items-center justify-between">
              <span>{announcementsError}</span>
              <button
                type="button"
                onClick={fetchAnnouncements}
                className="font-bold underline text-xs ml-3"
              >
                Retry
              </button>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-[#e4ecee] text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f0f7f8] text-[#087f8c] grid place-items-center mx-auto text-xl font-bold">
                ▤
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#102a2f]">No announcements found</h3>
                <p className="text-xs text-[#64777d] mt-1">
                  {announcementSearch || announcementCategoryFilter !== 'All'
                    ? 'No announcements match your search or filter criteria.'
                    : 'No department announcements have been created yet.'}
                </p>
              </div>
              {announcementSearch || announcementCategoryFilter !== 'All' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncementSearch('')
                    setAnnouncementCategoryFilter('All')
                  }}
                  className="text-xs text-[#087f8c] font-bold hover:underline"
                >
                  Clear search & filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(true)}
                  className="px-4 py-2 rounded-xl bg-[#087f8c] text-white text-xs font-bold hover:bg-[#05636d] transition-colors"
                >
                  + Create first announcement
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map((item) => (
                <article
                  key={item.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    item.is_pinned
                      ? 'border-[#f2d89f] bg-gradient-to-r from-[#fffdfa] to-white ring-1 ring-[#f2d89f]/40'
                      : 'border-[#e4ecee] hover:border-[#b8dfe1]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${categoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f1f5f6] text-[#55696e] border border-[#e2e9eb]">
                        👥 {item.audience || 'All students'}
                      </span>

                      {item.is_pinned && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#fff4db] text-[#975c03] border border-[#edd7a4] flex items-center gap-1">
                          <Pin size={10} />
                          PINNED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <small className="text-[11px] text-[#9aa7aa] font-medium">
                        {timeAgo(item.published_at)}
                      </small>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="text-[#b64a4a] hover:text-[#8e2929] hover:bg-[#fdecec] p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                        title="Delete announcement"
                      >
                        <Trash2 size={13} className={deletingId === item.id ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h3 className="text-base font-bold text-[#102a2f] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#52656a] leading-relaxed mb-3 whitespace-pre-line">
                    {item.body}
                  </p>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-[11px] text-[#9aa7aa] border-t border-[#f4f7f8] pt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#667a7f]">Issued by:</span>
                      <span className="text-[#102a2f] font-bold">{item.issuer}</span>
                    </div>
                    {item.published_at && (
                      <span className="text-[10px]">
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
          )}
        </div>
      )}
    </div>
  )
}
