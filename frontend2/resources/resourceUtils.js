/**
 * Formats byte size into human readable string.
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
    return 'Size unavailable'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

/**
 * Extracts and formats readable file type from mime_type or file name.
 */
export function getFileFormatInfo(mimeType = '', filename = '') {
  const mime = (mimeType || '').toLowerCase()
  const name = (filename || '').toLowerCase()

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return { ext: 'PDF', color: 'bg-rose-50 text-rose-600 border-rose-200' }
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return { ext: 'DOCX', color: 'bg-blue-50 text-blue-600 border-blue-200' }
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt')
  ) {
    return { ext: 'PPTX', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv')
  ) {
    return { ext: 'XLSX', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    name.endsWith('.zip') ||
    name.endsWith('.rar')
  ) {
    return { ext: 'ZIP', color: 'bg-purple-50 text-purple-600 border-purple-200' }
  }
  if (mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
    return { ext: 'IMAGE', color: 'bg-teal-50 text-teal-600 border-teal-200' }
  }

  // Fallback: extract extension from filename
  const parts = name.split('.')
  if (parts.length > 1) {
    return {
      ext: parts.pop().toUpperCase(),
      color: 'bg-slate-50 text-slate-600 border-slate-200',
    }
  }

  return { ext: 'FILE', color: 'bg-slate-50 text-slate-600 border-slate-200' }
}

/**
 * Formats ISO date into readable format (e.g. Sep 24, 2026).
 */
export function formatResourceDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Clean up folder path for display (removes leading /Academic Resources/ root if present).
 */
export function formatFolderPath(folderPath = '') {
  if (!folderPath) return ''
  const trimmed = folderPath.replace(/^[\/\\]+/, '')
  const parts = trimmed.split(/[\/\\]+/).filter(Boolean)
  // If first segment is "Academic Resources", omit or keep
  if (parts.length > 1 && parts[0].toLowerCase().includes('academic')) {
    return parts.slice(1).join(' › ')
  }
  return parts.join(' › ')
}
