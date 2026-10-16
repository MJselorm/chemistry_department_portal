import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchAcademicPreviewBlob } from './resourcePreviewLinks'

const thumbnailCache = new Map()
const MAX_CACHED_THUMBNAILS = 12

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), { once: true })
    reader.addEventListener('error', () => reject(reader.error), { once: true })
    reader.readAsDataURL(blob)
  })
}

async function inlineSlideAssets(svg) {
  const attributes = ['href', 'src', 'xlink:href']
  const tasks = []
  svg.querySelectorAll('*').forEach((element) => {
    attributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value?.startsWith('blob:')) return
      tasks.push(
        fetch(value)
          .then((response) => response.blob())
          .then(dataUrl)
          .then((inlineUrl) => element.setAttribute(attribute, inlineUrl)),
      )
    })
  })
  await Promise.all(tasks)
}

async function generateThumbnail(resourceId) {
  const source = await fetchAcademicPreviewBlob(resourceId)
  const { loadPresentation, renderSlideThumbnail } = await import('pptx-viewer')
  const presentation = await loadPresentation(await source.arrayBuffer())
  try {
    if (!presentation.slides?.length) throw new Error('The presentation has no readable slides.')
    const svg = renderSlideThumbnail(presentation.slides[0], presentation.slideSize, 480)
    await inlineSlideAssets(svg)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    const serialized = new XMLSerializer().serializeToString(svg)
    return new Blob([serialized], { type: 'image/svg+xml' })
  } finally {
    presentation.cleanup?.()
  }
}

function getThumbnail(resourceId) {
  const cached = thumbnailCache.get(resourceId)
  if (cached) return cached

  const promise = generateThumbnail(resourceId).catch((error) => {
    thumbnailCache.delete(resourceId)
    throw error
  })
  thumbnailCache.set(resourceId, promise)

  if (thumbnailCache.size > MAX_CACHED_THUMBNAILS) {
    thumbnailCache.delete(thumbnailCache.keys().next().value)
  }
  return promise
}

export default function PptxThumbnail({ resource, onUnavailable }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    getThumbnail(resource.id)
      .then((thumbnail) => {
        if (!active) return
        objectUrl = URL.createObjectURL(thumbnail)
        setUrl(objectUrl)
      })
      .catch(() => active && onUnavailable())

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [onUnavailable, resource.id])

  if (!url) return <RefreshCw size={18} className="animate-spin text-primary" aria-label="Loading presentation thumbnail" />
  return <img src={url} alt="" className="h-full w-full object-contain" onError={onUnavailable} />
}
