// Push Notifications Manager

export interface NotificationPermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!("Notification" in window)) {
    console.log("[Notifications] Not supported in this browser")
    return { granted: false, denied: true, prompt: false }
  }

  if (!("serviceWorker" in navigator)) {
    console.log("[Notifications] Service Worker not supported")
    return { granted: false, denied: true, prompt: false }
  }

  try {
    const permission = await Notification.requestPermission()
    console.log("[Notifications] Permission:", permission)

    return {
      granted: permission === "granted",
      denied: permission === "denied",
      prompt: permission === "default",
    }
  } catch (error) {
    console.error("[Notifications] Error requesting permission:", error)
    return { granted: false, denied: true, prompt: false }
  }
}

export function getNotificationPermissionState(): NotificationPermissionState {
  if (!("Notification" in window)) {
    return { granted: false, denied: true, prompt: false }
  }

  const permission = Notification.permission

  return {
    granted: permission === "granted",
    denied: permission === "denied",
    prompt: permission === "default",
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[SW] Service Worker not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("[SW] Service Worker registered:", registration)
    return registration
  } catch (error) {
    console.error("[SW] Service Worker registration failed:", error)
    return null
  }
}

export async function showLocalNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window)) {
    console.log("[Notifications] Not supported")
    return
  }

  if (Notification.permission !== "granted") {
    console.log("[Notifications] Permission not granted")
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: tag || "reminder",
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
    console.log("[Notifications] Local notification shown")
  } catch (error) {
    console.error("[Notifications] Error showing notification:", error)
  }
}

import { createNotification } from "./notification-system"
import { showLocalNotification as showBrowserNotification } from "./notifications"

export async function sendNotification(params: {
  userEmail: string
  userRole: "owner" | "customer"
  type: "tax_expiry" | "booking_start" | "booking_end" | "booking_created" | "booking_cancelled" | "general"
  title: string
  message: string
  relatedId?: string
  relatedType?: "vehicle" | "condo" | "booking"
  sendImmediately?: boolean
}) {
  // Save to database
  const notification = await createNotification({
    userEmail: params.userEmail,
    userRole: params.userRole,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedId: params.relatedId,
    relatedType: params.relatedType,
  })

  // If user has notifications enabled and we should send immediately, show browser notification
  if (params.sendImmediately !== false) {
    const state = getNotificationPermissionState()
    if (state.granted) {
      showBrowserNotification(params.title, params.message, params.relatedId)
    }
  }

  return notification
}

export function checkAndNotifyReminders(reminders: any[]) {
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  reminders.forEach((reminder) => {
    const reminderDate = new Date(reminder.date)
    const daysUntil = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Notify for urgent reminders (today or tomorrow)
    if (daysUntil <= 1 && daysUntil >= 0) {
      const notificationKey = `notified-${reminder.id}-${today}`

      // Check if we already notified today
      if (localStorage.getItem(notificationKey)) {
        return
      }

      // Show notification
      showLocalNotification(reminder.title, reminder.description, reminder.id)

      // Mark as notified
      localStorage.setItem(notificationKey, "true")
    }
  })
}
