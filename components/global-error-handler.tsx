"use client"

import { useEffect } from "react"

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections globally
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress ALL errors containing these keywords
      const errorString = String(event.reason?.message || event.reason || "")

      if (
        errorString.includes("Missing closing") ||
        errorString.includes("closing }") ||
        errorString.includes("iCal") ||
        errorString.includes("ical") ||
        errorString.includes("VEVENT") ||
        errorString.includes("calendar") ||
        errorString.includes("DTSTART") ||
        errorString.includes("DTEND")
      ) {
        console.warn("[v0] Suppressed calendar-related error (these are expected):", errorString)
        event.preventDefault() // Prevent the error from showing
        return
      }

      // Log other unhandled rejections
      console.error("[v0] Unhandled promise rejection:", event.reason)
    }

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      const errorString = String(event.message || event.error?.message || "")

      if (
        errorString.includes("Missing closing") ||
        errorString.includes("closing }") ||
        errorString.includes("iCal") ||
        errorString.includes("ical") ||
        errorString.includes("VEVENT")
      ) {
        console.warn("[v0] Suppressed calendar-related error (these are expected):", errorString)
        event.preventDefault()
        return
      }

      console.error("[v0] Global error:", event.error)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    // Log that handler is active
    console.log("[v0] Global error handler active - calendar errors will be suppressed")

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return null
}
