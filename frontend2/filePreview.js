const PREVIEWABLE_TYPES = new Set([
  'application/pdf',
  'application/json',
  'application/xml',
  'text/csv',
  'text/html',
  'text/plain',
])

const MIME_TYPES_BY_EXTENSION = {
  csv: 'text/csv',
  gif: 'image/gif',
  htm: 'text/html',
  html: 'text/html',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  webp: 'image/webp',
  xml: 'application/xml',
}

function filenameFor(resource) {
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
