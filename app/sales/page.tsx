"use client"

import { AppShell } from "@/components/app-shell"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { vehiclesApi, condosApi, bookingsApi } from "@/lib/api"
import type { Vehicle, Condo, Booking } from "@/lib/types"
import { Download, DollarSign, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SalesHistoryViewer } from "@/components/sales-history-viewer"
import { loadSalesHistory } from "@/lib/sales-history"
import { SimpleSalesInput } from "@/components/simple-sales-input"
import { SalesComparisonChart } from "@/components/sales-comparison-chart"

export default function SalesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [condos, setCondos] = useState<Condo[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [savedHistory, setSavedHistory] = useState<Record<string, any>>({})
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehiclesData, condosData, bookingsData] = await Promise.all([
        vehiclesApi.getAll(),
        condosApi.getAll(),
        bookingsApi.getAll(),
      ])
      setVehicles(vehiclesData)
      setCondos(condosData)
      setBookings(bookingsData)

      console.log("[v0] Loaded bookings:", bookingsData.length)
    } catch (error) {
      console.error("[v0] Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryData = async () => {
    setHistoryLoading(true)
    try {
      const history = await loadSalesHistory()
      setSavedHistory(history)
      console.log("[v0] Loaded sales history:", Object.keys(history))
    } catch (error) {
      console.error("[v0] Failed to load sales history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadHistoryData()

    const now = new Date()
    const currentYear = now.getFullYear().toString()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = monthNames[now.getMonth()]
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth)

    const handleHistoryUpdate = () => {
      console.log("[v0] ===== SALES HISTORY UPDATE EVENT RECEIVED =====")
      loadHistoryData()
    }

    window.addEventListener("salesHistoryUpdated", handleHistoryUpdate)
    console.log("[v0] Event listener registered for salesHistoryUpdated")

    return () => {
      window.removeEventListener("salesHistoryUpdated", handleHistoryUpdate)
      console.log("[v0] Event listener removed")
    }
  }, [])

  const availableYears = Array.from(new Set(Object.keys(savedHistory).map((key) => key.split("-")[0]))).sort(
    (a, b) => Number(b) - Number(a),
  )

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const thisMonthBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.startDate)
    return bookingDate >= thisMonthStart && b.status !== "cancelled"
  })

  const lastMonthBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.startDate)
    return bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd && b.status !== "cancelled"
  })

  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  const thisMonthVehicleRevenue = thisMonthBookings
    .filter((b) => b.vehicleId)
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const thisMonthCondoRevenue = thisMonthBookings
    .filter((b) => b.condoId)
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const vehicleBookings = bookings.filter((b) => b.vehicleId && b.status !== "cancelled")
  const condoBookings = bookings.filter((b) => b.condoId && b.status !== "cancelled")

  const vehicleRevenue = vehicleBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const condoRevenue = condoBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  const vehicleUtilization =
    vehicles.length > 0 ? (vehicles.filter((v) => v.status === "rented").length / vehicles.length) * 100 : 0
  const condoUtilization =
    condos.length > 0 ? (condos.filter((c) => c.status === "rented").length / condos.length) * 100 : 0

  const avgVehicleRate =
    vehicleBookings.length > 0
      ? vehicleBookings.reduce((sum, b) => sum + (b.price || 0), 0) / vehicleBookings.length
      : 0

  const avgCondoRate =
    condoBookings.length > 0 ? condoBookings.reduce((sum, b) => sum + (b.price || 0), 0) / condoBookings.length : 0

  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length
  const cancellationRate = bookings.length > 0 ? (cancelledBookings / bookings.length) * 100 : 0

  const assetRevenue = new Map<string, { name: string; revenue: number; type: string }>()

  bookings
    .filter((b) => b.status !== "cancelled")
    .forEach((booking) => {
      if (booking.vehicleId) {
        const key = `vehicle-${booking.vehicleId}`
        const existing = assetRevenue.get(key) || { name: "", revenue: 0, type: "vehicle" }
        if (!existing.name) {
          const vehicle = vehicles.find((v) => v.id === booking.vehicleId)
          existing.name = vehicle ? `${vehicle.name} (${vehicle.plate})` : "Unknown"
        }
        existing.revenue += booking.totalPrice || 0
        assetRevenue.set(key, existing)
      } else if (booking.condoId) {
        const key = `condo-${booking.condoId}`
        const existing = assetRevenue.get(key) || { name: "", revenue: 0, type: "condo" }
        if (!existing.name) {
          const condo = condos.find((c) => c.id === booking.condoId)
          existing.name = condo ? `${condo.building} ${condo.unitNo}` : "Unknown"
        }
        existing.revenue += booking.totalPrice || 0
        assetRevenue.set(key, existing)
      }
    })

  const topAssets = Array.from(assetRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const latestMonthData = (() => {
    const keys = Object.keys(savedHistory)
    if (keys.length === 0) return null

    const sortedKeys = keys.sort((a, b) => {
      const [yearA, monthA] = a.split("-")
      const [yearB, monthB] = b.split("-")
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const dateA = new Date(Number.parseInt(yearA), monthNames.indexOf(monthA))
      const dateB = new Date(Number.parseInt(yearB), monthNames.indexOf(monthB))
      return dateB.getTime() - dateA.getTime()
    })

    const latestKey = sortedKeys[0]
    console.log("[v0] Latest month key:", latestKey)
    return savedHistory[latestKey]
  })()

  const selectedMonthData = (() => {
    if (!selectedYear || !selectedMonth) {
      console.log("[v0] No year or month selected")
      return null
    }
    const key = `${selectedYear}-${selectedMonth}`
    console.log("[v0] ===== LOOKING UP MONTH DATA =====")
    console.log("[v0] Looking for key:", key)
    console.log("[v0] Available keys in history:", Object.keys(savedHistory))
    const data = savedHistory[key]
    console.log("[v0] Found data:", data ? "YES" : "NO")
    return data || null
  })()

  const yearOverYearData = (() => {
    if (!selectedYear) return null

    const currentYear = selectedYear
    const previousYear = (Number.parseInt(selectedYear) - 1).toString()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const now = new Date()
    const currentYearNum = now.getFullYear()
    const currentMonthIndex = now.getMonth() // 0-11
    const selectedYearNum = Number.parseInt(selectedYear)

    const monthlyComparison = monthNames.map((month, index) => {
      const currentKey = `${currentYear}-${month}`
      const previousKey = `${previousYear}-${month}`

      const currentData = savedHistory[currentKey]
      const previousData = savedHistory[previousKey]

      const currentTotal = currentData ? (currentData.totalVehicles || 0) + (currentData.totalCondos || 0) : 0
      const previousTotal = previousData ? (previousData.totalVehicles || 0) + (previousData.totalCondos || 0) : 0

      const growthAmount = currentTotal - previousTotal
      const growthPercent = previousTotal > 0 ? (growthAmount / previousTotal) * 100 : currentTotal > 0 ? 100 : 0

      const isFutureMonth = selectedYearNum === currentYearNum && index > currentMonthIndex

      return {
        month,
        currentTotal,
        previousTotal,
        growthAmount,
        growthPercent,
        hasCurrentData: !!currentData,
        hasPreviousData: !!previousData,
        isFutureMonth,
      }
    })

    const monthsToInclude = monthlyComparison.filter((m) => !m.isFutureMonth)

    const totalCurrent = monthsToInclude.reduce((sum, m) => sum + m.currentTotal, 0)
    const totalPrevious = monthsToInclude.reduce((sum, m) => sum + m.previousTotal, 0)
    const totalGrowth = totalCurrent - totalPrevious
    const totalGrowthPercent = totalPrevious > 0 ? (totalGrowth / totalPrevious) * 100 : 0

    return {
      monthlyComparison,
      totalCurrent,
      totalPrevious,
      totalGrowth,
      totalGrowthPercent,
      currentYear,
      previousYear,
    }
  })()

  const revenueByType = (() => {
    if (!latestMonthData) {
      return {
        vehicleRevenue: 0,
        condoRevenue: 0,
        totalRevenue: 0,
      }
    }

    const vehicleRevenue = latestMonthData.totalVehicles || 0
    const condoRevenue = latestMonthData.totalCondos || 0
    const totalRevenue = vehicleRevenue + condoRevenue

    console.log("[v0] Revenue by type from sales history:", {
      vehicleRevenue,
      condoRevenue,
      totalRevenue,
      month: latestMonthData.month,
      year: latestMonthData.year,
    })

    return { vehicleRevenue, condoRevenue, totalRevenue }
  })()

  return (
    <AuthGuard allowedRoles={["owner"]}>
      <AppShell
        header={<h1 className="text-xl font-bold text-foreground">Sales Analytics</h1>}
        actions={
          <div className="flex gap-2">
            <SalesHistoryViewer />
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        }
      >
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <SimpleSalesInput />

            <Card className="rounded-2xl border-border bg-card shadow-lg lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue This Month</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {latestMonthData ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      ฿{((latestMonthData.totalVehicles || 0) + (latestMonthData.totalCondos || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <div>Bikes + Cars: ฿{(latestMonthData.totalVehicles || 0).toLocaleString()}</div>
                      <div>Condos: ฿{(latestMonthData.totalCondos || 0).toLocaleString()}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {latestMonthData.month} {latestMonthData.year}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">฿0</div>
                    <p className="text-xs text-muted-foreground mt-2">No sales data yet</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <SalesComparisonChart />

          {loading || historyLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-2xl border-border bg-card">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="rounded-2xl border-border bg-card shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sales History</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="lg:hidden w-24">
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full h-10 px-2 text-sm rounded-md border border-input bg-background text-foreground"
                        >
                          <option value="">Year</option>
                          {availableYears.length > 0 ? (
                            availableYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))
                          ) : (
                            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                          )}
                        </select>
                      </div>
                      <div className="hidden lg:block w-24">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={5}>
                            {availableYears.length > 0 ? (
                              availableYears.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={new Date().getFullYear().toString()}>
                                {new Date().getFullYear()}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="lg:hidden flex-1">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full h-10 px-2 text-sm rounded-md border border-input bg-background text-foreground"
                        >
                          <option value="">Month</option>
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                            (month) => (
                              <option key={month} value={month}>
                                {month}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div className="hidden lg:block flex-1">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={5}>
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                              (month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {selectedMonthData ? (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Vehicles: ฿{(selectedMonthData.totalVehicles || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Condos: ฿{(selectedMonthData.totalCondos || 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-bold text-foreground pt-1 border-t border-border">
                          Total: ฿
                          {(
                            (selectedMonthData.totalVehicles || 0) + (selectedMonthData.totalCondos || 0)
                          ).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {selectedYear && selectedMonth ? "No data for this month" : "Select year and month"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border bg-card shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{thisMonthBookings.length}</div>
                  <p className="text-xs text-muted-foreground">{thisMonthBookings.length} this month</p>
                </CardContent>
              </Card>
            </div>
          )}

          {yearOverYearData && (
            <Card className="rounded-2xl border-border bg-card shadow-lg col-span-full">
              <CardHeader>
                <CardTitle className="text-foreground">Year-over-Year Growth</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Comparing {yearOverYearData.currentYear} vs {yearOverYearData.previousYear} ({(() => {
                    const now = new Date()
                    const selectedYearNum = Number.parseInt(yearOverYearData.currentYear)
                    const currentYearNum = now.getFullYear()
                    if (selectedYearNum === currentYearNum) {
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ]
                      return `Jan - ${monthNames[now.getMonth()]}`
                    }
                    return "All Months"
                  })()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{yearOverYearData.previousYear} Total</p>
                      <p className="text-2xl font-bold text-foreground">
                        ฿{yearOverYearData.totalPrevious.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-3xl font-bold ${yearOverYearData.totalGrowthPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {yearOverYearData.totalGrowthPercent >= 0 ? "+" : ""}
                        {yearOverYearData.totalGrowthPercent.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {yearOverYearData.totalGrowth >= 0 ? "+" : ""}฿{yearOverYearData.totalGrowth.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">{yearOverYearData.currentYear} Total</p>
                      <p className="text-2xl font-bold text-foreground">
                        ฿{yearOverYearData.totalCurrent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {yearOverYearData.monthlyComparison.map((monthData) => (
                      <div
                        key={monthData.month}
                        className={`p-3 rounded-lg border ${
                          monthData.isFutureMonth
                            ? "border-dashed border-muted-foreground/20 bg-muted/10 opacity-40"
                            : monthData.hasCurrentData || monthData.hasPreviousData
                              ? "border-border bg-card"
                              : "border-dashed border-muted-foreground/30 bg-muted/20"
                        }`}
                      >
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          {monthData.month}
                          {monthData.isFutureMonth && <span className="ml-1 text-[8px]">(future)</span>}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {yearOverYearData.previousYear.slice(-2)}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {monthData.hasPreviousData ? `฿${(monthData.previousTotal / 1000).toFixed(0)}k` : "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {yearOverYearData.currentYear.slice(-2)}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {monthData.hasCurrentData ? `฿${(monthData.currentTotal / 1000).toFixed(0)}k` : "-"}
                            </span>
                          </div>
                          {(monthData.hasCurrentData || monthData.hasPreviousData) && !monthData.isFutureMonth && (
                            <div className="pt-1 border-t border-border">
                              <p
                                className={`text-[10px] font-bold text-center ${
                                  monthData.growthPercent >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {monthData.growthPercent >= 0 ? "+" : ""}
                                {monthData.growthPercent.toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="space-y-2">
                    {yearOverYearData.monthlyComparison
                      .filter((m) => !m.isFutureMonth && (m.hasCurrentData || m.hasPreviousData))
                      .map((monthData) => {
                        const maxValue = Math.max(monthData.currentTotal, monthData.previousTotal)
                        return (
                          <div key={monthData.month} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground w-8">{monthData.month}</span>
                              <div className="flex-1 flex gap-1">
                                <div className="flex-1 h-6 bg-secondary rounded overflow-hidden">
                                  <div
                                    className="h-full bg-muted-foreground/40 flex items-center justify-end pr-1"
                                    style={{
                                      width: `${maxValue > 0 ? (monthData.previousTotal / maxValue) * 100 : 0}%`,
                                    }}
                                  >
                                    {monthData.hasPreviousData && (
                                      <span className="text-[10px] font-medium text-foreground">
                                        ฿{(monthData.previousTotal / 1000).toFixed(0)}k
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 h-6 bg-secondary rounded overflow-hidden">
                                  <div
                                    className={`h-full ${monthData.growthPercent >= 0 ? "bg-green-500" : "bg-red-500"} flex items-center justify-end pr-1`}
                                    style={{
                                      width: `${maxValue > 0 ? (monthData.currentTotal / maxValue) * 100 : 0}%`,
                                    }}
                                  >
                                    {monthData.hasCurrentData && (
                                      <span className="text-[10px] font-bold text-white">
                                        ฿{(monthData.currentTotal / 1000).toFixed(0)}k
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-bold w-12 text-right ${
                                  monthData.growthPercent >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {monthData.growthPercent >= 0 ? "+" : ""}
                                {monthData.growthPercent.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-border bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Revenue by Type</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {latestMonthData ? `${latestMonthData.month} ${latestMonthData.year}` : "Vehicles vs Condos"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Vehicles</span>
                    <span className="text-sm font-bold text-primary">
                      ฿{revenueByType.vehicleRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${revenueByType.totalRevenue > 0 ? (revenueByType.vehicleRevenue / revenueByType.totalRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {latestMonthData && (
                    <p className="text-xs text-muted-foreground mt-1">{latestMonthData.vehicles.length} transactions</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Condos</span>
                    <span className="text-sm font-bold text-primary">
                      ฿{revenueByType.condoRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${revenueByType.totalRevenue > 0 ? (revenueByType.condoRevenue / revenueByType.totalRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {latestMonthData && (
                    <p className="text-xs text-muted-foreground mt-1">{latestMonthData.condos.length} transactions</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Utilization Rates</CardTitle>
                <CardDescription className="text-muted-foreground">Current rental status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-foreground">Vehicles</span>
                      <span className="text-sm font-bold text-primary">{vehicleUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${vehicleUtilization}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vehicles.filter((v) => v.status === "rented").length} of {vehicles.length} rented
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-foreground">Condos</span>
                      <span className="text-sm font-bold text-primary">{condoUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${condoUtilization}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {condos.filter((c) => c.status === "rented").length} of {condos.length} rented
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl border-border bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Avg Vehicle Rate</CardTitle>
                <CardDescription className="text-muted-foreground">Per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">฿{avgVehicleRate.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground mt-1">Based on {vehicleBookings.length} bookings</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Avg Condo Rate</CardTitle>
                <CardDescription className="text-muted-foreground">Per night/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">฿{avgCondoRate.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground mt-1">Based on {condoBookings.length} bookings</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Top Performing Assets</CardTitle>
              <CardDescription className="text-muted-foreground">By total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">฿{asset.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
