"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookingWizard } from "@/components/booking-wizard"
import { vehiclesApi, condosApi, bookingsApi, customersApi } from "@/lib/api"
import type { Vehicle, Condo, Booking, Customer } from "@/lib/types"
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "list">("week")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<string>("all")

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

    if (view === "week") {
      // Show current week (7 days starting from Monday)
      const curr = new Date(currentDate)
      const first = curr.getDate() - curr.getDay() + 1
      for (let i = 0; i < 7; i++) {
        days.push(new Date(year, month, first + i))
      }
    } else {
      // Show current month
      const lastDay = new Date(year, month + 1, 0)
      for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push(new Date(year, month, day))
      }
    }

    return days
  }

  const getBookingsForAsset = (assetId: string, assetType: "vehicle" | "condo") => {
    return bookings.filter((b) => {
      return b.assetId === assetId && b.assetType === assetType && b.status !== "cancelled"
    })
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

  const filteredAssets =
    selectedAsset === "all" ? allAssets : allAssets.filter((a) => `${a.type}-${a.id}` === selectedAsset)

  const monthYear = currentDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["owner"]}>
        <AppShell header={<h1 className="text-2xl font-bold text-foreground">Calendar</h1>}>
          <div className="container mx-auto p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
          <div className="flex items-center justify-between flex-1 gap-4">
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <Button size="sm" className="gap-2" onClick={() => setBookingWizardOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Booking</span>
            </Button>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-full min-w-[140px] font-semibold"
              >
                {monthYear}
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="w-[180px] rounded-full">
                  <SelectValue placeholder="Filter assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={`vehicle-${v.id}`} value={`vehicle-${v.id}`}>
                      {v.name} {v.plate ? `(${v.plate})` : ""}
                    </SelectItem>
                  ))}
                  {condos.map((c) => (
                    <SelectItem key={`condo-${c.id}`} value={`condo-${c.id}`}>
                      {c.building} {c.unitNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="rounded-full">
                <TabsList className="bg-secondary/50 rounded-full">
                  <TabsTrigger value="week" className="rounded-full gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Week</span>
                  </TabsTrigger>
                  <TabsTrigger value="month" className="rounded-full gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Month</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="rounded-full gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {view === "list" ? (
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <Card className="rounded-2xl border-border/50 bg-card/50">
                  <CardContent className="p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No bookings scheduled</p>
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
                      <Card
                        key={booking.id}
                        className="rounded-2xl border-border/50 bg-card/50 hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg text-foreground">{assetName}</h3>
                                {booking.source === "airbnb" ? (
                                  <Badge className="bg-[#FF5A5F]/20 text-[#FF5A5F] border-[#FF5A5F]/30 rounded-full">
                                    Airbnb
                                  </Badge>
                                ) : (
                                  <Badge
                                    className={`${statusColors[booking.status] || statusColors.confirmed} rounded-full`}
                                  >
                                    {booking.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">{booking.customerName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(booking.startDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                                {" → "}
                                {new Date(booking.endDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                ฿{booking.totalPrice.toLocaleString()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
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
          ) : (
            <div className="space-y-2">
              {/* Date header row */}
              <div
                className="grid gap-2 mb-3"
                style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
              >
                {days.map((day) => {
                  const isToday = day.getTime() === today.getTime()
                  return (
                    <div
                      key={day.toISOString()}
                      className={`text-center p-3 rounded-2xl transition-colors ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs font-medium mb-1">
                        {day.toLocaleDateString("en-GB", { weekday: "short" })}
                      </div>
                      <div className="text-lg font-bold">{day.getDate()}</div>
                    </div>
                  )
                })}
              </div>

              {/* Asset rows */}
              {filteredAssets.map((asset) => {
                const assetBookings = getBookingsForAsset(asset.id, asset.type)

                return (
                  <Card key={`${asset.type}-${asset.id}`} className="rounded-2xl border-border/50 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="font-medium text-sm text-foreground px-2">{asset.displayName}</div>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                        >
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

                              return dayStart <= bookingEnd && dayEnd >= bookingStart
                            })

                            const isInOriginalPeriod = dayBookings.some((b) => {
                              const bookingStart = new Date(b.startDate)
                              bookingStart.setHours(0, 0, 0, 0)
                              const bookingEnd = new Date(b.endDate)
                              bookingEnd.setHours(23, 59, 59, 999)

                              return dayStart >= bookingStart && dayStart <= bookingEnd
                            })

                            const booking = dayBookings[0]

                            return (
                              <div
                                key={day.toISOString()}
                                className={`aspect-square rounded-xl border transition-all ${
                                  day.getTime() === today.getTime()
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-border/30 bg-secondary/20"
                                } relative overflow-hidden`}
                                title={
                                  booking
                                    ? `${booking.customerName} - ${booking.status}${booking.source === "airbnb" ? " (Airbnb)" : ""}`
                                    : undefined
                                }
                              >
                                {isInOriginalPeriod && booking && (
                                  <div
                                    className={`absolute inset-1 rounded-lg ${
                                      booking.source === "airbnb"
                                        ? "bg-[#FF5A5F]"
                                        : booking.status === "confirmed"
                                          ? "bg-primary"
                                          : booking.status === "pending"
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                    }`}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <BookingWizard open={bookingWizardOpen} onOpenChange={setBookingWizardOpen} onSave={loadData} />
      </AppShell>
    </AuthGuard>
  )
}
