"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Bell, CheckCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  registerServiceWorker,
  showLocalNotification,
} from "@/lib/notifications"

export function NotificationSettings() {
  const [permissionState, setPermissionState] = useState({ granted: false, denied: false, prompt: false })
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window

    setBrowserSupported(isSupported)

    if (!isSupported) {
      console.log("[Notifications] Browser does not support push notifications (this is normal for iOS Safari)")
      return
    }

    // Check current permission state
    const state = getNotificationPermissionState()
    setPermissionState(state)
    setNotificationsEnabled(state.granted)

    // Register service worker if supported
    if (state.granted) {
      registerServiceWorker()
    }
  }, [])

  async function handleEnableNotifications() {
    setRequesting(true)

    try {
      // Register service worker first
      const registration = await registerServiceWorker()
      if (!registration) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in this browser",
          variant: "destructive",
        })
        setRequesting(false)
        return
      }

      // Request permission
      const state = await requestNotificationPermission()
      setPermissionState(state)
      setNotificationsEnabled(state.granted)

      if (state.granted) {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive reminders for bookings and tax renewals",
        })

        // Show a test notification
        setTimeout(() => {
          showLocalNotification(
            "Notifications Enabled!",
            "You'll now receive reminders for upcoming bookings and tax renewals",
          )
        }, 1000)
      } else if (state.denied) {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Notifications] Error:", error)
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      })
    } finally {
      setRequesting(false)
    }
  }

  function handleDisableNotifications() {
    setNotificationsEnabled(false)
    toast({
      title: "Notifications Disabled",
      description: "You won't receive push notifications anymore",
    })
  }

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Get notified about upcoming bookings and tax renewals
            </CardDescription>
          </div>
          {permissionState.granted && browserSupported && <CheckCircle className="h-5 w-5 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">In-App Notifications Active</p>
              <p className="text-muted-foreground">
                You'll see notifications in the bell icon at the top of the page. They update automatically every 30
                seconds.
              </p>
            </div>
          </div>
        </div>

        {!browserSupported ? (
          <div className="p-3 rounded-lg bg-muted border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Browser Push Notifications:</strong> Not available on this browser (iOS Safari, some mobile
              browsers). You'll still receive in-app notifications.
            </p>
          </div>
        ) : (
          <>
            {permissionState.denied && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">
                  Browser notifications are blocked. Please enable them in your browser settings to receive push alerts.
                </p>
              </div>
            )}

            {!permissionState.granted && !permissionState.denied && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Optional: Enable Browser Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get push alerts even when the app is closed for:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Upcoming bookings (1 day before)</li>
                  <li>• Vehicle returns (same day)</li>
                  <li>• Tax renewals (7 days before)</li>
                </ul>
                <Button onClick={handleEnableNotifications} disabled={requesting} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  {requesting ? "Requesting..." : "Enable Push Notifications"}
                </Button>
              </div>
            )}

            {permissionState.granted && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Push Notifications Active</span>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleEnableNotifications()
                      } else {
                        handleDisableNotifications()
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll receive push notifications for upcoming bookings, returns, and tax renewals
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
