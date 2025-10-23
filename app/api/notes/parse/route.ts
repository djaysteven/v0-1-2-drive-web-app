import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"

// Parse sales notes with month headers and entries
function parseLines(raw: string) {
  const lines = raw.split("\n").filter((line) => line.trim())
  const monthsData: any[] = []
  let currentMonth = ""
  let currentYear = ""
  let currentVehicles: any[] = []
  let currentCondos: any[] = []

  const monthMap: { [key: string]: string } = {
    january: "Jan",
    february: "Feb",
    march: "Mar",
    april: "Apr",
    may: "May",
    june: "Jun",
    july: "Jul",
    august: "Aug",
    september: "Sep",
    sept: "Sep",
    october: "Oct",
    november: "Nov",
    december: "Dec",
    jan: "Jan",
    feb: "Feb",
    mar: "Mar",
    apr: "Apr",
    jun: "Jun",
    jul: "Jul",
    aug: "Aug",
    sep: "Sep",
    oct: "Oct",
    nov: "Nov",
    dec: "Dec",
  }

  for (const line of lines) {
    // Check for month header: 📅Sept 2025📅
    const monthMatch = line.match(/📅\s*(\w+)\s+(\d{4})\s*📅/)
    if (monthMatch) {
      // Save previous month data
      if (currentMonth && (currentVehicles.length > 0 || currentCondos.length > 0)) {
        const totalVehicles = currentVehicles.reduce((sum, e) => {
          const price = Number.parseFloat(e.price.replace(/[,.]/g, ""))
          return sum + (isNaN(price) ? 0 : price)
        }, 0)
        const totalCondos = currentCondos.reduce((sum, e) => {
          const price = Number.parseFloat(e.price.replace(/[,.]/g, ""))
          return sum + (isNaN(price) ? 0 : price)
        }, 0)
        monthsData.push({
          month: currentMonth,
          year: currentYear,
          vehicles: currentVehicles,
          condos: currentCondos,
          totalVehicles,
          totalCondos,
        })
      }
      const rawMonth = monthMatch[1].toLowerCase()
      currentMonth = monthMap[rawMonth] || monthMatch[1]
      currentYear = monthMatch[2]
      currentVehicles = []
      currentCondos = []
      continue
    }

    // Skip summary lines
    if (line.includes("💰") || line.includes("=") || !line.includes(":")) {
      continue
    }

    // Parse entry line: "3000 : Alex dj 05-11/05-12* 913"
    const parts = line.split(":")
    if (parts.length >= 2) {
      const price = parts[0].trim()
      const rest = parts.slice(1).join(":").trim()

      const dateMatch = rest.match(/(\d{2}-\d{2}\/\d{2}-\d{2})[*•]/)
      let customer = rest
      let dateRange = ""
      let vehicle = ""
      let type: "vehicle" | "condo" = "condo"

      if (dateMatch) {
        type = "vehicle"
        dateRange = dateMatch[1]
        const beforeDate = rest.substring(0, dateMatch.index).trim()
        const afterDate = rest.substring(dateMatch.index + dateMatch[0].length).trim()
        customer = beforeDate
        vehicle = afterDate
      } else {
        type = "condo"
        const words = rest.split(/\s+/)
        customer = words.slice(0, -1).join(" ") || words[0]
        vehicle = words[words.length - 1] !== customer ? words[words.length - 1] : ""
      }

      const entry = {
        price,
        customer,
        dateRange,
        vehicle,
        rawLine: line,
        type,
      }

      if (type === "vehicle") {
        currentVehicles.push(entry)
      } else {
        currentCondos.push(entry)
      }
    }
  }

  // Save last month data
  if (currentMonth && (currentVehicles.length > 0 || currentCondos.length > 0)) {
    const totalVehicles = currentVehicles.reduce((sum, e) => {
      const price = Number.parseFloat(e.price.replace(/[,.]/g, ""))
      return sum + (isNaN(price) ? 0 : price)
    }, 0)
    const totalCondos = currentCondos.reduce((sum, e) => {
      const price = Number.parseFloat(e.price.replace(/[,.]/g, ""))
      return sum + (isNaN(price) ? 0 : price)
    }, 0)
    monthsData.push({
      month: currentMonth,
      year: currentYear,
      vehicles: currentVehicles,
      condos: currentCondos,
      totalVehicles,
      totalCondos,
    })
  }

  return monthsData
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text" }, { status: 400 })
    }
    const items = parseLines(text)
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "parse fail" }, { status: 500 })
  }
}
