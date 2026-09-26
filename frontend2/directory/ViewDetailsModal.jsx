import React from 'react'
import { X, Edit3, Trash2, Power, Clock, Users, ExternalLink } from 'lucide-react'

export default function ViewDetailsModal({
  isOpen,
  onClose,
  categoryConfig,
  record,
  departments = [],
  courses = [],
  lecturers = [],
  onEdit,
  onDelete,
  onToggleActive,
  onOpenConsultations,
  onOpenMembers,
}) {
  if (!isOpen || !record) return null

  const getDepartmentName = (id) => {
    const dept = departments.find((d) => d.id === Number(id))
    return dept ? dept.name : `Dept #${id}`
  }

  const getCourseName = (id) => {
    const c = courses.find((item) => item.id === Number(id))
    return c ? `${c.course_code} - ${c.course_name}` : `Course #${id}`
  }

  const getLecturerName = (id) => {
    const l = lecturers.find((item) => item.id === Number(id))
    return l ? `${l.title || ''} ${l.name}`.trim() : `Lecturer #${id}`
  }

  const renderFieldValue = (field) => {
    const val = record[field.name]
    if (val === undefined || val === null || val === '') {
      return <span className="text-[#a1adb0] italic">Not provided</span>
    }

    if (field.type === 'boolean') {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
            val ? 'bg-[var(--success-soft)] text-success' : 'bg-[var(--destructive-soft)] text-destructive'
          }`}
        >
          {val ? 'Active' : 'Inactive'}
        </span>
      )
    }

    if (field.type === 'department_select') {
      return getDepartmentName(val)
    }

    if (field.type === 'course_select') {
      return getCourseName(val)
    }

    if (field.type === 'lecturer_select') {
      return getLecturerName(val)
    }

    if (field.name === 'website' || field.name === 'social_links') {
      return (
        <a
          href={val.startsWith('http') ? val : `https://${val}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary font-bold hover:underline inline-flex items-center gap-1"
        >
          {val} <ExternalLink size={12} />
        </a>
      )
    }

    if (field.type === 'email') {
      return (
        <a href={`mailto:${val}`} className="text-primary hover:underline">
          {val}
        </a>
      )
    }

    if (field.type === 'textarea') {
      return <p className="whitespace-pre-wrap leading-relaxed">{val}</p>
    }

    return String(val)
  }

  const imageSrc = categoryConfig.imageField ? record[categoryConfig.imageField] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border p-6 shadow-card z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={record.name || record.course_name}
                className="w-14 h-14 rounded-2xl object-cover border border-border shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] text-primary grid place-items-center font-black text-xl shadow-xs">
                {(record.name || record.course_name || record.code || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                {categoryConfig.singular} Profile
              </span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {record.title ? `${record.title} ` : ''}
                {record.name || record.course_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    record.is_active ? 'bg-[var(--success-soft)] text-success' : 'bg-[var(--destructive-soft)] text-destructive'
                  }`}
                >
                  {record.is_active ? 'Active' : 'Inactive'}
                </span>
                {record.position && (
                  <span className="text-xs font-semibold text-muted-foreground">· {record.position}</span>
                )}
                {record.course_code && (
                  <span className="text-xs font-semibold text-primary">· {record.course_code}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar for Sub-resources */}
        {(categoryConfig.hasConsultations || categoryConfig.hasMembers) && (
          <div className="flex flex-wrap gap-2 py-3 border-b border-border bg-[#f9fbfb] px-4 -mx-6">
            {categoryConfig.hasConsultations && (
              <button
                onClick={() => {
                  onClose()
                  onOpenConsultations?.(record)
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--primary-soft)] hover:bg-[#d6f0f2] text-primary text-xs font-bold flex items-center gap-1.5 transition-colors border border-[var(--primary-border)]"
              >
                <Clock size={13} /> Manage Consultation Hours
              </button>
            )}
            {categoryConfig.hasMembers && (
              <button
                onClick={() => {
                  onClose()
                  onOpenMembers?.(record)
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--primary-soft)] hover:bg-[#e4d8f8] text-primary text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#d6c3f3]"
              >
                <Users size={13} /> Manage Committee Members
              </button>
            )}
          </div>
        )}

        {/* Field Details Grid */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryConfig.fields
              .filter((f) => f.type !== 'image')
              .map((field) => (
                <div
                  key={field.name}
                  className={`p-3 rounded-xl border border-[#f0f4f5] bg-[#fafcfc] ${
                    field.colSpan === 2 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8da0a5]">
                    {field.label}
                  </span>
                  <div className="text-xs font-medium text-foreground mt-1 break-words">
                    {renderFieldValue(field)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => onToggleActive(record)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              record.is_active
                ? 'border-[var(--destructive-border)] text-destructive hover:bg-[var(--destructive-soft)]'
                : 'border-[var(--success-border)] text-success hover:bg-[var(--success-soft)]'
            }`}
          >
            <Power size={13} />
            {record.is_active ? 'Deactivate Record' : 'Activate Record'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete(record)
              }}
              className="px-3.5 py-2 rounded-xl border border-[var(--destructive-border)] text-destructive hover:bg-[var(--destructive-soft)] text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Delete
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(record)
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 size={13} /> Edit Record
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
