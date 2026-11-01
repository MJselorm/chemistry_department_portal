/**
 * Thin fetch wrapper around the FastAPI backend.
 * Everything the production UI does goes through this authenticated client.
 */

const PRODUCTION_API_ORIGIN = 'https://chemistry-department-portal.onrender.com'

function resolveBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (import.meta.env.PROD) {
    if (envUrl) {
      try {
        const configured = new URL(envUrl)
        if (configured.protocol === 'https:') return configured.origin
      } catch {
        // Fall through to the known production API when build configuration is invalid.
      }
    }
    return PRODUCTION_API_ORIGIN
  }
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }
  // In local development, fall back to localhost
  return 'http://127.0.0.1:8000'
}

const BASE_URL = resolveBaseUrl()
let accessToken = null
// Render's free instances can need around half a minute to wake after idle.
// Keep local failures quick, but give the hosted portal enough time to retry
// through that normal cold-start window before showing a connection error.
const RETRY_DELAYS_MS = import.meta.env.PROD
  ? [2000, 4000, 8000, 16000]
  : [500]
const REQUEST_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000

export const tokenStore = {
  get: () => accessToken,
  set: (token) => {
    accessToken = token
  },
  clear: () => {
    accessToken = null
  },
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function parseBody(res) {
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * FastAPI returns errors as {detail: "..."} or, for 422, as
 * {detail: [{loc, msg, type}, ...]}. Flatten both into one readable string.
 */
function messageFromDetail(payload, status) {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 429) return payload?.detail || 'Too many requests. Please wait and try again.'
  if (status >= 500) return 'Something went wrong. Please try again.'
  const detail = payload?.detail
  if (!detail) return status === 404 ? 'The requested item could not be found.' : 'Unable to complete this request. Please try again.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join(', ') || 'Please check the information provided and try again.'
  }
  return 'Unable to complete this request. Please try again.'
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort(options.signal?.reason)
  if (options.signal?.aborted) abort()
  else options.signal?.addEventListener('abort', abort, { once: true })
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (timedOut) throw new ApiError('The request took too long. Please try again.', 0, null)
    throw error
  } finally {
    window.clearTimeout(timer)
    options.signal?.removeEventListener('abort', abort)
  }
}

async function request(path, { method = 'GET', body, form, auth = true, signal, retryCount = RETRY_DELAYS_MS.length } = {}) {
  const headers = {}
  if (auth) {
    const token = tokenStore.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload
  if (form) {
    // OAuth2PasswordRequestForm expects urlencoded, not JSON.
    payload = new URLSearchParams(form)
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (body !== undefined) {
    payload = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  const targetUrl = BASE_URL && path.startsWith(BASE_URL) ? path : `${BASE_URL}${path}`
  let res
  try {
    res = await fetchWithTimeout(targetUrl, { method, headers, body: payload, signal, credentials: 'omit' })
  } catch (err) {
    const retryable = method === 'GET' && (err.name === 'TypeError' || err.message?.includes('fetch') || err instanceof ApiError)
    if (retryCount > 0 && retryable && !signal?.aborted) {
      const retryIndex = RETRY_DELAYS_MS.length - retryCount
      const retryDelay = RETRY_DELAYS_MS[retryIndex] ?? RETRY_DELAYS_MS.at(-1)
      // Server may be spinning up from cold sleep (e.g. Render free tier).
      await new Promise((r) => setTimeout(r, retryDelay))
      return request(path, { method, body, form, auth, signal, retryCount: retryCount - 1 })
    }
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new ApiError(
        'Unable to connect right now. Please check your connection and try again.',
        0,
        null
      )
    }
    throw err
  }

  const data = await parseBody(res)

  if (res.status === 401 && auth) {
    tokenStore.clear()
    window.dispatchEvent(new CustomEvent('chemhub:session-expired'))
  }
  if (!res.ok) {
    const error = new ApiError(messageFromDetail(data, res.status), res.status, data)
    error.retryAfter = res.headers.get('retry-after')
    throw error
  }
  return data
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  postForm: (path, form, opts) => request(path, { ...opts, method: 'POST', form }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  blob: async (path, opts = {}) => {
    const headers = {}
    if (opts.auth !== false && tokenStore.get()) headers.Authorization = `Bearer ${tokenStore.get()}`
    const targetUrl = BASE_URL && path.startsWith(BASE_URL) ? path : `${BASE_URL}${path}`
    let response
    try {
      response = await fetchWithTimeout(targetUrl, { headers, signal: opts.signal, credentials: 'omit' })
    } catch {
      throw new ApiError('Unable to reach the file server. Please try again.', 0, null)
    }
    if (!response.ok) {
      const data = await parseBody(response)
      if (response.status === 401 && opts.auth !== false) {
        tokenStore.clear()
        window.dispatchEvent(new CustomEvent('chemhub:session-expired'))
      }
      throw new ApiError(messageFromDetail(data, response.status), response.status, data)
    }
    return { blob: await response.blob(), contentType: response.headers.get('content-type') || 'application/octet-stream' }
  },
  upload: async (path, file, opts = {}) => {
    const headers = {}
    if (opts.auth !== false) {
      const token = tokenStore.get()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(opts.fields || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value)
    })
    const targetUrl = BASE_URL && path.startsWith(BASE_URL) ? path : `${BASE_URL}${path}`
    let res
    try {
      res = await fetchWithTimeout(targetUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: opts.signal,
        credentials: 'omit',
      }, UPLOAD_TIMEOUT_MS)
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        throw new ApiError(
          'Unable to upload the file right now. Check your connection and try again.',
          0,
          null
        )
      }
      throw err
    }
    const data = await parseBody(res)
    if (res.status === 401 && opts.auth !== false) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent('chemhub:session-expired'))
    }
    if (!res.ok) {
      throw new ApiError(messageFromDetail(data, res.status), res.status, data)
    }
    return data
  },
}

export { BASE_URL }
