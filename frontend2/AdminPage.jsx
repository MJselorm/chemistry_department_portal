import React, { useState } from 'react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useAuth } from './AuthContext'
import { MOCK_ADMIN_USERS, MOCK_ADMIN_ACTIVITY } from './mocks'

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'events' | 'resources' | 'users' | 'announcements'
  const [adminTestResult, setAdminTestResult] = useState(null)
  const [testingRole, setTestingRole] = useState(false)

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', type: 'Seminar', datetime: '', venue: '', description: '' })
  const [resourceForm, setResourceForm] = useState({ title: '', category: 'Past Questions', course: '', year: '2026/2027' })
  const [announcementForm, setAnnouncementForm] = useState({ headline: '', message: '', audience: 'All students', pin: false })
  const [feedback, setFeedback] = useState(null)

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
            onClick={() => setActiveTab('events')}
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
          { id: 'announcements', label: 'Post Announcement' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            <div className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm">
              <span className="w-8 h-8 rounded-lg bg-[#fff6df] text-[#a66b08] text-sm grid place-items-center mb-3 font-bold">
                ▤
              </span>
              <strong className="block text-2xl font-black text-[#102a2f]">14</strong>
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
                  onClick={() => setActiveTab('events')}
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
                  onClick={() => setActiveTab('resources')}
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
                  onClick={() => setActiveTab('announcements')}
                  className="w-full text-left p-3 rounded-xl border border-[#e4ecee] hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                      Post announcement
                    </strong>
                    <small className="block text-[10px] text-[#64777d]">Send department-wide updates</small>
                  </div>
                  <span className="text-[#087f8c] font-bold text-xs">→</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
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

      {/* ── Tab: POST ANNOUNCEMENT ──────────────────────────────── */}
      {activeTab === 'announcements' && (
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-6 shadow-sm max-w-3xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
            CONTENT MANAGEMENT
          </span>
          <h2 className="text-xl font-bold text-[#102a2f] mt-0.5 mb-4">Post announcement</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              showFeedback(`Announcement published! (Placeholder API: POST /admin/announcements)`)
              setAnnouncementForm({ headline: '', message: '', audience: 'All students', pin: false })
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Headline</label>
              <input
                type="text"
                required
                placeholder="Announcement headline"
                value={announcementForm.headline}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, headline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Message</label>
              <textarea
                rows="5"
                required
                placeholder="Write the department announcement..."
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-[#102a2f] mb-1">Audience</label>
                <select
                  value={announcementForm.audience}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e3e5] text-xs focus:outline-none focus:border-[#087f8c] bg-white"
                >
                  <option value="All students">All students</option>
                  <option value="Level 100">Level 100</option>
                  <option value="Level 200">Level 200</option>
                  <option value="Level 300">Level 300</option>
                  <option value="Level 400">Level 400</option>
                </select>
              </div>
              <div className="pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-[#63767b] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.pin}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, pin: e.target.checked })}
                    className="w-4 h-4 rounded text-[#087f8c] focus:ring-[#087f8c]"
                  />
                  <span>Pin announcement to dashboard</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#f4f7f8]">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold transition-colors"
              >
                Publish announcement
              </button>
              <button
                type="button"
                onClick={() => showFeedback('Announcement draft saved locally.')}
                className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-[#496066] text-xs font-bold hover:bg-gray-50"
              >
                Save draft
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
