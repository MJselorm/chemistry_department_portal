import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { RefreshCw } from 'lucide-react'
import { getAcademicPreviewLink } from './resourcePreviewLinks'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export default function PdfThumbnail({ resource, onUnavailable }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    getAcademicPreviewLink(resource.id)
      .then((previewUrl) => active && setUrl(previewUrl))
      .catch(() => active && onUnavailable())
    return () => { active = false }
  }, [onUnavailable, resource.id])

  if (!url) return <RefreshCw size={18} className="animate-spin text-primary" aria-label="Loading document thumbnail" />

  return (
    <Document file={url} loading={<RefreshCw size={18} className="animate-spin text-primary" />} onLoadError={onUnavailable}>
      <Page
        pageNumber={1}
        height={142}
        devicePixelRatio={1}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        onRenderError={onUnavailable}
        className="overflow-hidden rounded border border-border bg-white shadow-xs"
      />
    </Document>
  )
}
