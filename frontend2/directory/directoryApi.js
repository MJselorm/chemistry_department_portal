import { api } from '../client'
import { DIRECTORY_ENDPOINTS } from '../endpoints'

/**
 * Normalizes query parameters into URL search string.
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  }
  const str = query.toString()
  return str ? `?${str}` : ''
}

export const directoryApi = {
  // Summary & Search
  getSummary: async () => {
    return await api.get(DIRECTORY_ENDPOINTS.summary)
  },

  search: async (q) => {
    if (!q || !q.trim()) return {}
    return await api.get(`${DIRECTORY_ENDPOINTS.search}?q=${encodeURIComponent(q.trim())}`)
  },

  // Image Upload via Supabase Storage backend endpoint
  uploadImage: async (file) => {
    return await api.upload(DIRECTORY_ENDPOINTS.uploadImage, file)
  },

  // Generic Entity CRUD
  listEntities: async (endpoint, params = {}) => {
    const qs = buildQueryString(params)
    return await api.get(`${endpoint}${qs}`)
  },

  getEntity: async (endpoint, id) => {
    return await api.get(`${endpoint}/${id}`)
  },

  createEntity: async (endpoint, data) => {
    return await api.post(endpoint, data)
  },

  updateEntity: async (endpoint, id, data) => {
    return await api.patch(`${endpoint}/${id}`, data)
  },

  deleteEntity: async (endpoint, id) => {
    return await api.del(`${endpoint}/${id}`)
  },

  toggleActive: async (endpoint, id, currentIsActive) => {
    return await api.patch(`${endpoint}/${id}`, { is_active: !currentIsActive })
  },

  // Lecturer Consultations
  listConsultations: async (lecturerId) => {
    return await api.get(DIRECTORY_ENDPOINTS.lecturerConsultations(lecturerId))
  },

  createConsultation: async (lecturerId, data) => {
    return await api.post(DIRECTORY_ENDPOINTS.lecturerConsultations(lecturerId), data)
  },

  updateConsultation: async (consultationId, data) => {
    return await api.patch(DIRECTORY_ENDPOINTS.consultation(consultationId), data)
  },

  deleteConsultation: async (consultationId) => {
    return await api.del(DIRECTORY_ENDPOINTS.consultation(consultationId))
  },

  // Committee Members
  listCommitteeMembers: async (committeeId) => {
    return await api.get(DIRECTORY_ENDPOINTS.committeeMembers(committeeId))
  },

  createCommitteeMember: async (committeeId, data) => {
    return await api.post(DIRECTORY_ENDPOINTS.committeeMembers(committeeId), data)
  },

  updateCommitteeMember: async (memberId, data) => {
    return await api.patch(DIRECTORY_ENDPOINTS.committeeMember(memberId), data)
  },

  deleteCommitteeMember: async (memberId) => {
    return await api.del(DIRECTORY_ENDPOINTS.committeeMember(memberId))
  },
}
