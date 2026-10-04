import { api } from '../client'
import { ENDPOINTS } from '../endpoints'

const OFFICE_EXTENSIONS = new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])

export function resourceFilename(resource) {
  return resource?.file_name || resource?.name || resource?.title || 'academic-resource'
}

export function resourceExtension(resource) {
  const filename = resourceFilename(resource)
  const extension = filename.includes('.') ? filename.split('.').pop() : resource?.resource_type
  return String(extension || '').toLowerCase().replace(/^\./, '')
}

export function previewKind(resource, contentType = resource?.mime_type || '') {
  const mime = String(contentType).toLowerCase().split(';')[0]
  const extension = resourceExtension(resource)

  if (mime === 'application/pdf' || extension === 'pdf') return 'pdf'
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image'
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension)) return 'video'
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a'].includes(extension)) return 'audio'
  if (mime.startsWith('text/') || ['txt', 'csv', 'md'].includes(extension)) return 'text'
  if (OFFICE_EXTENSIONS.has(extension)) return 'unsupported'
  return 'unknown'
}

export function isKnownUnsupportedPreview(resource) {
  return previewKind(resource) === 'unsupported'
}

export async function downloadResourceFile(resource, signal) {
  const { blob, filename } = await api.blob(ENDPOINTS.academicDownload(resource.id), { signal })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || resourceFilename(resource)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
