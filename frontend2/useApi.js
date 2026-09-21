import { useCallback, useEffect, useState } from 'react'
import { api } from './client'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/**
 * GET a path once on mount. While the backend is missing, fall back to the
 * sample data passed in so the screen still renders.
 */
export function useResource(path, fallback) {
  const [data, setData] = useState(USE_MOCKS ? fallback : null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    try {
      const result = await api.get(path, { signal })
      setData(result)
      setError(null)
    } catch (err) {
      if (err.name === 'AbortError') return
      if (USE_MOCKS) setData(fallback)
      else setError(err)
    } finally {
      setLoading(false)
    }
    // fallback is static sample data; intentionally not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { data, loading, error, reload: () => load() }
}
