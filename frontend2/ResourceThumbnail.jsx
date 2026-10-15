import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { FileImage, FileText, Presentation, RefreshCw } from 'lucide-react'
import { fetchAcademicPreviewBlob } from './resourcePreviewLinks'
import { resourceExtension } from './filePreview'

const PdfThumbnail = lazy(() => import('./PdfThumbnail'))
const PptxThumbnail = lazy(() => import('./PptxThumbnail'))

function TypePlaceholder({ extension }) {
  const isPresentation = ['ppt', 'pptx'].includes(extension)
  const isImage = ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp'].includes(extension)
  const Icon = isPresentation ? Presentation : isImage ? FileImage : FileText
  const color = isPresentation
    ? 'bg-[var(--warning-soft)] text-warning'
    : isImage
      ? 'bg-[var(--success-soft)] text-success'
      : 'bg-[var(--primary-soft)] text-primary'

  return (
    <div className={`grid h-14 w-14 place-items-center rounded-lg ${color}`}>
      <Icon size={25} aria-hidden="true" />
      <span className="sr-only">{extension ? `${extension.toUpperCase()} file` : 'Document file'}</span>
    </div>
  )
}

function ImageThumbnail({ resource, onUnavailable }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true
    let objectUrl = ''
    fetchAcademicPreviewBlob(resource.id)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => active && onUnavailable())
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [onUnavailable, resource.id])

  if (!url) return <RefreshCw size={18} className="animate-spin text-primary" aria-label="Loading image thumbnail" />
  return <img src={url} alt="" onError={onUnavailable} className="h-full w-full object-contain" />
}

export default function ResourceThumbnail({ resource, onOpen }) {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const extension = resourceExtension(resource)
  const isPdf = extension === 'pdf' || resource.mime_type === 'application/pdf'
  const isPptx = extension === 'pptx' || resource.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  const isImage = ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'webp'].includes(extension)
  const markUnavailable = useCallback(() => setUnavailable(true), [])

  useEffect(() => {
    const element = rootRef.current
    if (!element) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '160px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <button ref={rootRef} type="button" onClick={onOpen} className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-border bg-surface-secondary transition-colors hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" aria-label={`Preview ${resource.title || resource.name || 'document'}`}>
      {!visible || unavailable ? (
        <TypePlaceholder extension={extension} />
      ) : isPdf ? (
        <Suspense fallback={<TypePlaceholder extension={extension} />}>
          <PdfThumbnail resource={resource} onUnavailable={markUnavailable} />
        </Suspense>
      ) : isPptx ? (
        <Suspense fallback={<TypePlaceholder extension={extension} />}>
          <PptxThumbnail resource={resource} onUnavailable={markUnavailable} />
        </Suspense>
      ) : isImage ? (
        <ImageThumbnail resource={resource} onUnavailable={markUnavailable} />
      ) : (
        <TypePlaceholder extension={extension} />
      )}
    </button>
  )
}
