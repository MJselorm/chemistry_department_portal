/**
 * Thin fetch wrapper around the FastAPI backend.
 * Everything the UI does goes through here, so swapping mocks for the real
 * server is a matter of flipping VITE_USE_MOCKS and making sure the routes
 * in endpoints.js match your FastAPI router prefixes.
 */

function resolveBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  // A localhost API URL works during Vite development but can never work from
  // a visitor's browser after deployment. Guard against a mistakenly copied
  // production environment variable and use Vercel's same-origin rewrite.
  if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(envUrl || '')) {
    console.warn('Ignoring a localhost VITE_API_BASE_URL in the production build.')
    return '/api'
  }
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
let accessToken = null

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
    this.payload = import.meta.env.DEV ? payload : null
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

function publicErrorMessage(status) {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested item could not be found.'
  if (status === 409) return 'This change conflicts with an existing record.'
  if (status === 400 || status === 413 || status === 422) return 'Please check the information provided and try again.'
  return 'Something went wrong. Please try again.'
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const externalSignal = options.signal
  const abortFromExternal = () => controller.abort()
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (externalSignal?.aborted) throw error
    if (error?.name === 'AbortError') throw new ApiError('Something went wrong. Please try again.', 0, null)
    throw error
  } finally {
    window.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}

function filenameFromDisposition(value) {
  if (!value) return null

  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ''))
    } catch {
      return encoded.replace(/^"|"$/g, '')
    }
  }

  return value.match(/filename="?([^";]+)"?/i)?.[1]?.trim() || null
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
    res = await fetchWithTimeout(targetUrl, { method, headers, body: payload, signal, credentials: 'omit' })
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (retryCount > 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      await new Promise((r) => setTimeout(r, 2000))
      return request(path, { method, body, form, auth, signal, retryCount: retryCount - 1 })
    }
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new ApiError('Something went wrong. Please try again.', 0, null)
    }
    throw err
  }

  const data = await parseBody(res)

  if (res.status === 401 && auth) tokenStore.clear()
  if (!res.ok) {
    throw new ApiError(publicErrorMessage(res.status), res.status, data)
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
      response = await fetchWithTimeout(targetUrl, { headers, signal: opts.signal, credentials: 'omit' }, 60000)
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (error instanceof ApiError) throw error
      throw new ApiError('Something went wrong. Please try again.', 0, null)
    }
    if (!response.ok) {
      const data = await parseBody(response)
      if (response.status === 401 && opts.auth !== false) tokenStore.clear()
      throw new ApiError(publicErrorMessage(response.status), response.status, data)
    }
    return {
      blob: await response.blob(),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      filename: filenameFromDisposition(response.headers.get('content-disposition')),
    }
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
      }, 120000)
    } catch (err) {
      if (err instanceof ApiError) throw err
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        throw new ApiError('Something went wrong. Please try again.', 0, null)
      }
      throw err
    }
    const data = await parseBody(res)
    if (res.status === 401 && opts.auth !== false) tokenStore.clear()
    if (!res.ok) {
      throw new ApiError(publicErrorMessage(res.status), res.status, data)
    }
    return data
  },
}

export { BASE_URL }
