import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
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
import { filenameFor, isSafeDocumentHref, previewMimeType, resolveViewerKind, resourceExtension, sanitizeDocumentLinks } from './filePreview'
import { downloadAcademicResource } from './resourceDownload'
import useDialogAccessibility from './useDialogAccessibility'

const TEXT_PREVIEW_LIMIT = 1_000_000
const PdfDocumentViewer = lazy(() => import('./PdfDocumentViewer'))

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
      }).then(() => active && sanitizeDocumentLinks(container)))
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
  const viewportRef = useRef(null)
  const stageRef = useRef(null)
  const rendererRef = useRef(null)
  const [presentation, setPresentation] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    let active = true
    let loadedPresentation = null
    import('pptx-viewer')
      .then(async (module) => {
        if (!active) return
        const loaded = await module.loadPresentation(await blob.arrayBuffer())
        if (!active) {
          loaded.cleanup?.()
          return
        }
        if (!loaded.slides?.length) throw new Error('This presentation does not contain any readable slides.')
        loadedPresentation = loaded
        rendererRef.current = module.renderSlideToElement
        setPresentation(loaded)
      })
      .catch((error) => {
        if (active) onError(messageFromError(error))
      })

    return () => {
      active = false
      rendererRef.current = null
      loadedPresentation?.cleanup?.()
    }
  }, [blob, onError])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined
    const resize = () => {
      if (!presentation) return
      const availableWidth = Math.max(220, viewport.clientWidth - 32)
      const availableHeight = Math.max(160, viewport.clientHeight - 32)
      const ratio = presentation.slideSize.width / presentation.slideSize.height
      let width = availableWidth
      let height = width / ratio
      if (height > availableHeight) {
        height = availableHeight
        width = height * ratio
      }
      const nextSize = { width: Math.floor(width), height: Math.floor(height) }
      setStageSize((current) => current.width === nextSize.width && current.height === nextSize.height ? current : nextSize)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [presentation])

  useEffect(() => {
    const stage = stageRef.current
    if (!presentation || !rendererRef.current || !stage || !stageSize.width) return
    try {
      rendererRef.current(presentation, currentSlide, stage, stageSize)
      sanitizeDocumentLinks(stage)
      const slide = stage.firstElementChild
      if (slide) {
        slide.style.display = 'block'
        slide.style.maxWidth = '100%'
        slide.style.maxHeight = '100%'
      }
    } catch (error) {
      onError(messageFromError(error))
    }
  }, [currentSlide, onError, presentation, stageSize])

  const blockUnsafeLink = (event) => {
    const link = event.target.closest?.('a')
    if (link && !isSafeDocumentHref(link.getAttribute('href'))) event.preventDefault()
  }

  const slideCount = presentation?.slides?.length || 0
  const moveSlide = (change) => setCurrentSlide((value) => Math.min(Math.max(0, value + change), Math.max(0, slideCount - 1)))

  if (!presentation) return <LoadingState />

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[#181a22]"
      tabIndex={0}
      onClickCapture={blockUnsafeLink}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          moveSlide(-1)
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          moveSlide(1)
        }
      }}
      aria-label="PowerPoint presentation preview"
    >
      <div ref={viewportRef} className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        <div
          ref={stageRef}
          className="shrink-0 overflow-hidden bg-white shadow-2xl"
          style={{ width: stageSize.width, height: stageSize.height, aspectRatio: `${presentation.slideSize.width} / ${presentation.slideSize.height}` }}
        />
      </div>
      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-black/35 px-3 py-2.5 text-white">
        <button type="button" onClick={() => moveSlide(-1)} disabled={currentSlide === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-35" aria-label="Previous slide"><ChevronLeft size={16} /></button>
        <span className="min-w-20 text-center text-xs font-bold" aria-live="polite">Slide {currentSlide + 1} of {slideCount}</span>
        <button type="button" onClick={() => moveSlide(1)} disabled={currentSlide >= slideCount - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-35" aria-label="Next slide"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export default function AcademicResourceViewer({ resource, onClose }) {
  const [documentState, setDocumentState] = useState({ status: 'loading', blob: null, kind: null, contentType: '', objectUrl: '', error: '' })
  const [retryKey, setRetryKey] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfPages, setPdfPages] = useState(0)
  const [pdfFitToWidth, setPdfFitToWidth] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [downloadState, setDownloadState] = useState({ loading: false, error: '' })
  const dialogRef = useDialogAccessibility(onClose)
  const pdfRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let objectUrl = ''
    setDocumentState({ status: 'loading', blob: null, kind: null, contentType: '', objectUrl: '', error: '' })
    setZoom(100)
    setPdfPage(1)
    setPdfPages(0)
    setPdfFitToWidth(true)
    setDownloadState({ loading: false, error: '' })

    const load = async () => {
      try {
        const { blob, contentType } = await api.blob(ENDPOINTS.academicView(resource.id), { signal: controller.signal })
        const kind = await resolveViewerKind(resource, blob, contentType)
        if (!active) return
        if (kind === 'image') objectUrl = URL.createObjectURL(blob)
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
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === dialogRef.current)
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  const retry = useCallback(() => setRetryKey((value) => value + 1), [])
  const handleRendererError = useCallback((error) => {
    setDocumentState((current) => ({ ...current, status: 'error', error }))
  }, [])
  const download = useCallback(async () => {
    if (downloadState.loading) return
    setDownloadState({ loading: true, error: '' })
    try {
      await downloadAcademicResource(resource)
      setDownloadState({ loading: false, error: '' })
    } catch (error) {
      setDownloadState({ loading: false, error: messageFromError(error) })
    }
  }, [downloadState.loading, resource])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await dialogRef.current?.requestFullscreen?.()
    } catch {
      // Fullscreen is optional and can be disabled by an embedded browser.
    }
  }, [])

  const renderPreview = () => {
    if (documentState.status === 'loading') return <LoadingState />
    if (documentState.status === 'error') return <ErrorState message={documentState.error} onRetry={retry} />
    if (documentState.kind === 'unsupported') return <UnsupportedState label={formatLabel(resource, documentState.contentType)} />

    if (documentState.kind === 'pdf') {
      return (
        <Suspense fallback={<LoadingState />}>
          <PdfDocumentViewer
            ref={pdfRef}
            blob={documentState.blob}
            fitToWidth={pdfFitToWidth}
            zoom={zoom}
            onError={handleRendererError}
            onPageChange={setPdfPage}
            onPageCount={setPdfPages}
          />
        </Suspense>
      )
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
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="resource-viewer-title" tabIndex={-1} className="flex h-full min-w-0 w-full max-w-7xl flex-col overflow-hidden bg-surface shadow-2xl sm:h-[min(92vh,900px)] sm:rounded-2xl">
        <header className="min-w-0 shrink-0 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <h2 id="resource-viewer-title" className="truncate text-sm font-bold text-foreground">{resource.title || resource.name}</h2>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{formatLabel(resource, documentState.contentType)} document</p>
              {downloadState.error && <p className="mt-0.5 truncate text-[10px] font-semibold text-destructive" role="alert">{downloadState.error}</p>}
            </div>
            <button type="button" onClick={download} disabled={downloadState.loading || resource.download_available === false} title={resource.download_available === false ? 'Downloads are disabled for this resource' : 'Download original file'} aria-label={resource.download_available === false ? 'Downloads are disabled for this resource' : 'Download original file'} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-50 sm:inline-flex sm:w-auto sm:gap-1.5 sm:px-2.5">{downloadState.loading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}<span className="hidden sm:inline">Download</span></button>
            <button type="button" onClick={toggleFullscreen} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary" title={isFullscreen ? 'Exit full screen' : 'Full screen'} aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>{isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
            <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary" title="Close preview" aria-label="Close preview"><X size={16} /></button>
          </div>
          {zoomable && (
            <div className="mt-2 flex w-full min-w-0 max-w-full items-center justify-start gap-1 overflow-x-auto sm:justify-center">
              <button type="button" onClick={() => { setPdfFitToWidth(false); setZoom((value) => Math.max(50, value - 25)) }} disabled={!pdfFitToWidth && zoom <= 50} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" title="Zoom out" aria-label="Zoom out"><ZoomOut size={15} /></button>
              <span className="min-w-12 text-center text-xs font-bold text-muted-foreground">{documentState.kind === 'pdf' && pdfFitToWidth ? 'Fit' : `${zoom}%`}</span>
              <button type="button" onClick={() => { setPdfFitToWidth(false); setZoom((value) => Math.min(200, value + 25)) }} disabled={!pdfFitToWidth && zoom >= 200} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" title="Zoom in" aria-label="Zoom in"><ZoomIn size={15} /></button>
              <button type="button" onClick={() => { setZoom(100); if (documentState.kind === 'pdf') setPdfFitToWidth(true) }} className="rounded-lg border border-border px-2 py-1.5 text-[11px] font-bold text-foreground hover:bg-surface-secondary">Fit</button>
              {documentState.kind === 'pdf' && <div className="ml-1 flex items-center gap-1"><button type="button" onClick={() => pdfRef.current?.goToPage(pdfPage - 1)} disabled={pdfPage <= 1} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button><span className="min-w-20 text-center text-xs font-bold text-muted-foreground">{pdfPages ? `${pdfPage} / ${pdfPages}` : 'Pages'}</span><button type="button" onClick={() => pdfRef.current?.goToPage(pdfPage + 1)} disabled={!pdfPages || pdfPage >= pdfPages} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground hover:bg-surface-secondary disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button></div>}
            </div>
          )}
        </header>
        <div className="min-h-0 flex-1 bg-surface">{renderPreview()}</div>
      </section>
    </div>
  )
}
