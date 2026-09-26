import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileQuestion,
  FolderOpen,
  GraduationCap,
  MapPin,
  Megaphone,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { MOCK_DASHBOARD_STATS } from './mocks'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const STAT_ICONS = {
  events: CalendarDays,
  resources: BookOpen,
  students: Users,
  announcements: Megaphone,
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isActualAdmin = user?.role === 'admin'

  // Allow admins to preview student dashboard if desired
  const [previewAsStudent, setPreviewAsStudent] = useState(false)
  const isDisplayingAdmin = isActualAdmin && !previewAsStudent
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    api.get(ENDPOINTS.announcements)
      .then((items) => setAnnouncements(items.slice(0, 4)))
      .catch(() => setAnnouncements([]))
  }, [])

  return (
    <div className="space-y-6">
      {/* ── TOP ROLE BANNER SPECIFICATION ────────────────────────── */}
      {isDisplayingAdmin ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#eee7fa] border border-[#d6c3f3] text-[#7652b8] px-4 py-3 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7652b8] animate-pulse flex-shrink-0" />
            <div>
              <strong className="text-xs font-black uppercase tracking-wider block sm:inline">
                ADMINISTRATOR DASHBOARD
              </strong>
              <span className="text-[11px] text-[#7652b8]/80 sm:ml-2">
                Department management & administrative oversight.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setPreviewAsStudent(true)}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#d6c3f3] text-[#7652b8] text-[10px] font-bold hover:bg-gray-50 transition-colors"
            >
              Preview Student View
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#e8f6f7] border border-[#bce4e8] text-[#087f8c] px-4 py-3 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#087f8c] flex-shrink-0" />
            <div>
              <strong className="text-xs font-black uppercase tracking-wider block sm:inline">
                STUDENT DASHBOARD
              </strong>
              <span className="text-[11px] text-[#087f8c]/80 sm:ml-2">
                Undergraduate & Postgraduate Chemistry student workspace.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isActualAdmin && previewAsStudent && (
              <button
                onClick={() => setPreviewAsStudent(false)}
                className="px-3 py-1 rounded-xl bg-[#7652b8] text-white text-[10px] font-bold hover:bg-[#5f3ea5] transition-colors"
              >
                Back to Admin Dashboard
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white border border-[#bce4e8] text-[#087f8c]">
              Student Portal
            </span>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      {isDisplayingAdmin ? (
        /* Admin Hero Banner */
        <div className="rounded-2xl p-6 sm:p-10 bg-gradient-to-br from-[#1d1b38] to-[#453676] text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#d2beff]">
              ADMIN CONSOLE · CHEMISTRY DEPARTMENT
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-3 leading-tight">
              Administrator Hub — Department operations in one place.
            </h1>
            <p className="text-[#ded6f9] text-xs sm:text-sm leading-relaxed max-w-xl">
              Publish events, manage syllabus materials, issue department notices, and manage student accounts across all levels.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/admin?tab=events"
                className="px-4 py-2.5 rounded-xl bg-white text-[#1d1b38] text-xs font-bold shadow hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={14} aria-hidden="true" />
                Create new event
              </Link>
              <Link
                to="/admin?tab=resources"
                className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Upload resource
              </Link>
              <Link
                to="/announcements?create=true"
                className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Post announcement
              </Link>
            </div>
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 select-none opacity-15 pointer-events-none hidden md:block">
            <ShieldCheck size={120} strokeWidth={1.4} aria-hidden="true" />
          </div>
        </div>
      ) : (
        /* Student Hero Banner */
        <div className="rounded-2xl p-6 sm:p-10 bg-gradient-to-br from-[#073a43] to-[#0a8a92] text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#8fe3e5]">
              STUDENT DASHBOARD · CHEMISTRY DEPARTMENT
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-3 leading-tight">
              Everything you need, in one place.
            </h1>
            <p className="text-[#cceced] text-xs sm:text-sm leading-relaxed max-w-xl">
              Events, academic resources, announcements and your department community — organized for chemistry students.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/events"
                className="px-4 py-2.5 rounded-xl bg-white text-[#102a2f] text-xs font-bold shadow hover:bg-gray-50 transition-colors"
              >
                Explore events
              </Link>
              <Link
                to="/academic"
                className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Browse resources
              </Link>
            </div>
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 select-none opacity-15 pointer-events-none hidden md:block">
            <GraduationCap size={120} strokeWidth={1.4} aria-hidden="true" />
          </div>
        </div>
      )}

      {/* ── SECTION HEAD ────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">
            {isDisplayingAdmin ? 'DEPARTMENT OVERSIGHT' : 'STUDENT OVERVIEW'}
          </span>
          <h2 className="text-xl font-bold text-[#102a2f] mt-0.5">
            {isDisplayingAdmin ? 'Department administration at a glance' : 'Your department at a glance'}
          </h2>
        </div>
        <Link
          to={isDisplayingAdmin ? '/admin' : '/events'}
          className="text-xs font-bold text-[#087f8c] hover:underline"
        >
          {isDisplayingAdmin ? 'Open Admin Console →' : 'View all events →'}
        </Link>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MOCK_DASHBOARD_STATS.map((stat) => {
          const Icon = STAT_ICONS[stat.id] || FolderOpen
          return (
          <div
            key={stat.id}
            className="bg-white border border-[#e4ecee] rounded-2xl p-4 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-lg text-sm grid place-items-center mb-3 ${
                isDisplayingAdmin && stat.id === 'events'
                  ? 'bg-[#f1ebfb] text-[#7652b8]'
                  : 'bg-[#eef7f7] text-[#087f8c]'
              }`}
            >
              <Icon size={17} aria-hidden="true" />
            </div>
            <strong className="block text-2xl font-black text-[#102a2f] tracking-tight">{stat.value}</strong>
            <span className="block text-xs text-[#64777d] mt-1">
              {isDisplayingAdmin && stat.id === 'events'
                ? 'Published events'
                : isDisplayingAdmin && stat.id === 'students'
                ? 'Students registered'
                : stat.label}
            </span>
          </div>
          )
        })}
      </div>

      {/* ── 2-COLUMN GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel: Up Next Event */}
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">UP NEXT</span>
                <h3 className="text-base font-bold text-[#102a2f] mt-0.5">Annual Chemistry Symposium</h3>
              </div>
              <span className="px-2 py-1 rounded-full text-[10px] font-extrabold bg-[#e7f5f7] text-[#087f8c]">
                Oct 12
              </span>
            </div>
            <p className="text-xs text-[#64777d] leading-relaxed">
              A departmental seminar bringing students and researchers together around current developments in chemistry.
            </p>
            <div className="flex gap-4 text-xs text-[#74878b] font-medium my-4">
              <span className="inline-flex items-center gap-1.5"><CalendarClock size={13} aria-hidden="true" />10:00 AM</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden="true" />Main Auditorium</span>
            </div>
          </div>
          <Link
            to={isDisplayingAdmin ? '/admin' : '/events'}
            className={`w-full py-2.5 rounded-xl text-white text-xs font-bold text-center block transition-colors ${
              isDisplayingAdmin
                ? 'bg-[#7652b8] hover:bg-[#5f3ea5]'
                : 'bg-[#087f8c] hover:bg-[#05636d]'
            }`}
          >
            {isDisplayingAdmin ? 'Manage event details' : 'View event details'}
          </Link>
        </section>

        {/* Right Panel: Latest Announcements */}
        <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">LATEST</span>
              <h3 className="text-base font-bold text-[#102a2f] mt-0.5">Announcements</h3>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-bold text-[#087f8c] hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="divide-y divide-[#eef2f3]">
            {announcements.length === 0 && (
              <p className="py-3 text-[11px] text-[#64777d]">No announcements have been published yet.</p>
            )}
            {announcements.map((item) => (
              <Link
                key={item.id}
                to="/announcements"
                className="py-3 flex items-start gap-2.5 group hover:bg-[#fbfcfc] rounded-lg px-1 transition-colors"
              >
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#087f8c]" />
                <div className="flex-1">
                  <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#087f8c]">
                    {item.title}
                  </strong>
                  <p className="text-[11px] text-[#64777d] mt-0.5">{item.body}</p>
                </div>
                <time className="text-[10px] text-[#a1adb0] ml-2 flex-shrink-0">
                  {new Date(item.published_at).toLocaleDateString()}
                </time>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── QUICK ACCESS GRID ───────────────────────────────────── */}
      <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
          {isDisplayingAdmin ? 'ADMINISTRATIVE SHORTCUTS' : 'QUICK ACCESS'}
        </span>
        <h3 className="text-base font-bold text-[#102a2f] mt-0.5 mb-4">
          {isDisplayingAdmin ? 'Management tools' : 'What do you need?'}
        </h3>

        {isDisplayingAdmin ? (
          /* Admin Quick Access */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/admin?tab=events"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <CalendarDays className="block text-[#7652b8] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#7652b8]">
                Manage Events
              </strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Schedule & edit seminars</small>
            </Link>
            <Link
              to="/admin?tab=resources"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <BookOpen className="block text-[#7652b8] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#7652b8]">
                Upload Resources
              </strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Lecture notes & handouts</small>
            </Link>
            <Link
              to="/admin?tab=users"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <Users className="block text-[#7652b8] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#7652b8]">
                Student Accounts
              </strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Accounts & roles list</small>
            </Link>
            <Link
              to="/announcements?create=true"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <Megaphone className="block text-[#7652b8] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f] group-hover:text-[#7652b8]">
                Manage Announcements
              </strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Create, pin & view broadcasts</small>
            </Link>
          </div>
        ) : (
          /* Student Quick Access */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/academic"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#b7dfe2] hover:-translate-y-0.5 transition-all block"
            >
              <FileQuestion className="block text-[#087f8c] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f]">Past Questions</strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Exam papers by course & year</small>
            </Link>
            <Link
              to="/academic"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#b7dfe2] hover:-translate-y-0.5 transition-all block"
            >
              <BookOpen className="block text-[#087f8c] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f]">Lecture Notes</strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Slides & study materials</small>
            </Link>
            <Link
              to="/events"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#b7dfe2] hover:-translate-y-0.5 transition-all block"
            >
              <ClipboardCheck className="block text-[#087f8c] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f]">Event Check-in</strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Scan or enter attendance code</small>
            </Link>
            <Link
              to="/directory"
              className="border border-[#e4ecee] p-4 rounded-xl bg-[#fbfcfc] hover:border-[#b7dfe2] hover:-translate-y-0.5 transition-all block"
            >
              <Users className="block text-[#087f8c] mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-[#102a2f]">Department Directory</strong>
              <small className="block text-[10px] text-[#64777d] mt-1">Executives, reps & lecturers</small>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
