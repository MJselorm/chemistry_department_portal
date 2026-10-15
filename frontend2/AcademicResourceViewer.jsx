import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileWarning,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'
import { filenameFor, previewMimeType, resolveViewerKind, resourceExtension } from './filePreview'
import useDialogAccessibility from './useDialogAccessibility'

const TEXT_PREVIEW_LIMIT = 1_000_000

function formatLabel(resource, contentType = '') {
  const extension = resourceExtension(resource)
  if (extension) return extension.toUpperCase()
  const type = previewMimeType(resource, contentType)
  return type === 'application/octet-stream' ? 'FILE' : type.split('/').pop().toUpperCase()
}

function messageFromError(error) {
  return error?.message || 'Unable to retrieve this file from Academic Storage.'
}

function LoadingState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 text-center" role="status">
      <RefreshCw className="animate-spin text-primary" size={26} aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground">Preparing your document…</p>
      <p className="max-w-sm text-xs text-muted-foreground">The file is being securely retrieved from Academic Storage.</p>
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--destructive-soft)] text-destructive">
        <FileWarning size={21} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">Preview unavailable</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-surface-secondary">
        <RefreshCw size={13} aria-hidden="true" />
        Retry
      </button>
    </div>
  )
}

function UnsupportedState({ label }) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--warning-soft)] text-warning">
        <FileText size={21} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{label} files are not previewable here</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">This file stays private and has not been sent to an external viewer. Download the original file to open it in a compatible application.</p>
      </div>
    </div>
  )
}

function TextPreview({ blob }) {
  const [state, setState] = useState({ loading: true, text: '', truncated: false, error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ loading: true, text: '', truncated: false, error: '' })
    blob.slice(0, TEXT_PREVIEW_LIMIT).text()
      .then((text) => {
        if (active) setState({ loading: false, text, truncated: blob.size > TEXT_PREVIEW_LIMIT, error: '' })
      })
      .catch(() => {
        if (active) setState({ loading: false, text: '', truncated: false, error: 'This text file could not be read.' })
      })
    return () => { active = false }
  }, [blob, attempt])

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} onRetry={() => setAttempt((value) => value + 1)} />

  return (
    <div className="h-full overflow-auto bg-surface-secondary p-4 sm:p-6">
      {state.truncated && <p className="mb-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-xs text-warning">Showing the first 1 MB. Download the file to read all of it.</p>}
      <pre className="m-0 whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-4 font-mono text-xs leading-6 text-foreground shadow-xs">{state.text}</pre>
    </div>
  )
}

function DocxPreview({ blob, onError }) {
  const containerRef = useRef(null)

  useEffect(() => {
    let active = true
    const container = containerRef.current
    if (!container) return undefined
    container.replaceChildren()

    import('docx-preview')
      .then(({ renderAsync }) => renderAsync(blob, container, container, {
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        renderAltChunks: false,
        renderComments: false,
        renderFooters: true,
        renderHeaders: true,
      }))
      .catch((error) => {
        if (active) onError(messageFromError(error))
      })

    return () => {
      active = false
      container.replaceChildren()
    }
  }, [blob, onError])

  return <div ref={containerRef} className="academic-docx-viewer h-full overflow-auto bg-surface-secondary p-3 sm:p-6" aria-label="Word document preview" />
}

function PptxPreview({ blob, onError }) {
  const containerRef = useRef(null)

  useEffect(() => {
    let active = true
    let viewer = null
    const container = containerRef.current
    if (!container) return undefined
    container.replaceChildren()

    import('pptx-viewer')
      .then(async ({ PPTXViewer }) => {
        if (!active) return
        viewer = new PPTXViewer(container, {
          keyboardNavigation: true,
          showControls: true,
          onError: (error) => active && onError(messageFromError(error)),
        })
        await viewer.load(await blob.arrayBuffer())
      })
      .catch((error) => {
        if (active) onError(messageFromError(error))
      })

    return () => {
      active = false
      viewer?.destroy?.()
      container.replaceChildren()
    }
  }, [blob, onError])

  return <div ref={containerRef} className="academic-pptx-viewer h-full overflow-auto bg-surface-secondary p-3 sm:p-6" aria-label="PowerPoint presentation preview" />
}

export default function AcademicResourceViewer({ resource, onClose }) {
  const [documentState, setDocumentState] = useState({ status: 'loading', blob: null, kind: null, contentType: '', objectUrl: '', error: '' })
  const [retryKey, setRetryKey] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfFitToWidth, setPdfFitToWidth] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dialogRef = useDialogAccessibility(onClose)
  const viewerRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let objectUrl = ''
    setDocumentState({ status: 'loading', blob: null, kind: null, contentType: '', objectUrl: '', error: '' })
    setZoom(100)
    setPdfPage(1)
    setPdfFitToWidth(true)

    const load = async () => {
      try {
        const { blob, contentType } = await api.blob(ENDPOINTS.academicView(resource.id), { signal: controller.signal })
        const kind = await resolveViewerKind(resource, blob, contentType)
        if (!active) return
        if (kind === 'pdf' || kind === 'image') objectUrl = URL.createObjectURL(blob)
        setDocumentState({ status: 'ready', blob, kind, contentType, objectUrl, error: '' })
      } catch (error) {
        if (active && error?.name !== 'AbortError') {
          setDocumentState({ status: 'error', blob: null, kind: null, contentType: '', objectUrl: '', error: messageFromError(error) })
        }
      }
    }

    load()
    return () => {
      active = false
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [resource, retryKey])

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === viewerRef.current)
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  const retry = useCallback(() => setRetryKey((value) => value + 1), [])
  const handleRendererError = useCallback((error) => {
    setDocumentState((current) => ({ ...current, status: 'error', error }))
  }, [])
  const download = useCallback(() => {
    if (!documentState.blob) return
    const url = URL.createObjectURL(documentState.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filenameFor(resource) || 'document'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }, [documentState.blob, resource])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await viewerRef.current?.requestFullscreen?.()
    } catch {
      // Fullscreen is optional and can be disabled by an embedded browser.
    }
  }, [])

  const renderPreview = () => {
    if (documentState.status === 'loading') return <LoadingState />
    if (documentState.status === 'error') return <ErrorState message={documentState.error} onRetry={retry} />
    if (documentState.kind === 'unsupported') return <UnsupportedState label={formatLabel(resource, documentState.contentType)} />

    if (documentState.kind === 'pdf') {
      const source = `${documentState.objectUrl}#page=${pdfPage}&zoom=${pdfFitToWidth ? 'page-width' : zoom}`
      return <iframe key={source} title={`${filenameFor(resource)} preview`} src={source} className="h-full w-full border-0 bg-surface" />
    }
    if (documentState.kind === 'image') {
      return (
        <div className="flex h-full items-center justify-center overflow-auto bg-surface-secondary p-4">
          <img src={documentState.objectUrl} alt={filenameFor(resource)} className="max-w-none rounded-lg shadow-raised" style={{ maxHeight: `${zoom}%`, maxWidth: `${zoom}%` }} />
        </div>
      )
    }
    if (documentState.kind === 'text') return <TextPreview blob={documentState.blob} />
    if (documentState.kind === 'docx') return <DocxPreview blob={documentState.blob} onError={handleRendererError} />
    if (documentState.kind === 'pptx') return <PptxPreview blob={documentState.blob} onError={handleRendererError} />
    return <UnsupportedState label={formatLabel(resource, documentState.contentType)} />
  }

  const zoomable = documentState.kind === 'pdf' || documentState.kind === 'image'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="resource-viewer-title" tabIndex={-1} className="flex h-full w-full max-w-7xl flex-col overflow-hidden bg-surface shadow-2xl sm:h-[min(92vh,900px)] sm:rounded-2xl">
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <h2 id="resource-viewer-title" className="truncate text-sm font-bold text-foreground">{resource.title || resource.name}</h2>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{formatLabel(resource, documentState.contentType)} document</p>
          </div>

          {zoomable && (
            <div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">
              <button type="button" onClick={() => { setPdfFitToWidth(false); setZoom((value) => Math.max(50, value - 25)) }} disabled={!pdfFitToWidth && zoom <= 50} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" title="Zoom out" aria-label="Zoom out"><ZoomOut size={15} /></button>
              <span className="min-w-12 text-center text-xs font-bold text-muted-foreground">{documentState.kind === 'pdf' && pdfFitToWidth ? 'Fit' : `${zoom}%`}</span>
              <button type="button" onClick={() => { setPdfFitToWidth(false); setZoom((value) => Math.min(200, value + 25)) }} disabled={!pdfFitToWidth && zoom >= 200} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" title="Zoom in" aria-label="Zoom in"><ZoomIn size={15} /></button>
              <button type="button" onClick={() => { setZoom(100); if (documentState.kind === 'pdf') setPdfFitToWidth(true) }} className="rounded-lg border border-border px-2 py-1.5 text-[11px] font-bold text-foreground hover:bg-surface-secondary">Fit</button>
              {documentState.kind === 'pdf' && <div className="ml-1 flex items-center gap-1"><button type="button" onClick={() => setPdfPage((value) => Math.max(1, value - 1))} disabled={pdfPage <= 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button><span className="text-xs font-bold text-muted-foreground">Page {pdfPage}</span><button type="button" onClick={() => setPdfPage((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary" aria-label="Next page"><ChevronRight size={15} /></button></div>}
            </div>
          )}

          <button type="button" onClick={download} disabled={!documentState.blob || resource.download_available === false} title={resource.download_available === false ? 'Downloads are disabled for this resource' : 'Download original file'} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50"><Download size={14} />Download</button>
          <button type="button" onClick={toggleFullscreen} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary" title={isFullscreen ? 'Exit full screen' : 'Full screen'} aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>{isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary" title="Close preview" aria-label="Close preview"><X size={16} /></button>
        </header>
        <div ref={viewerRef} className="min-h-0 flex-1 bg-surface">{renderPreview()}</div>
      </section>
    </div>
  )
}
