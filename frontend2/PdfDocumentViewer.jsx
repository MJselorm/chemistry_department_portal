import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PdfDocumentViewer = forwardRef(function PdfDocumentViewer(
  { blob, fitToWidth, zoom, onError, onPageChange, onPageCount },
  ref,
) {
  const scrollRef = useRef(null)
  const frameRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(720)
  const [numPages, setNumPages] = useState(0)

  useEffect(() => {
    setNumPages(0)
    onPageCount(0)
    onPageChange(1)
  }, [blob, onPageChange, onPageCount])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return undefined
    const updateWidth = () => setContainerWidth(Math.max(240, container.clientWidth - 32))
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const updateVisiblePage = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const viewportTop = container.getBoundingClientRect().top
    let nearestPage = 1
    let nearestDistance = Number.POSITIVE_INFINITY
    container.querySelectorAll('[data-pdf-page]').forEach((page) => {
      const distance = Math.abs(page.getBoundingClientRect().top - viewportTop - 16)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestPage = Number(page.dataset.pdfPage)
      }
    })
    onPageChange(nearestPage)
  }, [onPageChange])

  const handleScroll = useCallback(() => {
    if (frameRef.current) return
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      updateVisiblePage()
    })
  }, [updateVisiblePage])

  useEffect(() => () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
  }, [])

  useImperativeHandle(ref, () => ({
    goToPage(pageNumber) {
      const page = Math.min(Math.max(1, pageNumber), numPages || 1)
      scrollRef.current?.querySelector(`[data-pdf-page="${page}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  }), [numPages])

  const pageWidth = fitToWidth
    ? Math.min(containerWidth, 940)
    : Math.max(240, Math.round(Math.min(containerWidth, 900) * (zoom / 100)))

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-auto bg-surface-secondary px-3 py-4 sm:px-6" aria-label="PDF document pages">
      <Document
        file={blob}
        loading={<p className="py-16 text-center text-xs font-semibold text-muted-foreground">Loading PDF pages…</p>}
        onLoadSuccess={({ numPages: loadedPages }) => {
          setNumPages(loadedPages)
          onPageCount(loadedPages)
          onPageChange(1)
        }}
        onLoadError={() => onError('This PDF could not be rendered. Download the original file or try again.')}
        className="mx-auto flex w-max min-w-full flex-col items-center gap-4"
      >
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1
          return (
            <figure key={pageNumber} data-pdf-page={pageNumber} className="m-0 scroll-mt-4">
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
                renderAnnotationLayer={false}
                renderTextLayer
                loading={<div className="h-72 w-56 animate-pulse rounded-lg border border-border bg-surface" />}
                onRenderError={() => onError(`Page ${pageNumber} could not be rendered.`)}
                className="overflow-hidden rounded-lg bg-white shadow-raised"
              />
              <figcaption className="mt-1 text-center text-[10px] font-semibold text-muted-foreground">Page {pageNumber}</figcaption>
            </figure>
          )
        })}
      </Document>
    </div>
  )
})

export default PdfDocumentViewer
