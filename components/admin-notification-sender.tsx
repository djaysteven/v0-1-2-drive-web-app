"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendNotificationToUser, sendNotificationToAll } from "@/lib/notification-system"
import { Bell, Users, User } from "lucide-react"

export function AdminNotificationSender() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [recipient, setRecipient] = useState<"all" | "email">("all")
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!title || !message) {
      alert("Please fill in title and message")
      return
    }

    if (recipient === "email" && !email) {
      alert("Please enter recipient email")
      return
    }

    setSending(true)
    try {
      if (recipient === "all") {
        await sendNotificationToAll({
          type: "general",
          title,
          message,
        })
        alert("Notification sent to all users!")
      } else {
        await sendNotificationToUser(email, {
          type: "general",
          title,
          message,
        })
        alert(`Notification sent to ${email}!`)
      }

      // Reset form
      setTitle("")
      setMessage("")
      setEmail("")
    } catch (error) {
      console.error("[AdminNotificationSender] Error sending notification:", error)
      alert("Failed to send notification. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Send Notifications</h3>
          <p className="text-sm text-muted-foreground">Push notifications to customers</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="recipient">Send To</Label>
          <Select value={recipient} onValueChange={(value: "all" | "email") => setRecipient(value)}>
            <SelectTrigger id="recipient">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Users
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Specific User
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recipient === "email" && (
          <div>
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="title">Notification Title</Label>
          <Input id="title" placeholder="Important Update" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Your booking is confirmed for tomorrow..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? "Sending..." : "Send Notification"}
        </Button>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">iOS Users:</p>
          <p>
            Push notifications work on iOS 16.4+ only after installing the app to the home screen ("Add to Home
            Screen"). They won't work in Safari browser.
          </p>
        </div>
      </div>
    </Card>
  )
}
