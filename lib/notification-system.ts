import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  userEmail: string
  userRole: "owner" | "customer"
  type: "tax_expiry" | "booking_start" | "booking_end" | "booking_created" | "booking_cancelled" | "general"
  title: string
  message: string
  relatedId?: string
  relatedType?: "vehicle" | "condo" | "booking"
  isRead: boolean
  isSent: boolean
  sendAt: string
  createdAt: string
  readAt?: string
}

interface CreateNotificationParams {
  userEmail: string
  userRole: "owner" | "customer"
  type: Notification["type"]
  title: string
  message: string
  relatedId?: string
  relatedType?: "vehicle" | "condo" | "booking"
  sendAt?: Date
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_email: params.userEmail,
      user_role: params.userRole,
      type: params.type,
      title: params.title,
      message: params.message,
      related_id: params.relatedId,
      related_type: params.relatedType,
      send_at: params.sendAt?.toISOString() || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[Notifications] Error creating notification:", error)
    return null
  }

  return mapNotificationFromDB(data)
}

export async function getNotifications(userEmail: string, unreadOnly = false): Promise<Notification[]> {
  try {
    const url = unreadOnly ? `/api/notifications?action=getUnread` : `/api/notifications`

    const response = await fetch(url)
    if (!response.ok) {
      console.log("[Notifications] API returned error, table may not be ready yet")
      return []
    }

    const { notifications } = await response.json()
    return notifications || []
  } catch (err: any) {
    console.log("[Notifications] Error fetching notifications:", err.message)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", id: notificationId }),
    })
    return response.ok
  } catch (error) {
    console.error("[Notifications] Error marking notification as read:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(userEmail: string): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead", userEmail }),
    })
    return response.ok
  } catch (error) {
    console.error("[Notifications] Error marking all notifications as read:", error)
    return false
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: notificationId }),
    })
    return response.ok
  } catch (error) {
    console.error("[Notifications] Error deleting notification:", error)
    return false
  }
}

export async function getUnreadCount(userEmail: string): Promise<number> {
  try {
    const response = await fetch("/api/notifications?action=count")
    if (!response.ok) return 0

    const { count } = await response.json()
    return count || 0
  } catch (err: any) {
    return 0
  }
}

// Helper function to map database rows to Notification type
function mapNotificationFromDB(data: any): Notification {
  return {
    id: data.id,
    userEmail: data.user_email,
    userRole: data.user_role,
    type: data.type,
    title: data.title,
    message: data.message,
    relatedId: data.related_id,
    relatedType: data.related_type,
    isRead: data.is_read,
    isSent: data.is_sent,
    sendAt: data.send_at,
    createdAt: data.created_at,
    readAt: data.read_at,
  }
}

export async function sendNotificationToUser(
  email: string,
  notification: {
    type: Notification["type"]
    title: string
    message: string
    relatedId?: string
    relatedType?: "vehicle" | "condo" | "booking"
  },
): Promise<boolean> {
  try {
    const result = await createNotification({
      userEmail: email,
      userRole: "customer",
      ...notification,
    })
    return !!result
  } catch (error) {
    console.error("[Notifications] Error sending notification to user:", error)
    return false
  }
}

export async function sendNotificationToAll(notification: {
  type: Notification["type"]
  title: string
  message: string
  relatedId?: string
  relatedType?: "vehicle" | "condo" | "booking"
}): Promise<{ sent: number; failed: number }> {
  try {
    const supabase = createClient()

    // Get all unique customer emails from customers table
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("email")
      .not("email", "is", null)

    if (customersError) {
      console.error("[Notifications] Error fetching customers:", customersError)
      return { sent: 0, failed: 0 }
    }

    // Get all unique emails from profiles table (registered users)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .not("email", "is", null)

    if (profilesError) {
      console.error("[Notifications] Error fetching profiles:", profilesError)
    }

    // Combine and deduplicate emails
    const allEmails = new Set<string>()
    customers?.forEach((c) => c.email && allEmails.add(c.email))
    profiles?.forEach((p) => p.email && allEmails.add(p.email))

    // Filter out owner email
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
    if (ownerEmail) {
      allEmails.delete(ownerEmail)
    }

    let sent = 0
    let failed = 0

    // Send to all users
    for (const email of allEmails) {
      const success = await sendNotificationToUser(email, notification)
      if (success) {
        sent++
      } else {
        failed++
      }
    }

    console.log(`[Notifications] Sent ${sent} notifications, ${failed} failed`)
    return { sent, failed }
  } catch (error) {
    console.error("[Notifications] Error sending notification to all:", error)
    return { sent: 0, failed: 0 }
  }
}
