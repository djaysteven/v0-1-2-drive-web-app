"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, AlertCircle } from "lucide-react"
import { format, startOfToday } from "date-fns"
import { enGB } from "date-fns/locale"
import type { Vehicle, BookingChannel, Booking } from "@/lib/types"
import { hasOverlap, upsertCustomer, createBooking, vehiclesApi } from "@/lib/api"
import { toDateSafe, diffCalendarDaysInclusive, calculateSmartPrice } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { BookingSuccessDialog } from "@/components/booking-success-dialog"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@supabase/ssr"

interface ReserveVehicleModalProps {
  vehicle: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  booking?: Booking | null
}

export function ReserveVehicleModal({
  vehicle: initialVehicle,
  open,
  onOpenChange,
  booking,
}: ReserveVehicleModalProps) {
  const [isOwner, setIsOwner] = useState(false)
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(initialVehicle)
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [bookedThrough, setBookedThrough] = useState<BookingChannel>("whatsapp")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [notes, setNotes] = useState("")
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
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup")
  const [deliveryHotel, setDeliveryHotel] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [etaDate, setEtaDate] = useState<Date>()
  const [deliveryTime, setDeliveryTime] = useState("")
  const [openStartPicker, setOpenStartPicker] = useState(false)
  const [openEndPicker, setOpenEndPicker] = useState(false)
  const [isRequestMode, setIsRequestMode] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  const supabaseUrl = process.env.SUPABASE_SUPABASE_SUPABASE_SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY_ANON_KEY_ANON_KEY_ANON_KEY

  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        console.log("[v0] Checking owner status...")
        console.log("[v0] Owner email from env:", ownerEmail)

        // Create Supabase client
        const supabase = createBrowserClient(supabaseUrl!, supabaseAnonKey!)

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        console.log("[v0] Session user email:", session?.user?.email)

        if (session?.user?.email && ownerEmail && session.user.email.toLowerCase() === ownerEmail.toLowerCase()) {
          console.log("[v0] User is OWNER - setting isOwner to true")
          setIsOwner(true)
          setEmail(session.user.email)
        } else {
          console.log("[v0] User is NOT owner")
          setIsOwner(false)
        }
      } catch (error) {
        console.log("[v0] Error checking owner status:", error)
        setIsOwner(false)
      }
    }

    if (open) {
      checkOwnerStatus()
    }
  }, [open])

  useEffect(() => {
    if (ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase()) {
      setIsOwner(true)
    } else if (email && email.toLowerCase() !== ownerEmail?.toLowerCase()) {
      setIsOwner(false)
    }
  }, [email])

  useEffect(() => {
    if (open && booking) {
      loadAllVehicles()
    }
  }, [open, booking])

  const loadAllVehicles = async () => {
    try {
      const vehicles = await vehiclesApi.getAll()
      setAllVehicles(vehicles)
    } catch (error) {
      console.error("[v0] Error loading vehicles:", error)
    }
  }

  useEffect(() => {
    setSelectedVehicle(initialVehicle)
  }, [initialVehicle])

  useEffect(() => {
    if (open) {
      console.log("[v0] ReserveVehicleModal opened with:", {
        hasVehicle: !!selectedVehicle,
        vehicleId: selectedVehicle?.id,
        vehicleName: selectedVehicle?.name,
        vehiclePlate: selectedVehicle?.plate,
        hasBooking: !!booking,
        bookingId: booking?.id,
        bookingVehicleId: booking?.vehicleId,
        bookingVehicleName: booking?.vehicleName,
        bookingVehiclePlate: booking?.vehiclePlate,
      })
    }
  }, [open, selectedVehicle, booking])

  useEffect(() => {
    if (!open) {
      setIsRequestMode(false)
    }
  }, [open])

  useEffect(() => {
    if (booking && open) {
      console.log("[v0] Populating form with booking data:", {
        customerName: booking.customerName,
        vehicleId: booking.vehicleId,
        vehicleName: booking.vehicleName,
        vehiclePlate: booking.vehiclePlate,
        startDate: booking.startDate,
        endDate: booking.endDate,
      })
      setCustomerName(booking.customerName)
      setPhone(booking.customerPhone || "")
      setEmail(booking.customerEmail || "")
      setBookedThrough(booking.bookedThrough || "whatsapp")
      const safeStartDate = toDateSafe(booking.startDate)
      const safeEndDate = toDateSafe(booking.endDate)
      setStartDate(safeStartDate || undefined)
      setEndDate(safeEndDate || undefined)
      setNotes(booking.notes || "")
      setIsLongTerm(booking.isLongTerm || false)

      // Check if manual price was used by comparing with the booking's original price calculation
      const days = safeStartDate && safeEndDate ? diffCalendarDaysInclusive(safeStartDate, safeEndDate) : 0
      const expectedPrice =
        selectedVehicle && days > 0
          ? calculateSmartPrice(
              days,
              selectedVehicle.dailyPrice,
              selectedVehicle.weeklyPrice,
              selectedVehicle.monthlyPrice,
            ).total
          : 0

      if (expectedPrice > 0 && Math.abs(booking.totalPrice - expectedPrice) > 1) {
        setUseManualPrice(true)
        setManualPrice(booking.totalPrice.toString())
      } else {
        setUseManualPrice(false)
        setManualPrice("")
      }

      setDeliveryMethod(booking.deliveryMethod || "pickup")
      setDeliveryHotel(booking.deliveryHotel || "")
      setDeliveryAddress(booking.deliveryAddress || "")
      setEtaDate(toDateSafe(booking.deliveryEta) || undefined)
      setDeliveryTime(booking.deliveryEta?.split("T")[1] || "")
    } else if (!open) {
      // Reset form when modal closes
      setCustomerName("")
      setPhone("")
      setEmail("")
      setBookedThrough("whatsapp")
      setStartDate(undefined)
      setEndDate(undefined)
      setNotes("")
      setIsLongTerm(false)
      setUseManualPrice(false)
      setManualPrice("")
      setAvailability(null)
      setConflicts([])
      setSelectedVehicle(initialVehicle)
      setDeliveryMethod("pickup")
      setDeliveryHotel("")
      setDeliveryAddress("")
      setEtaDate(undefined)
      setDeliveryTime("")
      setIsRequestMode(false)
    }
  }, [booking, open, selectedVehicle])

  useEffect(() => {
    if (selectedVehicle && startDate && endDate) {
      checkAvailability()
    } else {
      setAvailability(null)
      setConflicts([])
    }
  }, [selectedVehicle, startDate, endDate])

  useEffect(() => {
    if (startDate) {
      setEtaDate(startDate)
      setDeliveryTime("")
    }
  }, [startDate])

  const checkAvailability = async () => {
    if (!selectedVehicle || !startDate || !endDate) return

    console.log("[v0] ===== AVAILABILITY CHECK START =====")
    console.log("[v0] Vehicle:", {
      id: selectedVehicle.id,
      name: selectedVehicle.name,
      plate: selectedVehicle.plate,
    })
    console.log("[v0] Date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: diffCalendarDaysInclusive(startDate, endDate),
    })
    console.log("[v0] Booking context:", {
      isEditing: !!booking,
      bookingId: booking?.id,
      excludeFromCheck: booking?.id,
    })

    setAvailability("checking")
    setChecking(true)

    try {
      const result = await hasOverlap(selectedVehicle.id, startDate, endDate, booking?.id)

      console.log("[v0] Overlap check result:", {
        hasConflict: result.hasConflict,
        conflictCount: result.conflicts.length,
        conflicts: result.conflicts,
      })

      if (result.hasConflict) {
        setAvailability("unavailable")
        setConflicts(
          result.conflicts.map(
            (c) =>
              `${format(new Date(c.startDate), "d MMM", { locale: enGB })} - ${format(new Date(c.endDate), "d MMM yyyy", { locale: enGB })}`,
          ),
        )
        console.log("[v0] Vehicle is UNAVAILABLE due to conflicts:", conflicts)
      } else {
        setAvailability("available")
        setConflicts([])
        console.log("[v0] Vehicle is AVAILABLE")
      }
    } catch (error) {
      console.error("[v0] Error checking availability:", error)
      setAvailability(null)
    } finally {
      setChecking(false)
      console.log("[v0] ===== AVAILABILITY CHECK END =====")
    }
  }

  const calculateTotal = () => {
    if (!selectedVehicle || !startDate || !endDate) return 0

    const days = diffCalendarDaysInclusive(startDate, endDate)
    const result = calculateSmartPrice(
      days,
      selectedVehicle.dailyPrice,
      selectedVehicle.weeklyPrice,
      selectedVehicle.monthlyPrice,
    )
    return result.total
  }

  const getPriceBreakdown = () => {
    if (!selectedVehicle || !startDate || !endDate) return ""

    const days = diffCalendarDaysInclusive(startDate, endDate)
    const result = calculateSmartPrice(
      days,
      selectedVehicle.dailyPrice,
      selectedVehicle.weeklyPrice,
      selectedVehicle.monthlyPrice,
    )
    return result.breakdown
  }

  const getValidationErrors = () => {
    const errors: string[] = []
    if (!customerName) errors.push("Customer name")
    if (!isOwner && !email) errors.push("Email")
    if (!startDate) errors.push("Delivery/Pickup date")
    if (!endDate) errors.push("Return date")
    if (!deliveryTime) errors.push(`${deliveryMethod === "pickup" ? "Pickup" : "Delivery"} time`)
    if (deliveryMethod === "delivery") {
      if (!deliveryHotel) errors.push("Hotel/Condo name")
      if (!deliveryAddress) errors.push("Delivery address")
    }
    return errors
  }

  const validationErrors = getValidationErrors()
  const hasValidationErrors = validationErrors.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form validation state:", {
      customerName,
      email,
      isOwner,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      deliveryTime,
      deliveryMethod,
      deliveryHotel,
      deliveryAddress,
    })

    if (!selectedVehicle || !startDate || !endDate || !customerName || (!isOwner && !email)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate delivery fields if delivery is selected
    if (deliveryMethod === "delivery") {
      if (!deliveryHotel || !deliveryAddress || !deliveryTime) {
        toast({
          title: "Missing delivery information",
          description: "Please provide hotel name, address, and ETA for delivery",
          variant: "destructive",
        })
        return
      }
    }

    const composedDeliveryEta =
      etaDate && deliveryTime ? `${format(etaDate, "yyyy-MM-dd")}T${deliveryTime}:00` : undefined

    setSaving(true)

    try {
      const customerId = await upsertCustomer({
        name: customerName,
        phone,
        email: email || undefined,
      })

      const days = diffCalendarDaysInclusive(startDate, endDate)
      let totalPrice = 0

      if (useManualPrice && isOwner) {
        totalPrice = Number.parseFloat(manualPrice) || 0
      } else {
        totalPrice = calculateTotal()
      }

      const bookingData = {
        customerId,
        customerName,
        vehicleId: selectedVehicle.id,
        assetType: "vehicle" as const,
        assetId: selectedVehicle.id,
        assetName: selectedVehicle.name,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        price: useManualPrice && isOwner ? Number.parseFloat(manualPrice) : selectedVehicle.dailyPrice,
        priceMode: "day",
        totalPrice,
        depositPaid: 0,
        status: "confirmed",
        notes,
        source: "manual" as const,
        bookedThrough,
        isLongTerm,
        deliveryMethod,
        ...(deliveryMethod === "pickup" && {
          pickupLocationLabel: "Unixx South Pattaya",
          pickupLocationUrl: "https://maps.google.com/?q=Unixx+South+Pattaya",
          deliveryEta: composedDeliveryEta,
        }),
        ...(deliveryMethod === "delivery" && {
          deliveryHotel,
          deliveryAddress,
          deliveryEta: composedDeliveryEta,
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
              deliveryMethod: bookingData.deliveryMethod,
              pickupLocationLabel: bookingData.pickupLocationLabel,
              deliveryHotel: bookingData.deliveryHotel,
              deliveryAddress: bookingData.deliveryAddress,
              deliveryEta: bookingData.deliveryEta,
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
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error creating booking:", error)

      let errorTitle = "Booking Failed"
      let errorDescription = error.message || "Failed to create booking"

      // Parse specific error types
      if (error.message?.includes("Double booking conflict")) {
        errorTitle = "Double Booking Detected"
        errorDescription = error.message
      } else if (error.message?.includes("Missing required field")) {
        errorTitle = "Missing Information"
        errorDescription = error.message
      } else if (error.message?.includes("Validation failed")) {
        errorTitle = "Validation Error"
        errorDescription = error.message
      } else if (error.message?.includes("Invalid reference")) {
        errorTitle = "Invalid Data"
        errorDescription = error.message
      } else if (error.message?.includes("Database error")) {
        errorTitle = "Database Error"
        errorDescription = error.message
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestLaterDate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedVehicle || !startDate || !endDate || !customerName || !email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (isLongTerm) {
      toast({
        title: "Long-term booking not available",
        description: "Please uncheck 'Long-term rental' for booking requests",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const emailResponse = await fetch("/api/booking/request-later-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail: email,
          customerPhone: phone,
          assetName: selectedVehicle.name,
          requestedStartDate: format(startDate, "yyyy-MM-dd"),
          requestedEndDate: format(endDate, "yyyy-MM-dd"),
          notes,
        }),
      })

      const emailResult = await emailResponse.json()

      if (!emailResult.ok) {
        throw new Error(emailResult.error || "Failed to send booking request")
      }

      toast({
        title: "Request sent!",
        description: "Your booking request has been sent. We'll respond within 24 hours.",
      })

      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error sending booking request:", error)
      toast({
        title: "Request failed",
        description: error.message || "Failed to send booking request. Please try again.",
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

  if (!selectedVehicle) return null

  const total = useManualPrice && manualPrice ? Number.parseFloat(manualPrice) || 0 : calculateTotal()
  const rateInfo = calculateSmartPrice(
    diffCalendarDaysInclusive(startDate, endDate),
    selectedVehicle.dailyPrice,
    selectedVehicle.weeklyPrice,
    selectedVehicle.monthlyPrice,
  )

  const getVehicleNameWithoutYear = (name: string) => {
    return name.replace(/\s*\d{4}\s*/g, "").trim()
  }

  const isVehicleRented = selectedVehicle.status === "rented" || (availability === "unavailable" && !isOwner)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{booking ? "Edit Booking" : isRequestMode ? "Request Booking" : "Reserve Vehicle"}</span>
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

          {!booking && isVehicleRented && !isOwner && (
            <Alert className="bg-secondary border-border">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This vehicle is currently rented. You can request a booking for a later date, and we'll confirm within
                24 hours.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={isRequestMode ? handleRequestLaterDate : handleSubmit} className="space-y-4">
            {booking && allVehicles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="vehicleSelect">
                  Vehicle <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedVehicle.id}
                  onValueChange={(vehicleId) => {
                    const vehicle = allVehicles.find((v) => v.id === vehicleId)
                    if (vehicle) setSelectedVehicle(vehicle)
                  }}
                >
                  <SelectTrigger id="vehicleSelect">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {allVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} {v.plate && `(${v.plate})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20">
              <div className="font-semibold text-lg text-center mb-1">
                {getVehicleNameWithoutYear(selectedVehicle.name)}
              </div>
              {selectedVehicle.plate && (
                <div className="text-sm text-muted-foreground text-center mb-3">{selectedVehicle.plate}</div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded bg-background/50">
                  <span className="text-sm text-muted-foreground">Daily Rate</span>
                  <span className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                    ฿{selectedVehicle.dailyPrice}
                  </span>
                </div>

                {selectedVehicle.weeklyPrice && (
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-background/50">
                    <span className="text-sm text-muted-foreground">Weekly Rate</span>
                    <span className="font-bold text-lg" style={{ color: "#00FF3C" }}>
                      ฿{selectedVehicle.weeklyPrice}
                    </span>
                  </div>
                )}

                {selectedVehicle.monthlyPrice && (
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-primary/10 border border-primary/30">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Monthly Rate</span>
                      <span className="text-xs font-semibold" style={{ color: "#00FF3C" }}>
                        💰 Save More!
                      </span>
                    </div>
                    <span className="font-bold text-xl" style={{ color: "#00FF3C" }}>
                      ฿{selectedVehicle.monthlyPrice}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hide customer fields in request mode if owner */}
            {!isOwner && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+66 XX XXX XXXX"
                  />
                </div>
              </>
            )}

            {/* Show the request mode toggle if vehicle is rented and not owner */}
            {!booking && isVehicleRented && !isOwner && (
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                <Checkbox
                  id="isRequestMode"
                  checked={isRequestMode}
                  onCheckedChange={(checked) => setIsRequestMode(!!checked)}
                />
                <Label htmlFor="isRequestMode" className="cursor-pointer font-normal">
                  Request booking for a later date
                </Label>
              </div>
            )}

            {!isRequestMode && isOwner && (
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
                <Checkbox
                  id="isLongTerm"
                  checked={isLongTerm}
                  onCheckedChange={(checked) => setIsLongTerm(!!checked)}
                />
                <Label htmlFor="isLongTerm" className="cursor-pointer font-normal">
                  Long-term rental (no end date required)
                </Label>
              </div>
            )}

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  {deliveryMethod === "pickup" ? "Pickup" : "Delivery"} Date <span className="text-destructive">*</span>
                </Label>
                <Popover open={openStartPicker} onOpenChange={setOpenStartPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateSelect}
                      disabled={(date) => date < startOfToday()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Return Date <span className="text-destructive">*</span>
                </Label>
                <Popover open={openEndPicker} onOpenChange={setOpenEndPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateSelect}
                      disabled={(date) => !startDate || date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* ... existing owner fields ... */}

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
                <div className="space-y-3">
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

                  <div className="space-y-2">
                    <Label htmlFor="pickup-time">
                      Pickup Time <span className="text-destructive">*</span>
                    </Label>
                    <Select value={deliveryTime} onValueChange={setDeliveryTime} required>
                      <SelectTrigger id="pickup-time">
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

                  <div className="space-y-2">
                    <Label htmlFor="delivery-time">
                      Delivery Time <span className="text-destructive">*</span>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special requests or notes"
                rows={3}
              />
            </div>

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
                    window.open("https://wa.me/66884866866?text=I'm interested in long-term rental discounts", "_blank")
                  }}
                  className="shrink-0 font-semibold"
                  style={{ backgroundColor: "#00FF3C", color: "#000" }}
                >
                  Request Offer
                </Button>
              </div>
            </div>

            {hasValidationErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fill in the following required fields: {validationErrors.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  saving || (availability === "unavailable" && !isOwner && !isRequestMode) || hasValidationErrors
                }
                style={{ backgroundColor: "#00FF3C", color: "#000" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRequestMode ? "Sending Request..." : booking ? "Updating..." : "Booking..."}
                  </>
                ) : isRequestMode ? (
                  "Send Request"
                ) : booking ? (
                  "Update Booking"
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BookingSuccessDialog open={showSuccess} onOpenChange={setShowSuccess} bookingDetails={successDetails} />
    </>
  )
}
