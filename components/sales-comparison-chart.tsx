"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp } from "lucide-react"

interface SalesData {
  year: string
  month: string
  vehicles: number
  condos: number
  total: number
}

export function SalesComparisonChart() {
  const [data, setData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      console.log("[v0] Sales updated, reloading chart...")
      loadData()
    }

    window.addEventListener("salesHistoryUpdated", handleUpdate)
    return () => window.removeEventListener("salesHistoryUpdated", handleUpdate)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { data: salesData, error } = await supabase
        .from("sales_history")
        .select("*")
        .order("year", { ascending: true })
        .order("month", { ascending: true })

      if (error) throw error

      const formattedData: SalesData[] = (salesData || []).map((row) => ({
        year: row.year,
        month: row.month,
        vehicles: Number(row.total_vehicles) || 0,
        condos: Number(row.total_condos) || 0,
        total: (Number(row.total_vehicles) || 0) + (Number(row.total_condos) || 0),
      }))

      setData(formattedData)
    } catch (error) {
      console.error("[v0] Failed to load sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const monthlyData = data.slice(-12).map((d) => ({
    name: `${d.month} ${d.year.slice(-2)}`,
    "Bikes+Cars": d.vehicles,
    Condos: d.condos,
    Total: d.total,
  }))

  const yearlyData = data.reduce((acc, curr) => {
    const existing = acc.find((item) => item.year === curr.year)
    if (existing) {
      existing.vehicles += curr.vehicles
      existing.condos += curr.condos
      existing.total += curr.total
    } else {
      acc.push({ ...curr })
    }
    return acc
  }, [] as SalesData[])

  const yearlyChartData = yearlyData.map((d) => ({
    name: d.year,
    "Bikes+Cars": d.vehicles,
    Condos: d.condos,
    Total: d.total,
  }))

  if (loading) {
    return (
      <Card className="rounded-2xl border-border bg-card shadow-lg col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-border bg-card shadow-lg col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Comparison
          </CardTitle>
          <CardDescription>No sales data yet. Start by entering your first month.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Comparison
            </CardTitle>
            <CardDescription>Compare bikes+cars vs condos revenue over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode("yearly")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={viewMode === "monthly" ? monthlyData : yearlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => `฿${Number(value).toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="Bikes+Cars" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Condos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 pt-4 border-t border-border">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewMode === "monthly" ? monthlyData : yearlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => `฿${Number(value).toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
