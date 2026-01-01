"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { vehiclesApi } from "@/lib/api"
import type { Vehicle } from "@/lib/types"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/hooks/use-role"
import { ArrowLeft, Car, Calendar, Fuel, Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { ShareButton } from "@/components/share-button"

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isOwner } = useRole()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params?.id && typeof params.id === "string") {
      loadVehicle()
    } else {
      setError("Invalid vehicle ID")
      setLoading(false)
    }
  }, [params?.id])

  const loadVehicle = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vehiclesApi.getById(params.id as string)
      if (data) {
        setVehicle(data)
      } else {
        setError("Vehicle not found")
      }
    } catch (error) {
      console.error("Failed to load vehicle:", error)
      setError("Failed to load vehicle details")
      toast({
        title: "Error",
        description: "Failed to load vehicle details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell
        header={
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </AppShell>
    )
  }

  if (error || !vehicle) {
    return (
      <AppShell
        header={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/vehicles")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Vehicle Not Found</h1>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error || "The requested vehicle could not be found."}</p>
            <Button onClick={() => router.push("/vehicles")} className="mt-4 rounded-xl">
              View All Vehicles
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  const vehicleTitle = vehicle.name
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/vehicles/${vehicle.id}`
      : `https://www.1-2drive.com/vehicles/${vehicle.id}`
  const shareDescription = `Check out this ${vehicle.type} for rent: ${vehicleTitle} - ฿${vehicle.dailyPrice.toLocaleString()}/day. ${vehicle.status === "available" ? "Available now!" : "Currently rented."}`

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/vehicles")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{vehicleTitle}</h1>
              <p className="text-sm text-muted-foreground">{vehicle.type}</p>
            </div>
          </div>
          <ShareButton url={shareUrl} title={vehicleTitle} description={shareDescription} />
        </div>
      }
    >
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        <Card className="overflow-hidden rounded-2xl bg-card border-border">
          <div className="relative aspect-video w-full">
            <Image
              src={vehicle.photos[0] || "/placeholder.svg?height=400&width=800&query=vehicle"}
              alt={vehicleTitle}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute top-4 left-4">
              <Badge
                variant={vehicle.status === "available" ? "default" : "secondary"}
                className={`text-sm px-3 py-1 ${
                  vehicle.status === "available" ? "bg-emerald-500/90 text-white" : "bg-rose-500/90 text-white"
                }`}
              >
                {vehicle.status === "available" ? "Available" : "Rented"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border rounded-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-4">Vehicle Information</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Type</Label>
                <p className="text-foreground font-medium capitalize">{vehicle.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="text-foreground font-medium">{vehicle.name}</p>
              </div>
            </div>
            {vehicle.cc && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Engine CC</Label>
                  <p className="text-foreground font-medium">{vehicle.cc} cc</p>
                </div>
              </div>
            )}
            {vehicle.year && isOwner && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Year</Label>
                  <p className="text-foreground font-medium">{vehicle.year}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border rounded-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pricing</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">฿{vehicle.dailyPrice.toLocaleString()}</span>
            <span className="text-muted-foreground">/ day</span>
          </div>
          {vehicle.weeklyPrice && vehicle.weeklyPrice > 0 && (
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-semibold text-foreground">฿{vehicle.weeklyPrice.toLocaleString()}</span>
              <span className="text-muted-foreground">/ week</span>
            </div>
          )}
          {vehicle.monthlyPrice && vehicle.monthlyPrice > 0 && (
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-semibold text-foreground">฿{vehicle.monthlyPrice.toLocaleString()}</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
          )}
          {vehicle.status === "available" && (
            <Button
              onClick={() => router.push(`/vehicles?book=${vehicle.id}`)}
              className="mt-4 rounded-xl w-full sm:w-auto"
            >
              Book Now
            </Button>
          )}
        </Card>

        {(vehicle.plate || vehicle.color) && (
          <Card className="p-6 bg-card border-border rounded-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Additional Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {vehicle.plate && (
                <div>
                  <Label className="text-muted-foreground text-xs">License Plate</Label>
                  <p className="text-foreground font-medium">{vehicle.plate}</p>
                </div>
              )}
              {vehicle.color && (
                <div>
                  <Label className="text-muted-foreground text-xs">Color</Label>
                  <p className="text-foreground font-medium capitalize">{vehicle.color}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
