"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/notification-system"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface NotificationCenterProps {
  userEmail: string
}

export function NotificationCenter({ userEmail }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const loadNotifications = useCallback(async () => {
    // Early return if no user email
    if (!userEmail) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getNotifications(userEmail)
      const count = await getUnreadCount(userEmail)
      setNotifications(data)
      setUnreadCount(count)
    } catch (error) {
      console.error("[NotificationCenter] Error loading notifications:", error)
      // Don't show error to user - fail silently until table is created
    } finally {
      setLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    if (userEmail) {
      loadNotifications()
      // Refresh every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [userEmail, loadNotifications])

  async function handleMarkAsRead(notificationId: string) {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      await loadNotifications()
    }
  }

  async function handleMarkAllAsRead() {
    const success = await markAllNotificationsAsRead(userEmail)
    if (success) {
      toast({
        title: "All marked as read",
        description: "All notifications have been marked as read",
      })
      await loadNotifications()
    }
  }

  async function handleDelete(notificationId: string) {
    const success = await deleteNotification(notificationId)
    if (success) {
      toast({
        title: "Notification deleted",
        description: "The notification has been removed",
      })
      await loadNotifications()
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "tax_expiry":
        return "🚗"
      case "booking_start":
        return "🎉"
      case "booking_end":
        return "📅"
      case "booking_created":
        return "✅"
      case "booking_cancelled":
        return "❌"
      default:
        return "ℹ️"
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-accent">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 text-xs">
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.isRead ? "bg-card border-border" : "bg-accent/50 border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{notification.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
