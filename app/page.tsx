"use client"

import type React from "react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingWizard } from "@/components/booking-wizard"
import { RemindersCard } from "@/components/reminders-card"
import { NotificationSettings } from "@/components/notification-settings"
import { DatabaseSetupBanner } from "@/components/database-setup-banner"
import { Car, Building2, Users, Calendar, Plus, Bike } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { vehiclesApi, condosApi, customersApi } from "@/lib/api"
import { useRole } from "@/hooks/use-role"

export default function HomePage() {
  const [bookingWizardOpen, setBookingWizardOpen] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [showContent, setShowContent] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("splashShown") === "true"
    }
    return false
  })
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    availableBikes: 0,
    availableCars: 0,
    totalCondos: 0,
    availableCondos: 0,
    totalCustomers: 0,
  })

  const { isOwner, loading: roleLoading } = useRole()

  useEffect(() => {
    if (!showContent) {
      const fallbackTimer = setTimeout(() => {
        setShowContent(true)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("splashShown", "true")
        }
      }, 2000)

      return () => {
        clearTimeout(fallbackTimer)
      }
    }
  }, [showContent])

  const fetchStats = useCallback(async () => {
    try {
      const [vehiclesWithStatus, condos, customers] = await Promise.all([
        vehiclesApi.getAllWithBookingStatus(),
        condosApi.getAll(),
        customersApi.getAll(),
      ])

      const availableVehicles = vehiclesWithStatus.filter((v) => !v.isCurrentlyBooked && v.status === "available")
      const availableBikes = availableVehicles.filter((v) => v.type === "bike").length
      const availableCars = availableVehicles.filter((v) => v.type === "car").length

      setStats({
        totalVehicles: vehiclesWithStatus.length,
        availableVehicles: availableVehicles.length,
        availableBikes,
        availableCars,
        totalCondos: condos.length,
        availableCondos: condos.filter((c) => c.status === "available").length,
        totalCustomers: customers.length,
      })
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }, [])

  useEffect(() => {
    if (showContent) {
      fetchStats()
    }
  }, [showContent, fetchStats])

  if (!showContent) {
    return null
  }

  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsPressed(true)
  }

  const handleRelease = () => {
    setIsPressed(false)
  }

  return (
    <AppShell
      header={<h1 className="text-xl font-bold text-foreground">Dashboard</h1>}
      actions={
        isOwner ? (
          <Button size="sm" className="gap-2" onClick={() => setBookingWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        ) : null
      }
    >
      <div className="animate-in fade-in duration-1000">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          {isOwner && <DatabaseSetupBanner />}

          <div className="rounded-2xl bg-background p-2 sm:p-4 border border-border flex items-center justify-center">
            <div
              className={!isPressed ? "animate-spin-slow" : ""}
              onMouseDown={handlePress}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={handlePress}
              onTouchEnd={handleRelease}
              onContextMenu={(e) => e.preventDefault()}
              style={{ cursor: "pointer" }}
            >
              <Image
                src="/logo.png"
                alt="1-2 DRIVE Logo"
                width={400}
                height={400}
                className="w-full max-w-[300px] lg:max-w-[400px] h-auto"
                style={{
                  mixBlendMode: "screen",
                  filter: "drop-shadow(0 0 20px rgba(0, 255, 60, 0.6)) drop-shadow(0 0 40px rgba(0, 255, 60, 0.3))",
                  pointerEvents: "none",
                }}
                priority
                draggable={false}
              />
            </div>
          </div>

          {isOwner && <RemindersCard />}

          {!isOwner && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Link href="/vehicles?type=bike" className="w-full">
                <Card className="rounded-xl sm:rounded-2xl border-border bg-card shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full min-h-[180px] sm:min-h-[240px]">
                  <CardContent className="flex flex-col items-center justify-center p-3 sm:p-8 gap-2 sm:gap-4 h-full">
                    <div className="rounded-full bg-primary/10 p-3 sm:p-6">
                      <Bike className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-base text-muted-foreground">Rent a</p>
                      <h3 className="text-base sm:text-2xl font-bold text-foreground">Bike</h3>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-primary">{stats.availableBikes}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">available</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/vehicles?type=car" className="w-full">
                <Card className="rounded-xl sm:rounded-2xl border-border bg-card shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full min-h-[180px] sm:min-h-[240px]">
                  <CardContent className="flex flex-col items-center justify-center p-3 sm:p-8 gap-2 sm:gap-4 h-full">
                    <div className="rounded-full bg-primary/10 p-3 sm:p-6">
                      <Car className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-base text-muted-foreground">Rent a</p>
                      <h3 className="text-base sm:text-2xl font-bold text-foreground">Car</h3>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-primary">{stats.availableCars}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">available</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/condos" className="w-full">
                <Card className="rounded-xl sm:rounded-2xl border-border bg-card shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer h-full min-h-[180px] sm:min-h-[240px]">
                  <CardContent className="flex flex-col items-center justify-center p-3 sm:p-8 gap-2 sm:gap-4 h-full">
                    <div className="rounded-full bg-primary/10 p-3 sm:p-6">
                      <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-base text-muted-foreground">Rent a</p>
                      <h3 className="text-base sm:text-2xl font-bold text-foreground">Condo</h3>
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-2xl font-bold text-primary">{stats.availableCondos}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">available</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          <div className="flex justify-center">
            <Card className="rounded-2xl border-border bg-card shadow-lg w-full max-w-4xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground text-center">Fleet Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Vehicles</p>
                      <p className="text-xs text-muted-foreground">{stats.totalVehicles} total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{stats.availableVehicles}</p>
                    <p className="text-xs text-muted-foreground">available</p>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Condos</p>
                      <p className="text-xs text-muted-foreground">{stats.totalCondos} total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{stats.availableCondos}</p>
                    <p className="text-xs text-muted-foreground">available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isOwner && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-2xl border-border bg-card shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">Total registered</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border bg-card shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Link href="/vehicles" className="w-full">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-sm">Vehicles</span>
                      </Button>
                    </Link>

                    <Link href="/condos" className="w-full">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">Condos</span>
                      </Button>
                    </Link>

                    <Link href="/bookings" className="w-full">
                      <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm">Bookings</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isOwner && <NotificationSettings />}
        </div>
      </div>

      <BookingWizard open={bookingWizardOpen} onOpenChange={setBookingWizardOpen} onSave={() => {}} isOwner={isOwner} />
    </AppShell>
  )
}
