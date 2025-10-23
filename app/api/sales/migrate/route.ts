import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { toISODate } from "@/lib/date-utils"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const url = process.env.SUPABASE_SUPABASE_URL!
    const key = process.env.SUPABASE_SUPABASE_ANON_KEY!
    const sb = createClient(url, key)
    const { items, defaultDate } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    const fallbackDate = toISODate(defaultDate) || toISODate(new Date())
    const rows: any[] = []

    // Process each month's data
    for (const monthData of items) {
      const monthDate = new Date(`${monthData.year}-${monthData.month}-01`)
      const createdAt = toISODate(monthDate) || fallbackDate

      // Add vehicle entries
      for (const vehicle of monthData.vehicles || []) {
        rows.push({
          amount: Number(vehicle.price?.replace(/[,.]/g, "") ?? 0) || 0,
          category: "vehicle",
          notes: `${vehicle.customer ?? ""} ${vehicle.vehicle ?? ""} ${vehicle.dateRange ?? ""}`.trim(),
          created_at: createdAt,
        })
      }

      // Add condo entries
      for (const condo of monthData.condos || []) {
        rows.push({
          amount: Number(condo.price?.replace(/[,.]/g, "") ?? 0) || 0,
          category: "condo",
          notes: `${condo.customer ?? ""} ${condo.vehicle ?? ""}`.trim(),
          created_at: createdAt,
        })
      }
    }

    const validRows = rows.filter((r) => !isNaN(r.amount) && r.amount > 0)

    if (validRows.length === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    const { data, error } = await sb.from("sales").insert(validRows).select("id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: data?.length || validRows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "migrate fail" }, { status: 500 })
  }
}
