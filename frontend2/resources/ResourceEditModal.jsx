import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, AlertCircle, Info, Lock } from 'lucide-react'
import { RESOURCE_TYPES, LEVELS } from './ResourceFilters'

export default function ResourceEditModal({
  isOpen,
  onClose,
  resource,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course_code: '',
    course_name: '',
    level: 'All',
    category: '',
    resource_type: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || '',
        description: resource.description || '',
        course_code: resource.course_code || '',
        course_name: resource.course_name || '',
        level: resource.level || 'All',
        category: resource.category || '',
        resource_type: resource.resource_type || '',
        is_active: resource.is_active ?? true,
      })
      setError('')
    }
  }, [resource])

  if (!isOpen || !resource) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Title cannot be empty.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        course_code: formData.course_code.trim() || null,
        course_name: formData.course_name.trim() || null,
        level: formData.level !== 'All' ? formData.level : null,
        category: formData.category.trim() || null,
        resource_type: formData.resource_type.trim() || null,
        is_active: formData.is_active,
      }
      await onSave(resource.id, payload)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to update resource metadata.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#e4ecee] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#f0f4f5] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#102a2f]">Edit Resource Metadata</h3>
            <p className="text-xs text-[#71868c] mt-0.5">
              Update indexing tags, descriptions, and course association
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Read-Only File Protection Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <Lock size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Google Drive File ID (Read-only):</span>{' '}
              <code className="text-slate-700 font-mono text-[10px] break-all">
                {resource.google_drive_file_id}
              </code>
              <p className="text-[10px] text-slate-500 mt-0.5">
                The underlying Google Drive file is linked securely and cannot be changed here.
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#102a2f] mb-1">
              Resource Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
              placeholder="e.g. Organic Chemistry Lecture 4"
            />
          </div>

          {/* Course Code & Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Course Code</label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
                placeholder="e.g. CEN 212"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Course Name</label>
              <input
                type="text"
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
                placeholder="e.g. Chemical Thermodynamics"
              />
            </div>
          </div>

          {/* Level & Resource Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl === 'All' ? 'Unspecified / All Levels' : `Level ${lvl}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#102a2f] mb-1">Resource Type</label>
              <select
                value={formData.resource_type}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
              >
                <option value="">Select Resource Type</option>
                {RESOURCE_TYPES.filter((t) => t !== 'All').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-[#102a2f] mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
              placeholder="e.g. Past Questions, Textbooks, Lab Notes"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#102a2f] mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
              placeholder="Brief context about this academic material..."
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f6f9fa] border border-[#e4ecee]">
            <div>
              <strong className="block text-xs font-bold text-[#102a2f]">Active in Student Library</strong>
              <span className="text-[11px] text-[#71868c]">
                When inactive, students will not see this file in search or browsing.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#087f8c]"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f4f5]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#5e7379] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#087f8c] hover:bg-[#066570] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Save Metadata</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
