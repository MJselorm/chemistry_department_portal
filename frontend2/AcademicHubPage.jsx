import React, { useEffect, useState, useCallback } from 'react'
import { BookOpen, Download, ExternalLink, FileText, Filter, FolderOpen, RefreshCw, Search, Sparkles } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

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
      const { blob } = await api.blob(ENDPOINTS.academicDownload(resource.id))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = resource.file_name || resource.name || 'document'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to stream file from Google Drive.' })
      setTimeout(() => setFeedback(null), 5000)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleView = async (resource) => {
    // If resource has a direct web_view_link, or use streaming proxy
    setActionLoadingId(`view-${resource.id}`)
    try {
      const { blob, contentType } = await api.blob(ENDPOINTS.academicView(resource.id))
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      // Fallback to web_view_link if direct stream fails
      if (resource.web_view_link) {
        window.open(resource.web_view_link, '_blank', 'noopener,noreferrer')
      } else {
        setFeedback({ type: 'error', message: err.message || 'Unable to open file preview.' })
        setTimeout(() => setFeedback(null), 5000)
      }
    } finally {
      setActionLoadingId(null)
    }
  }

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
              <option value="last_modified_drive">Google Drive Modified</option>
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

      {/* Resources Table / List */}
      <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Indexing and loading resources…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <FolderOpen size={36} className="text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-foreground">No resources found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedSemester !== 'All Semesters'
                ? 'No documents matched your active search or filters. Try adjusting your selections.'
                : 'The department repository does not have indexed files matching this category yet. An administrator can sync the repository from the Admin Console.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const isViewLoading = actionLoadingId === `view-${item.id}`
              const isDownloadLoading = actionLoadingId === `download-${item.id}`

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 group hover:bg-[var(--surface-secondary)] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-primary grid place-items-center shrink-0 mt-0.5">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title || item.name}
                      </strong>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
                        {item.course_code && (
                          <span className="font-bold text-primary">{item.course_code}</span>
                        )}
                        {item.label && <span className="font-bold text-primary">· {item.label}</span>}
                        {item.level && <span>· Level {item.level}</span>}
                        {item.category && <span>· {item.category}</span>}
                        {item.semester && <span>· Sem {item.semester}</span>}
                        <span>· {formatBytes(item.file_size)}</span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleView(item)}
                      disabled={isViewLoading || isDownloadLoading}
                      className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {isViewLoading ? (
                        <RefreshCw size={13} className="animate-spin text-primary" />
                      ) : (
                        <ExternalLink size={13} />
                      )}
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      disabled={isViewLoading || isDownloadLoading || item.download_available === false}
                      className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {isDownloadLoading ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-3">
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
    </div>
  )
}
