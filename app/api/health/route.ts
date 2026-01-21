import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const url = process.env.SUPABASE_SUPABASE_URL
    const key = process.env.SUPABASE_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 503 })
    }
    
    const sb = createClient(url, key)
    const { error } = await sb.from("sales").select("id").limit(1)
    
    if (error && !String(error.message).includes("relation")) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "health fail" }, { status: 500 })
  }
}
