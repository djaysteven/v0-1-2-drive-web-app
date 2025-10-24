"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Bell, CheckCircle, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getReminders, updateVehicle } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { checkAndNotifyReminders } from "@/lib/notifications"
import { bookingsApi } from "@/lib/api"

interface Reminder {
  id: string
  type: "tax" | "booking_start" | "return"
  title: string
  description: string
  date: string
  severity: "warning" | "urgent"
  photo?: string
  plate?: string
  bookedThrough?: string
  source?: string
}

export function RemindersCard() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const [renewingTax, setRenewingTax] = useState<string | null>(null)
  const [deletingBooking, setDeletingBooking] = useState<string | null>(null)
  const { toast } = useToast()

  async function loadReminders() {
    try {
      const { taxReminders, bookingStartReminders, returnReminders } = await getReminders()

      const newReminders: Reminder[] = []

      taxReminders.forEach((reminder) => {
        newReminders.push({
          id: `tax-${reminder.vehicleId}`,
          type: "tax",
          title: `Tax Expiring: ${reminder.vehicleName}`,
          description:
            reminder.daysUntil < 0
              ? `Tax expired ${Math.abs(reminder.daysUntil)} days ago`
              : reminder.daysUntil === 0
                ? "Tax expires today"
                : `Tax expires in ${reminder.daysUntil} days`,
          date: reminder.expiryDate,
          severity: reminder.daysUntil <= 7 ? "urgent" : "warning",
          photo: reminder.vehiclePhoto,
          plate: reminder.vehiclePlate,
        })
      })

      bookingStartReminders.forEach((reminder) => {
        const customerPart = reminder.customerName ? ` for ${reminder.customerName}` : ""
        newReminders.push({
          id: `booking-start-${reminder.bookingId}`,
          type: "booking_start",
          title: `Upcoming Booking: ${reminder.assetName}`,
          description:
            reminder.daysUntil === 0
              ? `Booking starts today${customerPart}`
              : reminder.daysUntil === 1
                ? `Booking starts tomorrow${customerPart}`
                : `Booking starts in ${reminder.daysUntil} days${customerPart}`,
          date: reminder.startDate,
          severity: reminder.daysUntil <= 1 ? "urgent" : "warning",
          photo: reminder.assetPhoto,
          plate: reminder.assetPlate,
          bookedThrough: reminder.bookedThrough,
          source: reminder.source,
        })
      })

      returnReminders.forEach((reminder) => {
        const customerPart = reminder.customerName ? ` from ${reminder.customerName}` : ""
        newReminders.push({
          id: `return-${reminder.bookingId}`,
          type: "return",
          title: `Upcoming Return: ${reminder.assetName}`,
          description:
            reminder.daysUntil < 0
              ? `Return was ${Math.abs(reminder.daysUntil)} days ago${customerPart}`
              : reminder.daysUntil === 0
                ? `Return is today${customerPart}`
                : reminder.daysUntil === 1
                  ? `Return is tomorrow${customerPart}`
                  : `Return in ${reminder.daysUntil} days${customerPart}`,
          date: reminder.returnDate,
          severity: reminder.isUrgent ? "urgent" : "warning",
          photo: reminder.assetPhoto,
          plate: reminder.assetPlate,
          bookedThrough: reminder.bookedThrough,
          source: reminder.source,
        })
      })

      newReminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setReminders(newReminders)

      checkAndNotifyReminders(newReminders)
    } catch (error) {
      console.error("[v0] Failed to load reminders:", error)
      setDbError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [])

  async function handleRenewTax(reminderId: string) {
    const vehicleId = reminderId.replace("tax-", "")

    setRenewingTax(vehicleId)

    try {
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      const taxOverrideDate = oneYearFromNow.toISOString().split("T")[0]

      await updateVehicle(vehicleId, { taxOverrideUntil: taxOverrideDate })

      toast({
        title: "Tax Renewed",
        description: "Tax reminder dismissed for 1 year",
      })

      await loadReminders()
    } catch (error) {
      console.error("[v0] Failed to dismiss tax reminder:", error)
      toast({
        title: "Error",
        description: "Failed to dismiss tax reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRenewingTax(null)
    }
  }

  async function handleDelivered(reminderId: string) {
    const bookingId = reminderId.replace("booking-start-", "").replace("return-", "")

    setDeletingBooking(bookingId)

    try {
      await bookingsApi.delete(bookingId)

      toast({
        title: "Booking Delivered",
        description: "Booking has been marked as delivered and removed from the list",
      })

      await loadReminders()
    } catch (error) {
      console.error("[v0] Failed to delete booking:", error)
      toast({
        title: "Error",
        description: "Failed to mark booking as delivered. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingBooking(null)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Reminders</CardTitle>
          <CardDescription className="text-muted-foreground">Loading reminders...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (dbError) {
    return (
      <Card className="rounded-2xl border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground">Reminders</CardTitle>
          <CardDescription className="text-muted-foreground">Database not set up</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            The database tables haven't been created yet. Run the SQL scripts in the scripts/ folder to set up your
            database.
          </p>
          <p className="text-xs text-muted-foreground">
            Files: scripts/001_create_schema.sql and scripts/002_create_profile_trigger.sql
          </p>
        </CardContent>
      </Card>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Reminders</CardTitle>
              <CardDescription className="text-muted-foreground">No upcoming reminders</CardDescription>
            </div>
            <Badge variant="destructive" className="rounded-full">
              {reminders.filter((r) => r.severity === "urgent").length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All clear! No tax expiries, upcoming bookings, or returns in the next 7-30 days.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: string, severity: string) => {
    const className = `h-5 w-5 ${severity === "urgent" ? "text-destructive" : "text-yellow-500"}`
    switch (type) {
      case "tax":
        return <FileText className={className} />
      case "booking_start":
        return <Bell className={className} />
      case "return":
        return <Calendar className={className} />
      default:
        return <Calendar className={className} />
    }
  }

  const getReminderColor = (reminder: Reminder) => {
    if (reminder.type === "tax") {
      const daysUntil = Math.ceil((new Date(reminder.date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))

      if (daysUntil <= 0) {
        return "bg-destructive/10 border-destructive/30"
      }

      return "bg-amber-400/10 border-amber-400/30"
    }

    if (reminder.plate) {
      return reminder.severity === "urgent" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-500/10 border-blue-500/30"
    }

    return reminder.severity === "urgent"
      ? "bg-purple-500/10 border-purple-500/30"
      : "bg-purple-500/10 border-purple-500/30"
  }

  const isUrgentBooking = (reminder: Reminder) => {
    if (reminder.type !== "booking_start" && reminder.type !== "return") {
      return false
    }
    const daysUntil = Math.ceil((new Date(reminder.date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
    return daysUntil <= 3 && daysUntil >= 0
  }

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Reminders</CardTitle>
            <CardDescription className="text-muted-foreground">
              {reminders.length} upcoming {reminders.length === 1 ? "reminder" : "reminders"}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="rounded-full">
            {reminders.filter((r) => r.severity === "urgent").length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${getReminderColor(reminder)} ${
              isUrgentBooking(reminder) ? "animate-pulse-glow" : ""
            }`}
          >
            {reminder.photo && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                <Image src={reminder.photo || "/placeholder.svg"} alt={reminder.title} fill className="object-cover" />
                {(reminder.bookedThrough === "Airbnb" || reminder.source === "airbnb") && (
                  <div className="absolute bottom-1 right-1 bg-white/90 rounded px-1.5 py-0.5 shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF5A5F">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm5.6-10.8c-.4-.8-1.2-1.4-2.1-1.4-.9 0-1.7.6-2.1 1.4l-1.4 2.8-1.4-2.8c-.4-.8-1.2-1.4-2.1-1.4-.9 0-1.7.6-2.1 1.4L4 16.8h2.4l1.4-2.8 1.4 2.8h2.4l1.4-2.8 1.4 2.8h2.4l-2.4-5.6z" />
                    </svg>
                  </div>
                )}
              </div>
            )}
            <div className="mt-0.5">{getIcon(reminder.type, reminder.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm text-foreground leading-tight">{reminder.title}</p>
                  {reminder.plate && <p className="text-xs text-muted-foreground font-mono mt-0.5">{reminder.plate}</p>}
                </div>
                <Badge
                  variant={reminder.severity === "urgent" ? "destructive" : "secondary"}
                  className="shrink-0 text-xs rounded-full"
                >
                  {reminder.severity === "urgent" ? "Urgent" : "Warning"}
                </Badge>
              </div>
              <p
                className={`mt-1.5 ${
                  reminder.type === "booking_start" || reminder.type === "return" || reminder.type === "tax"
                    ? "text-sm font-bold text-foreground"
                    : "text-xs text-muted-foreground"
                }`}
              >
                {reminder.description}
              </p>
              <p className="text-sm font-bold text-foreground mt-2">
                {new Date(reminder.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="flex gap-2 mt-2">
                {reminder.type === "tax" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-transparent"
                    onClick={() => handleRenewTax(reminder.id)}
                    disabled={renewingTax === reminder.id.replace("tax-", "")}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {renewingTax === reminder.id.replace("tax-", "") ? "Processing..." : "Tax Renewed"}
                  </Button>
                )}
                {(reminder.type === "booking_start" || reminder.type === "return") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-transparent"
                    onClick={() => handleDelivered(reminder.id)}
                    disabled={deletingBooking === reminder.id.replace("booking-start-", "").replace("return-", "")}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {deletingBooking === reminder.id.replace("booking-start-", "").replace("return-", "")
                      ? "Processing..."
                      : "Delivered"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
