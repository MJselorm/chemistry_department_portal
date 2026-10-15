import React, { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Download, Eye, Filter, FolderOpen, RefreshCw, Search } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import AcademicResourceViewer from './AcademicResourceViewer'
import ResourceThumbnail from './ResourceThumbnail'
import { downloadAcademicResource } from './resourceDownload'
import { resourceExtension } from './filePreview'

const CATEGORIES = [
  'All Categories',
  'Lecture Notes',
  'Past Questions',
  'Lab Manuals',
  'Textbooks',
  'Course Outlines',
]

const LEVELS = ['All Levels', 'Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate']
const SEMESTERS = ['All Semesters', 'Semester 1', 'Semester 2']

const formatBytes = (value) => {
  if (!value || isNaN(value)) return 'Size unknown'
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (value) => {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export default function AcademicHubPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [selectedSemester, setSelectedSemester] = useState('All Semesters')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ total: 0, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [previewResource, setPreviewResource] = useState(null)

  const loadResources = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '12',
        sort_by: sortBy,
      })
      if (search.trim()) params.set('search', search.trim())
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory)
      if (selectedLevel !== 'All Levels') {
        const lvlCode = selectedLevel.replace('Level ', '')
        params.set('level', lvlCode)
      }
      if (selectedSemester !== 'All Semesters') {
        params.set('semester', selectedSemester.replace('Semester ', ''))
      }

      const result = await api.get(`${ENDPOINTS.academicResources}?${params}`)
      setItems(result.items || [])
      setData(result)
    } catch (err) {
      setError(err.message || 'Unable to load academic materials.')
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedCategory, selectedLevel, selectedSemester, sortBy])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    loadResources()
  }

  const handleDownload = async (resource) => {
    setActionLoadingId(`download-${resource.id}`)
    try {
      await downloadAcademicResource(resource)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to download the file from Academic Storage.' })
      setTimeout(() => setFeedback(null), 5000)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleView = (resource) => setPreviewResource(resource)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            STUDY CENTRE & REPOSITORY
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Academic Hub</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Access course lecture slides, past examination papers, laboratory guides, and study materials.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, course code or tag…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary shadow-xs"
          />
        </form>
      </div>

      {/* Action and Filter Controls */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-secondary border border-border text-muted-foreground hover:border-[var(--primary-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Level & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter size={13} className="text-primary" />
              <span className="font-semibold">Level:</span>
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
              <span className="font-semibold">Semester:</span>
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
            >
              {SEMESTERS.map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
              <span className="font-semibold">Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
            >
              <option value="name">Name (A-Z)</option>
              <option value="created_at">Date Added</option>
              <option value="updated_at">Last Updated</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {data.total || 0} {data.total === 1 ? 'file' : 'files'} available
            </span>
            <button
              type="button"
              onClick={loadResources}
              disabled={loading}
              className="p-1.5 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh repository"
              aria-label="Refresh repository"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-primary' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback / Error Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'error'
              ? 'bg-[var(--destructive-soft)] border-[var(--destructive-border)] text-destructive'
              : 'bg-[var(--success-soft)] border-[var(--success-border)] text-success'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[var(--destructive-soft)] border border-[var(--destructive-border)] text-destructive text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadResources} className="font-bold underline ml-3">
            Retry
          </button>
        </div>
      )}

      {/* Resource cards */}
      <section aria-label="Academic materials">
        {loading ? (
          <div className="rounded-lg border border-border bg-surface py-16 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Loading academic materials…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface py-14 text-center space-y-2">
            <FolderOpen size={36} className="text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-foreground">No resources found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedSemester !== 'All Semesters'
                ? 'No documents matched your active search or filters. Try adjusting your selections.'
                : 'The department repository does not have indexed files matching this category yet. An administrator can refresh the Academic Storage index from the Admin Console.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const isDownloadLoading = actionLoadingId === `download-${item.id}`
              const extension = resourceExtension(item)

              return (
                <article
                  key={item.id}
                  className="group flex min-h-[330px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs transition-[border-color,box-shadow] hover:border-[var(--primary-border)] hover:shadow-raised"
                >
                  <ResourceThumbnail resource={item} />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                        {extension || item.resource_type || 'File'}
                      </span>
                      <span className="truncate text-[10px] font-semibold text-muted-foreground">{item.category || 'General'}</span>
                    </div>
                    <strong className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground transition-colors group-hover:text-primary">
                        {item.title || item.name}
                    </strong>
                    <p className="mt-1 truncate text-[11px] font-semibold text-primary">
                      {[item.course_code, item.course_name].filter(Boolean).join(' · ') || 'General Chemistry'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      {item.level && <span>Level {item.level}</span>}
                      {item.semester && <span>Semester {item.semester}</span>}
                      <span>{formatBytes(item.file_size)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CalendarDays size={12} aria-hidden="true" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <button type="button" onClick={() => handleView(item)} disabled={isDownloadLoading} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-foreground transition-colors hover:bg-surface-secondary disabled:opacity-50">
                        <Eye size={13} aria-hidden="true" />
                        View
                      </button>
                      <button type="button" onClick={() => handleDownload(item)} disabled={isDownloadLoading || item.download_available === false} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
                        {isDownloadLoading ? <RefreshCw size={13} className="animate-spin" aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
                        Download
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-5">
            <span className="text-xs text-muted-foreground">
              Page {data.page || page} of {data.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 text-xs font-bold border border-border rounded-xl bg-surface hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= data.total_pages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs font-bold border border-border rounded-xl bg-surface hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      {previewResource && <AcademicResourceViewer resource={previewResource} onClose={() => setPreviewResource(null)} />}
    </div>
  )
}
