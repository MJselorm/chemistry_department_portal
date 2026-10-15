import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveViewerKind, viewerKind } from '../filePreview.js'

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
