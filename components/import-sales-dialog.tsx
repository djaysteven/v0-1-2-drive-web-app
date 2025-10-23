"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, AlertCircle, CheckCircle2, Calendar } from "lucide-react"
import { bookingsApi, vehiclesApi, condosApi, customersApi } from "@/lib/api"
import type { Booking } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ParsedBooking {
  customerName: string
  assetName: string
  startDate: string
  endDate: string
  price: number
  month: string
  vehicleId?: string
  condoId?: string
  line: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export function ImportSalesDialog({ onImportComplete }: { onImportComplete?: () => void }) {
  const [open, setOpen] = useState(false)
  const [notesText, setNotesText] = useState("")
  const [parsedBookings, setParsedBookings] = useState<ParsedBooking[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<"input" | "preview">("input")

  const parseNotesText = async (text: string): Promise<ParsedBooking[]> => {
    const bookings: ParsedBooking[] = []
    const lines = text.split("\n").filter((line) => line.trim())

    console.log("[v0] Parsing", lines.length, "lines from import")

    const [vehicles, condos] = await Promise.all([vehiclesApi.getAll(), condosApi.getAll()])

    console.log("[v0] Loaded", vehicles.length, "vehicles,", condos.length, "condos")

    for (const line of lines) {
      try {
        console.log("[v0] Parsing line:", line)

        // Split by colon to get price and rest
        const colonParts = line.split(":").map((p) => p.trim())
        if (colonParts.length < 2) {
          console.log("[v0] Skipping line - no colon separator")
          continue
        }

        const priceStr = colonParts[0].replace(/\./g, "").replace(/,/g, "") // Remove dots/commas from price
        const price = Number.parseInt(priceStr)
        if (isNaN(price)) {
          console.log("[v0] Skipping line - invalid price:", priceStr)
          continue
        }

        // Parse the rest: "customer name date-range vehicle"
        // Example: "Bart 18-10/18-11* fiesta"
        const rest = colonParts[1].trim()

        // Match pattern: customer name, date range (DD-MM/DD-MM), optional *, vehicle name
        const match = rest.match(/^(.+?)\s+(\d{1,2}-\d{1,2})\/(\d{1,2}-\d{1,2})\*?\s+(.+)$/)
        if (!match) {
          console.log("[v0] Skipping line - pattern doesn't match:", rest)
          continue
        }

        const customerName = match[1].trim()
        const startDateStr = match[2] // DD-MM
        const endDateStr = match[3] // DD-MM
        const assetName = match[4].trim()

        console.log("[v0] Parsed:", { customerName, startDateStr, endDateStr, assetName, price })

        // Assume current year if not specified
        const currentYear = new Date().getFullYear()
        const [startDay, startMonth] = startDateStr.split("-").map(Number)
        const [endDay, endMonth] = endDateStr.split("-").map(Number)

        // Create dates
        const startDate = new Date(currentYear, startMonth - 1, startDay)
        const endDate = new Date(currentYear, endMonth - 1, endDay)

        // If end date is before start date, assume it's next year
        if (endDate < startDate) {
          endDate.setFullYear(currentYear + 1)
        }

        const startDateISO = startDate.toISOString().split("T")[0]
        const endDateISO = endDate.toISOString().split("T")[0]

        // Get month name for grouping
        const monthName = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

        console.log("[v0] Dates:", { startDateISO, endDateISO, monthName })

        let vehicleId: string | undefined
        let condoId: string | undefined

        const vehicle = vehicles.find(
          (v) =>
            v.name.toLowerCase().includes(assetName.toLowerCase()) ||
            v.plate.toLowerCase().includes(assetName.toLowerCase()),
        )

        if (vehicle) {
          vehicleId = vehicle.id
          console.log("[v0] Found vehicle:", vehicle.name, vehicle.id)
        } else {
          const condo = condos.find(
            (c) =>
              c.unitNo.toLowerCase().includes(assetName.toLowerCase()) ||
              `${c.building} ${c.unitNo}`.toLowerCase().includes(assetName.toLowerCase()),
          )
          if (condo) {
            condoId = condo.id
            console.log("[v0] Found condo:", condo.building, condo.unitNo, condo.id)
          }
        }

        bookings.push({
          customerName,
          assetName,
          startDate: startDateISO,
          endDate: endDateISO,
          price,
          month: monthName,
          vehicleId,
          condoId,
          line,
        })
      } catch (error) {
        console.error("[v0] Failed to parse line:", line, error)
      }
    }

    console.log("[v0] Successfully parsed", bookings.length, "bookings")
    return bookings
  }

  const handleParse = async () => {
    console.log("[v0] Starting parse...")
    const bookings = await parseNotesText(notesText)
    setParsedBookings(bookings)
    setStep("preview")
  }

  const handleImport = async () => {
    setImporting(true)
    setResult(null)

    try {
      console.log("[v0] Starting import of", parsedBookings.length, "bookings...")

      const errors: string[] = []
      let success = 0

      const customers = await customersApi.getAll()

      for (const parsed of parsedBookings) {
        try {
          if (!parsed.vehicleId && !parsed.condoId) {
            errors.push(`Asset not found: ${parsed.assetName}`)
            continue
          }

          // Find or create customer
          let customer = customers.find((c) => c.name.toLowerCase() === parsed.customerName.toLowerCase())
          if (!customer) {
            console.log("[v0] Creating new customer:", parsed.customerName)
            customer = await customersApi.create({
              name: parsed.customerName,
              phone: "",
            })
          }

          const booking: Omit<Booking, "id"> = {
            customerId: customer.id,
            customerName: customer.name,
            vehicleId: parsed.vehicleId,
            condoId: parsed.condoId,
            assetType: parsed.vehicleId ? "vehicle" : "condo",
            assetId: parsed.vehicleId || parsed.condoId || "",
            assetName: parsed.assetName,
            startDate: parsed.startDate,
            endDate: parsed.endDate,
            price: parsed.price,
            priceMode: "day",
            totalPrice: parsed.price,
            depositPaid: 0,
            status: "returned",
            source: "manual",
            notes: `Imported from notes: ${parsed.line}`,
          }

          console.log("[v0] Creating booking:", booking)
          await bookingsApi.create(booking)
          success++
          console.log("[v0] Booking created successfully")
        } catch (error: any) {
          const errorMsg = `Failed to import ${parsed.customerName} - ${parsed.assetName}: ${error.message || error}`
          console.error("[v0]", errorMsg)
          errors.push(errorMsg)
        }
      }

      console.log("[v0] Import complete:", success, "successful,", errors.length, "failed")

      setResult({
        success,
        failed: parsedBookings.length - success,
        errors,
      })

      if (success > 0 && onImportComplete) {
        onImportComplete()
      }
    } catch (error: any) {
      console.error("[v0] Import failed:", error)
      setResult({
        success: 0,
        failed: 0,
        errors: [`Import failed: ${error.message || error}`],
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setNotesText("")
    setParsedBookings([])
    setResult(null)
    setStep("input")
  }

  const handleBack = () => {
    setStep("input")
    setParsedBookings([])
    setResult(null)
  }

  // Group bookings by month
  const bookingsByMonth = parsedBookings.reduce(
    (acc, booking) => {
      if (!acc[booking.month]) {
        acc[booking.month] = []
      }
      acc[booking.month].push(booking)
      return acc
    },
    {} as Record<string, ParsedBooking[]>,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import from Notes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">
            {step === "input" ? "Import Sales from Notes" : "Preview Parsed Bookings"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === "input"
              ? "Paste your sales data from notes. Each line should follow this format:"
              : `Found ${parsedBookings.length} bookings organized by month`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {step === "input" ? (
            <>
              <div className="rounded-lg bg-secondary/50 p-3 text-xs font-mono text-muted-foreground">
                <div>price : customer name date-range* vehicle</div>
                <div className="mt-2 text-primary">Example:</div>
                <div>15.000 : Bart 18-10/18-11* fiesta</div>
                <div>20.000 : John 01-11/15-11 pcx</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes-text" className="text-foreground">
                  Paste your notes here
                </Label>
                <Textarea
                  id="notes-text"
                  placeholder="Paste your sales data here..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="min-h-[300px] max-h-[400px] font-mono text-sm bg-background border-border text-foreground resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {Object.entries(bookingsByMonth).map(([month, bookings]) => (
                <div key={month} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calendar className="h-4 w-4" />
                    {month}
                    <Badge variant="secondary">{bookings.length} bookings</Badge>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{booking.customerName}</TableCell>
                            <TableCell>{booking.assetName}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(booking.startDate).toLocaleDateString("en-GB")} -{" "}
                              {new Date(booking.endDate).toLocaleDateString("en-GB")}
                            </TableCell>
                            <TableCell className="text-right font-mono">{booking.price.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                              {booking.vehicleId || booking.condoId ? (
                                <Badge variant="default" className="bg-green-500">
                                  Ready
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Not Found</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}

              {result && (
                <Alert className={result.success > 0 ? "border-primary" : "border-destructive"}>
                  {result.success > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <AlertDescription className="text-foreground">
                    <div className="font-semibold mb-1">
                      Import Complete: {result.success} successful, {result.failed} failed
                    </div>
                    {result.errors.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {result.errors.slice(0, 3).map((error, i) => (
                          <div key={i}>{error}</div>
                        ))}
                        {result.errors.length > 3 && <div>... and {result.errors.length - 3} more errors</div>}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
          {step === "input" ? (
            <>
              <Button variant="outline" onClick={handleClose} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!notesText.trim()} className="bg-primary text-primary-foreground">
                Parse & Preview
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={result ? handleClose : handleBack} className="bg-transparent">
                {result ? "Close" : "Back"}
              </Button>
              {!result && (
                <Button
                  onClick={handleImport}
                  disabled={parsedBookings.length === 0 || importing}
                  className="bg-primary text-primary-foreground"
                >
                  {importing ? "Importing..." : `Import ${parsedBookings.length} Bookings`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
