// Airbnb iCal sync utilities

export interface ICalEvent {
  summary: string
  startDate: Date
  endDate: Date
  uid: string
}

export interface SyncResult {
  success: boolean
  eventsFound: number
  bookingsCreated: number
  nextEvents: ICalEvent[]
  error?: string
}

/**
 * Parse iCal date format (YYYYMMDDTHHMMSSZ) to JavaScript Date
 * Example: 20251013T000000Z -> 2025-10-13T00:00:00Z
 */
function parseICalDate(dateStr: string): Date | null {
  try {
    // Remove 'Z' if present
    const cleanStr = dateStr.replace("Z", "").trim()

    // Check if it's in compact format (YYYYMMDDTHHMMSS)
    if (cleanStr.length === 15 && cleanStr.includes("T")) {
      const year = cleanStr.substring(0, 4)
      const month = cleanStr.substring(4, 6)
      const day = cleanStr.substring(6, 8)
      const hour = cleanStr.substring(9, 11)
      const minute = cleanStr.substring(11, 13)
      const second = cleanStr.substring(13, 15)

      // Construct ISO 8601 format
      const isoStr = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
      const date = new Date(isoStr)

      // Validate the date
      if (isNaN(date.getTime())) {
        console.error("[v0] Invalid date parsed:", isoStr)
        return null
      }

      return date
    }

    // Try parsing as-is (might be already in ISO format)
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      console.error("[v0] Could not parse date:", dateStr)
      return null
    }

    return date
  } catch (error) {
    console.error("[v0] Error parsing iCal date:", dateStr, error)
    return null
  }
}

/**
 * Fetch and parse iCal feed from Airbnb
 */
export async function fetchICalFeed(url: string): Promise<ICalEvent[]> {
  try {
    // In a real implementation, this would fetch from the URL
    // For mock purposes, we'll simulate the response
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock iCal data - in production, parse actual iCal format
    const mockEvents: ICalEvent[] = [
      {
        summary: "Airbnb Reservation - John Doe",
        startDate: new Date("2025-11-01T14:00:00Z"),
        endDate: new Date("2025-11-05T10:00:00Z"),
        uid: "airbnb-12345@airbnb.com",
      },
      {
        summary: "Airbnb Reservation - Jane Smith",
        startDate: new Date("2025-11-10T14:00:00Z"),
        endDate: new Date("2025-11-15T10:00:00Z"),
        uid: "airbnb-67890@airbnb.com",
      },
      {
        summary: "Airbnb Reservation - Bob Wilson",
        startDate: new Date("2025-12-01T14:00:00Z"),
        endDate: new Date("2025-12-07T10:00:00Z"),
        uid: "airbnb-11111@airbnb.com",
      },
    ]

    // Filter out events older than 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    return mockEvents.filter((event) => event.startDate >= sixMonthsAgo)
  } catch (error) {
    console.error("[v0] Failed to fetch iCal feed:", error)
    throw new Error("Failed to fetch calendar data")
  }
}

/**
 * Parse iCal text format (VEVENT blocks)
 * This is a simplified parser - in production, use a library like ical.js
 */
export function parseICalText(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = []
  const eventBlocks = icalText.split("BEGIN:VEVENT")

  for (const block of eventBlocks.slice(1)) {
    const lines = block.split("\n")
    let summary = ""
    let startDate: Date | null = null
    let endDate: Date | null = null
    let uid = ""

    for (const line of lines) {
      if (line.startsWith("SUMMARY:")) {
        summary = line.replace("SUMMARY:", "").trim()
      } else if (line.startsWith("DTSTART")) {
        const dateStr = line.split(":")[1]?.trim()
        if (dateStr) startDate = parseICalDate(dateStr)
      } else if (line.startsWith("DTEND")) {
        const dateStr = line.split(":")[1]?.trim()
        if (dateStr) endDate = parseICalDate(dateStr)
      } else if (line.startsWith("UID:")) {
        uid = line.replace("UID:", "").trim()
      }
    }

    if (summary && startDate && endDate && uid) {
      events.push({ summary, startDate, endDate, uid })
    }
  }

  return events
}

/**
 * Parse iCal events from text and return in API-compatible format
 */
export function parseICalEvents(icalText: string): Array<{ summary: string; start: string; end: string; uid: string }> {
  console.log("[v0] Parsing iCal text, length:", icalText.length)
  const events: Array<{ summary: string; start: string; end: string; uid: string }> = []
  const eventBlocks = icalText.split("BEGIN:VEVENT")
  console.log("[v0] Found event blocks:", eventBlocks.length - 1)

  for (const block of eventBlocks.slice(1)) {
    const lines = block.split(/\r?\n/)
    let summary = ""
    let start = ""
    let end = ""
    let uid = ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("SUMMARY:")) {
        summary = trimmed.replace("SUMMARY:", "").trim()
      } else if (trimmed.startsWith("DTSTART")) {
        const parts = trimmed.split(":")
        start = parts[parts.length - 1]?.trim() || ""
      } else if (trimmed.startsWith("DTEND")) {
        const parts = trimmed.split(":")
        end = parts[parts.length - 1]?.trim() || ""
      } else if (trimmed.startsWith("UID:")) {
        uid = trimmed.replace("UID:", "").trim()
      }
    }

    if (start && end) {
      events.push({ summary: summary || "Airbnb Reservation", start, end, uid })
      console.log("[v0] Parsed event:", { summary, start, end, uid })
    }
  }

  console.log("[v0] Total events parsed:", events.length)
  return events
}

/**
 * Test iCal URL and return preview of events
 */
export async function testICalUrl(url: string): Promise<{ events: ICalEvent[]; count: number }> {
  const events = await fetchICalFeed(url)
  return {
    events: events.slice(0, 3), // Return first 3 for preview
    count: events.length,
  }
}
