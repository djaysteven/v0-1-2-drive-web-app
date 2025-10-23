"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingWizard } from "@/components/booking-wizard"
import { vehiclesApi, condosApi, bookingsApi, customersApi } from "@/lib/api"
import type { Vehicle, Condo, Booking, Customer } from "@/lib/types"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"

export default function CalendarPage() {
  const [view, setView] = useState<"timeline" | "agenda">("timeline")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehiclesData, condosData, bookingsData, customersData] = await Promise.all([
        vehiclesApi.getAll(),
        condosApi.getAll(),
        bookingsApi.getAll(),
        customersApi.getAll(),
      ])

      console.log("[v0] ===== CALENDAR DATA LOADED =====")
      console.log("[v0] Vehicles:", vehiclesData.length, vehiclesData)
      console.log("[v0] Condos:", condosData.length, condosData)
      console.log("[v0] Bookings:", bookingsData.length, bookingsData)
      console.log("[v0] Customers:", customersData.length)

      bookingsData.forEach((b, i) => {
        console.log(`[v0] Booking ${i + 1}:`, {
          id: b.id,
          assetType: b.assetType,
          assetId: b.assetId,
          vehicleId: b.vehicleId,
          condoId: b.condoId,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
          customerName: b.customerName,
        })
      })

      setVehicles(vehiclesData)
      setCondos(condosData)
      setBookings(bookingsData)
      setCustomers(customersData)
    } catch (error) {
      console.error("[v0] Failed to load calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInView = () => {
    const days = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getBookingsForAsset = (assetId: string, assetType: "vehicle" | "condo") => {
    console.log(`[v0] Looking for bookings for ${assetType} ${assetId}`)

    const filtered = bookings.filter((b) => {
      const idMatch = b.assetId === assetId
      const typeMatch = b.assetType === assetType
      const notCancelled = b.status !== "cancelled"
      const matches = idMatch && typeMatch && notCancelled

      console.log(`[v0] Checking booking ${b.id}:`, {
        bookingAssetId: b.assetId,
        bookingAssetType: b.assetType,
        targetAssetId: assetId,
        targetAssetType: assetType,
        idMatch,
        typeMatch,
        notCancelled,
        matches,
      })

      return matches
    })

    console.log(`[v0] Found ${filtered.length} bookings for ${assetType} ${assetId}`)
    return filtered
  }

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || "Unknown"
  }

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-primary/20 text-primary border-primary/30",
    checked_out: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    returned: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-destructive/20 text-destructive border-destructive/30",
    active: "bg-primary/20 text-primary border-primary/30",
  }

  const days = getDaysInView()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allAssets = [
    ...vehicles.map((v) => ({
      ...v,
      type: "vehicle" as const,
      displayName: `${v.name} ${v.plate ? `(${v.plate})` : ""}`,
    })),
    ...condos.map((c) => ({ ...c, type: "condo" as const, displayName: `${c.building} ${c.unitNo}` })),
  ]

  const monthYear = currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const todayFormatted = today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  if (loading) {
    return (
      <AuthGuard allowedRoles={["owner"]}>
        <AppShell header={<h1 className="text-xl font-bold text-foreground">Calendar</h1>}>
          <div className="container mx-auto p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["owner"]}>
      <AppShell
        header={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">Calendar</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                Today: {todayFormatted}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setCurrentDate(newDate)
                }}
                className="rounded-xl bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-xl bg-transparent min-w-[120px]"
              >
                {monthYear}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentDate)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setCurrentDate(newDate)
                }}
                className="rounded-xl bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        }
        actions={
          <Button size="sm" className="gap-2" onClick={() => setBookingWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        }
      >
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
          </Tabs>

          {view === "timeline" ? (
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                {/* Header with dates */}
                <div
                  className="grid gap-1 mb-4 sticky top-0 bg-background z-10 pb-2"
                  style={{ gridTemplateColumns: `150px repeat(${days.length}, minmax(30px, 1fr))` }}
                >
                  <div className="font-semibold text-xs text-muted-foreground">Asset</div>
                  {days.map((day) => {
                    const isToday = day.getTime() === today.getTime()
                    return (
                      <div
                        key={day.toISOString()}
                        className={`text-center text-xs ${isToday ? "text-primary font-bold bg-primary/10 rounded-md py-1" : "text-muted-foreground"}`}
                      >
                        <div className="hidden sm:block">
                          {day.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 1)}
                        </div>
                        <div className={isToday ? "text-primary" : ""}>{day.getDate()}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Asset rows */}
                <div className="space-y-1">
                  {allAssets.map((asset) => {
                    const assetBookings = getBookingsForAsset(asset.id, asset.type)

                    return (
                      <Card key={`${asset.type}-${asset.id}`} className="rounded-xl border-border bg-card">
                        <CardContent className="p-2">
                          <div
                            className="grid gap-1 items-center"
                            style={{ gridTemplateColumns: `150px repeat(${days.length}, minmax(30px, 1fr))` }}
                          >
                            <div className="text-xs font-medium text-foreground truncate pr-2">{asset.displayName}</div>
                            {days.map((day) => {
                              const dayStart = new Date(day)
                              dayStart.setHours(0, 0, 0, 0)
                              const dayEnd = new Date(day)
                              dayEnd.setHours(23, 59, 59, 999)

                              const dayBookings = assetBookings.filter((b) => {
                                const bookingStart = new Date(b.startDate)
                                bookingStart.setHours(0, 0, 0, 0)
                                const bookingEnd = new Date(b.endDate)
                                bookingEnd.setHours(23, 59, 59, 999)

                                const overlaps = dayStart <= bookingEnd && dayEnd >= bookingStart

                                if (overlaps) {
                                  console.log(`[v0] Day ${day.toLocaleDateString("en-GB")} overlaps with booking:`, {
                                    bookingId: b.id,
                                    bookingStart: bookingStart.toLocaleDateString("en-GB"),
                                    bookingEnd: bookingEnd.toLocaleDateString("en-GB"),
                                    dayStart: dayStart.toLocaleDateString("en-GB"),
                                    dayEnd: dayEnd.toLocaleDateString("en-GB"),
                                  })
                                }

                                return overlaps
                              })

                              const longTermFutureBooking = dayBookings.find((b) => {
                                if (!b.isLongTerm) return false

                                const bookingEnd = new Date(b.endDate)
                                bookingEnd.setHours(0, 0, 0, 0)

                                // Check if day is after the original booking end date
                                return dayStart > bookingEnd
                              })

                              // Check if day is within the original booking period
                              const isInOriginalPeriod = dayBookings.some((b) => {
                                const bookingStart = new Date(b.startDate)
                                bookingStart.setHours(0, 0, 0, 0)
                                const bookingEnd = new Date(b.endDate)
                                bookingEnd.setHours(23, 59, 59, 999)

                                return dayStart >= bookingStart && dayStart <= bookingEnd
                              })

                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`min-h-[40px] rounded border ${
                                    day.getTime() === today.getTime()
                                      ? "border-primary/20 bg-primary/5"
                                      : "border-border bg-secondary/50"
                                  } p-0.5 flex flex-col gap-0.5 items-center justify-center relative`}
                                >
                                  {isInOriginalPeriod && dayBookings.length > 0 && (
                                    <div
                                      className={`absolute inset-0.5 rounded ${
                                        dayBookings[0].source === "airbnb"
                                          ? "bg-[#FF5A5F]/70"
                                          : dayBookings[0].status === "confirmed"
                                            ? "bg-primary/70"
                                            : dayBookings[0].status === "pending"
                                              ? "bg-yellow-500/70"
                                              : "bg-blue-500/70"
                                      }`}
                                      title={`${dayBookings[0].customerName} - ${dayBookings[0].status}${dayBookings[0].source === "airbnb" ? " (Airbnb)" : ""}${dayBookings[0].isLongTerm ? " (Long-term)" : ""}`}
                                    />
                                  )}

                                  {!isInOriginalPeriod && longTermFutureBooking && (
                                    <div
                                      className="absolute inset-0.5 rounded border-2 border-primary/70"
                                      title={`${longTermFutureBooking.customerName} - Long-term booking (auto-renewed)`}
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="rounded-2xl border-border bg-card">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No bookings found</p>
                  </CardContent>
                </Card>
              ) : (
                bookings
                  .filter((b) => b.status !== "cancelled")
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((booking) => {
                    const asset =
                      booking.assetType === "vehicle"
                        ? vehicles.find((v) => v.id === booking.assetId)
                        : condos.find((c) => c.id === booking.assetId)

                    if (!asset) return null

                    const assetName =
                      booking.assetType === "vehicle"
                        ? `${(asset as Vehicle)?.name} ${(asset as Vehicle)?.plate ? `(${(asset as Vehicle)?.plate})` : ""}`
                        : `${(asset as Condo)?.building} Unit ${(asset as Condo)?.unitNo}`

                    return (
                      <Card key={booking.id} className="rounded-2xl border-border bg-card shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground">{assetName}</h3>
                                {booking.source === "airbnb" ? (
                                  <Badge className="bg-[#FF5A5F]/20 text-[#FF5A5F] border-[#FF5A5F]/30">Airbnb</Badge>
                                ) : (
                                  <Badge className={statusColors[booking.status] || statusColors.confirmed}>
                                    {booking.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{booking.customerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(booking.startDate).toLocaleDateString("en-GB")} -{" "}
                                {new Date(booking.endDate).toLocaleDateString("en-GB")}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                ฿{booking.totalPrice.toLocaleString()}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {booking.depositPaid ? "Deposit Paid" : "Payment Required"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </div>
          )}
        </div>

        <BookingWizard open={bookingWizardOpen} onOpenChange={setBookingWizardOpen} onSave={loadData} />
      </AppShell>
    </AuthGuard>
  )
}
