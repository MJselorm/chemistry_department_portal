import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { FileImage, FileText, Presentation } from 'lucide-react'
import { getAcademicPreviewLink } from './resourcePreviewLinks'
import { resourceExtension } from './filePreview'

const PdfThumbnail = lazy(() => import('./PdfThumbnail'))

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
    getAcademicPreviewLink(resource.id)
      .then((previewUrl) => active && setUrl(previewUrl))
      .catch(() => active && onUnavailable())
    return () => { active = false }
  }, [onUnavailable, resource.id])

  if (!url) return null
  return <img src={url} alt="" onError={onUnavailable} className="h-full w-full object-contain" />
}

export default function ResourceThumbnail({ resource }) {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const extension = resourceExtension(resource)
  const isPdf = extension === 'pdf' || resource.mime_type === 'application/pdf'
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
    <div ref={rootRef} className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-border bg-surface-secondary">
      {!visible || unavailable ? (
        <TypePlaceholder extension={extension} />
      ) : isPdf ? (
        <Suspense fallback={<TypePlaceholder extension={extension} />}>
          <PdfThumbnail resource={resource} onUnavailable={markUnavailable} />
        </Suspense>
      ) : isImage ? (
        <ImageThumbnail resource={resource} onUnavailable={markUnavailable} />
      ) : (
        <TypePlaceholder extension={extension} />
      )}
    </div>
  )
}
