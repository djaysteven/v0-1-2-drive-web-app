import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toDateSafe(v?: string | Date | null): Date | null {
  if (!v) return null
  const d = typeof v === "string" ? new Date(v) : v
  return isNaN(d.getTime()) ? null : d
}

export function toISOorNull(d: Date | null): string | null {
  return d ? d.toISOString() : null
}

export function diffCalendarDaysInclusive(a: Date | undefined, b: Date | undefined): number {
  if (!a || !b) return 0
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.max(1, Math.round((B.getTime() - A.getTime()) / 86400000) + 1)
}

export function calculateSmartPrice(
  days: number,
  dailyRate: number,
  weeklyRate?: number,
  monthlyRate?: number,
): { total: number; breakdown: string } {
  if (days < 7) {
    // Use daily pricing
    const total = Math.round(days * dailyRate)
    return {
      total,
      breakdown: `${days} ${days === 1 ? "day" : "days"} × ฿${dailyRate}`,
    }
  } else if (days < 30) {
    // Use weekly pricing
    if (!weeklyRate) {
      const total = Math.round(days * dailyRate)
      return {
        total,
        breakdown: `${days} days × ฿${dailyRate}`,
      }
    }
    const weeks = Math.floor(days / 7)
    const extraDays = days % 7
    const total = Math.round(weeks * weeklyRate + extraDays * (weeklyRate / 7))
    return {
      total,
      breakdown:
        extraDays > 0
          ? `${weeks} ${weeks === 1 ? "week" : "weeks"} + ${extraDays} ${extraDays === 1 ? "day" : "days"}`
          : `${weeks} ${weeks === 1 ? "week" : "weeks"}`,
    }
  } else {
    // Use monthly pricing
    if (!monthlyRate) {
      const total = Math.round(days * dailyRate)
      return {
        total,
        breakdown: `${days} days × ฿${dailyRate}`,
      }
    }
    const months = Math.floor(days / 30)
    const extraDays = days % 30
    const total = Math.round(months * monthlyRate + extraDays * (monthlyRate / 30))
    return {
      total,
      breakdown:
        extraDays > 0
          ? `${months} ${months === 1 ? "month" : "months"} + ${extraDays} ${extraDays === 1 ? "day" : "days"}`
          : `${months} ${months === 1 ? "month" : "months"}`,
    }
  }
}
