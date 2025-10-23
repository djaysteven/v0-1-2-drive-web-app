// Service Worker for Push Notifications
const CACHE_NAME = "1-2-drive-v1"

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker installing...")
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activating...")
  event.waitUntil(self.clients.claim())
})

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const data = event.data ? event.data.json() : {}
  const title = data.title || "1-2 DRIVE Reminder"
  const options = {
    body: data.body || "You have a new reminder",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: data.tag || "reminder",
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")
  event.notification.close()

  event.waitUntil(clients.openWindow("/"))
})
