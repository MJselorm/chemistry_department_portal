import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COOKIE_PREFERENCES_KEY,
  getCookiePreferences,
  parseCookiePreferences,
  preferenceStorageAllowed,
  saveCookiePreferences,
} from '../cookiePreferences.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('rejects missing, malformed, and outdated consent records', () => {
  assert.equal(parseCookiePreferences(null), null)
  assert.equal(parseCookiePreferences('{broken'), null)
  assert.equal(parseCookiePreferences(JSON.stringify({ version: 0, functional: true })), null)
})

test('persists an explicit optional-storage choice', () => {
  const storage = memoryStorage()
  saveCookiePreferences(true, storage)
  const saved = getCookiePreferences(storage)
  assert.equal(saved.essential, true)
  assert.equal(saved.functional, true)
  assert.equal(saved.analytics, false)
  assert.equal(preferenceStorageAllowed(storage), true)
})

test('rejecting optional storage clears saved visual preferences', () => {
  const storage = memoryStorage({
    'chemhub-theme': 'dark',
    'chemhub-sidebar-collapsed': 'true',
  })
  saveCookiePreferences(false, storage)
  assert.equal(storage.getItem('chemhub-theme'), null)
  assert.equal(storage.getItem('chemhub-sidebar-collapsed'), null)
  assert.equal(JSON.parse(storage.getItem(COOKIE_PREFERENCES_KEY)).functional, false)
})
