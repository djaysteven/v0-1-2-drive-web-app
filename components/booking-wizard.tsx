"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Loader2, MapPin } from "lucide-react"
import { format, startOfToday, set } from "date-fns"
import { enGB } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Vehicle, Condo, BookingChannel, AssetType } from "@/lib/types"
import { vehiclesApi, condosApi, upsertCustomer, createBooking, hasOverlap } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { diffCalendarDaysInclusive, calculateSmartPrice } from "@/lib/utils"
import { BookingSuccessDialog } from "@/components/booking-success-dialog"

interface BookingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  isOwner: boolean
}

export function BookingWizard({ open, onOpenChange, onSave, isOwner }: BookingWizardProps) {
  const [assetType, setAssetType] = useState<AssetType>("vehicle")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup")
  const [deliveryHotel, setDeliveryHotel] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [notes, setNotes] = useState("")
  const [bookedThrough, setBookedThrough] = useState<BookingChannel>("whatsapp")
  const [isLongTerm, setIsLongTerm] = useState(false)
  const [useManualPrice, setUseManualPrice] = useState(false)
  const [manualPrice, setManualPrice] = useState("")
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availability, setAvailability] = useState<"available" | "unavailable" | "checking" | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successDetails, setSuccessDetails] = useState<{
    assetName: string
    customerName: string
    startDate: string
    endDate: string
    total: number
    emailSent: boolean
  } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [openStartPicker, setOpenStartPicker] = useState(false)
  const [openEndPicker, setOpenEndPicker] = useState(false)

  useEffect(() => {
    if (open) {
      loadAssets()
    }
  }, [open, assetType])

  const loadAssets = async () => {
    try {
      if (assetType === "vehicle") {
        const data = await vehiclesApi.getAll()
        setVehicles(data)
      } else {
        const data = await condosApi.getAll()
        setCondos(data)
      }
    } catch (error) {
      console.error("[v0] Error loading assets:", error)
    }
  }

  useEffect(() => {
    if (selectedAssetId && selectedAssetId !== "tbd" && startDate && endDate) {
      checkAvailability()
    } else {
      setAvailability(null)
      setConflicts([])
    }
  }, [selectedAssetId, startDate, endDate])

  const checkAvailability = async () => {
    if (!selectedAssetId || !startDate || !endDate) return

    setAvailability("checking")
    setChecking(true)

    try {
      const result = await hasOverlap(selectedAssetId, startDate, endDate)

      if (result.hasConflict) {
        setAvailability("unavailable")
        setConflicts(
          result.conflicts.map(
            (c) =>
              `${format(new Date(c.startDate), "d MMM", { locale: enGB })} - ${format(new Date(c.endDate), "d MMM yyyy", { locale: enGB })}`,
          ),
        )
      } else {
        setAvailability("available")
        setConflicts([])
      }
    } catch (error) {
      console.error("[v0] Error checking availability:", error)
      setAvailability(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (startDate) {
      setDeliveryTime("") // Reset time when date changes
    }
  }, [startDate])

  const selectedAsset =
    selectedAssetId === "tbd"
      ? null
      : assetType === "vehicle"
        ? vehicles.find((v) => v.id === selectedAssetId)
        : condos.find((c) => c.id === selectedAssetId)

  const handleSubmit = async () => {
    if (!customerName || !phone || (!isOwner && !email) || !selectedAssetId || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const customerId = await upsertCustomer({
        name: customerName,
        phone,
        email: email || undefined,
      })

      const asset =
        assetType === "vehicle"
          ? vehicles.find((v) => v.id === selectedAssetId)
          : condos.find((c) => c.id === selectedAssetId)

      if (!asset) {
        throw new Error("Asset not found")
      }

      const days = diffCalendarDaysInclusive(startDate, endDate)
      let totalPrice = 0

      if (useManualPrice) {
        totalPrice = Number.parseFloat(manualPrice) || 0
      } else {
        totalPrice = calculateTotal()
      }

      let deliveryEta: string | undefined
      if (assetType === "vehicle" && deliveryTime && startDate) {
        const [hh, mm] = deliveryTime.split(":").map(Number)
        const etaLocal = set(startDate, { hours: hh, minutes: mm, seconds: 0, milliseconds: 0 })
        deliveryEta = etaLocal.toISOString()
      }

      const bookingData = {
        customerId,
        customerName,
        vehicleId: assetType === "vehicle" ? selectedAssetId : undefined,
        condoId: assetType === "condo" ? selectedAssetId : undefined,
        assetType,
        assetId: selectedAssetId,
        assetName: "name" in asset ? asset.name : `${asset.building} ${asset.unitNo}`,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        price: useManualPrice ? Number.parseFloat(manualPrice) : "dailyPrice" in asset ? asset.dailyPrice : asset.price,
        priceMode: assetType === "vehicle" ? "day" : (asset as Condo).priceMode,
        totalPrice,
        depositPaid: 0,
        status: "confirmed",
        notes,
        source: "manual" as const,
        bookedThrough,
        isLongTerm,
        ...(assetType === "vehicle" && {
          delivery_method: deliveryMethod,
          ...(deliveryMethod === "pickup" && {
            pickup_location_label: "Unixx South Pattaya",
            pickup_location_url: "https://maps.google.com/?q=Unixx+South+Pattaya",
          }),
          ...(deliveryMethod === "delivery" && {
            delivery_hotel: deliveryHotel,
            delivery_address: deliveryAddress,
          }),
          ...(deliveryEta && { delivery_eta: deliveryEta }),
        }),
      }

      console.log("[v0] Creating booking with data:", bookingData)
      const newBooking = await createBooking(bookingData)
      console.log("[v0] Booking created successfully:", newBooking)

      let emailSent = false
      if (email) {
        try {
          console.log("[v0] Sending confirmation email to:", email)
          const emailResponse = await fetch("/api/booking/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName,
              customerEmail: email,
              assetName: bookingData.assetName,
              startDate: bookingData.startDate,
              endDate: bookingData.endDate,
              totalPrice: bookingData.totalPrice,
              deliveryMethod: bookingData.delivery_method,
              pickupLocationLabel: bookingData.pickup_location_label,
              deliveryHotel: bookingData.delivery_hotel,
              deliveryAddress: bookingData.delivery_address,
              deliveryEta: bookingData.delivery_eta,
            }),
          })

          const emailResult = await emailResponse.json()
          console.log("[v0] Email API response:", emailResult)
          emailSent = emailResult.ok === true
        } catch (emailError) {
          console.error("[v0] Error sending confirmation email:", emailError)
        }
      }

      setSuccessDetails({
        assetName: bookingData.assetName,
        customerName,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        total: totalPrice,
        emailSent,
      })
      setShowSuccess(true)
      onSave()
    } catch (error: any) {
      console.error("[v0] Error creating booking:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date)
      if (!endDate || endDate < date) {
        setEndDate(date)
      }
      setOpenStartPicker(false)
      setTimeout(() => setOpenEndPicker(true), 100)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date)
      setOpenEndPicker(false)
    }
  }

  const calculateTotal = () => {
    if (!selectedAsset || !startDate || !endDate) return 0

    const days = diffCalendarDaysInclusive(startDate, endDate)

    if (assetType === "vehicle") {
      const vehicle = selectedAsset as Vehicle
      const result = calculateSmartPrice(days, vehicle.dailyPrice, vehicle.weeklyPrice, vehicle.monthlyPrice)
      return result.total
    } else {
      const condo = selectedAsset as Condo
      if (condo.priceMode === "night") {
        return condo.price * days
      } else {
        const months = Math.ceil(days / 30)
        return condo.price * months
      }
    }
  }

  const getPriceBreakdown = () => {
    if (!selectedAsset || !startDate || !endDate) return ""

    const days = diffCalendarDaysInclusive(startDate, endDate)

    if (assetType === "vehicle") {
      const vehicle = selectedAsset as Vehicle
      const result = calculateSmartPrice(days, vehicle.dailyPrice, vehicle.weeklyPrice, vehicle.monthlyPrice)
      return result.breakdown
    } else {
      return `${days} ${days === 1 ? "night" : "nights"}`
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>New Booking</span>
              {availability === "checking" && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking...
                </Badge>
              )}
              {availability === "available" && (
                <Badge style={{ backgroundColor: "#00FF3C", color: "#000" }}>Available</Badge>
              )}
              {availability === "unavailable" && (
                <Badge style={{ backgroundColor: "#FF4040", color: "#fff" }}>Unavailable</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs
              value={assetType}
              onValueChange={(v) => {
                setAssetType(v as AssetType)
                setSelectedAssetId("")
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                <TabsTrigger value="condo">Condo</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="asset">
                Select {assetType === "vehicle" ? "Vehicle" : "Condo"} <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger id="asset">
                  <SelectValue placeholder={`Choose a ${assetType}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tbd">
                    <span className="font-semibold text-primary">TBD - Assign Later</span>
                  </SelectItem>
                  {assetType === "vehicle"
                    ? vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} {v.plate && `(${v.plate})`}
                        </SelectItem>
                      ))
                    : condos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.building} - Unit {c.unitNo}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAssetId === "tbd" && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="font-semibold text-yellow-700 dark:text-yellow-400">TBD - To Be Assigned</div>
                <div className="text-sm text-muted-foreground mt-1">
                  No specific {assetType} assigned yet. You can assign one later by editing this booking.
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">
                  Manual price entry is required for TBD bookings.
                </div>
              </div>
            )}

            {selectedAsset && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="font-semibold text-center mb-2">
                  {assetType === "vehicle"
                    ? (selectedAsset as Vehicle).name
                    : `${(selectedAsset as Condo).building} - Unit ${(selectedAsset as Condo).unitNo}`}
                </div>
                {assetType === "vehicle" && (selectedAsset as Vehicle).plate && (
                  <div className="text-sm text-muted-foreground text-center mb-2">
                    {(selectedAsset as Vehicle).plate}
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {assetType === "vehicle" ? (
                    <>
                      <div className="text-center">
                        <div className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                          ฿{(selectedAsset as Vehicle).dailyPrice}
                        </div>
                        <div className="text-xs text-muted-foreground">day</div>
                      </div>
                      {(selectedAsset as Vehicle).weeklyPrice && (
                        <>
                          <div className="text-muted-foreground">|</div>
                          <div className="text-center">
                            <div className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                              ฿{(selectedAsset as Vehicle).weeklyPrice}
                            </div>
                            <div className="text-xs text-muted-foreground">week</div>
                          </div>
                        </>
                      )}
                      {(selectedAsset as Vehicle).monthlyPrice && (
                        <>
                          <div className="text-muted-foreground">|</div>
                          <div className="text-center">
                            <div className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                              ฿{(selectedAsset as Vehicle).monthlyPrice}
                            </div>
                            <div className="text-xs text-muted-foreground">month</div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                        ฿{(selectedAsset as Condo).price}
                      </div>
                      <div className="text-xs text-muted-foreground">night</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerName">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email {!isOwner && <span className="text-destructive">*</span>}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Delivery / Pickup date <span className="text-destructive">*</span>
              </Label>
              <Popover open={openStartPicker} onOpenChange={setOpenStartPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal bg-background hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Delivery/Pickup:</span>
                      {startDate ? format(startDate, "dd MMM yyyy", { locale: enGB }) : "Select date"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <div className="px-3 py-2 border-b bg-secondary/50">
                    <p className="text-sm font-semibold text-center">Delivery / Pickup Date</p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    modifiers={{ today: startOfToday() }}
                    modifiersClassNames={{ today: "ring-2 ring-lime-400/60 rounded-md" }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>
                Return date <span className="text-destructive">*</span>
              </Label>
              <Popover open={openEndPicker} onOpenChange={setOpenEndPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal bg-background hover:bg-accent"
                    disabled={!startDate}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Return:</span>
                      {endDate ? format(endDate, "dd MMM yyyy", { locale: enGB }) : "Select date"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <div className="px-3 py-2 border-b bg-secondary/50">
                    <p className="text-sm font-semibold text-center">Return Date</p>
                  </div>
                  <Calendar
                    mode="single"
                    defaultMonth={startDate}
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) =>
                      startDate ? date < startDate : date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    modifiers={{ today: startOfToday() }}
                    modifiersClassNames={{ today: "ring-2 ring-lime-400/60 rounded-md" }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {startDate && endDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Duration: {diffCalendarDaysInclusive(startDate, endDate)}{" "}
                    {diffCalendarDaysInclusive(startDate, endDate) === 1 ? "day" : "days"}
                  </p>
                  {selectedAsset && (
                    <p className="text-base font-bold" style={{ color: "#00FF3C" }}>
                      {getPriceBreakdown()} = ฿{calculateTotal().toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {assetType === "vehicle" && selectedAssetId && selectedAssetId !== "tbd" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => setDeliveryMethod("pickup")}
                      className={cn(
                        "w-full",
                        deliveryMethod === "pickup"
                          ? "bg-[#00FF3C] text-black hover:bg-[#00DD35]"
                          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
                      )}
                    >
                      Pickup
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setDeliveryMethod("delivery")}
                      className={cn(
                        "w-full",
                        deliveryMethod === "delivery"
                          ? "bg-[#00FF3C] text-black hover:bg-[#00DD35]"
                          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
                      )}
                    >
                      Free Delivery
                    </Button>
                  </div>
                </div>

                {deliveryMethod === "pickup" && (
                  <div className="space-y-2">
                    <Label>Pickup Location</Label>
                    <div className="flex items-center gap-2">
                      <Input value="Unixx South Pattaya" disabled className="flex-1 bg-secondary" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("https://maps.google.com/?q=Unixx+South+Pattaya", "_blank")}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Maps
                      </Button>
                    </div>
                  </div>
                )}

                {deliveryMethod === "delivery" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-hotel">
                        Hotel/Condo Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="delivery-hotel"
                        value={deliveryHotel}
                        onChange={(e) => setDeliveryHotel(e.target.value)}
                        placeholder="e.g., Hilton Pattaya"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-address">
                        Delivery Address <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Full delivery address"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="delivery-time">
                    {deliveryMethod === "pickup" ? "Pickup" : "Delivery"} Time{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select value={deliveryTime} onValueChange={setDeliveryTime} required>
                    <SelectTrigger id="delivery-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">08:00 AM</SelectItem>
                      <SelectItem value="08:30">08:30 AM</SelectItem>
                      <SelectItem value="09:00">09:00 AM</SelectItem>
                      <SelectItem value="09:30">09:30 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="10:30">10:30 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="11:30">11:30 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="12:30">12:30 PM</SelectItem>
                      <SelectItem value="13:00">01:00 PM</SelectItem>
                      <SelectItem value="13:30">01:30 PM</SelectItem>
                      <SelectItem value="14:00">02:00 PM</SelectItem>
                      <SelectItem value="14:30">02:30 PM</SelectItem>
                      <SelectItem value="15:00">03:00 PM</SelectItem>
                      <SelectItem value="15:30">03:30 PM</SelectItem>
                      <SelectItem value="16:00">04:00 PM</SelectItem>
                      <SelectItem value="16:30">04:30 PM</SelectItem>
                      <SelectItem value="17:00">05:00 PM</SelectItem>
                      <SelectItem value="17:30">05:30 PM</SelectItem>
                      <SelectItem value="18:00">06:00 PM</SelectItem>
                      <SelectItem value="18:30">06:30 PM</SelectItem>
                      <SelectItem value="19:00">07:00 PM</SelectItem>
                      <SelectItem value="19:30">07:30 PM</SelectItem>
                      <SelectItem value="20:00">08:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-sm font-medium text-destructive mb-1">Conflicting bookings:</div>
                <ul className="text-xs text-destructive/80 space-y-1">
                  {conflicts.map((conflict, i) => (
                    <li key={i}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            )}

            {isOwner && startDate && endDate && selectedAssetId && selectedAssetId !== "tbd" && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="manualPrice" className="text-sm font-medium">
                    Manual price override
                  </Label>
                  <Switch
                    id="manualPriceToggle"
                    checked={useManualPrice}
                    onCheckedChange={(checked) => {
                      setUseManualPrice(checked)
                      if (!checked) setManualPrice("")
                    }}
                  />
                </div>
                {useManualPrice && (
                  <Input
                    id="manualPrice"
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="Enter custom price"
                    className="bg-background"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special requests or notes"
                rows={3}
              />
            </div>

            {assetType === "vehicle" && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Long-term rentals available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Contact us for special rates on extended rentals
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      window.open(
                        "https://wa.me/66884866866?text=I'm interested in long-term rental discounts",
                        "_blank",
                      )
                    }}
                    className="shrink-0 font-semibold"
                    style={{ backgroundColor: "#00FF3C", color: "#000" }}
                  >
                    Request Offer
                  </Button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="space-y-2">
                <Label htmlFor="bookedThrough">Booked through</Label>
                <Select value={bookedThrough} onValueChange={(value) => setBookedThrough(value as BookingChannel)}>
                  <SelectTrigger id="bookedThrough">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  saving ||
                  checking ||
                  (availability === "unavailable" && selectedAssetId !== "tbd") ||
                  !customerName ||
                  !phone ||
                  (!isOwner && !email) ||
                  !selectedAssetId ||
                  !startDate ||
                  !endDate ||
                  (assetType === "vehicle" &&
                    selectedAssetId !== "tbd" &&
                    (!deliveryTime || (deliveryMethod === "delivery" && (!deliveryHotel || !deliveryAddress))))
                }
                style={{ backgroundColor: "#00FF3C", color: "#000" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <BookingSuccessDialog open={showSuccess} onOpenChange={setShowSuccess} bookingDetails={successDetails} />
    </>
  )
}
