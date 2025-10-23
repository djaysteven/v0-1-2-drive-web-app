import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url")
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

    // Basic allow-list (Airbnb + ICS only)
    if (!/^https:\/\/(www\.)?airbnb\.com\/calendar\/ical\/.+\.ics/.test(url)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 400 })
    }

    const r = await fetch(url, {
      // Some providers require a UA; also avoid caching
      headers: { "User-Agent": "1-2-Drive-ICS/1.0" },
      cache: "no-store",
    })

    if (!r.ok) return NextResponse.json({ error: `Upstream ${r.status}` }, { status: r.status })

    const text = await r.text()
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fetch failed" }, { status: 500 })
  }
}
