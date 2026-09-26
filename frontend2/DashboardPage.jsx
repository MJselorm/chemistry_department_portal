import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Atom,
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

const STAT_TONES = {
  events: 'bg-[var(--primary-soft)] text-[var(--primary)]',
  resources: 'bg-[var(--accent-soft)] text-[var(--warning)]',
  students: 'bg-[var(--success-soft)] text-[var(--success)]',
  announcements: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isActualAdmin = user?.role === 'admin'

  // Allow admins to preview student dashboard if desired
  const [previewAsStudent, setPreviewAsStudent] = useState(false)
  const isDisplayingAdmin = isActualAdmin && !previewAsStudent
  const [announcements, setAnnouncements] = useState([])
  const [announcementsError, setAnnouncementsError] = useState(false)

  const loadAnnouncements = () => {
    setAnnouncementsError(false)
    api.get(ENDPOINTS.announcements)
      .then((items) => setAnnouncements(items.slice(0, 4)))
      .catch((error) => {
        console.error('Failed to load dashboard announcements:', error)
        setAnnouncements([])
        setAnnouncementsError(true)
      })
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  return (
    <div className="space-y-6">
      {/* ── TOP ROLE BANNER SPECIFICATION ────────────────────────── */}
      {isDisplayingAdmin ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--primary-soft)] border border-[var(--primary-border)] text-[var(--primary)] px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-xs font-black uppercase tracking-wider block sm:inline">
                ADMINISTRATOR DASHBOARD
              </strong>
              <span className="text-[11px] text-[var(--muted-foreground)] sm:ml-2">
                Department management & administrative oversight.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setPreviewAsStudent(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--primary-border)] text-[var(--primary)] text-[10px] font-bold hover:bg-[var(--surface-secondary)] transition-colors"
            >
              Preview Student View
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--primary-soft)] border border-[var(--primary-border)] text-[var(--primary)] px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={18} className="flex-shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-xs font-black uppercase tracking-wider block sm:inline">
                STUDENT DASHBOARD
              </strong>
              <span className="text-[11px] text-[var(--muted-foreground)] sm:ml-2">
                Undergraduate & Postgraduate Chemistry student workspace.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isActualAdmin && previewAsStudent && (
              <button
                onClick={() => setPreviewAsStudent(false)}
                className="px-3 py-1 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary-hover transition-colors"
              >
                Back to Admin Dashboard
              </button>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-surface border border-[var(--primary-border)] text-primary">
              Student Portal
            </span>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      {isDisplayingAdmin ? (
        /* Admin Hero Banner */
        <div className="chem-hero rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#e8c95b]">
              ADMIN CONSOLE · CHEMISTRY DEPARTMENT
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-3 leading-tight">
              Administrator Hub — Department operations in one place.
            </h1>
            <p className="text-white/75 text-xs sm:text-sm leading-relaxed max-w-xl">
              Publish events, manage syllabus materials, issue department notices, and manage student accounts across all levels.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/admin?tab=events"
                className="px-4 py-2.5 rounded-lg bg-[#ffffff] text-[#171a4a] text-xs font-bold shadow hover:bg-[#f0f2f6] transition-colors inline-flex items-center gap-2"
              >
                <Plus size={14} aria-hidden="true" />
                Create new event
              </Link>
              <Link
                to="/admin?tab=resources"
                className="px-4 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Upload resource
              </Link>
              <Link
                to="/announcements?create=true"
                className="px-4 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Post announcement
              </Link>
            </div>
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 select-none opacity-15 pointer-events-none hidden md:block">
            <Atom size={132} strokeWidth={1} aria-hidden="true" />
          </div>
        </div>
      ) : (
        /* Student Hero Banner */
        <div className="chem-hero rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#e8c95b]">
              STUDENT DASHBOARD · CHEMISTRY DEPARTMENT
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-3 leading-tight">
              Everything you need, in one place.
            </h1>
            <p className="text-white/75 text-xs sm:text-sm leading-relaxed max-w-xl">
              Events, academic resources, announcements and your department community — organized for chemistry students.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/events"
                className="px-4 py-2.5 rounded-lg bg-[#ffffff] text-[#171a4a] text-xs font-bold shadow hover:bg-[#f0f2f6] transition-colors"
              >
                Explore events
              </Link>
              <Link
                to="/academic"
                className="px-4 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
              >
                Browse resources
              </Link>
            </div>
          </div>
          <div className="absolute right-10 top-1/2 -translate-y-1/2 select-none opacity-15 pointer-events-none hidden md:block">
            <Atom size={132} strokeWidth={1} aria-hidden="true" />
          </div>
        </div>
      )}

      {/* ── SECTION HEAD ────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {isDisplayingAdmin ? 'DEPARTMENT OVERSIGHT' : 'STUDENT OVERVIEW'}
          </span>
          <h2 className="text-xl font-bold text-foreground mt-0.5">
            {isDisplayingAdmin ? 'Department administration at a glance' : 'Your department at a glance'}
          </h2>
        </div>
        <Link
          to={isDisplayingAdmin ? '/admin' : '/events'}
          className="text-xs font-bold text-primary hover:underline"
        >
          {isDisplayingAdmin ? 'Open Admin Console →' : 'View all events →'}
        </Link>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MOCK_DASHBOARD_STATS.map((stat) => {
          const Icon = STAT_ICONS[stat.id] || FolderOpen
          return (
          <div
            key={stat.id}
            className="bg-surface border border-border rounded-2xl p-4 shadow-sm transition-[border-color,box-shadow] hover:border-[var(--primary-border)] hover:shadow-md"
          >
            <div
              className={`w-9 h-9 rounded-lg text-sm grid place-items-center mb-3 ${STAT_TONES[stat.id]}`}
            >
              <Icon size={17} aria-hidden="true" />
            </div>
            <strong className="block text-2xl font-bold text-foreground">{stat.value}</strong>
            <span className="block text-xs text-muted-foreground mt-1">
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
        <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">UP NEXT</span>
                <h3 className="text-base font-bold text-foreground mt-0.5">Annual Chemistry Symposium</h3>
              </div>
              <span className="px-2 py-1 rounded-full text-[10px] font-extrabold bg-[#e7f5f7] text-primary">
                Oct 12
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
                ? 'bg-primary hover:bg-primary-hover'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {isDisplayingAdmin ? 'Manage event details' : 'View event details'}
          </Link>
        </section>

        {/* Right Panel: Latest Announcements */}
        <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">LATEST</span>
              <h3 className="text-base font-bold text-foreground mt-0.5">Announcements</h3>
            </div>
            <Link
              to="/announcements"
              className="text-xs font-bold text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="divide-y divide-[#eef2f3]">
            {announcementsError && (
              <div className="flex items-center justify-between gap-3 py-3 text-[11px] text-destructive">
                <span>Announcements could not be loaded.</span>
                <button type="button" onClick={loadAnnouncements} className="font-bold underline">
                  Retry
                </button>
              </div>
            )}
            {!announcementsError && announcements.length === 0 && (
              <p className="py-3 text-[11px] text-muted-foreground">No announcements have been published yet.</p>
            )}
            {announcements.map((item) => (
              <Link
                key={item.id}
                to="/announcements"
                className="py-3 flex items-start gap-2.5 group hover:bg-surface-secondary rounded-lg px-1 transition-colors"
              >
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-primary" />
                <div className="flex-1">
                  <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                    {item.title}
                  </strong>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.body}</p>
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
      <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {isDisplayingAdmin ? 'ADMINISTRATIVE SHORTCUTS' : 'QUICK ACCESS'}
        </span>
        <h3 className="text-base font-bold text-foreground mt-0.5 mb-4">
          {isDisplayingAdmin ? 'Management tools' : 'What do you need?'}
        </h3>

        {isDisplayingAdmin ? (
          /* Admin Quick Access */
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/admin?tab=events"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <CalendarDays className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                Manage Events
              </strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Schedule & edit seminars</small>
            </Link>
            <Link
              to="/admin?tab=resources"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <BookOpen className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                Upload Resources
              </strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Lecture notes & handouts</small>
            </Link>
            <Link
              to="/admin?tab=users"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <Users className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                Student Accounts
              </strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Accounts & roles list</small>
            </Link>
            <Link
              to="/announcements?create=true"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[#c6b4e8] hover:-translate-y-0.5 transition-all block group"
            >
              <Megaphone className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                Manage Announcements
              </strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Create, pin & view broadcasts</small>
            </Link>
          </div>
        ) : (
          /* Student Quick Access */
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/academic"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[var(--primary-border)] hover:-translate-y-0.5 transition-all block"
            >
              <FileQuestion className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground">Past Questions</strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Exam papers by course & year</small>
            </Link>
            <Link
              to="/academic"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[var(--primary-border)] hover:-translate-y-0.5 transition-all block"
            >
              <BookOpen className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground">Lecture Notes</strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Slides & study materials</small>
            </Link>
            <Link
              to="/events"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[var(--primary-border)] hover:-translate-y-0.5 transition-all block"
            >
              <ClipboardCheck className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground">Event Check-in</strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Scan or enter attendance code</small>
            </Link>
            <Link
              to="/directory"
              className="border border-border p-4 rounded-xl bg-surface-secondary hover:border-[var(--primary-border)] hover:-translate-y-0.5 transition-all block"
            >
              <Users className="block text-primary mb-2" size={22} aria-hidden="true" />
              <strong className="block text-xs font-bold text-foreground">Department Directory</strong>
              <small className="block text-[10px] text-muted-foreground mt-1">Executives, reps & lecturers</small>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
