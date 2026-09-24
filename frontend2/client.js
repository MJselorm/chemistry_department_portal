/**
 * Thin fetch wrapper around the FastAPI backend.
 * Everything the UI does goes through here, so swapping mocks for the real
 * server is a matter of flipping VITE_USE_MOCKS and making sure the routes
 * in endpoints.js match your FastAPI router prefixes.
 */

function resolveBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }
  // In production builds (e.g. Vercel), default to '/api' so Vercel's proxy rewrite handles routing without CORS issues
  if (import.meta.env.PROD) {
    return '/api'
  }
  // In local development, fall back to localhost
  return 'http://127.0.0.1:8000'
}

const BASE_URL = resolveBaseUrl()
const TOKEN_KEY = 'gscs.access_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
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
function messageFromDetail(payload, fallback) {
  const detail = payload?.detail
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join(', ') || fallback
  }
  return fallback
}

async function request(path, { method = 'GET', body, form, auth = true, signal, retryCount = 1 } = {}) {
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
    res = await fetch(targetUrl, { method, headers, body: payload, signal })
  } catch (err) {
    if (retryCount > 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      // Server may be spinning up from cold sleep (e.g. Render free tier). Wait 2s and retry once.
      await new Promise((r) => setTimeout(r, 2000))
      return request(path, { method, body, form, auth, signal, retryCount: retryCount - 1 })
    }
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the backend server. If the server is on a free tier (Render), it may be waking up from standby (~30 seconds). Please try again in a moment.',
        0,
        null
      )
    }
    throw err
  }

  const data = await parseBody(res)

  if (res.status === 401 && auth) tokenStore.clear()
  if (!res.ok) {
    throw new ApiError(messageFromDetail(data, `Request failed (${res.status})`), res.status, data)
  }
  return data
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  postForm: (path, form, opts) => request(path, { ...opts, method: 'POST', form }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  upload: async (path, file, opts = {}) => {
    const headers = {}
    if (opts.auth !== false) {
      const token = tokenStore.get()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    const formData = new FormData()
    formData.append('file', file)
    const targetUrl = BASE_URL && path.startsWith(BASE_URL) ? path : `${BASE_URL}${path}`
    let res
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: formData,
        signal: opts.signal,
      })
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        throw new ApiError(
          'Unable to reach the file upload server. The server may be waking up or offline. Please retry in a moment.',
          0,
          null
        )
      }
      throw err
    }
    const data = await parseBody(res)
    if (res.status === 401 && opts.auth !== false) tokenStore.clear()
    if (!res.ok) {
      throw new ApiError(messageFromDetail(data, `Upload failed (${res.status})`), res.status, data)
    }
    return data
  },
}

export { BASE_URL }
