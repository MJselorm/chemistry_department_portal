import test from 'node:test'
import assert from 'node:assert/strict'
import { safeExternalHttpUrl } from '../safeUrl.js'

test('accepts ordinary HTTPS event links', () => {
  assert.equal(safeExternalHttpUrl('https://example.edu/register'), 'https://example.edu/register')
})

test('rejects executable and malformed event links', () => {
  assert.equal(safeExternalHttpUrl('javascript:alert(1)'), null)
  assert.equal(safeExternalHttpUrl('//example.edu/register'), null)
  assert.equal(safeExternalHttpUrl('https://user:password@example.edu/register'), null)
  assert.equal(safeExternalHttpUrl('not a url'), null)
})
