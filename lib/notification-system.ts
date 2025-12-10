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
  const supabase = createClient()

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error } = await query

    if (error) {
      // Check if it's a missing table error
      if (error.message?.includes("Could not find the table")) {
        console.log("[Notifications] Table not yet created. Please run the database migration script.")
        return []
      }
      console.error("[Notifications] Error fetching notifications:", error)
      return []
    }

    return data.map(mapNotificationFromDB)
  } catch (err) {
    console.error("[Notifications] Unexpected error:", err)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)

  if (error) {
    console.error("[Notifications] Error marking notification as read:", error)
    return false
  }

  return true
}

export async function markAllNotificationsAsRead(userEmail: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_email", userEmail)
    .eq("is_read", false)

  if (error) {
    console.error("[Notifications] Error marking all notifications as read:", error)
    return false
  }

  return true
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) {
    console.error("[Notifications] Error deleting notification:", error)
    return false
  }

  return true
}

export async function getUnreadCount(userEmail: string): Promise<number> {
  const supabase = createClient()

  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_email", userEmail)
      .eq("is_read", false)

    if (error) {
      // Check if it's a missing table error
      if (error.message?.includes("Could not find the table")) {
        return 0
      }
      console.error("[Notifications] Error getting unread count:", error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error("[Notifications] Unexpected error:", err)
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
