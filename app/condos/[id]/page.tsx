"use client"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { condosApi } from "@/lib/api"
import type { Condo } from "@/lib/types"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, CheckCircle2, Loader2, TestTube2, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { parseICalEvents } from "@/lib/airbnb-ical"
import { ShareButton } from "@/components/share-button"

export default function CondoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [condo, setCondo] = useState<Condo | null>(null)
  const [loading, setLoading] = useState(true)
  const [icalUrl, setIcalUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [testResult, setTestResult] = useState<{ count: number; nextEvents: string[] } | null>(null)

  useEffect(() => {
    loadCondo()
  }, [params.id])

  const loadCondo = async () => {
    setLoading(true)
    try {
      const data = await condosApi.getById(params.id as string)
      if (data) {
        setCondo(data)
        setIcalUrl(data.airbnbIcalUrl || "")
      }
    } catch (error) {
      console.error("[v0] Failed to load condo:", error)
      toast({
        title: "Error",
        description: "Failed to load condo details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIcalUrl = async () => {
    if (!condo) return
    setSaving(true)
    try {
      await condosApi.update(condo.id, { airbnbIcalUrl: icalUrl || undefined })
      toast({
        title: "Saved",
        description: "Airbnb calendar URL has been saved",
      })
      await loadCondo()
    } catch (error) {
      console.error("[v0] Failed to save iCal URL:", error)
      toast({
        title: "Error",
        description: "Failed to save calendar URL",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestUrl = async () => {
    if (!icalUrl) {
      toast({
        title: "Error",
        description: "Please enter an iCal URL first",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const proxyUrl = `/api/ical?url=${encodeURIComponent(icalUrl)}`
      const response = await fetch(proxyUrl, { cache: "no-store" })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Proxy error ${response.status}: ${errorText}`)
      }

      const icalText = await response.text()

      let events
      try {
        const parsedEvents = parseICalEvents(icalText)

        // Convert to the expected format with date objects
        events = parsedEvents
          .map((e) => {
            try {
              // Parse YYYYMMDD or YYYYMMDDTHHMMSSZ format
              const parseDate = (dateStr: string) => {
                if (!dateStr) return null
                if (/^\d{8}$/.test(dateStr)) {
                  // YYYYMMDD format
                  return new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`)
                }
                if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
                  // YYYYMMDDTHHMMSSZ format
                  const clean = dateStr.replace("Z", "")
                  return new Date(
                    `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}Z`,
                  )
                }
                return new Date(dateStr)
              }

              const startDate = parseDate(e.start)
              const endDate = parseDate(e.end)

              if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return null
              }

              return {
                summary: e.summary || "Reservation",
                startDate,
                endDate,
              }
            } catch (err) {
              console.warn("[v0] Error parsing event dates:", err)
              return null
            }
          })
          .filter((e): e is NonNullable<typeof e> => e !== null && e.endDate > new Date())
      } catch (parseError) {
        console.error("[v0] iCal parsing error:", parseError)
        throw new Error("Failed to parse calendar data. The calendar format may be invalid.")
      }

      setTestResult({
        count: events.length,
        nextEvents: events
          .slice(0, 3)
          .map((e) => `${e.summary} (${e.startDate.toLocaleDateString()} - ${e.endDate.toLocaleDateString()})`),
      })
      toast({
        title: "Test successful",
        description: `Found ${events.length} upcoming reservations`,
      })
    } catch (error: any) {
      console.error("[v0] Failed to test iCal URL:", error)
      toast({
        title: "Test failed",
        description: error?.message || "Could not fetch calendar data. Check the URL and try again.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSyncNow = async () => {
    if (!condo || !condo.airbnbIcalUrl) {
      toast({
        title: "Error",
        description: "Please save an iCal URL first",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    toast({
      title: "Airbnb sync started...",
      description: "Fetching and inserting calendar data",
    })

    try {
      const result = await condosApi.syncAirbnbCalendar(condo.id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Sync complete",
        description: `Airbnb sync done: ${result.bookingsCreated} inserted`,
      })

      await loadCondo()
    } catch (error: any) {
      console.error("[v0] Failed to sync calendar:", error)
      toast({
        title: "Sync failed",
        description: error?.message || "Could not sync calendar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleTestInsert = async () => {
    if (!condo?.id) {
      toast({
        title: "Error",
        description: "Missing condo ID",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("bookings").insert({
        condo_id: condo.id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString(),
        booked_through: "Airbnb",
        source: "Airbnb",
        status: "confirmed",
        notes: "Test insert",
      })

      if (error) {
        toast({
          title: "Test insert failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Test insert succeeded",
          description: "DB insert OK",
        })
        await loadCondo()
      }
    } catch (e: any) {
      toast({
        title: "Test insert error",
        description: e?.message || "Unknown error",
        variant: "destructive",
      })
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

  if (!condo) {
    return (
      <AppShell
        header={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Condo Not Found</h1>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">The requested condo could not be found.</p>
          </Card>
        </div>
      </AppShell>
    )
  }

  const condoTitle = `${condo.building} - Unit ${condo.unitNo}`
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/condos/${condo.id}` : ""
  const shareDescription = `Check out this ${condo.bedrooms} bedroom condo for rent: ${condoTitle} - ฿${condo.price.toLocaleString()}/${condo.priceMode}. ${condo.status === "available" ? "Available now!" : "Currently rented."}`

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {condo.building} - {condo.unitNo}
              </h1>
              <p className="text-sm text-muted-foreground">
                {condo.bedrooms} bed • {condo.bathrooms} bath
              </p>
            </div>
          </div>
          <ShareButton url={shareUrl} title={condoTitle} description={shareDescription} />
        </div>
      }
    >
      <div className="container mx-auto p-4 lg:p-6">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="airbnb">
              <Calendar className="h-4 w-4 mr-2" />
              Airbnb Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card className="p-6 bg-card border-border rounded-2xl">
              <h2 className="text-lg font-semibold text-foreground mb-4">Condo Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Building</Label>
                  <p className="text-foreground font-medium">{condo.building}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unit Number</Label>
                  <p className="text-foreground font-medium">{condo.unitNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="text-foreground font-medium">
                    ฿{condo.price.toLocaleString()} / {condo.priceMode}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={condo.status === "available" ? "default" : "secondary"} className="mt-1">
                    {condo.status}
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="airbnb" className="space-y-4">
            <Card className="p-6 bg-card border-border rounded-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Airbnb Calendar Sync</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import reservations from your Airbnb calendar automatically
                  </p>
                </div>
                {condo.lastSyncedAt && (
                  <Badge variant="outline" className="gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Last synced: {new Date(condo.lastSyncedAt).toLocaleString()}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="icalUrl" className="text-foreground">
                    Airbnb iCal URL
                  </Label>
                  <Input
                    id="icalUrl"
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="rounded-xl bg-secondary border-border font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this URL from your Airbnb listing's calendar export settings
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveIcalUrl} disabled={saving} className="rounded-xl gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save URL
                  </Button>
                  <Button
                    onClick={handleTestUrl}
                    disabled={testing || !icalUrl}
                    variant="outline"
                    className="rounded-xl gap-2 bg-transparent"
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                    Test Link
                  </Button>
                  <Button
                    onClick={handleSyncNow}
                    disabled={syncing || !condo.airbnbIcalUrl}
                    variant="secondary"
                    className="rounded-xl gap-2"
                  >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sync Now
                  </Button>
                </div>

                {testResult && (
                  <Card className="p-4 bg-secondary border-border rounded-xl">
                    <h3 className="font-semibold text-foreground mb-2">Test Results</h3>
                    <p className="text-sm text-muted-foreground mb-3">Found {testResult.count} upcoming reservations</p>
                    {testResult.nextEvents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Next 3 reservations:</p>
                        <ul className="space-y-1">
                          {testResult.nextEvents.map((event, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                <Card className="p-4 bg-secondary border-border rounded-xl">
                  <h3 className="font-semibold text-foreground mb-3">Debug Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Condo ID:</span>
                      <span className="font-mono text-foreground">{condo?.id || "none"}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="font-mono text-foreground text-xs break-all">
                        {condo?.airbnbIcalUrl || "none"}
                      </span>
                    </div>
                    <Button
                      onClick={handleTestInsert}
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 mt-2 bg-transparent"
                    >
                      <TestTube2 className="h-3 w-3" />
                      Insert 1 test booking
                    </Button>
                  </div>
                </Card>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border rounded-2xl">
              <h3 className="font-semibold text-foreground mb-2">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Paste your Airbnb calendar iCal URL above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Click "Test Link" to verify the connection and preview upcoming reservations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Click "Sync Now" to import all reservations as bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Synced bookings will appear in your calendar with an "Airbnb" badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Duplicate bookings are automatically prevented</span>
                </li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
