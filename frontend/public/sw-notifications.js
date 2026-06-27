/* global self, clients */

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const payload = event.notification?.data || {}
  const targetUrl = String(payload.targetUrl || '/view/live-earthquake-map')

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const match = windowClients.find((client) => 'focus' in client)
      if (match) {
        return match.focus().then(() => {
          try {
            match.postMessage({ type: 'r360-eq-notification-focus', payload })
          } catch {
            /* ignore postMessage failures */
          }
          if ('navigate' in match && targetUrl) return match.navigate(targetUrl)
          return undefined
        })
      }
      return clients.openWindow(targetUrl)
    }),
  )
})
