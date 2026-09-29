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

// Cache & in-flight deduplication to prevent repetitive network requests
let cachedSummary = null
let summaryInFlight = null
let lastSummaryTime = 0
const SUMMARY_TTL_MS = 30000 // 30 seconds

export const directoryApi = {
  // Summary & Search
  getSummary: async (forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && cachedSummary && (now - lastSummaryTime < SUMMARY_TTL_MS)) {
      return cachedSummary
    }
    if (summaryInFlight) {
      return await summaryInFlight
    }
    summaryInFlight = (async () => {
      try {
        const data = await api.get(DIRECTORY_ENDPOINTS.summary)
        cachedSummary = data || {}
        lastSummaryTime = Date.now()
        return cachedSummary
      } finally {
        summaryInFlight = null
      }
    })()
    return await summaryInFlight
  },

  invalidateSummary: () => {
    cachedSummary = null
    lastSummaryTime = 0
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
    const res = await api.post(endpoint, data)
    directoryApi.invalidateSummary()
    return res
  },

  updateEntity: async (endpoint, id, data) => {
    const res = await api.patch(`${endpoint}/${id}`, data)
    directoryApi.invalidateSummary()
    return res
  },

  deleteEntity: async (endpoint, id) => {
    const res = await api.del(`${endpoint}/${id}`)
    directoryApi.invalidateSummary()
    return res
  },

  toggleActive: async (endpoint, id, currentIsActive) => {
    const res = await api.patch(`${endpoint}/${id}`, { is_active: !currentIsActive })
    directoryApi.invalidateSummary()
    return res
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
