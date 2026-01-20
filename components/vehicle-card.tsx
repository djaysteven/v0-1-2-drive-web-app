"use client"

import { useEffect } from "react"

import type React from "react"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Vehicle } from "@/lib/types"
import { Edit, Trash2, Car, Bike, Calendar, Clock, List } from "lucide-react"
import Image from "next/image"
import { useState, useRef } from "react"
import { vehiclesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ReserveVehicleModal } from "./reserve-vehicle-modal"
import { ShareButton } from "./share-button"
import { ImageLightbox } from "./image-lightbox"
import { RenterNameDialog } from "./renter-name-dialog"

interface VehicleCardProps {
  vehicle: Vehicle
  isCurrentlyBooked?: boolean // Added prop to indicate if vehicle is currently booked
  isAuthenticated?: boolean // Added prop to control admin features visibility
  onEdit?: () => void
  onDelete?: () => void
  onReserve?: () => void
  onRenterNameSaved?: (vehicleId: string, renterName: string) => void
}

export function VehicleCard({
  vehicle,
  isCurrentlyBooked = false,
  isAuthenticated = false,
  onEdit,
  onDelete,
  onReserve,
  onRenterNameSaved,
}: VehicleCardProps) {
  const [isSnoozing, setIsSnoozing] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false) // Added state for toggling status
  const [lightboxOpen, setLightboxOpen] = useState(false) // Added state for image lightbox
  const [localVehicle, setLocalVehicle] = useState(vehicle) // Local state for optimistic updates
  const [renterNameDialogOpen, setRenterNameDialogOpen] = useState(false) // State for renter name dialog
  const { toast } = useToast()
  const statusBadgeRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Sync localVehicle with vehicle prop when it changes (e.g., after update from parent)
  useEffect(() => {
    setLocalVehicle(vehicle)
  }, [vehicle])

  const statusColors = {
    available: "bg-green-500/70 text-white border-green-500", // Changed available to use explicit green color instead of primary
    rented: "bg-blue-500/70 text-white border-blue-500",
    maintenance: "bg-destructive/20 text-destructive border-destructive/30",
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  const isTaxExpiringSoon = (dateString?: string) => {
    if (!dateString) return false
    const expiryDate = new Date(dateString)
    const today = new Date()
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isTaxExpired = (dateString?: string) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  const isTaxSnoozed = localVehicle.taxOverrideUntil && new Date(localVehicle.taxOverrideUntil) > new Date()
  const taxStatus = isTaxSnoozed ? "snoozed" : isTaxExpired(localVehicle.taxExpires) ? "expired" : "expiring"

  const handleSnooze = async () => {
    setIsSnoozing(true)
    try {
      const currentYear = new Date().getFullYear()
      const snoozeUntil = `${currentYear}-12-31`

      await vehiclesApi.update(vehicle.id, {
        taxOverrideUntil: snoozeUntil,
      })

      toast({
        title: "Tax snoozed",
        description: `Tax warning snoozed until 31 Dec ${currentYear}`,
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze tax warning",
        variant: "destructive",
      })
    } finally {
      setIsSnoozing(false)
    }
  }

  const handleClearSnooze = async () => {
    setIsSnoozing(true)
    try {
      await vehiclesApi.update(vehicle.id, {
        taxOverrideUntil: null,
      })

      toast({
        title: "Snooze cleared",
        description: "Tax warning snooze has been cleared",
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear snooze",
        variant: "destructive",
      })
    } finally {
      setIsSnoozing(false)
    }
  }

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated || isTogglingStatus) {
      return
    }

    const newStatus = localVehicle.status === "available" ? "rented" : "available"

    // Optimistic update
    setLocalVehicle({ ...localVehicle, status: newStatus })
    setIsTogglingStatus(true)

    try {
      await vehiclesApi.update(vehicle.id, {
        status: newStatus,
      })

      toast({
        title: "Status updated",
        description: `Vehicle status changed to ${newStatus}`,
      })
    } catch (error) {
      // Revert on error
      setLocalVehicle({ ...localVehicle, status: vehicle.status })
      toast({
        title: "Error",
        description: "Failed to update vehicle status",
        variant: "destructive",
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleSaveRenterName = async (name: string) => {
    console.log("[v0] handleSaveRenterName called with:", name)
    const trimmedName = name.trim()
    console.log("[v0] Trimmed name:", trimmedName)

    // Optimistic update
    setLocalVehicle({ ...localVehicle, renterName: trimmedName || undefined })

    try {
      console.log("[v0] Calling vehiclesApi.update with renterName:", trimmedName)
      await vehiclesApi.update(vehicle.id, {
        renterName: trimmedName || undefined,
      })
      console.log("[v0] vehiclesApi.update succeeded")

      // Notify parent component to update vehicles list
      if (onRenterNameSaved) {
        console.log("[v0] Calling onRenterNameSaved callback")
        onRenterNameSaved(vehicle.id, trimmedName || "")
      }

      toast({
        title: "Renter name updated",
        description: trimmedName ? `Renter set to ${trimmedName}` : "Renter name cleared",
      })
    } catch (error) {
      console.error("[v0] Error saving renter name:", error)
      // Revert on error
      setLocalVehicle({ ...localVehicle, renterName: vehicle.renterName })
      toast({
        title: "Error",
        description: "Failed to update renter name",
        variant: "destructive",
      })
      throw error // Re-throw so dialog knows it failed
    }
  }

  const displayStatus = isCurrentlyBooked ? "rented" : localVehicle.status // Use localVehicle for display

  // Added handler to open lightbox only on actual click (not during scroll)
  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null)

  const handleImagePointerDown = (e: React.PointerEvent) => {
    setClickStart({ x: e.clientX, y: e.clientY })
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (!clickStart) return
    const dx = e.clientX - clickStart.x
    const dy = e.clientY - clickStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 10) {
      setLightboxOpen(true)
    }
    setClickStart(null)
  }

  return (
    <>
      <Card className="rounded-2xl border-2 border-green-500/30 bg-card shadow-lg overflow-hidden group hover:border-green-500 hover:shadow-[0_0_20px_rgba(0,255,60,0.4)] transition-all duration-200">
        <div className="relative">
          <div className="relative aspect-video overflow-hidden bg-secondary">
            {/* Clickable image container - ONLY contains the image */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={handleImageClick}
              onPointerDown={handleImagePointerDown}
            >
              <Image
                src={localVehicle.photos[0] || "/placeholder.svg"}
                alt={localVehicle.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                loading="eager"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 45vw, 400px"
                quality={85}
              />
            </div>

            {/* Type badge - positioned absolutely */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <Badge variant="secondary" className="gap-1">
                {localVehicle.type === "bike" ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                {localVehicle.type}
              </Badge>
            </div>

            {/* Share button - positioned absolutely */}
            <div className="absolute bottom-3 right-3 z-10">
              <ShareButton
                title={`${localVehicle.name} - ${localVehicle.plate}`}
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/vehicles/${vehicle.id}`}
              />
            </div>

            {/* Tax badge */}
            {isAuthenticated && localVehicle.taxExpires && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
                {isTaxSnoozed ? (
                  <>
                    <Badge style={{ backgroundColor: "#00FF3C", color: "#000" }} className="font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      Tax OK
                    </Badge>
                  </>
                ) : (
                  (isTaxExpired(localVehicle.taxExpires) || isTaxExpiringSoon(localVehicle.taxExpires)) && (
                    <Badge
                      style={{
                        backgroundColor: isTaxExpired(localVehicle.taxExpires) ? "#FF4040" : "#FFA500",
                        color: "#fff",
                      }}
                      className="font-medium"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {isTaxExpired(localVehicle.taxExpires) ? "Tax Expired" : "Tax Expiring Soon"}
                    </Badge>
                  )
                )}
              </div>
            )}
          </div>

          {/* Status badge - OUTSIDE the aspect-video container */}
          {isAuthenticated && !isCurrentlyBooked ? (
            <button
              onClick={handleStatusToggle}
              style={{ cursor: "pointer", pointerEvents: "auto" }}
              className={`absolute top-3 right-3 z-[999] ${statusColors[displayStatus]} px-3 py-1 rounded-full text-xs font-semibold shadow-lg hover:opacity-80 transition-opacity`}
            >
              {isTogglingStatus ? "..." : displayStatus}
            </button>
          ) : (
            <div className="absolute top-3 right-3 z-[999]">
              <Badge className={`${statusColors[displayStatus]} font-semibold shadow-lg cursor-default`}>
                {displayStatus}
              </Badge>
            </div>
          )}
        </div>

        {/* Card content */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground text-balance">
              {localVehicle.name.replace(/\s*\d{4}\s*/g, "").trim()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {localVehicle.plate} {localVehicle.cc && `• ${localVehicle.cc}cc`}
              {localVehicle.keyless && <span className="text-green-500 font-medium"> • Keyless</span>}
            </p>
            {isAuthenticated && displayStatus === "rented" && (
              <button
                onClick={() => setRenterNameDialogOpen(true)}
                className="mt-2 px-2 py-1 text-sm bg-green-500/10 border border-green-500/30 rounded-md text-foreground hover:bg-green-500/20 hover:border-green-500/50 transition-colors flex items-center gap-1.5"
              >
                <span className="font-semibold text-green-500">Renter:</span>
                <span className="underline">{localVehicle.renterName || "Click to add"}</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">฿{localVehicle.dailyPrice}</span>
              <span className="text-sm text-muted-foreground">/day</span>
            </div>
            {(localVehicle.weeklyPrice || localVehicle.monthlyPrice) && (
              <div className="space-y-1">
                <div className="flex gap-3 text-sm text-muted-foreground">
                  {localVehicle.weeklyPrice && (
                    <span>
                      ฿{localVehicle.weeklyPrice}
                      <span className="text-xs">/week</span>
                    </span>
                  )}
                  {localVehicle.monthlyPrice && (
                    <span>
                      ฿{localVehicle.monthlyPrice}
                      <span className="text-xs">/month</span>
                    </span>
                  )}
                </div>
                {localVehicle.monthlyPrice && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                    <span>1+ month =</span>
                    <span className="font-bold">Save More</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {isAuthenticated && localVehicle.taxExpires && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Tax expires: {formatDate(localVehicle.taxExpires)}
              </div>
              <div className="flex items-center gap-2">
                {!isTaxSnoozed ? (
                  <Button
                    onClick={handleSnooze}
                    disabled={isSnoozing}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-transparent"
                  >
                    {isSnoozing ? "Snoozing..." : "Snooze"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleClearSnooze}
                    disabled={isSnoozing}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {localVehicle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {localVehicle.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        {/* Card footer */}
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            onClick={() => setBookingModalOpen(true)}
            style={{ backgroundColor: "#00FF3C", color: "#000" }}
            className="flex-1 gap-2 rounded-xl font-semibold hover:opacity-90"
          >
            {isCurrentlyBooked ? "Book Later" : "Book Now"}
          </Button>
          {isAuthenticated && (
            <>
              <Button
                onClick={() => (window.location.href = `/bookings?asset=${vehicle.id}`)}
                variant="outline"
                size="icon"
                className="rounded-xl bg-transparent"
                title="View Bookings"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button onClick={onEdit} variant="outline" size="icon" className="rounded-xl bg-transparent">
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Delete Vehicle</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to delete {localVehicle.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="rounded-xl bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Modals */}
      <ReserveVehicleModal vehicle={vehicle} open={bookingModalOpen} onOpenChange={setBookingModalOpen} />

      <ImageLightbox
        src={localVehicle.photos[0] || "/placeholder.svg"}
        alt={localVehicle.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <RenterNameDialog
        open={renterNameDialogOpen}
        onOpenChange={setRenterNameDialogOpen}
        currentName={localVehicle.renterName}
        onSave={handleSaveRenterName}
        assetType="vehicle"
      />
    </>
  )
}
