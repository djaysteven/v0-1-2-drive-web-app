import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const DEBUG = true // Set to true for console logs

export async function POST(request: NextRequest) {
  try {
    const { condoId, renterName } = await request.json()

    if (!condoId) {
      return NextResponse.json({ error: "condoId is required" }, { status: 400 })
    }

    if (typeof renterName !== "string") {
      return NextResponse.json({ error: "renterName must be a string" }, { status: 400 })
    }

    const url = process.env.SUPABASE_SUPABASE_URL
    const key = process.env.SUPABASE_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 503 })
    }

    const supabase = createClient(url, key)

    if (DEBUG) console.log("[v0] Updating condo renter_name:", { condoId, renterName: renterName || "(empty)" })

    const { error } = await supabase
      .from("condos")
      .update({ renter_name: renterName || null })
      .eq("id", condoId)

    if (error) {
      if (DEBUG) console.error("[v0] Supabase error updating condo:", error)
      return NextResponse.json({ error: `Failed to update renter name: ${error.message}` }, { status: 500 })
    }

    if (DEBUG) console.log("[v0] Successfully updated condo renter_name")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (DEBUG) console.error("[v0] API error:", e)
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}
