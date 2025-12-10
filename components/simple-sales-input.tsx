"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { DollarSign, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MonthlySales {
  id?: string
  year: string
  month: string
  vehicles_total: number
  condos_total: number
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
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("sales_history")
        .select("*")
        .eq("year", selectedYear)
        .eq("month", selectedMonth)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found, which is fine
        console.error("[v0] Error loading sales data:", error)
        return
      }

      if (data) {
        setExistingData(data)
        setVehiclesTotal(data.total_vehicles?.toString() || "0")
        setCondosTotal(data.total_condos?.toString() || "0")
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
    const vehiclesAmount = Number.parseFloat(vehiclesTotal) || 0
    const condosAmount = Number.parseFloat(condosTotal) || 0

    if (vehiclesAmount === 0 && condosAmount === 0) {
      toast.error("Please enter at least one amount")
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("sales_history").upsert(
        {
          year: selectedYear,
          month: selectedMonth,
          vehicles: [], // Keep empty for simple input
          condos: [], // Keep empty for simple input
          total_vehicles: vehiclesAmount,
          total_condos: condosAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "year,month" },
      )

      if (error) throw error

      toast.success(`Saved sales for ${selectedMonth} ${selectedYear}`)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("salesHistoryUpdated"))
      }

      await loadExistingData()
    } catch (error: any) {
      console.error("[v0] Failed to save:", error)
      toast.error(error.message || "Failed to save sales data")
    } finally {
      setSaving(false)
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
