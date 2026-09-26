import React, { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Plus, Trash2, Edit3, X, Loader2, AlertCircle, Check } from 'lucide-react'
import { directoryApi } from './directoryApi'
import { useToast } from './Toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MODES = ['In-Person', 'Online', 'Hybrid']

export default function ConsultationModal({ lecturer, isOpen, onClose }) {
  const { showToast } = useToast()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null) // null = view/new, id = editing
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const initialForm = {
    day_of_week: 'Monday',
    start_time: '09:00:00',
    end_time: '11:00:00',
    location: lecturer?.office || '',
    mode: 'In-Person',
    instructions: '',
    is_active: true,
  }
  const [formData, setFormData] = useState(initialForm)

  const loadConsultations = async () => {
    if (!lecturer?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await directoryApi.listConsultations(lecturer.id)
      setConsultations(res?.items || res || [])
    } catch (err) {
      setError(err?.message || 'Failed to load consultation hours.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && lecturer?.id) {
      loadConsultations()
      setIsFormOpen(false)
      setEditingId(null)
      setFormData({
        ...initialForm,
        location: lecturer.office || '',
      })
    }
  }, [isOpen, lecturer?.id])

  const openAddForm = () => {
    setEditingId(null)
    setFormData({
      ...initialForm,
      location: lecturer?.office || '',
    })
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setEditingId(item.id)
    setFormData({
      day_of_week: item.day_of_week,
      start_time: item.start_time?.slice(0, 5) || '09:00',
      end_time: item.end_time?.slice(0, 5) || '11:00',
      location: item.location || '',
      mode: item.mode || 'In-Person',
      instructions: item.instructions || '',
      is_active: item.is_active ?? true,
    })
    setIsFormOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        // Backend expects time format like "09:00:00"
        start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
        end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time,
      }

      if (editingId) {
        await directoryApi.updateConsultation(editingId, payload)
        showToast('Consultation period updated.')
      } else {
        await directoryApi.createConsultation(lecturer.id, payload)
        showToast('Consultation period added.')
      }
      setIsFormOpen(false)
      setEditingId(null)
      loadConsultations()
    } catch (err) {
      showToast(err?.message || 'Failed to save consultation period.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this consultation period?')) return
    setDeletingId(id)
    try {
      await directoryApi.deleteConsultation(id)
      showToast('Consultation period removed.')
      loadConsultations()
    } catch (err) {
      showToast(err?.message || 'Failed to remove consultation period.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border p-6 shadow-card z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              OFFICE HOURS
            </span>
            <h2 className="text-lg font-bold text-foreground mt-0.5">
              Consultation Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              Managing hours for <strong className="text-foreground">{lecturer?.name}</strong> {lecturer?.staff_id ? `(${lecturer.staff_id})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--destructive-soft)] text-destructive rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Form to Add/Edit */}
          {isFormOpen ? (
            <form onSubmit={handleSave} className="bg-[#f9fbfb] border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-foreground">
                  {editingId ? 'Edit Consultation Period' : 'Add Consultation Period'}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-foreground mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  >
                    {MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-foreground mb-1">Location / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. Chem Block Room 204 or Zoom link"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-foreground mb-1">Instructions for Students</label>
                  <input
                    type="text"
                    placeholder="e.g. Send an email prior to visiting"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Slot'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {consultations.length} scheduled consultation period{consultations.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={openAddForm}
                className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Consultation
              </button>
            </div>
          )}

          {/* Consultation List */}
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              Loading consultation periods…
            </div>
          ) : consultations.length === 0 ? (
            <div className="py-8 text-center bg-[#f9fbfb] rounded-xl border border-dashed border-border p-6">
              <Clock size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-foreground">No consultation periods configured</p>
              <p className="text-[11px] text-muted-foreground mt-1">Students will see office hours once added.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:border-[var(--primary-border)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-foreground">{c.day_of_week}</strong>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
                        {c.mode || 'In-Person'}
                      </span>
                      {c.is_active === false && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-primary" />
                        {c.start_time?.slice(0, 5)} – {c.end_time?.slice(0, 5)}
                      </span>
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-primary" />
                          {c.location}
                        </span>
                      )}
                    </div>
                    {c.instructions && (
                      <p className="text-[11px] text-[#8fa1a5] italic mt-0.5">{c.instructions}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(c)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[var(--primary-soft)] transition-colors"
                      title="Edit consultation period"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-[var(--destructive-soft)] transition-colors disabled:opacity-50"
                      title="Delete consultation period"
                    >
                      {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
