import assert from 'node:assert/strict'
import test from 'node:test'
import { isSafeDocumentHref, resolveViewerKind, viewerKind } from '../filePreview.js'

const resource = (file_name, mime_type = null) => ({ file_name, name: file_name, mime_type })

test('selects local renderers for supported academic file types', () => {
  assert.equal(viewerKind(resource('exam.pdf')), 'pdf')
  assert.equal(viewerKind(resource('lab-manual.DOCX')), 'docx')
  assert.equal(viewerKind(resource('lecture-slides.pptx')), 'pptx')
  assert.equal(viewerKind(resource('spectrum.png')), 'image')
  assert.equal(viewerKind(resource('notes.txt')), 'text')
})

test('does not interpret HTML or arbitrary binaries as previewable content', () => {
  assert.equal(viewerKind(resource('untrusted.html')), 'unsupported')
  assert.equal(viewerKind(resource('archive.zip')), 'unsupported')
})

test('recovers a PDF preview from a migrated object with stale metadata', async () => {
  const blob = new Blob(['%PDF-1.7\n'], { type: 'application/octet-stream' })
  assert.equal(await resolveViewerKind(resource('lecture-note', 'application/octet-stream'), blob), 'pdf')
})

test('uses a PPTX filename before stale PDF response metadata', () => {
  assert.equal(
    viewerKind(resource('lecture-slides.pptx'), 'application/pdf'),
    'pptx',
  )
})

test('allows ordinary document links and rejects executable URL schemes', () => {
  assert.equal(isSafeDocumentHref('https://example.edu/notes'), true)
  assert.equal(isSafeDocumentHref('mailto:lecturer@example.edu'), true)
  assert.equal(isSafeDocumentHref('#section-2'), true)
  assert.equal(isSafeDocumentHref('javascript:alert(1)'), false)
  assert.equal(isSafeDocumentHref('data:text/html,<script>alert(1)</script>'), false)
})
