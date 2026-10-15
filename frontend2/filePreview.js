const PREVIEWABLE_TYPES = new Set([
  'application/pdf',
  'application/json',
  'application/xml',
  'text/csv',
  'text/html',
  'text/plain',
])

const MIME_TYPES_BY_EXTENSION = {
  bmp: 'image/bmp',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  htm: 'text/html',
  html: 'text/html',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  webp: 'image/webp',
  xml: 'application/xml',
}

export function filenameFor(resource) {
  return resource.file_name || resource.name || ''
}

function previewable(type) {
  return PREVIEWABLE_TYPES.has(type) || type.startsWith('image/')
}

export function previewMimeType(resource, responseContentType = '') {
  const extension = filenameFor(resource).split('.').pop()?.toLowerCase()
  const extensionType = MIME_TYPES_BY_EXTENSION[extension]
  // Bucket records migrated from an earlier repository can retain generic or
  // stale MIME metadata. For formats browsers natively preview, a recognized
  // filename extension is the most reliable recovery path.
  if (extensionType && previewable(extensionType)) return extensionType

  const responseType = String(responseContentType || '').split(';', 1)[0].trim().toLowerCase()
  if (responseType && responseType !== 'application/octet-stream') return responseType

  const resourceType = (resource.mime_type || '').toLowerCase()
  if (resourceType && resourceType !== 'application/octet-stream') return resourceType

  return extensionType || 'application/octet-stream'
}

export function canPreviewInBrowser(resource, responseContentType = '') {
  const type = previewMimeType(resource, responseContentType)
  return previewable(type)
}

export function previewBlob(blob, resource, responseContentType = '') {
  return new Blob([blob], { type: previewMimeType(resource, responseContentType) })
}

export function resourceExtension(resource) {
  const filename = filenameFor(resource)
  return filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''
}

export function isSafeDocumentHref(value) {
  const href = String(value || '').trim()
  if (!href || href.startsWith('#')) return true
  try {
    const parsed = new URL(href, 'https://chemhub.invalid')
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function sanitizeDocumentLinks(container) {
  container?.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href')
    if (!isSafeDocumentHref(href)) {
      link.removeAttribute('href')
      link.setAttribute('aria-disabled', 'true')
      return
    }
    if (link.target === '_blank') link.rel = 'noopener noreferrer'
  })
}

/**
 * Choose a local, safe renderer. Files are fetched through the authenticated
 * backend first; no external document service receives the file or its URL.
 */
export function viewerKind(resource, responseContentType = '') {
  const type = previewMimeType(resource, responseContentType)
  const extension = resourceExtension(resource)

  if (type === 'application/pdf') return 'pdf'
  if (extension === 'docx' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  if (extension === 'pptx' || type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'pptx'
  if (type.startsWith('image/') && type !== 'image/svg+xml') return 'image'

  // HTML is intentionally excluded: resources are not trusted application UI
  // and must never be interpreted as executable markup inside the portal.
  if (
    type === 'text/plain' ||
    type === 'text/csv' ||
    type === 'application/json' ||
    type === 'application/xml' ||
    extension === 'log' ||
    extension === 'md'
  ) return 'text'

  return 'unsupported'
}

export async function resolveViewerKind(resource, blob, responseContentType = '') {
  const declaredKind = viewerKind(resource, responseContentType)
  if (declaredKind !== 'unsupported') return declaredKind

  // Some migrated records have no usable filename or MIME metadata. Recover
  // PDFs from their standard file signature without pretending arbitrary
  // binary files are browser-previewable.
  const header = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
  if (String.fromCharCode(...header) === '%PDF-') return 'pdf'

  return 'unsupported'
}
