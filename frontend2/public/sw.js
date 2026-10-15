self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch { payload = {} }
  event.waitUntil(self.registration.showNotification(payload.title || 'Chemistry Hub update', {
    body: payload.body || 'Open Chemistry Hub to view this update.',
    icon: '/gscs-logo-circle.png', badge: '/favicon.png',
    data: { url: typeof payload.url === 'string' && payload.url.startsWith('/') && !payload.url.startsWith('//') && !payload.url.includes('\\') ? payload.url : '/dashboard' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.location.origin))
    if (existing) { existing.navigate(target); return existing.focus() }
    return clients.openWindow(target)
  }))
})
