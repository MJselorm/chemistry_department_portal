import React, { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Edit3, X, Loader2, AlertCircle, Mail, Phone, Hash } from 'lucide-react'
import { directoryApi } from './directoryApi'
import { useToast } from './Toast'
import ImageUpload from './ImageUpload'

export default function CommitteeMembersModal({ committee, isOpen, onClose }) {
  const { showToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#e4ecee] p-6 shadow-card z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e4ecee]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#087f8c]">
              MEMBERSHIP ROSTER
            </span>
            <h2 className="text-lg font-bold text-[#102a2f] mt-0.5">
              {committee?.name}
            </h2>
            <p className="text-xs text-[#64777d]">
              Manage committee membership, officers, and appointed representatives
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#91a0a5] hover:text-[#102a2f] hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="p-3 bg-[#fdecec] text-[#c84b4b] rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Add / Edit Form */}
          {isFormOpen ? (
            <form onSubmit={handleSave} className="bg-[#f9fbfb] border border-[#e4ecee] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-[#102a2f]">
                  {editingId ? 'Edit Committee Member' : 'Add Committee Member'}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-[#64777d] hover:text-[#102a2f]"
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
                  <label className="block font-bold text-[#102a2f] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ama Osei"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9e3e5] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102a2f] mb-1">Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Secretary, Student Rep, Member"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9e3e5] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102a2f] mb-1">Student / Staff ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 10982341"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9e3e5] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102a2f] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="aosei@st.ug.edu.gh"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9e3e5] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#102a2f] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9e3e5] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#d9e3e5] text-xs font-bold text-[#496066] hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Member'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#64777d]">
                {members.length} registered committee member{members.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={openAddForm}
                className="px-3 py-1.5 rounded-xl bg-[#087f8c] hover:bg-[#05636d] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div className="py-8 text-center text-xs text-[#64777d] flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#087f8c]" />
              Loading committee members…
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center bg-[#f9fbfb] rounded-xl border border-dashed border-[#e4ecee] p-6">
              <Users size={24} className="mx-auto text-[#91a0a5] mb-2" />
              <p className="text-xs font-bold text-[#102a2f]">No members added yet</p>
              <p className="text-[11px] text-[#64777d] mt-1">Add committee chairs, secretaries, and members.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#e4ecee] bg-white hover:border-[#b7dfe2] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#e4ecee]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#d8f0f1] text-[#087f8c] font-black text-xs grid place-items-center">
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
                        <strong className="text-xs font-bold text-[#102a2f]">{m.name}</strong>
                        {m.role && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#f0eafb] text-[#7652b8]">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64777d] mt-0.5">
                        {m.student_id && (
                          <span className="flex items-center gap-1">
                            <Hash size={11} className="text-[#087f8c]" />
                            {m.student_id}
                          </span>
                        )}
                        {m.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={11} className="text-[#087f8c]" />
                            {m.email}
                          </span>
                        )}
                        {m.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} className="text-[#087f8c]" />
                            {m.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(m)}
                      className="p-1.5 rounded-lg text-[#64777d] hover:text-[#087f8c] hover:bg-[#e8f6f7] transition-colors"
                      title="Edit member"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      disabled={deletingId === m.id}
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 rounded-lg text-[#64777d] hover:text-[#c84b4b] hover:bg-[#fdecec] transition-colors disabled:opacity-50"
                      title="Remove member"
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
        <div className="pt-3 border-t border-[#e4ecee] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#d9e3e5] text-xs font-bold text-[#496066] hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
