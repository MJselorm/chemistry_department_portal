import React, { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Edit3, X, Loader2, AlertCircle, Mail, Phone, Hash } from 'lucide-react'
import { directoryApi } from './directoryApi'
import { useToast } from './Toast'
import ImageUpload from './ImageUpload'
import useDialogAccessibility from '../useDialogAccessibility'

export default function CommitteeMembersModal({ committee, isOpen, onClose }) {
  const { showToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const dialogRef = useDialogAccessibility(onClose, isOpen, saving)

  const initialForm = {
    name: '',
    role: 'Member',
    student_id: '',
    email: '',
    phone: '',
    photo_url: '',
  }
  const [formData, setFormData] = useState(initialForm)

  const loadMembers = async () => {
    if (!committee?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await directoryApi.listCommitteeMembers(committee.id)
      setMembers(res || [])
    } catch (err) {
      setError(err?.message || 'Failed to load committee members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && committee?.id) {
      loadMembers()
      setIsFormOpen(false)
      setEditingId(null)
      setFormData(initialForm)
    }
  }, [isOpen, committee?.id])

  const openAddForm = () => {
    setEditingId(null)
    setFormData(initialForm)
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name || '',
      role: item.role || 'Member',
      student_id: item.student_id || '',
      email: item.email || '',
      phone: item.phone || '',
      photo_url: item.photo_url || '',
    })
    setIsFormOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await directoryApi.updateCommitteeMember(editingId, formData)
        showToast('Committee member updated.')
      } else {
        await directoryApi.createCommitteeMember(committee.id, formData)
        showToast('Committee member added.')
      }
      setIsFormOpen(false)
      setEditingId(null)
      loadMembers()
    } catch (err) {
      showToast(err?.message || 'Failed to save member.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this member from the committee?')) return
    setDeletingId(id)
    try {
      await directoryApi.deleteCommitteeMember(id)
      showToast('Member removed from committee.')
      loadMembers()
    } catch (err) {
      showToast(err?.message || 'Failed to remove member.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="committee-members-title" tabIndex={-1} className="relative w-full max-w-2xl bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-card z-10 max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              MEMBERSHIP ROSTER
            </span>
            <h2 id="committee-members-title" className="text-lg font-bold text-foreground mt-0.5">
              {committee?.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage committee membership, officers, and appointed representatives
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
            aria-label="Close committee members"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--destructive-soft)] text-destructive rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Add / Edit Form */}
          {isFormOpen ? (
            <form onSubmit={handleSave} className="bg-[#f9fbfb] border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-foreground">
                  {editingId ? 'Edit Committee Member' : 'Add Committee Member'}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <ImageUpload
                label="Member Photo (Optional)"
                value={formData.photo_url}
                onChange={(url) => setFormData({ ...formData, photo_url: url })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-foreground mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ama Osei"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Secretary, Student Rep, Member"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Student / Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 10982341"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="aosei@st.ug.edu.gh"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-foreground mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  {saving ? 'Saving…' : 'Save Member'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {members.length} registered committee member{members.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={openAddForm}
                className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              Loading committee members…
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center bg-[#f9fbfb] rounded-xl border border-dashed border-border p-6">
              <Users size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-foreground">No members added yet</p>
              <p className="text-[11px] text-muted-foreground mt-1">Add committee chairs, secretaries, and members.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:border-[var(--primary-border)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#d8f0f1] text-primary font-black text-xs grid place-items-center">
                        {m.name
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-foreground">{m.name}</strong>
                        {m.role && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        {m.student_id && (
                          <span className="flex items-center gap-1">
                            <Hash size={11} className="text-primary" />
                            {m.student_id}
                          </span>
                        )}
                        {m.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={11} className="text-primary" />
                            {m.email}
                          </span>
                        )}
                        {m.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-primary" />
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(m)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[var(--primary-soft)] transition-colors"
                      title="Edit member"
                      aria-label={`Edit ${m.name}`}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      disabled={deletingId === m.id}
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-[var(--destructive-soft)] transition-colors disabled:opacity-50"
                      title="Remove member"
                      aria-label={`Remove ${m.name}`}
                    >
                      {deletingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
