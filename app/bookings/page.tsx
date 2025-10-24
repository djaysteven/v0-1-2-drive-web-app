"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { bookingsApi, vehiclesApi, condosApi } from "@/lib/api"
import type { Booking, Vehicle, Condo } from "@/lib/types"
import { Calendar, Car, Building2, Edit, Trash2, Filter, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReserveVehicleModal } from "@/components/reserve-vehicle-modal"
import { formatDisplayDate, parseYMDLocal } from "@/lib/date-utils"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAsset, setFilterAsset] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssetType, setFilterAssetType] = useState<"all" | "vehicle" | "condo">("all")
  const [showLongTerm, setShowLongTerm] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [deliveredDialogOpen, setDeliveredDialogOpen] = useState(false)
  const [bookingToMarkDelivered, setBookingToMarkDelivered] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null)
  const [vehicleForEdit, setVehicleForEdit] = useState<Vehicle | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [bookingsData, vehiclesData, condosData] = await Promise.all([
        bookingsApi.getAll(),
        vehiclesApi.getAll(),
        condosApi.getAll(),
      ])
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      const filteredBookings = bookingsData.filter((booking) => {
        // Keep long-term bookings regardless of date
        if (booking.isLongTerm) return true

        // Keep bookings that haven't ended yet
        const endDate = parseYMDLocal(booking.endDate)
        if (!endDate) return false

        endDate.setHours(23, 59, 59, 999)
        return endDate >= now
      })

      setBookings(filteredBookings)
      setVehicles(vehiclesData)
      setCondos(condosData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bookingToDelete) return

    try {
      await bookingsApi.delete(bookingToDelete)
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setBookingToDelete(null)
    }
  }

  const handleMarkDelivered = async () => {
    if (!bookingToMarkDelivered) return

    try {
      const booking = bookings.find((b) => b.id === bookingToMarkDelivered)
      if (booking) {
        await bookingsApi.update(bookingToMarkDelivered, {
          ...booking,
          status: "delivered",
          notes: booking.notes ? `${booking.notes}\n[Delivered]` : "[Delivered]",
        })
        toast({
          title: "Success",
          description: "Booking marked as delivered",
        })
        loadData()
      }
    } catch (error) {
      console.error("[v0] Error marking booking as delivered:", error)
      toast({
        title: "Error",
        description: "Failed to mark booking as delivered",
        variant: "destructive",
      })
    } finally {
      setDeliveredDialogOpen(false)
      setBookingToMarkDelivered(null)
    }
  }

  const handleEdit = (booking: Booking) => {
    console.log("[v0] handleEdit called with booking:", {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      vehicleName: booking.vehicleName,
      vehiclePlate: booking.vehiclePlate,
      assetName: booking.assetName,
    })

    const vehicle = vehicles.find((v) => v.id === booking.vehicleId)

    console.log("[v0] Vehicle lookup result:", {
      found: !!vehicle,
      vehicleId: vehicle?.id,
      vehicleName: vehicle?.name,
      vehiclePlate: vehicle?.plate,
    })

    if (vehicle) {
      setBookingToEdit(booking)
      setVehicleForEdit(vehicle)
      setEditModalOpen(true)
    } else {
      console.log("[v0] Creating temp vehicle from snapshot data")
      const tempVehicle: Vehicle = {
        id: booking.vehicleId || "",
        name: booking.vehicleName || booking.assetName || "Vehicle",
        plate: booking.vehiclePlate || "",
        type: "bike",
        dailyPrice: booking.price,
        deposit: 0,
        status: "rented",
        photos: [],
        tags: [],
      }
      console.log("[v0] Temp vehicle created:", tempVehicle)
      setBookingToEdit(booking)
      setVehicleForEdit(tempVehicle)
      setEditModalOpen(true)
    }
  }

  const handleEditModalClose = (open: boolean) => {
    setEditModalOpen(open)
    if (!open) {
      setBookingToEdit(null)
      setVehicleForEdit(null)
      loadData() // Reload bookings after edit
    }
  }

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString, "en-GB")
  }

  const isBookingStartingToday = (startDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const bookingStart = parseYMDLocal(startDate)
    if (!bookingStart) return false
    bookingStart.setHours(0, 0, 0, 0)
    return bookingStart.getTime() === today.getTime()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary/20 text-primary border-primary/30"
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "checked_out":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-secondary/20 text-secondary-foreground border-secondary/30"
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const assetMatch = filterAsset === "all" || booking.assetId === filterAsset
    const statusMatch = filterStatus === "all" || booking.status === filterStatus
    const assetTypeMatch = filterAssetType === "all" || booking.assetType === filterAssetType
    const longTermMatch = showLongTerm || !booking.isLongTerm

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const endDate = parseYMDLocal(booking.endDate)
    if (!endDate) return false

    endDate.setHours(23, 59, 59, 999)
    const isExpired = endDate < now
    const shouldShow = !isExpired || booking.isLongTerm

    return assetMatch && statusMatch && assetTypeMatch && longTermMatch && shouldShow
  })

  if (loading) {
    return (
      <AppShell header={<h1 className="text-xl font-bold">Bookings</h1>}>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading bookings...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell header={<h1 className="text-xl font-bold">Manage Bookings</h1>}>
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Bookings
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* Asset type toggle - full width on mobile */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto">
                  <Button
                    variant={filterAssetType === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterAssetType("all")}
                    className="h-8 flex-1 sm:flex-none"
                  >
                    All
                  </Button>
                  <Button
                    variant={filterAssetType === "vehicle" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterAssetType("vehicle")}
                    className="h-8 flex-1 sm:flex-none"
                  >
                    <Car className="h-4 w-4 mr-1" />
                    Vehicles
                  </Button>
                  <Button
                    variant={filterAssetType === "condo" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterAssetType("condo")}
                    className="h-8 flex-1 sm:flex-none"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Condos
                  </Button>
                </div>

                {/* Filters row - wraps on mobile */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex items-center gap-2">
                    <Switch id="show-long-term" checked={showLongTerm} onCheckedChange={setShowLongTerm} />
                    <Label htmlFor="show-long-term" className="text-sm cursor-pointer whitespace-nowrap">
                      Show long-term
                    </Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <Select value={filterAsset} onValueChange={setFilterAsset}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assets</SelectItem>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <Car className="h-3 w-3" />
                              {vehicle.name}
                            </div>
                          </SelectItem>
                        ))}
                        {condos.map((condo) => (
                          <SelectItem key={condo.id} value={condo.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {condo.building} {condo.unitNo}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked_out">Checked Out</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bookings found</p>
              </div>
            ) : (
              <div className="w-full">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Customer</TableHead>
                      <TableHead className="whitespace-nowrap">Asset</TableHead>
                      <TableHead className="whitespace-nowrap">Start Date</TableHead>
                      <TableHead className="whitespace-nowrap">End Date</TableHead>
                      <TableHead className="whitespace-nowrap">Total</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className={isBookingStartingToday(booking.startDate) ? "bg-green-500/10" : ""}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {booking.customerName ||
                            (booking.assetType === "condo"
                              ? "airbnb"
                              : booking.source === "airbnb"
                                ? "Airbnb"
                                : "Unknown")}
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            {booking.assetType === "vehicle" ? (
                              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm">{booking.assetName}</span>
                              {booking.vehiclePlate && (
                                <span className="text-xs text-muted-foreground font-mono">{booking.vehiclePlate}</span>
                              )}
                              {booking.deliveryMethod === "pickup" && booking.pickupLocationLabel && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30"
                                  >
                                    Pickup @ {booking.pickupLocationLabel}
                                  </Badge>
                                  {booking.pickupLocationUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1 text-xs"
                                      onClick={() => window.open(booking.pickupLocationUrl, "_blank")}
                                    >
                                      Maps
                                    </Button>
                                  )}
                                </div>
                              )}
                              {booking.deliveryMethod === "delivery" && booking.deliveryHotel && (
                                <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground">
                                  <div className="font-medium text-foreground">{booking.deliveryHotel}</div>
                                  {booking.deliveryAddress && <div>{booking.deliveryAddress}</div>}
                                  {booking.deliveryEta && (
                                    <div>
                                      ETA:{" "}
                                      {new Date(booking.deliveryEta).toLocaleString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {booking.isLongTerm && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Long-term
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(booking.startDate)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(booking.endDate)}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          ฿{booking.totalPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status === "returned" ? "delivered" : booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600 border-green-500/30"
                              onClick={() => {
                                setBookingToMarkDelivered(booking.id)
                                setDeliveredDialogOpen(true)
                              }}
                              title="Mark as delivered"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Delivered
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 bg-transparent"
                              onClick={() => handleEdit(booking)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30"
                              onClick={() => {
                                setBookingToDelete(booking.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deliveredDialogOpen} onOpenChange={setDeliveredDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Delivered</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this booking as delivered? This will change the status to delivered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkDelivered} className="bg-green-500 text-white hover:bg-green-600">
              Mark as Delivered
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReserveVehicleModal
        vehicle={vehicleForEdit}
        open={editModalOpen}
        onOpenChange={handleEditModalClose}
        booking={bookingToEdit}
      />
    </AppShell>
  )
}
