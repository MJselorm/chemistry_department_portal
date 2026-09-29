import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FolderTree,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Edit2,
  Lock,
  Layers,
} from 'lucide-react'
import { resourcesApi } from './resources/resourcesApi'
import ResourceCard from './resources/ResourceCard'
import ResourceFilters from './resources/ResourceFilters'
import ResourceSearch from './resources/ResourceSearch'
import ResourcePagination from './resources/ResourcePagination'
import ResourceSkeleton from './resources/ResourceSkeleton'
import ResourceEmptyState from './resources/ResourceEmptyState'
import ResourceErrorState from './resources/ResourceErrorState'
import AdminSyncModal from './resources/AdminSyncModal'
import ResourceEditModal from './resources/ResourceEditModal'

export default function AdminResourcesPage() {
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

  // Filters & search
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
  const [toastNotice, setToastNotice] = useState(null)

  // Dynamic dropdown references
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

  // Modal states
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [syncError, setSyncError] = useState(null)

  const [editingResource, setEditingResource] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // In-flight abort controller
  const abortControllerRef = useRef(null)

  const showToast = (message, tone = 'info') => {
    setToastNotice({ message, tone })
    setTimeout(() => setToastNotice(null), 4000)
  }

  const fetchResources = useCallback(
    async (targetPage = page, targetFilters = filters, targetSearch = search) => {
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

        if (items.length > 0) {
          setAvailableCourses((prev) => {
            const map = new Map()
            prev.forEach((c) => map.set(c.course_code || c.course_name, c))
            items.forEach((item) => {
              if (item.course_code || item.course_name) {
                const key = item.course_code || item.course_name
                if (!map.has(key)) {
                  map.set(key, {
                    course_code: item.course_code,
                    course_name: item.course_name,
                  })
                }
              }
            })
            return Array.from(map.values())
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
        if (err.name === 'AbortError') return
        setError(err?.message || 'Unable to load resources. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, filters, search]
  )

  useEffect(() => {
    fetchResources(page, filters, search)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [page, filters, search])

  // Sync Google Drive Handler
  const handleTriggerSync = async () => {
    setIsSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const summary = await resourcesApi.syncResources()
      setSyncResult(summary)
      showToast('Google Drive synchronization completed successfully!', 'success')
      // Refresh resources list
      fetchResources(1, filters, search)
    } catch (err) {
      const errMsg = err?.message || 'Drive synchronization failed. Please verify credentials.'
      setSyncError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  // View resource handler
  const handleView = async (resource) => {
    try {
      const { url } = await resourcesApi.viewResource(resource.id)
      window.open(url, '_blank')
    } catch (err) {
      showToast(err?.message || 'Unable to open resource file.', 'error')
    }
  }

  // Download resource handler
  const handleDownload = async (resource) => {
    try {
      await resourcesApi.downloadResource(resource.id, resource.name)
      showToast(`Downloaded "${resource.name}"`, 'success')
    } catch (err) {
      showToast(err?.message || 'Failed to download resource.', 'error')
    }
  }

  // Metadata Edit Handler
  const handleOpenEdit = (resource) => {
    setEditingResource(resource)
    setIsEditModalOpen(true)
  }

  const handleSaveMetadata = async (id, payload) => {
    try {
      const updated = await resourcesApi.updateResource(id, payload)
      setResources((prev) => prev.map((item) => (item.id === id ? updated : item)))
      showToast(`Updated metadata for "${updated.name}"`, 'success')
    } catch (err) {
      throw err
    }
  }

  // Active / Inactive Toggle Handler
  const handleToggleActive = async (resource) => {
    try {
      const newStatus = !resource.is_active
      const updated = await resourcesApi.updateResource(resource.id, { is_active: newStatus })
      setResources((prev) => prev.map((item) => (item.id === resource.id ? updated : item)))
      showToast(
        `Resource "${resource.name}" marked as ${newStatus ? 'active' : 'inactive'}.`,
        'success'
      )
    } catch (err) {
      showToast(err?.message || 'Failed to toggle resource status.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER WITH SYNC BUTTON ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-[#8fa0a4] mb-1">
            <Link to="/dashboard" className="hover:underline">Home</Link> /{' '}
            <span className="text-[#102a2f] font-semibold">Academic Resources</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102a2f] tracking-tight">
            Academic Resources Management
          </h1>
          <p className="text-xs text-[#64777d] mt-1 max-w-2xl leading-relaxed">
            Manage course materials, update resource tags, and synchronize repository files with Google Drive.
          </p>
        </div>

        {/* Sync Button & Live Stats */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSyncResult(null)
              setSyncError(null)
              setIsSyncModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#06646e] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all group"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Sync Google Drive</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastNotice.tone === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : toastNotice.tone === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span>{toastNotice.message}</span>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="opacity-70 hover:opacity-100 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <ResourceSearch
        value={search}
        onChange={(newSearch) => {
          setSearch(newSearch)
          setPage(1)
        }}
        placeholder="🔍 Search resources by name, course, description..."
        isSearching={loading}
      />

      {/* ── FILTERS ─────────────────────────────────────────────── */}
      <ResourceFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters)
          setPage(1)
        }}
        onReset={() => {
          setSearch('')
          setFilters({
            level: 'All',
            resource_type: 'All',
            course: 'All',
            category: 'All',
            folder: '',
          })
          setPage(1)
        }}
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
              ? 'No matching resources found for these filters. Try modifying your search or reset filters.'
              : 'No resources have been indexed yet. Click "Sync Google Drive" to scan and import academic materials from your designated Google Drive folder.'
          }
          onReset={() => {
            setSearch('')
            setFilters({
              level: 'All',
              resource_type: 'All',
              course: 'All',
              category: 'All',
              folder: '',
            })
            setPage(1)
          }}
        />
      )}

      {/* ── RESOURCE CARDS ──────────────────────────────────────── */}
      {!loading && !error && resources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onView={handleView}
              onDownload={handleDownload}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
              isAdmin={true}
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

      {/* ── GOOGLE DRIVE SYNC MODAL ─────────────────────────────── */}
      <AdminSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isSyncing={isSyncing}
        syncResult={syncResult}
        syncError={syncError}
        onTriggerSync={handleTriggerSync}
      />

      {/* ── METADATA EDIT MODAL ─────────────────────────────────── */}
      <ResourceEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingResource(null)
        }}
        resource={editingResource}
        onSave={handleSaveMetadata}
      />
    </div>
  )
}
