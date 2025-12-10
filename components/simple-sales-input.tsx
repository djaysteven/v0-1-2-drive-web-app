"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DollarSign, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MonthlySales {
  id?: string
  year: string
  month: string
  total_vehicles: number
  total_condos: number
  created_at?: string
  updated_at?: string
}

export function SimpleSalesInput() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date().getMonth()],
  )
  const [vehiclesTotal, setVehiclesTotal] = useState("")
  const [condosTotal, setCondosTotal] = useState("")
  const [saving, setSaving] = useState(false)
  const [existingData, setExistingData] = useState<MonthlySales | null>(null)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    loadExistingData()
  }, [selectedYear, selectedMonth])

  const loadExistingData = async () => {
    try {
      const response = await fetch(`/api/sales?year=${selectedYear}&month=${selectedMonth}`)

      if (!response.ok) {
        throw new Error("Failed to load data")
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const salesData = data[0]
        setExistingData(salesData)
        setVehiclesTotal(salesData.total_vehicles?.toString() || "")
        setCondosTotal(salesData.total_condos?.toString() || "")
      } else {
        setExistingData(null)
        setVehiclesTotal("")
        setCondosTotal("")
      }
    } catch (error) {
      console.error("[v0] Failed to load existing data:", error)
    }
  }

  const handleSave = async () => {
    console.log("[v0] SAVE BUTTON CLICKED")

    const vehiclesAmount = Number.parseFloat(vehiclesTotal) || 0
    const condosAmount = Number.parseFloat(condosTotal) || 0

    console.log("[v0] Parsed values:", { vehiclesAmount, condosAmount, selectedYear, selectedMonth })

    if (vehiclesAmount === 0 && condosAmount === 0) {
      console.log("[v0] Both amounts are zero, showing error")
      toast.error("Please enter at least one amount")
      return
    }

    setSaving(true)
    console.log("[v0] Starting save request...")

    try {
      const payload = {
        year: selectedYear,
        month: selectedMonth,
        total_vehicles: vehiclesAmount,
        total_condos: condosAmount,
      }

      console.log("[v0] Sending payload:", payload)

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Server error:", error)
        throw new Error(error.error || "Failed to save")
      }

      const savedData = await response.json()
      console.log("[v0] Saved successfully:", savedData)

      toast.success(`Saved sales for ${selectedMonth} ${selectedYear}`)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("salesHistoryUpdated"))
      }

      await loadExistingData()
    } catch (error: any) {
      console.error("[v0] Save failed:", error)
      toast.error(error.message || "Failed to save sales data")
    } finally {
      setSaving(false)
      console.log("[v0] Save process complete")
    }
  }

  const total = (Number.parseFloat(vehiclesTotal) || 0) + (Number.parseFloat(condosTotal) || 0)

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Quick Sales Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicles">Bikes + Cars Total (฿)</Label>
          <Input
            id="vehicles"
            type="number"
            placeholder="0"
            value={vehiclesTotal}
            onChange={(e) => setVehiclesTotal(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condos">Condos Total (฿)</Label>
          <Input
            id="condos"
            type="number"
            placeholder="0"
            value={condosTotal}
            onChange={(e) => setCondosTotal(e.target.value)}
            className="text-lg"
          />
        </div>

        {total > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Month Total</span>
              <span className="text-xl font-bold text-foreground">฿{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : existingData ? "Update Sales" : "Save Sales"}
        </Button>

        {existingData && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(existingData.updated_at || "").toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
