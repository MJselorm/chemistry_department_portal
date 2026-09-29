import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, RefreshCw, Layers } from 'lucide-react'
import { resourcesApi } from './resources/resourcesApi'
import ResourceCard from './resources/ResourceCard'
import ResourceFilters from './resources/ResourceFilters'
import ResourceSearch from './resources/ResourceSearch'
import ResourcePagination from './resources/ResourcePagination'
import ResourceSkeleton from './resources/ResourceSkeleton'
import ResourceEmptyState from './resources/ResourceEmptyState'
import ResourceErrorState from './resources/ResourceErrorState'

export default function ResourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCategory = searchParams.get('category') || 'All'
  const initialLevel = searchParams.get('level') || 'All'
  const initialType = searchParams.get('resource_type') || searchParams.get('type') || 'All'
  const initialCourse = searchParams.get('course') || 'All'
  const initialFolder = searchParams.get('folder') || ''
  const initialSearch = searchParams.get('search') || searchParams.get('q') || ''

  const [resources, setResources] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)

  // Filters & search initialized from URL query params
  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState({
    level: initialLevel,
    resource_type: initialType,
    course: initialCourse,
    category: initialCategory,
    folder: initialFolder,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  // Discovered dynamic options
  const [availableCourses, setAvailableCourses] = useState([])
  const [availableFolders, setAvailableFolders] = useState([])

  // Load indexed folders on mount
  useEffect(() => {
    resourcesApi
      .listFolders()
      .then((folders) => {
        if (Array.isArray(folders) && folders.length > 0) {
          const names = folders
            .map((f) => f.name || f.folder_path)
            .filter(Boolean)
          setAvailableFolders((prev) => Array.from(new Set([...prev, ...names])))
        }
      })
      .catch(() => {})
  }, [])

  // AbortController ref for in-flight search/fetch cancellation
  const abortControllerRef = useRef(null)

  const fetchResources = useCallback(
    async (targetPage = page, targetFilters = filters, targetSearch = search) => {
      // Cancel any existing in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setError(null)

      try {
        const queryParams = {
          page: targetPage,
          page_size: pageSize,
          search: targetSearch.trim() || undefined,
          level: targetFilters.level !== 'All' ? targetFilters.level : undefined,
          resource_type:
            targetFilters.resource_type !== 'All' ? targetFilters.resource_type : undefined,
          course: targetFilters.course !== 'All' ? targetFilters.course : undefined,
          category: targetFilters.category !== 'All' ? targetFilters.category : undefined,
          folder: targetFilters.folder || undefined,
        }

        const data = await resourcesApi.listResources(queryParams, {
          signal: abortControllerRef.current.signal,
        })

        const items = data?.items || []
        setResources(items)
        setTotal(data?.total || 0)
        setTotalPages(data?.total_pages || 0)
        setPage(data?.page || targetPage)

        // Dynamically extract courses and folders if not yet populated
        if (items.length > 0) {
          setAvailableCourses((prev) => {
            const courseMap = new Map()
            prev.forEach((c) => courseMap.set(c.course_code || c.course_name, c))
            items.forEach((item) => {
              if (item.course_code || item.course_name) {
                const key = item.course_code || item.course_name
                if (!courseMap.has(key)) {
                  courseMap.set(key, {
                    course_code: item.course_code,
                    course_name: item.course_name,
                  })
                }
              }
            })
            return Array.from(courseMap.values())
          })

          setAvailableFolders((prev) => {
            const folderSet = new Set(prev)
            items.forEach((item) => {
              if (item.folder_path) {
                const segments = item.folder_path.split(/[\/\\]+/).filter(Boolean)
                segments.forEach((seg) => {
                  if (seg && !seg.toLowerCase().includes('academic resources')) {
                    folderSet.add(seg)
                  }
                })
              }
            })
            return Array.from(folderSet)
          })
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // Normal cancellation, don't show error
          return
        }
        setError(err?.message || 'Unable to load resources. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, filters, search]
  )

  // Fetch when page, filters, or search change
  useEffect(() => {
    fetchResources(page, filters, search)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [page, filters, search])

  const handleSearchChange = (newSearch) => {
    setSearch(newSearch)
    setPage(1)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilters({
      level: 'All',
      resource_type: 'All',
      course: 'All',
      category: 'All',
      folder: '',
    })
    setPage(1)
  }

  const showNotice = (msg, tone = 'info') => {
    setActionNotice({ msg, tone })
    setTimeout(() => setActionNotice(null), 3500)
  }

  // Handle viewing resource
  const handleViewResource = async (resource) => {
    try {
      const { url } = await resourcesApi.viewResource(resource.id)
      window.open(url, '_blank')
    } catch (err) {
      showNotice(err?.message || 'Unable to open document for viewing.', 'error')
    }
  }

  // Handle downloading resource
  const handleDownloadResource = async (resource) => {
    try {
      await resourcesApi.downloadResource(resource.id, resource.name)
      showNotice(`Downloaded "${resource.name}"`, 'success')
    } catch (err) {
      showNotice(err?.message || 'Failed to download resource.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">
            STUDENT REPOSITORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102a2f] mt-1 tracking-tight">
            Academic Resources
          </h1>
          <p className="text-xs text-[#64777d] mt-1 max-w-2xl leading-relaxed">
            Access lecture notes, past questions, textbooks, labs, and other academic materials.
          </p>
        </div>

        {/* Refresh button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchResources(page, filters, search)}
            disabled={loading}
            className="p-2 rounded-xl border border-[#e4ecee] bg-white text-[#5f747a] hover:text-[#087f8c] hover:bg-[#f6f9fa] shadow-xs transition-colors"
            title="Refresh resources list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Floating Notice Toast */}
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
          <span>{actionNotice.msg}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="opacity-70 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <ResourceSearch
        value={search}
        onChange={handleSearchChange}
        placeholder="🔍 Search resources, courses, files..."
        isSearching={loading}
      />

      {/* ── MULTI-FILTER BAR ────────────────────────────────────── */}
      <ResourceFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        availableCourses={availableCourses}
        availableFolders={availableFolders}
      />

      {/* ── ERROR STATE ─────────────────────────────────────────── */}
      {error && !loading && (
        <ResourceErrorState
          message={error}
          onRetry={() => fetchResources(page, filters, search)}
        />
      )}

      {/* ── LOADING SKELETON ────────────────────────────────────── */}
      {loading && <ResourceSkeleton count={pageSize > 6 ? 6 : pageSize} />}

      {/* ── EMPTY STATE ─────────────────────────────────────────── */}
      {!loading && !error && resources.length === 0 && (
        <ResourceEmptyState
          title="No resources found"
          description={
            search || filters.level !== 'All' || filters.resource_type !== 'All'
              ? 'No academic resources matched your search criteria. Try modifying your filters or search terms.'
              : 'No academic resources have been published yet in this repository.'
          }
          onReset={search || filters.level !== 'All' || filters.resource_type !== 'All' ? handleResetFilters : null}
        />
      )}

      {/* ── RESOURCE CARDS GRID ─────────────────────────────────── */}
      {!loading && !error && resources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onView={handleViewResource}
              onDownload={handleDownloadResource}
              isAdmin={false}
            />
          ))}
        </div>
      )}

      {/* ── PAGINATION ──────────────────────────────────────────── */}
      {!loading && !error && total > 0 && (
        <ResourcePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </div>
  )
}
