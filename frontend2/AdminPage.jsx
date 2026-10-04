import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Archive,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Edit2,
  Eye,
  FileText,
  FileUp,
  Filter,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { useAuth } from './AuthContext'
import { MOCK_ADMIN_USERS, MOCK_ADMIN_ACTIVITY } from './mocks'
import ResourcePreviewModal from './academic/ResourcePreviewModal'
import { downloadResourceFile } from './academic/resourceFiles'

const CATEGORIES = [
  'All',
  'Past Questions',
  'Lecture Notes',
  'Lecture Slides',
  'Tutorials',
  'Textbooks',
  'Lab Manuals',
  'Course Outlines',
  'Other',
]

const LEVELS = ['All', 'Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate']

const formatBytes = (value) => {
  if (!value || isNaN(value)) return 'Size unknown'
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

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
  
  // Resource states
  const [resourceForm, setResourceForm] = useState({
    title: '',
    category: 'Past Questions',
    course: '',
    level: '100',
    year: '2026/2027',
    description: '',
  })
  const [resourceFile, setResourceFile] = useState(null)
  const [uploadingResource, setUploadingResource] = useState(false)
  const [adminResources, setAdminResources] = useState([])
  const [loadingAdminResources, setLoadingAdminResources] = useState(false)
  const [adminResourcesError, setAdminResourcesError] = useState('')
  const [resourceSearch, setResourceSearch] = useState('')
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('All')
  const [resourceLevelFilter, setResourceLevelFilter] = useState('All')
  const [resourcePage, setResourcePage] = useState(1)
  const [resourceData, setResourceData] = useState({ total: 0, total_pages: 0 })
  const [showUploadResource, setShowUploadResource] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [syncingDrive, setSyncingDrive] = useState(false)
  const [indexingStorage, setIndexingStorage] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [previewResource, setPreviewResource] = useState(null)

  // Resource Edit Modal state
  const [editingResource, setEditingResource] = useState(null)
  const [editResourceForm, setEditResourceForm] = useState({
    name: '',
    description: '',
    course_code: '',
    course_name: '',
    level: '',
    category: 'Past Questions',
    semester: '',
    academic_year: '',
    lecturer: '',
    is_active: true,
  })
  const [savingEditResource, setSavingEditResource] = useState(false)

  // Announcements state
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

  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState('')
  const [announcementSearch, setAnnouncementSearch] = useState('')
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState('All')
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const showFeedback = (msg) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 5000)
  }

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

  const fetchAdminResources = useCallback(async () => {
    setLoadingAdminResources(true)
    setAdminResourcesError('')
    try {
      const params = new URLSearchParams({
        page: String(resourcePage),
        page_size: '12',
        include_inactive: includeInactive ? 'true' : 'false',
      })
      if (resourceSearch.trim()) params.set('search', resourceSearch.trim())
      if (resourceCategoryFilter !== 'All') params.set('category', resourceCategoryFilter)
      if (resourceLevelFilter !== 'All') {
        const lvl = resourceLevelFilter.replace('Level ', '')
        params.set('level', lvl)
      }

      const res = await api.get(`${ENDPOINTS.academicResources}?${params}`)
      setAdminResources(res.items || [])
      setResourceData(res)
    } catch (err) {
      console.error('Admin resources could not be loaded.', err)
      setAdminResourcesError('Resources are unavailable right now. Please try again.')
    } finally {
      setLoadingAdminResources(false)
    }
  }, [resourcePage, resourceSearch, resourceCategoryFilter, resourceLevelFilter, includeInactive])

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    if (activeTab === 'resources' || activeTab === 'overview') {
      fetchAdminResources()
    }
  }, [activeTab, fetchAdminResources])

  const handleAdminTest = async () => {
    setTestingRole(true)
    setAdminTestResult(null)
    try {
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

  const createAndPublishEvent = async (event) => {
    event.preventDefault()
    try {
      const start = new Date(eventForm.datetime)
      const created = await api.post(ENDPOINTS.adminCreateEvent, {
        title: eventForm.title,
        event_type: eventForm.type,
        location: eventForm.venue,
        description: eventForm.description || null,
        start_datetime: start.toISOString(),
        end_datetime: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      })
      await api.post(ENDPOINTS.publishEvent(created.id), {})
      showFeedback(`Event "${created.title}" is published and visible to students.`)
      setEventForm({ title: '', type: 'Seminar', datetime: '', venue: '', description: '' })
    } catch (err) {
      showFeedback(err.message || 'Unable to publish event.')
    }
  }

  // Google Drive Sync
  const handleSyncDrive = async () => {
    setSyncingDrive(true)
    try {
      const result = await api.post(ENDPOINTS.adminSyncResources, {})
      showFeedback(
        `Google Drive sync complete: ${result.files_scanned || 0} scanned, ${result.new_resources || 0} new, ${result.updated_resources || 0} updated.`
      )
      fetchAdminResources()
    } catch (err) {
      showFeedback(err.message || 'Unable to synchronize Google Drive.')
    } finally {
      setSyncingDrive(false)
    }
  }

  const handleIndexMigratedStorage = async () => {
    setIndexingStorage(true)
    try {
      const result = await api.post(ENDPOINTS.adminIndexMigratedResources, {})
      showFeedback(
        `Migrated storage indexed: ${result.objects_indexed || 0} files scanned, ${result.new_resources || 0} new, ${result.updated_resources || 0} updated.`
      )
      fetchAdminResources()
    } catch (err) {
      showFeedback(err.message || 'Unable to index migrated Academic Storage files.')
    } finally {
      setIndexingStorage(false)
    }
  }

  // Upload Resource
  const uploadAcademicResource = async (event) => {
    event.preventDefault()
    if (!resourceFile) return showFeedback('Please select a file to upload.')
    setUploadingResource(true)
    try {
      let created = await api.upload(ENDPOINTS.adminUploadResource, resourceFile, {
        fields: {
          name: resourceForm.title || resourceFile.name,
          category: resourceForm.category,
          course_code: resourceForm.course,
          level: resourceForm.level,
          folder_path: `admin-uploads/${resourceForm.year.replace('/', '-')}`,
        },
      })
      let metadataUpdated = true
      if (resourceForm.description || resourceForm.year) {
        try {
          created = await api.patch(ENDPOINTS.adminUpdateResource(created.id), {
            description: resourceForm.description || null,
            academic_year: resourceForm.year || null,
          })
        } catch (metadataError) {
          metadataUpdated = false
          console.error('The resource uploaded, but its optional metadata could not be saved.', metadataError)
        }
      }
      showFeedback(
        metadataUpdated
          ? `“${created.name || created.title}” uploaded successfully and is available to students.`
          : `“${created.name || created.title}” uploaded, but its description or academic year must be added from Edit.`
      )
      setResourceFile(null)
      setResourceForm({
        title: '',
        category: 'Past Questions',
        course: '',
        level: '100',
        year: '2026/2027',
        description: '',
      })
      setShowUploadResource(false)
      fetchAdminResources()
    } catch (err) {
      console.error('Academic resource upload failed.', err)
      showFeedback('The resource could not be uploaded. Check the file and try again.')
    } finally {
      setUploadingResource(false)
    }
  }

  // Open Edit Resource Modal
  const openEditModal = (resource) => {
    setEditingResource(resource)
    setEditResourceForm({
      name: resource.name || resource.title || '',
      description: resource.description || '',
      course_code: resource.course_code || '',
      course_name: resource.course_name || '',
      level: resource.level || '',
      category: resource.category || 'Past Questions',
      semester: resource.semester || '',
      academic_year: resource.academic_year || '',
      lecturer: resource.lecturer || '',
      is_active: resource.is_active ?? true,
    })
  }

  // Save Resource Edits
  const handleSaveResourceEdit = async (e) => {
    e.preventDefault()
    if (!editingResource) return
    setSavingEditResource(true)
    try {
      const updated = await api.patch(ENDPOINTS.adminUpdateResource(editingResource.id), editResourceForm)
      showFeedback(`Resource "${updated.title || updated.name}" updated successfully.`)
      setEditingResource(null)
      fetchAdminResources()
    } catch (err) {
      showFeedback(err.message || 'Failed to update resource metadata.')
    } finally {
      setSavingEditResource(false)
    }
  }

  // Delete / Archive Resource
  const handleDeleteResource = async (id, title) => {
    if (!window.confirm(`Are you sure you want to archive/remove "${title}"?`)) {
      return
    }
    setActionLoadingId(`delete-${id}`)
    try {
      await api.del(ENDPOINTS.adminRemoveResource(id))
      showFeedback(`Resource "${title}" archived. It is now hidden from students.`)
      fetchAdminResources()
    } catch (err) {
      showFeedback(err.message || 'Failed to remove resource.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Restore Resource
  const handleRestoreResource = async (id, title) => {
    setActionLoadingId(`restore-${id}`)
    try {
      await api.patch(ENDPOINTS.adminUpdateResource(id), { is_active: true })
      showFeedback(`Resource "${title}" has been reactivated.`)
      fetchAdminResources()
    } catch (err) {
      showFeedback(err.message || 'Failed to restore resource.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Download File
  const handleDownloadResource = async (resource) => {
    if (actionLoadingId) return
    setActionLoadingId(`download-${resource.id}`)
    try {
      await downloadResourceFile(resource)
    } catch (err) {
      console.error('Admin resource download failed.', err)
      showFeedback('The file could not be downloaded. Please try again.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Announcements
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
      showFeedback('Announcement published! It is now visible to all portal users.')
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
      await api.del(ENDPOINTS.adminDeleteAnnouncement(id))
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
    if (value === 'urgent') return 'bg-[var(--destructive-soft)] text-destructive border border-[var(--destructive-border)]'
    if (value === 'academic') return 'bg-[#e7f5f7] text-primary border border-[#b8dfe1]'
    return 'bg-[var(--success-soft)] text-success border border-[var(--success-border)]'
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
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            ADMINISTRATION CONSOLE
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage portal content, events, academic resources, and user accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAdminTest}
            disabled={testingRole}
            className="px-3.5 py-2 rounded-xl bg-[#eee7fa] hover:bg-[#e4d8f8] text-primary text-xs font-bold border border-[#d6c3f3] transition-colors inline-flex items-center gap-2 shadow-xs"
          >
            <Zap size={13} aria-hidden="true" />
            {testingRole ? 'Verifying...' : 'Test Live Admin Endpoint'}
          </button>
          <button
            onClick={() => handleTabChange('resources')}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-xs"
          >
            Manage Resources
          </button>
        </div>
      </div>

      {/* Live Admin Endpoint Test Banner */}
      {adminTestResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between ${
            adminTestResult.success
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-success'
              : 'bg-[var(--destructive-soft)] border-[var(--destructive-border)] text-destructive'
          }`}
        >
          <span>
            <strong>FastAPI Response (/admin/test):</strong> {adminTestResult.message}
          </span>
          <button onClick={() => setAdminTestResult(null)} className="font-bold ml-2" aria-label="Dismiss admin test result">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Global Action Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-[var(--success-soft)] border border-[var(--success-border)] text-success text-xs font-semibold shadow-xs">
          {feedback}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'resources', label: `Resources (${resourceData.total || adminResources.length})` },
          { id: 'events', label: 'Events' },
          { id: 'announcements', label: `Announcements (${announcements.length})` },
          { id: 'users', label: 'Students & Users' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-border text-muted-foreground hover:border-[var(--primary-border)]'
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
            <div
              onClick={() => handleTabChange('resources')}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-primary transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#eaf4fb] text-[#2776a5] text-sm grid place-items-center mb-3 font-bold">
                <BookOpen size={17} aria-hidden="true" />
              </span>
              <strong className="block text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                {resourceData.total || adminResources.length}
              </strong>
              <span className="block text-xs text-muted-foreground mt-1">Academic Resources</span>
            </div>
            <div
              onClick={() => handleTabChange('events')}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-primary transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#f1ebfb] text-primary text-sm grid place-items-center mb-3 font-bold">
                <CalendarDays size={17} aria-hidden="true" />
              </span>
              <strong className="block text-2xl font-black text-foreground group-hover:text-primary transition-colors">08</strong>
              <span className="block text-xs text-muted-foreground mt-1">Published events</span>
            </div>
            <div
              onClick={() => handleTabChange('announcements')}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-primary transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#fff6df] text-[#a66b08] text-sm grid place-items-center mb-3 font-bold">
                <Megaphone size={17} aria-hidden="true" />
              </span>
              <strong className="block text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                {String(announcements.length).padStart(2, '0')}
              </strong>
              <span className="block text-xs text-muted-foreground mt-1">Announcements</span>
            </div>
            <div
              onClick={() => handleTabChange('users')}
              className="bg-surface border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-primary transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-[#eaf7f0] text-success text-sm grid place-items-center mb-3 font-bold">
                <Users size={17} aria-hidden="true" />
              </span>
              <strong className="block text-2xl font-black text-foreground group-hover:text-primary transition-colors">342</strong>
              <span className="block text-xs text-muted-foreground mt-1">Students</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quick Management Shortcuts */}
            <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">CONTENT</span>
              <h2 className="text-base font-bold text-foreground mt-0.5 mb-3">Quick management</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleTabChange('resources')}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                      Manage academic resources
                    </strong>
                    <small className="block text-[10px] text-muted-foreground">Add, update, delete, sync Drive, and inspect files</small>
                  </div>
                  <ChevronRight className="text-primary" size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleTabChange('events')}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                      Manage events
                    </strong>
                    <small className="block text-[10px] text-muted-foreground">Create, edit and publish seminars and workshops</small>
                  </div>
                  <ChevronRight className="text-primary" size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleTabChange('announcements')}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                      Manage announcements
                    </strong>
                    <small className="block text-[10px] text-muted-foreground">Create, pin, and view department notices</small>
                  </div>
                  <ChevronRight className="text-primary" size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-[#c4dde0] flex items-center justify-between transition-colors group"
                >
                  <div>
                    <strong className="block text-xs font-bold text-foreground group-hover:text-primary">
                      Manage students
                    </strong>
                    <small className="block text-[10px] text-muted-foreground">Accounts, roles and directory data</small>
                  </div>
                  <ChevronRight className="text-primary" size={15} aria-hidden="true" />
                </button>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">ACTIVITY</span>
              <h2 className="text-base font-bold text-foreground mt-0.5 mb-3">Recent activity</h2>
              <div className="divide-y divide-[#eef2f3]">
                {MOCK_ADMIN_ACTIVITY.map((act) => (
                  <div key={act.id} className="py-3 flex items-start gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: act.dotColor }}
                    />
                    <div className="flex-1">
                      <strong className="block text-xs font-bold text-foreground">{act.text}</strong>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{act.desc}</p>
                    </div>
                    <time className="text-[10px] text-[#a1adb0]">{act.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── Tab: ACADEMIC RESOURCES (Full Admin Management) ──────── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Header Card with Sync and Upload Actions */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                ACADEMIC REPOSITORY
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">Resource Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Index migrated Storage files, upload materials, edit metadata, and archive records.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncDrive}
                disabled={syncingDrive}
                className="px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-foreground text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                title="Sync files from connected Google Drive root folder"
              >
                <RefreshCw size={13} className={syncingDrive ? 'animate-spin text-primary' : ''} />
                <span>{syncingDrive ? 'Syncing Drive…' : 'Sync Google Drive'}</span>
              </button>

              <button
                type="button"
                onClick={handleIndexMigratedStorage}
                disabled={indexingStorage || syncingDrive}
                className="px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-foreground text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                title="Index files already migrated to Academic Storage"
              >
                <RefreshCw size={13} className={indexingStorage ? 'animate-spin text-primary' : ''} />
                <span>{indexingStorage ? 'Indexing Storage…' : 'Index Migrated Storage'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploadResource(!showUploadResource)}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                {showUploadResource ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Hide upload form</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>+ Upload Resource</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Resource Form Drawer */}
          {showUploadResource && (
            <section className="bg-surface border-2 border-[var(--primary-border)] rounded-2xl p-6 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#eaf4fb] text-primary grid place-items-center font-bold text-xs">
                    <Upload size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Upload Academic Resource</h3>
                    <p className="text-[11px] text-muted-foreground">Files are stored securely and made immediately available to students.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadResource(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold p-1"
                  aria-label="Close upload form"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={uploadAcademicResource} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Resource Title / Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      aria-label="Resource title"
                      required
                      placeholder="e.g. CHEM 151 Lecture 1 — Introduction to Chemical Principles"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Category</label>
                    <select
                      aria-label="Resource category"
                      value={resourceForm.category}
                      onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                    >
                      {CATEGORIES.filter((category) => category !== 'All').map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Level</label>
                    <select
                      aria-label="Resource level"
                      value={resourceForm.level}
                      onChange={(e) => setResourceForm({ ...resourceForm, level: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                    >
                      <option value="100">Level 100</option>
                      <option value="200">Level 200</option>
                      <option value="300">Level 300</option>
                      <option value="400">Level 400</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Course Code</label>
                    <input
                      type="text"
                      aria-label="Course code"
                      placeholder="e.g. CHEM 151"
                      value={resourceForm.course}
                      onChange={(e) => setResourceForm({ ...resourceForm, course: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Academic Year</label>
                    <input
                      type="text"
                      aria-label="Academic year"
                      placeholder="2026/2027"
                      value={resourceForm.year}
                      onChange={(e) => setResourceForm({ ...resourceForm, year: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      aria-label="Description"
                      placeholder="Summary or lecture notes overview..."
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    File Attachment <span className="text-destructive">*</span>
                  </label>
                  <label className="border-2 border-dashed border-[#dce6e8] rounded-xl p-6 bg-[#f9fbfb] text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <FileUp className="text-primary mb-1.5" size={28} aria-hidden="true" />
                    <strong className="text-xs text-foreground">{resourceFile ? resourceFile.name : 'Click or drag to choose an academic file (PDF, DOCX, PPTX, etc.)'}</strong>
                    <small className="text-[10px] text-muted-foreground mt-0.5">Maximum size: 50 MB</small>
                    <input
                      type="file"
                      required
                      className="sr-only"
                      onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    type="submit"
                    disabled={uploadingResource || !resourceFile}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {uploadingResource ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Uploading…</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} />
                        <span>Upload & Publish</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadResource(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-bold hover:bg-gray-50 shadow-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Search, Filter, and Controls Bar */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setResourceCategoryFilter(cat)
                    setResourcePage(1)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    resourceCategoryFilter === cat
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-secondary border border-border text-muted-foreground hover:border-[var(--primary-border)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Filter size={13} className="text-primary" />
                  <span className="font-semibold">Level:</span>
                </div>
                <select
                  value={resourceLevelFilter}
                  onChange={(e) => {
                    setResourceLevelFilter(e.target.value)
                    setResourcePage(1)
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>

                <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => {
                      setIncludeInactive(e.target.checked)
                      setResourcePage(1)
                    }}
                    className="w-3.5 h-3.5 rounded text-primary focus:ring-primary"
                  />
                  <span>Show Archived</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-56 sm:w-72">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={resourceSearch}
                    onChange={(e) => {
                      setResourceSearch(e.target.value)
                      setResourcePage(1)
                    }}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchAdminResources}
                  disabled={loadingAdminResources}
                  className="p-2 rounded-xl border border-border bg-surface hover:bg-gray-50 text-muted-foreground transition-colors disabled:opacity-50 shadow-xs"
                  title="Refresh resources list"
                >
                  <RefreshCw size={13} className={loadingAdminResources ? 'animate-spin text-primary' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Resources Table */}
          <section className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
            {loadingAdminResources && adminResources.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Loading resource repository…</p>
              </div>
            ) : adminResourcesError ? (
              <div className="p-5 text-center text-xs text-destructive">
                <p>{adminResourcesError}</p>
                <button onClick={fetchAdminResources} className="font-bold underline mt-2 inline-block">
                  Retry
                </button>
              </div>
            ) : adminResources.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <FileText size={32} className="text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-sm font-bold text-foreground">No resources found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {resourceSearch || resourceCategoryFilter !== 'All' || resourceLevelFilter !== 'All'
                    ? 'No materials matched your search or filters. Try adjusting your query.'
                    : 'Click "+ Upload Resource" or "Sync Google Drive" to add materials.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-[#fbfcfc] text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-3">Course / Level</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Size & Type</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {adminResources.map((item) => {
                      const isDeleting = actionLoadingId === `delete-${item.id}`
                      const isRestoring = actionLoadingId === `restore-${item.id}`
                      const isDownloading = actionLoadingId === `download-${item.id}`

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-[var(--surface-secondary)] transition-colors ${
                            !item.is_active ? 'opacity-60 bg-gray-50/50' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-primary grid place-items-center shrink-0 mt-0.5">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <strong className="block text-xs font-bold text-foreground truncate max-w-xs sm:max-w-sm">
                                  {item.title || item.name}
                                </strong>
                                {item.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                <small className="text-[10px] text-muted-foreground">
                                  Path: {item.folder_path || 'root'}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-bold text-primary block">
                              {item.course_code || '—'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.level ? `Level ${item.level}` : 'All Levels'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e7f5f7] text-primary border border-[#b8dfe1]">
                              {item.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="block font-medium text-foreground">
                              {formatBytes(item.file_size)}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {item.resource_type || (item.mime_type?.split('/')?.[1] ?? 'file')}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            {item.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--success-soft)] text-success border border-[var(--success-border)]">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                Archived
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View */}
                              <button
                                type="button"
                                onClick={() => setPreviewResource(item)}
                                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-foreground transition-colors"
                                title="View preview"
                                aria-label={`Preview ${item.title || item.name}`}
                              >
                                <Eye size={13} />
                              </button>

                              {/* Download */}
                              <button
                                type="button"
                                onClick={() => handleDownloadResource(item)}
                                disabled={isDownloading}
                                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-foreground transition-colors"
                                title="Download file"
                                aria-label={`Download ${item.title || item.name}`}
                              >
                                {isDownloading ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-primary transition-colors"
                                title="Edit resource metadata"
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* Delete / Archive or Restore */}
                              {item.is_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResource(item.id, item.title || item.name)}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] text-destructive hover:bg-red-100 transition-colors"
                                  title="Archive / Remove resource"
                                >
                                  {isDeleting ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreResource(item.id, item.title || item.name)}
                                  disabled={isRestoring}
                                  className="p-1.5 rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] text-success hover:bg-green-100 transition-colors"
                                  title="Reactivate resource"
                                >
                                  {isRestoring ? <RefreshCw size={13} className="animate-spin" /> : <Archive size={13} />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {resourceData.total_pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-[#fbfcfc]">
                <span className="text-xs text-muted-foreground font-medium">
                  Page {resourceData.page || resourcePage} of {resourceData.total_pages} ({resourceData.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={resourcePage <= 1 || loadingAdminResources}
                    onClick={() => setResourcePage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl bg-surface hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={resourcePage >= resourceData.total_pages || loadingAdminResources}
                    onClick={() => setResourcePage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl bg-surface hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Edit Resource Modal */}
          {editingResource && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Edit2 size={16} className="text-primary" />
                    <h3 className="text-base font-bold text-foreground">Edit Resource Metadata</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingResource(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveResourceEdit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Title / Name</label>
                    <input
                      type="text"
                      required
                      value={editResourceForm.name}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Course Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CHEM 251"
                        value={editResourceForm.course_code}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, course_code: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Level</label>
                      <select
                        value={editResourceForm.level}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, level: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                      >
                        <option value="">None / Unassigned</option>
                        <option value="100">Level 100</option>
                        <option value="200">Level 200</option>
                        <option value="300">Level 300</option>
                        <option value="400">Level 400</option>
                        <option value="Postgraduate">Postgraduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Category</label>
                      <select
                        value={editResourceForm.category}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                      >
                        {CATEGORIES.filter((category) => category !== 'All').map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Academic Year</label>
                      <input
                        type="text"
                        placeholder="2026/2027"
                        value={editResourceForm.academic_year}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, academic_year: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Semester</label>
                      <input
                        type="text"
                        placeholder="Semester 1 or 2"
                        value={editResourceForm.semester}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, semester: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Lecturer</label>
                      <input
                        type="text"
                        placeholder="Dr. Lecturer Name"
                        value={editResourceForm.lecturer}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, lecturer: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                    <textarea
                      rows="3"
                      placeholder="Resource description..."
                      value={editResourceForm.description}
                      onChange={(e) => setEditResourceForm({ ...editResourceForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editResourceForm.is_active}
                        onChange={(e) => setEditResourceForm({ ...editResourceForm, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span>Active & visible to students</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingResource(null)}
                        className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingEditResource}
                        className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        {savingEditResource ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: CREATE EVENT ───────────────────────────────────── */}
      {activeTab === 'events' && (
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm max-w-3xl">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            EVENT MANAGEMENT
          </span>
          <h2 className="text-xl font-bold text-foreground mt-0.5 mb-4">Create an event</h2>
          <form onSubmit={createAndPublishEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Event title</label>
                <input
                  type="text"
                  aria-label="Event title"
                  required
                  placeholder="e.g. Chemistry Research Forum"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Event type</label>
                <select
                  aria-label="Event type"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface"
                >
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Social">Social</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Date & time</label>
                <input
                  type="datetime-local"
                  aria-label="Event date and time"
                  required
                  value={eventForm.datetime}
                  onChange={(e) => setEventForm({ ...eventForm, datetime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Venue</label>
                <input
                  type="text"
                  aria-label="Event venue"
                  required
                  placeholder="Main Auditorium"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1">Description</label>
                <textarea
                  aria-label="Event description"
                  rows="4"
                  placeholder="Event description..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#f4f7f8]">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
              >
                Publish event
              </button>
              <button
                type="button"
                onClick={() => showFeedback('Draft saved locally.')}
                className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-muted-foreground text-xs font-bold hover:bg-gray-50"
              >
                Save draft
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Tab: ANNOUNCEMENTS MANAGEMENT ──────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* Header Card with Actions */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                COMMUNICATIONS
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">Department Announcements</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Broadcast notices to students, pin urgent advisories, and manage live feeds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAnnouncements}
                disabled={loadingAnnouncements}
                className="p-2.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-muted-foreground transition-colors shadow-xs disabled:opacity-50"
                title="Refresh announcements"
                aria-label="Refresh announcements"
              >
                <RefreshCw size={14} className={loadingAnnouncements ? 'animate-spin text-primary' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setShowCreateAnnouncement(!showCreateAnnouncement)}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
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
            <section className="bg-surface border-2 border-[var(--primary-border)] rounded-2xl p-6 shadow-card animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f5] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#e7f5f7] text-primary grid place-items-center font-bold text-xs">
                    <Sparkles size={14} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Create announcement</h3>
                    <p className="text-[11px] text-muted-foreground">This will be published live to all signed-in portal users.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold p-1"
                  aria-label="Close announcement form"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={publishAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Headline / Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    aria-label="Announcement headline"
                    required
                    placeholder="e.g. Mid-Semester Examination Timetable Release"
                    value={announcementForm.headline}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Message Body <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    aria-label="Announcement message"
                    rows="4"
                    required
                    placeholder="Provide full details, instructions, venue info or deadlines..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Category</label>
                    <select
                      aria-label="Announcement category"
                      value={announcementForm.category}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Department">Department</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Audience</label>
                    <select
                      aria-label="Announcement audience"
                      value={announcementForm.audience}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary bg-surface shadow-xs"
                    >
                      <option value="All students">All students</option>
                      <option value="Level 100">Level 100</option>
                      <option value="Level 200">Level 200</option>
                      <option value="Level 300">Level 300</option>
                      <option value="Level 400">Level 400</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Issued by</label>
                    <input
                      type="text"
                      aria-label="Announcement issuer"
                      required
                      placeholder="e.g. Chemistry Board of Studies"
                      value={announcementForm.issuer}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, issuer: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-primary shadow-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer bg-[#f7fafb] px-3.5 py-2 rounded-xl border border-border">
                    <input
                      type="checkbox"
                      checked={announcementForm.pin}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, pin: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <Pin size={13} className={announcementForm.pin ? 'text-primary' : 'text-[#8a999d]'} />
                    <span>Pin announcement to top of feed & dashboard</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#f4f7f8]">
                  <button
                    type="submit"
                    disabled={publishingAnnouncement}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
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
                    className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-muted-foreground text-xs font-bold hover:bg-gray-50"
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
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface border border-border text-muted-foreground hover:border-[var(--primary-border)]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                aria-label="Search announcements"
                placeholder="Search announcements..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
              />
              {announcementSearch && (
                <button
                  type="button"
                  onClick={() => setAnnouncementSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Clear announcement search"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Announcements Feed / View List */}
          {loadingAnnouncements && announcements.length === 0 ? (
            <div className="py-12 bg-surface rounded-2xl border border-border text-center">
              <RefreshCw size={20} className="animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading announcements feed…</p>
            </div>
          ) : announcementsError ? (
            <div className="p-4 bg-[var(--destructive-soft)] border border-[var(--destructive-border)] rounded-2xl text-xs text-destructive flex items-center justify-between">
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
            <div className="py-12 bg-surface rounded-2xl border border-border text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f0f7f8] text-primary grid place-items-center mx-auto text-xl font-bold">
                <Megaphone size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">No announcements found</h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Clear search & filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
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
                  className={`bg-surface border rounded-2xl p-5 shadow-xs transition-all ${
                    item.is_pinned
                      ? 'border-[#f2d89f] bg-gradient-to-r from-[#fffdfa] to-white ring-1 ring-[#f2d89f]/40'
                      : 'border-border hover:border-[var(--primary-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${categoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f1f5f6] text-[#55696e] border border-[#e2e9eb] inline-flex items-center gap-1">
                        <Users size={10} aria-hidden="true" />
                        {item.audience || 'All students'}
                      </span>

                      {item.is_pinned && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-[#fff4db] text-[#975c03] border border-[#edd7a4] flex items-center gap-1">
                          <Pin size={10} />
                          PINNED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <small className="text-[11px] text-muted-foreground font-medium">
                        {timeAgo(item.published_at)}
                      </small>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="text-[#b64a4a] hover:text-[#8e2929] hover:bg-[var(--destructive-soft)] p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                        title="Delete announcement"
                      >
                        <Trash2 size={13} className={deletingId === item.id ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#52656a] leading-relaxed mb-3 whitespace-pre-line">
                    {item.body}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-[#f4f7f8] pt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#667a7f]">Issued by:</span>
                      <span className="text-foreground font-bold">{item.issuer}</span>
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

      {/* ── Tab: STUDENTS & USERS ───────────────────────────────── */}
      {activeTab === 'users' && (
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                USER MANAGEMENT
              </span>
              <h2 className="text-xl font-bold text-foreground">Student accounts</h2>
            </div>
            <input
              type="text"
              placeholder="Search students"
              className="px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
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
                      <strong className="block text-xs font-bold text-foreground">{usr.name}</strong>
                      <small className="text-[10px] text-[#98a5a8]">{usr.status}</small>
                    </td>
                    <td className="py-3 text-muted-foreground">{usr.studentId}</td>
                    <td className="py-3 text-muted-foreground">{usr.level}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          usr.badgeColor === 'blue'
                            ? 'bg-[#e7f5f7] text-primary'
                            : usr.badgeColor === 'green'
                            ? 'bg-[var(--success-soft)] text-success'
                            : 'bg-[var(--primary-soft)] text-primary'
                        }`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => showFeedback(`Selected user: ${usr.name}`)}
                        className="text-xs font-bold text-primary hover:underline"
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

      <ResourcePreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
        onDownload={handleDownloadResource}
        downloading={actionLoadingId === `download-${previewResource?.id}`}
      />
    </div>
  )
}
