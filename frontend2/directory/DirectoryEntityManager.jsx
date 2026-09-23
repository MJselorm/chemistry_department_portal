import React, { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Home, Plus, RefreshCw } from 'lucide-react'
import { DIRECTORY_CATEGORIES } from './directoryConfig'
import { directoryApi } from './directoryApi'
import { useToast } from './Toast'
import DirectoryTable from './DirectoryTable'
import DirectoryFormModal from './DirectoryFormModal'
import ViewDetailsModal from './ViewDetailsModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import ConsultationModal from './ConsultationModal'
import CommitteeMembersModal from './CommitteeMembersModal'
import DirectorySubNav from './DirectorySubNav'

export default function DirectoryEntityManager({ categoryKey }) {
  const categoryConfig = DIRECTORY_CATEGORIES[categoryKey]
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [skip, setSkip] = useState(0)
  const limit = 20

  // Reference options for dropdowns
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [viewingItem, setViewingItem] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedLecturer, setSelectedLecturer] = useState(null)
  const [isConsultationsOpen, setIsConsultationsOpen] = useState(false)

  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  // Load ancillary dropdown options
  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const deptRes = await directoryApi.listEntities('/api/directory/departments', { limit: 100 })
        setDepartments(deptRes?.items || deptRes || [])
      } catch (err) {
        console.error('Failed to load departments:', err)
      }

      if (categoryConfig.fields.some((f) => f.type === 'course_select')) {
        try {
          const courseRes = await directoryApi.listEntities('/api/directory/courses', { limit: 100 })
          setCourses(courseRes?.items || courseRes || [])
        } catch (err) {
          console.error('Failed to load courses:', err)
        }
      }

      if (categoryConfig.fields.some((f) => f.type === 'lecturer_select')) {
        try {
          const lecRes = await directoryApi.listEntities('/api/directory/lecturers', { limit: 100 })
          setLecturers(lecRes?.items || lecRes || [])
        } catch (err) {
          console.error('Failed to load lecturers:', err)
        }
      }
    }
    loadSelectOptions()
  }, [categoryConfig])

  // Check URL query param ?action=new to open add form automatically if navigated from quick action
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingItem(null)
      setIsFormOpen(true)
      searchParams.delete('action')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Fetch items
  const loadData = useCallback(async () => {
    if (!categoryConfig) return
    setLoading(true)
    setError(null)

    try {
      const params = {
        skip,
        limit,
      }
      if (statusFilter === 'active') params.is_active = true
      if (statusFilter === 'inactive') params.is_active = false
      if (departmentFilter !== 'all') params.department_id = departmentFilter

      const res = await directoryApi.listEntities(categoryConfig.endpoint, params)
      const list = res?.items || res || []
      const totalCount = res?.total !== undefined ? res.total : list.length

      // Client-side search filtering if search query entered
      let filtered = list
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        filtered = list.filter((item) => {
          const name = (item.name || item.course_name || item.code || '').toLowerCase()
          const secondary = (item.position || item.staff_id || item.student_id || item.course_code || item.role || '').toLowerCase()
          return name.includes(q) || secondary.includes(q)
        })
      }

      setItems(filtered)
      setTotal(searchQuery.trim() ? filtered.length : totalCount)
    } catch (err) {
      setError(err?.message || `Failed to load ${categoryConfig.plural.toLowerCase()}.`)
    } finally {
      setLoading(false)
    }
  }, [categoryConfig, skip, limit, statusFilter, departmentFilter, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleAddNew = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleView = (item) => {
    setViewingItem(item)
    setIsViewOpen(true)
  }

  const handleDeletePrompt = (item) => {
    setDeletingItem(item)
    setIsDeleteOpen(true)
  }

  const handleSave = async (payload) => {
    setIsSaving(true)
    try {
      if (editingItem?.id) {
        await directoryApi.updateEntity(categoryConfig.endpoint, editingItem.id, payload)
        showToast(`${categoryConfig.singular} updated successfully.`)
      } else {
        await directoryApi.createEntity(categoryConfig.endpoint, payload)
        showToast(`${categoryConfig.singular} created successfully.`)
      }
      setIsFormOpen(false)
      setEditingItem(null)
      loadData()
    } catch (err) {
      showToast(err?.message || `Failed to save ${categoryConfig.singular.toLowerCase()}.`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem?.id) return
    setIsDeleting(true)
    try {
      await directoryApi.deleteEntity(categoryConfig.endpoint, deletingItem.id)
      showToast(`${categoryConfig.singular} removed successfully.`)
      setIsDeleteOpen(false)
      setDeletingItem(null)
      loadData()
    } catch (err) {
      showToast(err?.message || `Failed to delete ${categoryConfig.singular.toLowerCase()}.`, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (item) => {
    try {
      await directoryApi.toggleActive(categoryConfig.endpoint, item.id, item.is_active)
      showToast(
        `${item.name || item.course_name} marked as ${!item.is_active ? 'Active' : 'Inactive'}.`
      )
      // Update locally immediately
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
      )
      if (viewingItem?.id === item.id) {
        setViewingItem((prev) => ({ ...prev, is_active: !prev.is_active }))
      }
    } catch (err) {
      showToast(err?.message || 'Failed to update record status.', 'error')
    }
  }

  const handleOpenConsultations = (lecturer) => {
    setSelectedLecturer(lecturer)
    setIsConsultationsOpen(true)
  }

  const handleOpenMembers = (committee) => {
    setSelectedCommittee(committee)
    setIsMembersOpen(true)
  }

  if (!categoryConfig) {
    return <div>Category not found.</div>
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-[#8da0a5] mb-1.5">
            <Link to="/admin/directory" className="hover:text-[#087f8c] flex items-center gap-1">
              <Home size={13} />
              <span>Directory</span>
            </Link>
            <ChevronRight size={12} className="text-[#a8b8bc]" />
            <span className="font-bold text-[#102a2f]">{categoryConfig.plural}</span>
          </nav>

          <h1 className="text-2xl font-bold text-[#102a2f] tracking-tight">
            {categoryConfig.plural} Management
          </h1>
          <p className="text-xs text-[#64777d] mt-1">
            Browse, search, edit, and publish department {categoryConfig.plural.toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/directory"
            className="px-3.5 py-2 rounded-xl border border-[#d9e3e5] bg-white hover:bg-gray-50 text-xs font-bold text-[#496066] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft size={13} /> Overview
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#d9e3e5] bg-white hover:bg-gray-50 text-[#496066] transition-colors shadow-xs disabled:opacity-50"
            title="Refresh records"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#087f8c]' : ''} />
          </button>
        </div>
      </div>

      {/* Directory Category Navigation Tabs */}
      <DirectorySubNav />

      {/* Main Table Component */}
      <DirectoryTable
        categoryConfig={categoryConfig}
        items={items}
        total={total}
        skip={skip}
        limit={limit}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val)
          setSkip(0)
        }}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={(val) => {
          setDepartmentFilter(val)
          setSkip(0)
        }}
        departments={departments}
        courses={courses}
        lecturers={lecturers}
        onPageChange={(page) => setSkip((page - 1) * limit)}
        onRefresh={loadData}
        onAddNew={handleAddNew}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        onToggleActive={handleToggleActive}
        onOpenConsultations={handleOpenConsultations}
        onOpenMembers={handleOpenMembers}
      />

      {/* Add / Edit Form Modal */}
      <DirectoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categoryConfig={categoryConfig}
        initialData={editingItem}
        departments={departments}
        courses={courses}
        lecturers={lecturers}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        categoryConfig={categoryConfig}
        record={viewingItem}
        departments={departments}
        courses={courses}
        lecturers={lecturers}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        onToggleActive={handleToggleActive}
        onOpenConsultations={handleOpenConsultations}
        onOpenMembers={handleOpenMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${categoryConfig.singular}?`}
        itemName={deletingItem?.name || deletingItem?.course_name || deletingItem?.code}
        message={`Are you sure you want to delete this ${categoryConfig.singular.toLowerCase()}? This will mark the record as inactive.`}
        isDeleting={isDeleting}
      />

      {/* Lecturer Consultation Hours Modal */}
      {categoryConfig.hasConsultations && (
        <ConsultationModal
          isOpen={isConsultationsOpen}
          onClose={() => setIsConsultationsOpen(false)}
          lecturer={selectedLecturer}
        />
      )}

      {/* Committee Members Modal */}
      {categoryConfig.hasMembers && (
        <CommitteeMembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          committee={selectedCommittee}
        />
      )}
    </div>
  )
}
