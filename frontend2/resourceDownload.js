import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { filenameFor } from './filePreview'

function triggerDownload(url, filename, revoke = false) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
  if (revoke) window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadAcademicResource(resource) {
  const filename = filenameFor(resource) || 'document'
  try {
    const { url } = await api.get(ENDPOINTS.academicDownloadLink(resource.id))
    if (!url) throw new Error('Unable to prepare this download. Please try again.')
    triggerDownload(url, filename)
    return
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) throw error
  }

  // Compatibility fallback for a backend that has not deployed signed-link
  // delivery yet, or when Supabase signing is temporarily unavailable.
  const { blob } = await api.blob(ENDPOINTS.academicDownload(resource.id))
  triggerDownload(URL.createObjectURL(blob), filename, true)
}
