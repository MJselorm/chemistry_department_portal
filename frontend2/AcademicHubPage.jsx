import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Download,
  Eye,
  Search,
  ExternalLink,
  RefreshCw,
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { resourcesApi } from './resources/resourcesApi'
import {
  formatFileSize,
  getFileFormatInfo,
  formatResourceDate,
} from './resources/resourceUtils'

const ACADEMIC_CATEGORIES = [
  {
    id: 'past-questions',
    title: 'Past Questions',
    description: 'Mid-sem and end of semester past question papers with solutions.',
    icon: '▤',
    color: 'blue',
  },
  {
    id: 'lecture-notes',
    title: 'Lecture Notes',
    description: 'Course slides, handouts, and lecturer presentations across all levels.',
    icon: '▣',
    color: 'green',
  },
  {
    id: 'textbooks',
    title: 'Textbooks',
    description: 'Core chemistry textbooks, reference e-books and literature.',
    icon: '📖',
    color: 'amber',
  },
  {
    id: 'lab-manuals',
    title: 'Lab Manuals',
    description: 'Practical guides, experimental protocols and safety manuals.',
    icon: '⚗',
    color: 'purple',
  },
  {
    id: 'course-outlines',
    title: 'Course Outlines',
    description: 'Official department syllabi, grading schemes and course schedules.',
    icon: '📋',
    color: 'red',
  },
  {
    id: 'slides',
    title: 'Slides & Handouts',
    description: 'Summary sheets, formula guides, and periodic table references.',
    icon: '✦',
    color: 'slate',
  },
]

export default function AcademicHubPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [resources, setResources] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  const [downloadingId, setDownloadingId] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const abortControllerRef = useRef(null)

  const showToast = (message, tone = 'info') => {
    setActionNotice({ message, tone })
    setTimeout(() => setActionNotice(null), 3500)
  }

  const fetchRecentResources = async (cat = selectedCategory, search = searchTerm) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)
    try {
      const queryParams = {
        page: 1,
        page_size: 8,
        sort_by: 'created_at',
        sort_order: 'desc',
        category: cat || undefined,
        search: search.trim() || undefined,
      }
      const data = await resourcesApi.listResources(queryParams, {
        signal: abortControllerRef.current.signal,
      })
      setResources(data?.items || [])
      setTotalCount(data?.total || 0)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err?.message || 'Failed to load materials from the repository.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentResources(selectedCategory, searchTerm)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [selectedCategory, searchTerm])

  const handleDownload = async (resource) => {
    setDownloadingId(resource.id)
    try {
      await resourcesApi.downloadResource(resource.id, resource.name)
      showToast(`Downloaded "${resource.name}"`, 'success')
    } catch (err) {
      showToast(err?.message || 'Download failed.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleView = async (resource) => {
    setViewingId(resource.id)
    try {
      const { url } = await resourcesApi.viewResource(resource.id)
      window.open(url, '_blank')
    } catch (err) {
      showToast(err?.message || 'Unable to preview file.', 'error')
    } finally {
      setViewingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">
            STUDY CENTRE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102a2f] mt-1 tracking-tight">
            Academic Hub
          </h1>
          <p className="text-xs text-[#64777d] mt-1 max-w-2xl leading-relaxed">
            Curated repository of course materials, past questions, lecture notes, and lab manuals.
          </p>
        </div>

        {/* Search Bar & Full Repo CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <span className="absolute left-3 top-2.5 text-[#9ba8ac] text-xs">⌕</span>
            <input
              type="text"
              placeholder="Filter materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e4ecee] bg-white text-xs focus:outline-none focus:border-[#087f8c] shadow-xs"
            />
          </div>
          <Link
            to="/resources"
            className="px-3.5 py-2 rounded-xl bg-[#087f8c] hover:bg-[#066570] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Full Library</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Floating Action Notice */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionNotice.tone === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : actionNotice.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="opacity-70 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── CATEGORY GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ACADEMIC_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.title
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? null : cat.title)}
              className={`p-4.5 bg-white border rounded-2xl shadow-xs cursor-pointer flex gap-3.5 items-start transition-all ${
                isSelected
                  ? 'border-[#087f8c] ring-2 ring-[#087f8c]/20 bg-[#fbfdfd]'
                  : 'border-[#e4ecee] hover:border-[#b8dfe1] hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl grid place-items-center text-lg flex-shrink-0 shadow-xs ${
                  cat.color === 'blue'
                    ? 'bg-[#eaf4fb] text-[#2c79a8]'
                    : cat.color === 'green'
                    ? 'bg-[#eaf7ef] text-[#2b875c]'
                    : cat.color === 'amber'
                    ? 'bg-[#fff5df] text-[#ad740b]'
                    : cat.color === 'purple'
                    ? 'bg-[#f1ebfb] text-[#7652b8]'
                    : cat.color === 'red'
                    ? 'bg-[#fdeeee] text-[#c84b4b]'
                    : 'bg-[#eef2f3] text-[#5b7075]'
                }`}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="text-xs font-bold text-[#102a2f]">{cat.title}</h3>
                  {isSelected && (
                    <span className="text-[10px] font-extrabold text-[#087f8c] bg-[#e8f6f7] px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64777d] leading-relaxed mb-2.5 line-clamp-2">
                  {cat.description}
                </p>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#087f8c]">
                  <span>{isSelected ? '✓ Filtering below' : 'Click to filter'}</span>
                  <Link
                    to={`/resources?category=${encodeURIComponent(cat.title)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline flex items-center gap-0.5 text-[#5e747a] hover:text-[#087f8c]"
                  >
                    <span>Browse in library</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── RECENTLY ADDED SECTION ──────────────────────────────── */}
      <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">
              LIVE REPOSITORY
            </span>
            <h2 className="text-lg font-bold text-[#102a2f] mt-0.5">
              {selectedCategory ? `Recent ${selectedCategory}` : 'Recently Indexed Materials'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#d7e2e4] text-[#496066] hover:bg-gray-50 transition-colors"
              >
                Clear category
              </button>
            )}
            <Link
              to={selectedCategory ? `/resources?category=${encodeURIComponent(selectedCategory)}` : '/resources'}
              className="text-xs font-bold text-[#087f8c] hover:underline flex items-center gap-1"
            >
              <span>View all ({totalCount})</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <RefreshCw size={24} className="animate-spin text-[#087f8c]" />
            <span className="text-xs font-semibold text-[#64777d]">Loading academic resources...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-6 px-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <p className="text-xs font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchRecentResources(selectedCategory, searchTerm)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table of Resources */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <div className="min-w-[650px] divide-y divide-[#edf1f2]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 py-2.5 text-[9px] uppercase tracking-wider font-extrabold text-[#94a1a5]">
                <span className="col-span-5">Resource</span>
                <span className="col-span-2">Course / Level</span>
                <span className="col-span-2">Category</span>
                <span className="col-span-1">Size</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {/* Table Rows */}
              {resources.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#64777d]">
                  No materials found matching your current filter.
                  <div className="mt-2">
                    <Link to="/resources" className="font-bold text-[#087f8c] hover:underline">
                      Explore the full Academic Resources library →
                    </Link>
                  </div>
                </div>
              ) : (
                resources.map((item) => {
                  const formatInfo = getFileFormatInfo(item.mime_type, item.name)
                  const formattedSize = formatFileSize(item.file_size)
                  const formattedDate = formatResourceDate(item.updated_at || item.last_modified_drive)

                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 py-3.5 items-center text-xs hover:bg-[#fafcfc] px-1 rounded-xl transition-colors">
                      {/* Name & Format */}
                      <div className="col-span-5 flex items-start gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border flex-shrink-0 mt-0.5 ${formatInfo.color}`}>
                          {formatInfo.ext}
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-xs font-bold text-[#102a2f] truncate" title={item.name}>
                            {item.name}
                          </strong>
                          <span className="block text-[10px] text-[#98a5a8] mt-0.5">
                            {formattedDate ? `Added ${formattedDate}` : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {/* Course / Level */}
                      <div className="col-span-2 text-xs text-[#64777d]">
                        {item.course_code ? (
                          <span className="font-bold text-[#087f8c]">{item.course_code}</span>
                        ) : item.level ? (
                          <span>Level {item.level}</span>
                        ) : (
                          <span className="text-[#9ba8ac]">—</span>
                        )}
                      </div>

                      {/* Category */}
                      <div className="col-span-2 text-xs text-[#64777d]">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {item.category || item.resource_type || 'Academic'}
                        </span>
                      </div>

                      {/* Size */}
                      <div className="col-span-1 text-[11px] text-[#8e9fa3]">
                        {formattedSize}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 text-right flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(item)}
                          disabled={viewingId === item.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#e8f6f7] text-[#087f8c] hover:bg-[#d5eff1] transition-colors disabled:opacity-50"
                          title="View resource in browser"
                        >
                          {viewingId === item.id ? 'Opening…' : 'View'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId === item.id || !item.download_available}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#102a2f] text-white hover:bg-[#1b3f46] transition-colors disabled:opacity-50"
                          title="Download file"
                        >
                          {downloadingId === item.id ? '…' : 'Download'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
