// Service Worker for 1-2 DRIVE
const CACHE_NAME = "12drive-v1"
const urlsToCache = ["/", "/logo.png"]

// Install event - cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)))
})

// Push event - show notification
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event)

  let notificationData = {
    title: "1-2 DRIVE Notification",
    body: "You have a new notification",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "default",
    requireInteraction: false,
  }

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() }
    } catch (e) {
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
    }),
  )
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event)
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow("/")
      }
    }),
  )
})
