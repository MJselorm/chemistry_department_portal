export const COOKIE_PREFERENCES_KEY = 'chemhub-cookie-preferences'
export const COOKIE_PREFERENCES_VERSION = 1

export function parseCookiePreferences(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed?.version !== COOKIE_PREFERENCES_VERSION || typeof parsed.functional !== 'boolean') return null
    return parsed
  } catch {
    return null
  }
}

export function getCookiePreferences(storage = globalThis.localStorage) {
  try {
    return parseCookiePreferences(storage?.getItem(COOKIE_PREFERENCES_KEY))
  } catch {
    return null
  }
}

export function preferenceStorageAllowed(storage = globalThis.localStorage) {
  return getCookiePreferences(storage)?.functional === true
}

export function saveCookiePreferences(functional, storage = globalThis.localStorage) {
  const preferences = {
    version: COOKIE_PREFERENCES_VERSION,
    essential: true,
    functional: Boolean(functional),
    analytics: false,
    updatedAt: new Date().toISOString(),
  }
  storage?.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
  if (!preferences.functional) {
    storage?.removeItem('chemhub-theme')
    storage?.removeItem('chemhub-sidebar-collapsed')
  }
  globalThis.window?.dispatchEvent(new CustomEvent('chemhub:cookie-preferences-changed', { detail: preferences }))
  return preferences
}

export function openCookiePreferences() {
  globalThis.window?.dispatchEvent(new CustomEvent('chemhub:open-cookie-preferences'))
}
