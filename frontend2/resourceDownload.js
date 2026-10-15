import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { filenameFor } from './filePreview'

export async function downloadAcademicResource(resource) {
  const { url } = await api.get(ENDPOINTS.academicDownloadLink(resource.id))
  if (!url) throw new Error('Unable to prepare this download. Please try again.')

  const link = document.createElement('a')
  link.href = url
  link.download = filenameFor(resource) || 'document'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
