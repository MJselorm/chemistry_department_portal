import React, { useCallback, useEffect, useState } from 'react'
import { Filter, FolderOpen, RefreshCw, Search, X } from 'lucide-react'
import ResourceCard from './academic/ResourceCard'
import ResourcePreviewModal from './academic/ResourcePreviewModal'
import { downloadResourceFile } from './academic/resourceFiles'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const CATEGORIES = [
  'All Categories',
  'Lecture Notes',
  'Lecture Slides',
  'Past Questions',
  'Lab Manuals',
  'Tutorials',
  'Textbooks',
  'Course Outlines',
  'Other',
]
const LEVELS = ['All Levels', 'Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate']
const SEMESTERS = ['All Semesters', 'Semester 1', 'Semester 2']

export default function AcademicHubPage() {
  const [items, setItems] = useState([])
  const [searchInput, setSearchInput] = useState('')
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
  const [feedback, setFeedback] = useState('')
  const [previewResource, setPreviewResource] = useState(null)

  const loadResources = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '12',
        sort_by: sortBy,
        sort_order: sortBy === 'name' ? 'asc' : 'desc',
      })
      if (search) params.set('search', search)
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory)
      if (selectedLevel !== 'All Levels') params.set('level', selectedLevel.replace('Level ', ''))
      if (selectedSemester !== 'All Semesters') params.set('semester', selectedSemester.replace('Semester ', ''))

      const result = await api.get(`${ENDPOINTS.academicResources}?${params}`)
      setItems(result.items || [])
      setData(result)
    } catch (err) {
      console.error('Academic resources could not be loaded.', err)
      setError('Academic resources are unavailable right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedCategory, selectedLevel, selectedSemester, sortBy])

  useEffect(() => { loadResources() }, [loadResources])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setSelectedCategory('All Categories')
    setSelectedLevel('All Levels')
    setSelectedSemester('All Semesters')
    setSortBy('name')
    setPage(1)
  }

  const handleDownload = async (resource) => {
    if (actionLoadingId) return
    setActionLoadingId(`download-${resource.id}`)
    setFeedback('')
    try {
      await downloadResourceFile(resource)
    } catch (err) {
      console.error('Academic resource download failed.', err)
      setFeedback('The file could not be downloaded. Please try again.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const hasFilters = Boolean(search || selectedCategory !== 'All Categories' || selectedLevel !== 'All Levels' || selectedSemester !== 'All Semesters')

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Study centre & repository</span>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Academic Hub</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Browse course materials, past questions, laboratory guides, and department resources.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 sm:w-auto" role="search">
          <label className="relative min-w-0 flex-1 sm:w-72">
            <span className="sr-only">Search academic resources</span>
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} aria-hidden="true" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, course code, or keyword"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-xs text-foreground shadow-xs focus:border-primary focus:outline-none"
            />
          </label>
          <button type="submit" className="min-h-9 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover">Search</button>
        </form>
      </header>

      <section aria-label="Resource filters" className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => { setSelectedCategory(category); setPage(1) }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${selectedCategory === category ? 'bg-primary text-white' : 'border border-border bg-surface-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border pt-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter size={13} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Level</span>
              <select value={selectedLevel} onChange={(event) => { setSelectedLevel(event.target.value); setPage(1) }} className="min-h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none">
                {LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Semester</span>
              <select value={selectedSemester} onChange={(event) => { setSelectedSemester(event.target.value); setPage(1) }} className="min-h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none">
                {SEMESTERS.map((semester) => <option key={semester}>{semester}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort resources</span>
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }} className="min-h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none">
                <option value="name">Name (A-Z)</option>
                <option value="created_at">Recently added</option>
                <option value="last_modified_drive">Recently updated</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <span className="text-xs font-medium text-muted-foreground">{data.total || 0} {data.total === 1 ? 'resource' : 'resources'}</span>
            {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-muted-foreground hover:bg-surface-secondary hover:text-foreground"><X size={13} /> Clear</button>}
            <button type="button" onClick={loadResources} disabled={loading} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-surface-secondary hover:text-foreground disabled:opacity-50" title="Refresh resources" aria-label="Refresh resources">
              <RefreshCw size={13} className={loading ? 'animate-spin text-primary' : ''} />
            </button>
          </div>
        </div>
      </section>

      {feedback && <div role="alert" className="rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-xs font-semibold text-destructive">{feedback}</div>}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-4 text-xs text-destructive">
          <span>{error}</span><button type="button" onClick={loadResources} className="font-bold underline">Retry</button>
        </div>
      )}

      <section aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="py-16 text-center" role="status"><RefreshCw size={24} className="mx-auto animate-spin text-primary" /><p className="mt-3 text-xs text-muted-foreground">Loading resource metadata...</p></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <FolderOpen size={34} className="mx-auto text-muted-foreground opacity-60" />
            <h2 className="mt-3 text-sm font-bold text-foreground">No resources found</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{hasFilters ? 'No materials match the current search and filters.' : 'No academic materials are currently available.'}</p>
            {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-surface-secondary">Clear filters</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => <ResourceCard key={item.id} resource={item} onPreview={setPreviewResource} onDownload={handleDownload} actionLoadingId={actionLoadingId} />)}
          </div>
        )}

        {data.total_pages > 1 && (
          <nav aria-label="Academic resources pages" className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">Page {data.page || page} of {data.total_pages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-9 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-foreground hover:bg-surface-secondary disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= data.total_pages || loading} onClick={() => setPage((value) => value + 1)} className="min-h-9 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-foreground hover:bg-surface-secondary disabled:opacity-40">Next</button>
            </div>
          </nav>
        )}
      </section>

      <ResourcePreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} onDownload={handleDownload} downloading={actionLoadingId === `download-${previewResource?.id}`} />
    </div>
  )
}
