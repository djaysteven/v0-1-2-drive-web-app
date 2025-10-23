"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Upload, Calendar, Database, Wifi, Save } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type MonthData, loadSalesHistory, saveSalesHistory } from "@/lib/sales-history"
import { createBrowserClient } from "@/lib/supabase/client"

export function SalesHistoryViewer() {
  const [open, setOpen] = useState(false)
  const [notesText, setNotesText] = useState("")
  const [parsedData, setParsedData] = useState<MonthData[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"import" | "view">("import")
  const [savedHistory, setSavedHistory] = useState<Record<string, MonthData>>({})
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [yearOptions, setYearOptions] = useState<number[]>([])
  const [hasDataToSave, setHasDataToSave] = useState(false)

  useEffect(() => {
    if (open) {
      loadHistoryData()
      loadYearOptions()
    }
  }, [open])

  const loadYearOptions = async () => {
    try {
      await fetch("/api/health") // Warm up connection
      const supabase = createBrowserClient()
      const years = new Set<number>()

      const { data, error } = await supabase
        .from("sales")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1000)

      if (!error && data) {
        for (const r of data) {
          const d = new Date(r.created_at)
          if (!isNaN(+d)) years.add(d.getFullYear())
        }
      }

      if (years.size === 0) {
        years.add(new Date().getFullYear())
      }

      const yearArray = Array.from(years).sort((a, b) => b - a)
      console.log("[v0] Loaded year options:", yearArray)
      setYearOptions(yearArray)
    } catch (error) {
      console.error("[v0] Failed to load year options:", error)
      setYearOptions([new Date().getFullYear()])
    }
  }

  const loadHistoryData = async () => {
    setLoading(true)
    try {
      const history = await loadSalesHistory()
      setSavedHistory(history)
    } catch (error) {
      console.error("[v0] Failed to load history:", error)
    } finally {
      setLoading(false)
    }
  }

  const availableYears = Array.from(new Set(Object.keys(savedHistory).map((key) => key.split("-")[0]))).sort(
    (a, b) => Number(b) - Number(a),
  )
  const availableMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const selectedMonthData = selectedYear && selectedMonth ? savedHistory[`${selectedYear}-${selectedMonth}`] : null

  useEffect(() => {
    const hasData = parsedData.length > 0
    console.log("[v0] parsedData changed, length:", parsedData.length, "hasData:", hasData)
    setHasDataToSave(hasData)
  }, [parsedData])

  const parseNotes = async () => {
    console.log("[v0] ===== PARSE BUTTON CLICKED =====")
    console.log("[v0] notesText length:", notesText.length)

    if (!notesText.trim()) {
      toast.error("Please paste your sales notes first")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Calling /api/notes/parse...")
      const res = await fetch("/api/notes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notesText }),
      })

      console.log("[v0] Parse response status:", res.status)
      const j = await res.json()
      console.log("[v0] Parse response data:", j)

      if (!res.ok) {
        throw new Error(j.error || "Parse failed")
      }

      console.log("[v0] Setting parsedData with items:", j.items)
      console.log("[v0] Items length:", j.items?.length || 0)
      setParsedData(j.items || [])

      setTimeout(() => {
        alert(`Parsed ${j.items?.length || 0} months. Buttons should now be enabled.`)
      }, 100)

      if (j.items?.length === 0) {
        toast.error("No data found. Make sure your text includes month headers like: 📅Sept 2025📅")
      } else {
        const totalEntries = j.items.reduce(
          (sum: number, m: any) => sum + (m.vehicles?.length || 0) + (m.condos?.length || 0),
          0,
        )
        toast.success(`Parsed ${j.items.length} months with ${totalEntries} entries`)
      }
    } catch (e: any) {
      console.error("[v0] Parse error:", e)
      toast.error(e?.message || "Parse failed")
    } finally {
      setLoading(false)
    }
  }

  const migrateSales = () => {
    console.log("[MIGRATE] ===== BUTTON CLICKED - FUNCTION STARTED =====")
    alert("Migrate function called! Check console for details.")

    console.log("[MIGRATE] parsedData.length:", parsedData.length)
    console.log("[MIGRATE] hasDataToSave:", hasDataToSave)

    if (!parsedData?.length) {
      toast.error("Nothing to migrate. Parse your notes first.")
      return
    }

    setMigrating(true)

    fetch("/api/sales/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: parsedData }),
    })
      .then((res) => {
        console.log("[MIGRATE] Response status:", res.status)
        return res.json()
      })
      .then((j) => {
        console.log("[MIGRATE] Response data:", j)

        if (j.error) {
          if (j.error.includes("relation") && j.error.includes("does not exist")) {
            toast.error(
              "Sales table missing — run this once in Supabase SQL:\n\n" +
                "create table public.sales (\n" +
                "  id uuid primary key default gen_random_uuid(),\n" +
                "  created_at timestamptz default now(),\n" +
                "  amount numeric(12,2),\n" +
                "  category text,\n" +
                "  notes text\n" +
                ");",
              { duration: 10000 },
            )
          } else {
            throw new Error(j.error || "Migrate failed")
          }
          return
        }

        toast.success(`Migrated ${j.inserted || 0} sales`)

        console.log("[MIGRATE] Clearing parsedData...")
        setParsedData([])
        setNotesText("")
        setHasDataToSave(false)

        loadHistoryData()
        loadYearOptions()

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("salesHistoryUpdated"))
        }

        console.log("[MIGRATE] Migration complete!")
      })
      .catch((e) => {
        console.error("[MIGRATE] Error:", e)
        toast.error(e?.message || "Migration failed")
      })
      .finally(() => {
        setMigrating(false)
      })
  }

  const saveToHistory = async () => {
    console.log("[v0] ===== SAVE BUTTON CLICKED =====")
    console.log("[v0] parsedData.length:", parsedData.length)

    if (parsedData.length === 0) {
      toast.error("No data to save. Parse your notes first.")
      return
    }

    setSaving(true)
    try {
      const currentHistory = await loadSalesHistory()
      const newHistory = { ...currentHistory }
      let savedCount = 0

      for (const monthData of parsedData) {
        const key = `${monthData.year}-${monthData.month}`
        console.log(`[v0] Adding to history: ${key}`)
        newHistory[key] = monthData
        savedCount++
      }

      console.log("[v0] Calling saveSalesHistory with", savedCount, "months")

      await saveSalesHistory(newHistory)

      console.log("[v0] Save successful!")
      toast.success(`Saved ${savedCount} months to database`)

      setParsedData([])
      setNotesText("")
      setHasDataToSave(false)

      await loadHistoryData()
      setActiveTab("view")
    } catch (error) {
      console.error("[v0] Save failed:", error)
      const errorMessage = (error as Error).message

      if (errorMessage.includes("Database tables not created")) {
        toast.error("Database not set up! Click 'Auto Setup Database' at the top of the homepage.", {
          duration: 10000,
        })
      } else {
        toast.error("Failed to save: " + errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  const clearData = () => {
    setNotesText("")
    setParsedData([])
    setHasDataToSave(false)
    toast.success("Cleared input data")
  }

  const testSupabaseConnection = async () => {
    console.log("[v0] Testing Supabase connection...")
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("vehicles").select("*").limit(1)

      if (error) {
        alert(`❌ Supabase error: ${error.message}`)
        toast.error(`Supabase error: ${error.message}`)
      } else {
        alert("✅ Supabase connected successfully!")
        toast.success("Supabase connected successfully!")
      }
    } catch (e: any) {
      alert(`❌ Connection failed: ${e.message}`)
      toast.error(`Connection failed: ${e.message}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <FileText className="h-4 w-4" />
          Sales History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sales History</DialogTitle>
          <DialogDescription>Import sales notes or view saved history by month</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "import" | "view")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Notes</TabsTrigger>
              <TabsTrigger value="view">View History</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3 border border-border">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Test database connection</span>
                </div>
                <Button
                  type="button"
                  onClick={testSupabaseConnection}
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  Test Connection
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-blue-500/10 rounded-lg gap-3 border-2 border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Migrate parsed data to sales database
                    <span className="ml-2 text-xs opacity-70">({parsedData.length} months ready)</span>
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={migrateSales}
                  disabled={migrating || !hasDataToSave}
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {migrating
                    ? "Migrating..."
                    : `Migrate to Database ${parsedData.length > 0 ? `(${parsedData.length})` : ""}`}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-primary/10 rounded-lg gap-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Save parsed data to history</span>
                </div>
                <Button
                  type="button"
                  onClick={saveToHistory}
                  disabled={saving || !hasDataToSave}
                  size="lg"
                  className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                >
                  {saving ? "Saving..." : `Save to History ${parsedData.length > 0 ? `(${parsedData.length})` : ""}`}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paste Sales Notes</label>
                <Textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={parseNotes}
                    disabled={loading}
                    className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    size="lg"
                  >
                    <Upload className="h-4 w-4" />
                    {loading ? "Parsing..." : "Parse"}
                  </Button>
                  <Button
                    type="button"
                    onClick={clearData}
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-transparent"
                    size="lg"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {parsedData.length > 0 && (
                <div className="space-y-4">
                  {parsedData.map((monthData, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle>
                          {monthData.month} {monthData.year}
                        </CardTitle>
                        <CardDescription>
                          {monthData.vehicles.length} vehicles • {monthData.condos.length} condos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {monthData.vehicles.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Vehicles (฿{monthData.totalVehicles.toLocaleString()})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Date Range</TableHead>
                                  <TableHead>Vehicle</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {monthData.vehicles.map((entry, entryIdx) => (
                                  <TableRow key={entryIdx}>
                                    <TableCell className="font-medium">฿{entry.price}</TableCell>
                                    <TableCell>{entry.customer}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.dateRange || "-"}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.vehicle || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {monthData.condos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Condos (฿{monthData.totalCondos.toLocaleString()})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Unit</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {monthData.condos.map((entry, entryIdx) => (
                                  <TableRow key={entryIdx}>
                                    <TableCell className="font-medium">฿{entry.price}</TableCell>
                                    <TableCell>{entry.customer}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.vehicle || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="view" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <div className="lg:hidden">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground z-10"
                    >
                      <option value="">Select year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden lg:block">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Month</label>
                  <div className="lg:hidden">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={!selectedYear}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground disabled:opacity-50"
                    >
                      <option value="">Select month</option>
                      {availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden lg:block">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!selectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        {availableMonths.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedMonthData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedMonthData.month} {selectedMonthData.year}
                    </CardTitle>
                    <CardDescription>
                      {selectedMonthData.vehicles.length} vehicles • {selectedMonthData.condos.length} condos • Total: ฿
                      {(selectedMonthData.totalVehicles + selectedMonthData.totalCondos).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedMonthData.vehicles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Vehicles (฿{selectedMonthData.totalVehicles.toLocaleString()})
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Price</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date Range</TableHead>
                              <TableHead>Vehicle</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMonthData.vehicles.map((entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">฿{entry.price}</TableCell>
                                <TableCell>{entry.customer}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.dateRange || "-"}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.vehicle || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {selectedMonthData.condos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Condos (฿{selectedMonthData.totalCondos.toLocaleString()})
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Price</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMonthData.condos.map((entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">฿{entry.price}</TableCell>
                                <TableCell>{entry.customer}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.vehicle || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a year and month to view sales history</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
