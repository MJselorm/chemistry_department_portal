import { api } from './client'
import { ENDPOINTS } from './endpoints'

const previewLinkCache = new Map()

export async function getAcademicPreviewLink(resourceId) {
  for (const [id, entry] of previewLinkCache) {
    if (!entry.promise && entry.expiresAt <= Date.now()) previewLinkCache.delete(id)
  }
  const cached = previewLinkCache.get(resourceId)
  if (cached && cached.expiresAt > Date.now()) return cached.url
  if (cached?.promise) return cached.promise

  const promise = api.get(ENDPOINTS.academicPreviewLink(resourceId))
    .then(({ url, expires_in: expiresIn = 300 }) => {
      if (!url) throw new Error('Preview unavailable.')
      previewLinkCache.set(resourceId, {
        url,
        expiresAt: Date.now() + Math.max(15, expiresIn - 30) * 1000,
      })
      return url
    })
    .catch((error) => {
      previewLinkCache.delete(resourceId)
      throw error
    })

  previewLinkCache.set(resourceId, { promise, expiresAt: 0 })
  return promise
}
