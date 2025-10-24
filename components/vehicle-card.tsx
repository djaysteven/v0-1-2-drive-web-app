"use client"

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
import { useState } from "react"
import { vehiclesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ReserveVehicleModal } from "./reserve-vehicle-modal"

interface VehicleCardProps {
  vehicle: Vehicle
  isCurrentlyBooked?: boolean // Added prop to indicate if vehicle is currently booked
  isAuthenticated?: boolean // Added prop to control admin features visibility
  onEdit?: () => void
  onDelete?: () => void
}

export function VehicleCard({
  vehicle,
  isCurrentlyBooked = false,
  isAuthenticated = false,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const [isSnoozing, setIsSnoozing] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const { toast } = useToast()

  const statusColors = {
    available: "bg-primary/30 text-primary border-primary/50",
    rented: "bg-blue-500/20 text-blue-400 border-blue-500/30",
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

  const isTaxSnoozed = vehicle.taxOverrideUntil && new Date(vehicle.taxOverrideUntil) > new Date()
  const taxStatus = isTaxSnoozed ? "snoozed" : isTaxExpired(vehicle.taxExpires) ? "expired" : "expiring"

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

  const formatSnoozeDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const displayStatus = isCurrentlyBooked ? "rented" : vehicle.status
  const displayStatusText = isCurrentlyBooked ? "rented" : vehicle.status

  return (
    <>
      <Card className="rounded-2xl border-border bg-card shadow-lg overflow-hidden group hover:border-primary/50 transition-colors">
        <div className="relative aspect-video overflow-hidden bg-secondary">
          <Image
            src={vehicle.photos[0] || "/placeholder.svg?height=300&width=400"}
            alt={vehicle.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={85}
          />
          <div className="absolute top-3 right-3">
            <Badge className={statusColors[displayStatus]}>{displayStatusText}</Badge>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="gap-1">
              {vehicle.type === "bike" ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
              {vehicle.type}
            </Badge>
          </div>
          {isAuthenticated && vehicle.taxExpires && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {isTaxSnoozed ? (
                <>
                  <Badge style={{ backgroundColor: "#00FF3C", color: "#000" }} className="font-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    Tax OK
                  </Badge>
                </>
              ) : (
                (isTaxExpired(vehicle.taxExpires) || isTaxExpiringSoon(vehicle.taxExpires)) && (
                  <Badge
                    style={{
                      backgroundColor: isTaxExpired(vehicle.taxExpires) ? "#FF4040" : "#FFA500",
                      color: "#fff",
                    }}
                    className="font-medium"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {isTaxExpired(vehicle.taxExpires) ? "Tax Expired" : "Tax Expiring Soon"}
                  </Badge>
                )
              )}
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground text-balance">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.plate} {vehicle.cc && `• ${vehicle.cc}cc`} {vehicle.year && `• ${vehicle.year}`}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">฿{vehicle.dailyPrice}</span>
              <span className="text-sm text-muted-foreground">/day</span>
            </div>
            {(vehicle.weeklyPrice || vehicle.monthlyPrice) && (
              <div className="flex gap-3 text-sm text-muted-foreground">
                {vehicle.weeklyPrice && (
                  <span>
                    ฿{vehicle.weeklyPrice}
                    <span className="text-xs">/week</span>
                  </span>
                )}
                {vehicle.monthlyPrice && (
                  <span>
                    ฿{vehicle.monthlyPrice}
                    <span className="text-xs">/month</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {isAuthenticated && vehicle.taxExpires && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Tax expires: {formatDate(vehicle.taxExpires)}
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

          {vehicle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vehicle.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

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
                      Are you sure you want to delete {vehicle.name}? This action cannot be undone.
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

      <ReserveVehicleModal vehicle={vehicle} open={bookingModalOpen} onOpenChange={setBookingModalOpen} />
    </>
  )
}
