import { api } from '../client'
import { RESOURCE_ENDPOINTS } from '../endpoints'

function buildQueryString(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      query.append(key, value)
    }
  }
  const str = query.toString()
  return str ? `?${str}` : ''
}

export const resourcesApi = {
  /**
   * List resources with pagination and multi-filtering.
   */
  listResources: async (params = {}, opts = {}) => {
    const qs = buildQueryString(params)
    return await api.get(`${RESOURCE_ENDPOINTS.list}${qs}`, opts)
  },

  /**
   * Get single resource detail.
   */
  getResource: async (id, opts = {}) => {
    return await api.get(RESOURCE_ENDPOINTS.detail(id), opts)
  },

  /**
   * View resource in-browser (e.g. PDF viewer) via authenticated blob stream.
   */
  viewResource: async (id, opts = {}) => {
    const { blob, filename, contentType } = await api.blob(RESOURCE_ENDPOINTS.view(id), opts)
    const url = URL.createObjectURL(blob)
    return { url, blob, filename, contentType }
  },

  /**
   * Stream download a file from Google Drive preserving filename.
   */
  downloadResource: async (id, fallbackName = 'download', opts = {}) => {
    const { blob, filename } = await api.blob(RESOURCE_ENDPOINTS.download(id), opts)
    const finalFilename = filename || fallbackName
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = finalFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    return { success: true, filename: finalFilename }
  },

  /**
   * List indexed Google Drive folders.
   */
  listFolders: async (opts = {}) => {
    return await api.get(RESOURCE_ENDPOINTS.folders, opts)
  },

  /**
   * Search indexed resources.
   */
  searchResources: async (q, params = {}, opts = {}) => {
    const qs = buildQueryString({ q, ...params })
    return await api.get(`${RESOURCE_ENDPOINTS.search}${qs}`, opts)
  },

  /**
   * Check resource repository health & Google Drive configuration.
   */
  checkHealth: async (opts = {}) => {
    return await api.get(RESOURCE_ENDPOINTS.health, opts)
  },

  /**
   * Admin-only: Trigger Google Drive sync.
   */
  syncResources: async (opts = {}) => {
    return await api.post(RESOURCE_ENDPOINTS.sync, {}, opts)
  },

  /**
   * Admin-only: Update resource metadata.
   */
  updateResource: async (id, payload, opts = {}) => {
    return await api.patch(RESOURCE_ENDPOINTS.detail(id), payload, opts)
  },
}

