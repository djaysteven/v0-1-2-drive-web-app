"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Trash2 } from "lucide-react"
import { bookingsApi, vehiclesApi, condosApi, customersApi } from "@/lib/api"
import type { Vehicle, Condo, Customer } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface ManualBooking {
  customerName: string
  assetId: string
  assetType: "vehicle" | "condo"
  startDay: number
  endDay: number
  price: number
}

export function ManualBookingEntry({ onComplete }: { onComplete?: () => void }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bookings, setBookings] = useState<ManualBooking[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [customerName, setCustomerName] = useState("")
  const [assetType, setAssetType] = useState<"vehicle" | "condo">("vehicle")
  const [assetId, setAssetId] = useState("")
  const [startDay, setStartDay] = useState("")
  const [endDay, setEndDay] = useState("")
  const [price, setPrice] = useState("")

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    const [v, c, cu] = await Promise.all([vehiclesApi.getAll(), condosApi.getAll(), customersApi.getAll()])
    setVehicles(v)
    setCondos(c)
    setCustomers(cu)
  }

  const handleAddBooking = () => {
    if (!customerName || !assetId || !startDay || !endDay || !price) {
      toast.error("Please fill all fields")
      return
    }

    const newBooking: ManualBooking = {
      customerName,
      assetId,
      assetType,
      startDay: Number.parseInt(startDay),
      endDay: Number.parseInt(endDay),
      price: Number.parseFloat(price.replace(/,/g, "")),
    }

    setBookings([...bookings, newBooking])

    // Reset form
    setCustomerName("")
    setAssetId("")
    setStartDay("")
    setEndDay("")
    setPrice("")

    toast.success("Booking added to list")
  }

  const handleRemoveBooking = (index: number) => {
    setBookings(bookings.filter((_, i) => i !== index))
  }

  const handleSaveAll = async () => {
    if (bookings.length === 0) {
      toast.error("No bookings to save")
      return
    }

    setLoading(true)
    let success = 0
    let failed = 0

    try {
      for (const booking of bookings) {
        try {
          // Find or create customer
          let customer = customers.find((c) => c.name.toLowerCase() === booking.customerName.toLowerCase())
          if (!customer) {
            customer = await customersApi.create({
              name: booking.customerName,
              phone: "",
            })
          }

          // Create dates
          const startDate = new Date(year, month - 1, booking.startDay)
          const endDate = new Date(year, month - 1, booking.endDay)

          // If end day is less than start day, assume next month
          if (booking.endDay < booking.startDay) {
            endDate.setMonth(endDate.getMonth() + 1)
          }

          const asset =
            booking.assetType === "vehicle"
              ? vehicles.find((v) => v.id === booking.assetId)
              : condos.find((c) => c.id === booking.assetId)

          await bookingsApi.create({
            customerId: customer.id,
            customerName: customer.name,
            vehicleId: booking.assetType === "vehicle" ? booking.assetId : undefined,
            condoId: booking.assetType === "condo" ? booking.assetId : undefined,
            assetType: booking.assetType,
            assetId: booking.assetId,
            assetName: asset
              ? booking.assetType === "vehicle"
                ? (asset as Vehicle).name
                : (asset as Condo).unitNo
              : "",
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            price: booking.price,
            priceMode: "day",
            totalPrice: booking.price,
            depositPaid: 0,
            status: "returned",
            source: "manual",
            notes: `Manual entry for ${month}/${year}`,
          })
          success++
        } catch (error: any) {
          console.error("[v0] Failed to create booking:", error)
          failed++
        }
      }

      toast.success(`Saved ${success} bookings${failed > 0 ? `, ${failed} failed` : ""}`)

      if (success > 0) {
        setBookings([])
        if (onComplete) onComplete()
      }
    } catch (error: any) {
      toast.error(`Failed to save bookings: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long" })
  const assets = assetType === "vehicle" ? vehicles : condos

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Calendar className="h-4 w-4" />
          Manual Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manual Booking Entry</DialogTitle>
          <DialogDescription>
            Add bookings manually for {monthName} {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Month/Year Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month.toString()} onValueChange={(v) => setMonth(Number.parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleDateString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(Number.parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Booking Form */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h3 className="font-semibold">Add Booking</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select
                  value={assetType}
                  onValueChange={(v: "vehicle" | "condo") => {
                    setAssetType(v)
                    setAssetId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{assetType === "vehicle" ? "Vehicle" : "Condo"}</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${assetType}`} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {assetType === "vehicle"
                        ? `${(asset as Vehicle).name} - ${(asset as Vehicle).plate}`
                        : `${(asset as Condo).building} ${(asset as Condo).unitNo}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={startDay}
                  onChange={(e) => setStartDay(e.target.value)}
                  placeholder="1-31"
                />
              </div>

              <div className="space-y-2">
                <Label>End Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={endDay}
                  onChange={(e) => setEndDay(e.target.value)}
                  placeholder="1-31"
                />
              </div>

              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="15000" />
              </div>
            </div>

            <Button onClick={handleAddBooking} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add to List
            </Button>
          </div>

          {/* Bookings List */}
          {bookings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Bookings to Save ({bookings.length})</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, idx) => {
                      const asset =
                        booking.assetType === "vehicle"
                          ? vehicles.find((v) => v.id === booking.assetId)
                          : condos.find((c) => c.id === booking.assetId)

                      return (
                        <TableRow key={idx}>
                          <TableCell>{booking.customerName}</TableCell>
                          <TableCell>
                            {asset
                              ? booking.assetType === "vehicle"
                                ? (asset as Vehicle).name
                                : (asset as Condo).unitNo
                              : "Unknown"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {booking.startDay} - {booking.endDay}
                          </TableCell>
                          <TableCell className="text-right font-mono">{booking.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveBooking(idx)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={bookings.length === 0 || loading}>
            {loading ? "Saving..." : `Save ${bookings.length} Bookings`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
