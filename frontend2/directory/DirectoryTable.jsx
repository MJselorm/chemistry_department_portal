import React, { useState } from 'react'
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Power,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function DirectoryTable({
  categoryConfig,
  items = [],
  total = 0,
  skip = 0,
  limit = 20,
  loading = false,
  error = null,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  departmentFilter = 'all',
  onDepartmentFilterChange,
  departments = [],
  courses = [],
  lecturers = [],
  onPageChange,
  onRefresh,
  onAddNew,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  onOpenConsultations,
  onOpenMembers,
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null)

  const currentPage = Math.floor(skip / limit) + 1
  const totalPages = Math.ceil(total / limit) || 1

  const getDepartmentName = (id) => {
    const dept = departments.find((d) => d.id === Number(id))
    return dept ? `${dept.name} (${dept.code})` : id ? `Dept #${id}` : 'General'
  }

  const getLecturerName = (id) => {
    const l = lecturers.find((item) => item.id === Number(id))
    return l ? `${l.title || ''} ${l.name}`.trim() : '—'
  }

  const renderItemPrimary = (item) => {
    const image = categoryConfig.imageField ? item[categoryConfig.imageField] : null
    const title = item.name || item.course_name || item.code
    const subtitle =
      item.position ||
      item.staff_id ||
      item.student_id ||
      item.course_code ||
      item.acronym ||
      item.role ||
      item.category

    return (
      <div className="flex items-center gap-3">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-9 h-9 rounded-xl object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-primary font-black text-xs grid place-items-center flex-shrink-0">
            {(title || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <strong className="block text-xs font-bold text-foreground truncate hover:text-primary">
            {item.title ? `${item.title} ` : ''}
            {title}
          </strong>
          {subtitle && (
            <span className="block text-[11px] text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </div>
    )
  }

  const renderItemSecondary = (item) => {
    switch (categoryConfig.key) {
      case 'lecturers':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              {getDepartmentName(item.department_id)}
            </span>
            <small className="text-[11px] text-[#8e9ca0] truncate block">
              {item.specialization || item.qualification || 'No specialization stated'}
            </small>
          </div>
        )
      case 'executives':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              {item.academic_year || '—'} · Level {item.level || '—'}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              {item.program || getDepartmentName(item.department_id)}
            </small>
          </div>
        )
      case 'classRepresentatives':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              {item.class_name} (Level {item.level})
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              {item.program} · {item.academic_year}
            </small>
          </div>
        )
      case 'courses':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              Level {item.level || '—'} · {item.semester || 'Both Semesters'}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              Lecturer: {getLecturerName(item.lecturer_id)}
            </small>
          </div>
        )
      case 'clubs':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              Category: {item.category || 'General'}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              President: {item.president || 'Not appointed'}
            </small>
          </div>
        )
      case 'committees':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              Chair: {item.chairperson || '—'}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              Secretary: {item.secretary || '—'} · {item.academic_year || ''}
            </small>
          </div>
        )
      case 'departments':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              {item.location || 'Campus Location'}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              Code: <strong className="text-primary">{item.code}</strong>
            </small>
          </div>
        )
      case 'contacts':
        return (
          <div>
            <span className="block text-xs font-medium text-foreground">
              {item.category || 'General'} · {item.department || ''}
            </span>
            <small className="text-[11px] text-[#8e9ca0] block">
              {item.office || item.location || '—'}
            </small>
          </div>
        )
      default:
        return null
    }
  }

  const renderItemContact = (item) => {
    return (
      <div className="text-xs text-muted-foreground space-y-0.5">
        {item.email && <div className="truncate max-w-[180px]">{item.email}</div>}
        {item.phone && <div className="text-[11px] text-[#8fa1a5]">{item.phone}</div>}
        {!item.email && !item.phone && <span className="text-[#a1adb0] text-[11px]">No contact details</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-3 text-[#9ba8ac]" />
          <input
            type="text"
            aria-label={`Search ${categoryConfig.plural.toLowerCase()}`}
            placeholder={`Search ${categoryConfig.plural.toLowerCase()} by name, code, role…`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface-secondary text-xs focus:outline-none focus:border-primary focus:bg-surface transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-2.5 py-1 text-xs">
            <Filter size={13} className="text-[#728388]" />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Department Filter (if applicable) */}
          {departments.length > 0 && categoryConfig.key !== 'departments' && (
            <div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-xl px-2.5 py-1 text-xs">
              <select
                aria-label="Filter by department"
                value={departmentFilter}
                onChange={(e) => onDepartmentFilterChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary Add Button */}
          <button
            onClick={onAddNew}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs ml-auto"
          >
            <Plus size={14} /> Add {categoryConfig.singular}
          </button>
        </div>
      </div>

      {/* Table & Cards Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Error State */}
        {error ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--destructive-soft)] text-destructive grid place-items-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <strong className="block text-sm font-bold text-foreground">
                Unable to load {categoryConfig.plural.toLowerCase()}
              </strong>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          /* Loading Skeleton State */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                Loading {categoryConfig.plural.toLowerCase()}…
              </span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#f2f7f8] text-primary grid place-items-center mx-auto">
              <categoryConfig.icon size={26} />
            </div>
            <div>
              <strong className="block text-sm font-bold text-foreground">
                No {categoryConfig.plural.toLowerCase()} found
              </strong>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                  ? 'No records match your search and filter criteria.'
                  : `Get started by adding the first ${categoryConfig.singular.toLowerCase()} to the department directory.`}
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} /> Add {categoryConfig.singular}
            </button>
          </div>
        ) : (
          /* Main Table View */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f3] bg-[#fafcfc] text-[10px] uppercase tracking-wider text-[#8da0a5]">
                    <th className="py-3 px-4 font-bold">Details</th>
                    <th className="py-3 px-4 font-bold">Department / Meta</th>
                    <th className="py-3 px-4 font-bold">Contact</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f2]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-secondary transition-colors group"
                    >
                      {/* Primary Info */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onView(item)}
                          className="text-left hover:opacity-90 transition-opacity"
                        >
                          {renderItemPrimary(item)}
                        </button>
                      </td>

                      {/* Secondary Info */}
                      <td className="py-3.5 px-4">{renderItemSecondary(item)}</td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">{renderItemContact(item)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleActive(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase transition-all ${
                            item.is_active
                              ? 'bg-[var(--success-soft)] text-success hover:bg-[#d6f0e2]'
                              : 'bg-[var(--destructive-soft)] text-destructive hover:bg-[#fad8d8]'
                          }`}
                          title="Click to toggle active status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_active ? 'bg-[#27805a]' : 'bg-destructive'
                            }`}
                          />
                          {item.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Special action: Consultations */}
                          {categoryConfig.hasConsultations && (
                            <button
                              onClick={() => onOpenConsultations?.(item)}
                              className="p-1.5 rounded-lg text-primary bg-[var(--primary-soft)] hover:bg-[#d6f0f2] transition-colors"
                              title="Office Consultation Hours"
                              aria-label={`Manage office hours for ${item.name || 'lecturer'}`}
                            >
                              <Clock size={14} />
                            </button>
                          )}

                          {/* Special action: Members */}
                          {categoryConfig.hasMembers && (
                            <button
                              onClick={() => onOpenMembers?.(item)}
                              className="p-1.5 rounded-lg text-primary bg-[var(--primary-soft)] hover:bg-[#e4d8f8] transition-colors"
                              title="Committee Members"
                              aria-label={`Manage members for ${item.name || 'committee'}`}
                            >
                              <Users size={14} />
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-gray-100 transition-colors"
                            title="View details"
                            aria-label={`View ${item.name || item.course_name || 'record'}`}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit record */}
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-gray-100 transition-colors"
                            title="Edit"
                            aria-label={`Edit ${item.name || item.course_name || 'record'}`}
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete record */}
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-[var(--destructive-soft)] transition-colors"
                            title="Delete"
                            aria-label={`Delete ${item.name || item.course_name || 'record'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 border-t border-[#eef2f3] bg-[#fafcfc] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                Showing <strong className="text-foreground">{items.length > 0 ? skip + 1 : 0}</strong> to{' '}
                <strong className="text-foreground">{Math.min(skip + limit, total)}</strong> of{' '}
                <strong className="text-foreground">{total}</strong> records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-foreground font-bold text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="px-3 py-1 font-bold text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-gray-50 text-foreground font-bold text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
