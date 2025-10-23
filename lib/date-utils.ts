/**
 * Date utility functions to ensure consistent ISO date formatting (YYYY-MM-DD)
 * across the entire application
 */

/**
 * Convert any date input to ISO date string (YYYY-MM-DD)
 * @param date - Date string, Date object, or timestamp
 * @returns ISO date string in YYYY-MM-DD format, or null if invalid
 */
export function toISODate(date: string | Date | number | null | undefined): string | null {
  if (!date) return null

  try {
    // Handle YYYYMMDD format (8 digits)
    if (typeof date === "string" && /^\d{8}$/.test(date)) {
      const y = date.slice(0, 4)
      const m = date.slice(4, 6)
      const d = date.slice(6, 8)
      return `${y}-${m}-${d}`
    }

    // Handle YYYYMMDDTHHMMSSZ format
    if (typeof date === "string" && /^\d{8}T\d{6}Z?$/.test(date)) {
      const clean = date.replace("Z", "")
      const y = clean.slice(0, 4)
      const m = clean.slice(4, 6)
      const d = clean.slice(6, 8)
      return `${y}-${m}-${d}`
    }

    // Parse as Date and extract YYYY-MM-DD
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return null

    // Use toISOString() and extract date part (YYYY-MM-DD)
    return dateObj.toISOString().split("T")[0]
  } catch (e) {
    console.error("[v0] Date conversion error:", date, e)
    return null
  }
}

/**
 * Format ISO date string for display
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @param locale - Locale for formatting (default: 'en-GB')
 * @returns Formatted date string
 */
export function formatDisplayDate(isoDate: string | null | undefined, locale = "en-GB"): string {
  if (!isoDate) return ""

  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return isoDate

    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch (e) {
    return isoDate
  }
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Compare two ISO date strings
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime()
  const d2 = new Date(date2).getTime()

  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

/**
 * Check if a date is in the past
 */
export function isPast(isoDate: string): boolean {
  const date = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Check if a date is in the future
 */
export function isFuture(isoDate: string): boolean {
  const date = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Parse YYYY-MM-DD string as local date (not UTC)
 * Safari on iOS treats new Date('YYYY-MM-DD') as UTC, which can shift dates.
 * This function parses YYYY-MM-DD into a local Date to avoid timezone issues.
 *
 * @param s - Date string in YYYY-MM-DD format, Date object, or null
 * @returns Local Date object or null if invalid
 */
export function parseYMDLocal(s: string | Date | null | undefined): Date | null {
  if (!s) return null
  if (s instanceof Date) return s
  if (typeof s !== "string") return null

  // Match YYYY-MM-DD format
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) {
    // Fallback for full ISO like 2025-10-01T12:00:00Z
    return new Date(s)
  }

  const [, y, mo, d] = m
  // Create local date at midnight (not UTC)
  return new Date(Number(y), Number(mo) - 1, Number(d))
}

/**
 * Create a date range with proper time boundaries
 * Start date is set to 00:00:00.000, end date is set to 23:59:59.999
 *
 * @param startStr - Start date in YYYY-MM-DD format
 * @param endStr - End date in YYYY-MM-DD format
 * @returns Object with start and end Date objects
 */
export function createDateRange(startStr: string, endStr: string): { start: Date | null; end: Date | null } {
  const start = parseYMDLocal(startStr)
  const end = parseYMDLocal(endStr)

  if (start) {
    start.setHours(0, 0, 0, 0)
  }

  if (end) {
    end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

/**
 * Check if a date is within a range (inclusive)
 *
 * @param dateStr - Date to check in YYYY-MM-DD format
 * @param startStr - Start of range in YYYY-MM-DD format
 * @param endStr - End of range in YYYY-MM-DD format
 * @returns true if date is within range, false otherwise
 */
export function isDateInRange(dateStr: string, startStr: string, endStr: string): boolean {
  const date = parseYMDLocal(dateStr)
  const { start, end } = createDateRange(startStr, endStr)

  if (!date || !start || !end) return false

  return date >= start && date <= end
}
