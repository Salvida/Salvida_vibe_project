/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  let payload: { title: string; body: string } = { title: 'Salvida', body: '' }
  try {
    payload = event.data ? event.data.json() : payload
  } catch {
    payload.body = event.data ? event.data.text() : ''
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Salvida', {
      body: payload.body || '',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: payload,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(self.location.origin))
        if (existing) return existing.focus()
        return self.clients.openWindow('/')
      })
  )
})
