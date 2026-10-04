import React, { useEffect, useState } from 'react'
import { Download, FileWarning, RefreshCw, X } from 'lucide-react'
import { api } from '../client'
import { ENDPOINTS } from '../endpoints'
import useDialogAccessibility from '../useDialogAccessibility'
import { isKnownUnsupportedPreview, previewKind, resourceFilename } from './resourceFiles'

export default function ResourcePreviewModal({ resource, onClose, onDownload, downloading = false }) {
  const [preview, setPreview] = useState({ status: 'idle', url: '', kind: 'unknown' })
  const dialogRef = useDialogAccessibility(onClose, Boolean(resource))

  useEffect(() => {
    if (!resource) return undefined
    if (isKnownUnsupportedPreview(resource)) {
      setPreview({ status: 'unsupported', url: '', kind: 'unsupported' })
      return undefined
    }

    const controller = new AbortController()
    let objectUrl = ''
    setPreview({ status: 'loading', url: '', kind: previewKind(resource) })

    api.blob(ENDPOINTS.academicView(resource.id), { signal: controller.signal })
      .then(({ blob, contentType }) => {
        const kind = previewKind(resource, contentType)
        if (kind === 'unsupported' || kind === 'unknown') {
          setPreview({ status: 'unsupported', url: '', kind })
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setPreview({ status: 'ready', url: objectUrl, kind })
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          console.error('Academic resource preview failed.', error)
          setPreview({ status: 'error', url: '', kind: 'unknown' })
        }
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resource])

  if (!resource) return null
  const title = resource.title || resource.name || 'Academic resource'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-2 backdrop-blur-xs sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-preview-title"
        tabIndex={-1}
        className="flex h-[min(92dvh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="resource-preview-title" className="truncate text-sm font-bold text-foreground" title={title}>{title}</h2>
            <p className="truncate text-[11px] text-muted-foreground" title={resourceFilename(resource)}>{resourceFilename(resource)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(resource)}
              disabled={downloading || resource.download_available === false}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="hidden sm:inline">Download</span>
            </button>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-surface-secondary hover:text-foreground" aria-label="Close preview">
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-surface-secondary">
          {preview.status === 'loading' && (
            <div className="grid h-full place-items-center" role="status">
              <div className="text-center">
                <RefreshCw size={24} className="mx-auto animate-spin text-primary" />
                <p className="mt-3 text-xs text-muted-foreground">Loading secure preview...</p>
              </div>
            </div>
          )}

          {preview.status === 'ready' && preview.kind === 'image' && (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={preview.url} alt={`Preview of ${title}`} className="max-h-full max-w-full object-contain" />
            </div>
          )}
          {preview.status === 'ready' && preview.kind === 'video' && (
            <div className="flex h-full items-center justify-center p-4"><video src={preview.url} controls className="max-h-full max-w-full" /></div>
          )}
          {preview.status === 'ready' && preview.kind === 'audio' && (
            <div className="flex h-full items-center justify-center p-4"><audio src={preview.url} controls className="w-full max-w-xl" /></div>
          )}
          {preview.status === 'ready' && ['pdf', 'text'].includes(preview.kind) && (
            <iframe src={preview.url} title={`Preview of ${title}`} className="h-full w-full border-0 bg-white" />
          )}

          {['unsupported', 'error'].includes(preview.status) && (
            <div className="grid h-full place-items-center p-6 text-center">
              <div className="max-w-sm">
                <FileWarning size={34} className="mx-auto text-muted-foreground" />
                <h3 className="mt-3 text-sm font-bold text-foreground">
                  {preview.status === 'error' ? 'Preview unavailable' : 'Preview not supported'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {preview.status === 'error'
                    ? 'The secure preview could not be loaded. You can still download the file and open it locally.'
                    : 'This file type cannot be displayed reliably in the browser. Download it to open it with the appropriate application.'}
                </p>
                <button
                  type="button"
                  onClick={() => onDownload(resource)}
                  disabled={downloading || resource.download_available === false}
                  className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Download file
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
