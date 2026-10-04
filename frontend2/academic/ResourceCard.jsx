import React from 'react'
import { Download, Eye, File, FileImage, FileText, Presentation, RefreshCw } from 'lucide-react'
import { resourceExtension } from './resourceFiles'

const formatBytes = (value) => {
  if (!value || Number.isNaN(Number(value))) return 'Size unknown'
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function ResourceIcon({ resource }) {
  const extension = resourceExtension(resource)
  const props = { size: 20, 'aria-hidden': true }
  if (['ppt', 'pptx'].includes(extension)) return <Presentation {...props} />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return <FileImage {...props} />
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(extension)) return <FileText {...props} />
  return <File {...props} />
}

export default function ResourceCard({ resource, onPreview, onDownload, actionLoadingId }) {
  const title = resource.title || resource.name || 'Untitled resource'
  const downloading = actionLoadingId === `download-${resource.id}`

  return (
    <article className="flex min-h-[220px] flex-col rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-[var(--primary-border)]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-primary"><ResourceIcon resource={resource} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-bold leading-5 text-foreground" title={title}>{title}</h2>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-primary" title={resource.course_name || resource.course_code || ''}>
            {[resource.course_code, resource.course_name].filter(Boolean).join(' - ') || 'General chemistry'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        {resource.level && <span className="rounded-md bg-surface-secondary px-2 py-1">Level {resource.level}</span>}
        {resource.semester && <span className="rounded-md bg-surface-secondary px-2 py-1">Semester {resource.semester}</span>}
        {resource.category && <span className="rounded-md bg-surface-secondary px-2 py-1">{resource.category}</span>}
      </div>

      <p className="mt-3 line-clamp-2 min-h-8 text-[11px] leading-4 text-muted-foreground">
        {resource.description || `${formatBytes(resource.file_size)} academic resource`}
      </p>

      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <button type="button" onClick={() => onPreview(resource)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-surface-secondary">
          <Eye size={14} /> Preview
        </button>
        <button
          type="button"
          onClick={() => onDownload(resource)}
          disabled={downloading || resource.download_available === false}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          Download
        </button>
      </div>
    </article>
  )
}
