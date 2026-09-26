import React, { useEffect, useState } from 'react'
import { X, Loader2, Check, AlertCircle } from 'lucide-react'
import ImageUpload from './ImageUpload'

export default function DirectoryFormModal({
  isOpen,
  onClose,
  categoryConfig,
  initialData = null,
  departments = [],
  courses = [],
  lecturers = [],
  onSave,
  isSaving = false,
}) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const isEdit = Boolean(initialData?.id)

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      // Pre-fill existing data for edit
      const prefill = { ...initialData }
      // Format time fields if present
      if (prefill.meeting_time && typeof prefill.meeting_time === 'string') {
        prefill.meeting_time = prefill.meeting_time.slice(0, 5)
      }
      setFormData(prefill)
    } else {
      // Initialize with default values
      const defaults = {}
      categoryConfig.fields.forEach((f) => {
        if (f.default !== undefined) {
          defaults[f.name] = f.default
        } else if (f.type === 'boolean') {
          defaults[f.name] = true
        } else if (f.type === 'department_select' && departments.length > 0) {
          defaults[f.name] = departments[0].id
        } else {
          defaults[f.name] = ''
        }
      })
      setFormData(defaults)
    }
    setErrors({})
  }, [isOpen, initialData, categoryConfig, departments])

  const validate = () => {
    const errs = {}
    categoryConfig.fields.forEach((f) => {
      if (f.required) {
        const val = formData[f.name]
        if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
          errs[f.name] = `${f.label} is required`
        }
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    // Clean payload for backend types
    const payload = { ...formData }
    categoryConfig.fields.forEach((f) => {
      if (f.type === 'number' && payload[f.name] !== '') {
        payload[f.name] = Number(payload[f.name])
      }
      if (f.type === 'department_select' && payload[f.name]) {
        payload[f.name] = Number(payload[f.name])
      }
      if (f.type === 'course_select' && payload[f.name]) {
        payload[f.name] = Number(payload[f.name])
      }
      if (f.type === 'lecturer_select') {
        payload[f.name] = payload[f.name] ? Number(payload[f.name]) : null
      }
      if (f.type === 'time' && payload[f.name] && payload[f.name].length === 5) {
        payload[f.name] = `${payload[f.name]}:00`
      }
      // If string is empty and not required, set to null for backend optional fields
      if (typeof payload[f.name] === 'string' && !payload[f.name].trim() && !f.required) {
        payload[f.name] = null
      }
    })

    onSave(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={!isSaving ? onClose : undefined} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-card z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              DIRECTORY MANAGEMENT
            </span>
            <h2 className="text-xl font-bold text-foreground mt-0.5">
              {isEdit ? `Edit ${categoryConfig.singular}` : `Add New ${categoryConfig.singular}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              Fill in the details below. Required fields are marked with an asterisk (*).
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="directory-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryConfig.fields.map((field) => {
              const value = formData[field.name] ?? ''
              const hasError = Boolean(errors[field.name])

              if (field.type === 'image') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <ImageUpload
                      label={field.label}
                      value={formData[field.name]}
                      onChange={(url) => setFormData((prev) => ({ ...prev, [field.name]: url }))}
                    />
                  </div>
                )
              }

              if (field.type === 'boolean') {
                return (
                  <div
                    key={field.name}
                    className={`flex items-center justify-between p-3.5 rounded-xl border border-border bg-[#f9fbfb] ${
                      field.colSpan === 2 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-bold text-foreground">{field.label}</strong>
                      <small className="text-[10px] text-muted-foreground">
                        {formData[field.name] ? 'Visible to students in directory' : 'Hidden from students'}
                      </small>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[field.name])}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.name]: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                )
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                        hasError
                          ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                          : 'border-border bg-surface focus:border-primary'
                      }`}
                    />
                    {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                  </div>
                )
              }

              if (field.type === 'select') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                      value={value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-surface focus:outline-none transition-colors ${
                        hasError
                          ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Select {field.label}…</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                  </div>
                )
              }

              if (field.type === 'department_select') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                      value={value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-surface focus:outline-none transition-colors ${
                        hasError
                          ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Select Department…</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                    {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                  </div>
                )
              }

              if (field.type === 'course_select') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                      value={value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-surface focus:outline-none transition-colors ${
                        hasError
                          ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Select Course…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.course_code} - {c.course_name}
                        </option>
                      ))}
                    </select>
                    {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                  </div>
                )
              }

              if (field.type === 'lecturer_select') {
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                      value={value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-surface focus:outline-none transition-colors ${
                        hasError
                          ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                          : 'border-border focus:border-primary'
                      }`}
                    >
                      <option value="">Select Lecturer (Optional)…</option>
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title ? `${l.title} ` : ''}{l.name}
                        </option>
                      ))}
                    </select>
                    {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                  </div>
                )
              }

              // Standard inputs (text, email, number, time)
              return (
                <div key={field.name} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                      hasError
                        ? 'border-[var(--destructive-border)] bg-[var(--destructive-soft)]/30 focus:border-[#c84b4b]'
                        : 'border-border bg-surface focus:border-primary'
                    }`}
                  />
                  {hasError && <p className="text-[10px] text-destructive mt-1">{errors[field.name]}</p>}
                </div>
              )
            })}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="directory-form"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Saving…' : isEdit ? 'Update Record' : `Create ${categoryConfig.singular}`}
          </button>
        </div>
      </div>
    </div>
  )
}
