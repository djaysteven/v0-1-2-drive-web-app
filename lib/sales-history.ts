import { createBrowserClient } from "@/lib/supabase/client"

export interface SalesEntry {
  price: string
  customer: string
  dateRange?: string
  vehicle?: string
  rawLine: string
  type: "vehicle" | "condo"
}

export interface MonthData {
  month: string
  year: string
  vehicles: SalesEntry[]
  condos: SalesEntry[]
  totalVehicles: number
  totalCondos: number
}

export interface SavedHistory {
  [key: string]: MonthData // key format: "YYYY-Mon" (e.g., "2025-Sep")
}

let isTableSetup = false

/**
 * Ensure the sales_history table exists in the database
 */
async function ensureTableExists(): Promise<boolean> {
  if (isTableSetup) return true

  try {
    const supabase = createBrowserClient()

    // Try to create the table (will be ignored if it already exists)
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS sales_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          year TEXT NOT NULL,
          month TEXT NOT NULL,
          vehicles JSONB DEFAULT '[]'::jsonb,
          condos JSONB DEFAULT '[]'::jsonb,
          total_vehicles NUMERIC DEFAULT 0,
          total_condos NUMERIC DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(year, month)
        );
        
        CREATE INDEX IF NOT EXISTS idx_sales_history_year_month ON sales_history(year, month);
        
        ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow all operations on sales_history" ON sales_history;
        CREATE POLICY "Allow all operations on sales_history" ON sales_history
          FOR ALL
          USING (true)
          WITH CHECK (true);
      `,
    })

    if (error) {
      console.error("[v0] Failed to create table:", error)
      return false
    }

    isTableSetup = true
    console.log("[v0] Database table setup complete")
    return true
  } catch (error) {
    console.error("[v0] Error setting up table:", error)
    return false
  }
}

/**
 * Check if the sales_history table exists
 */
async function checkTableExists(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("sales_history").select("id").limit(1)

    if (error) {
      // Table doesn't exist or other error
      console.log("[v0] Table check failed:", error.message)
      return false
    }

    console.log("[v0] Database table exists")
    return true
  } catch (error) {
    console.error("[v0] Error checking table:", error)
    return false
  }
}

/**
 * Load sales history from database
 */
export async function loadSalesHistory(): Promise<SavedHistory> {
  try {
    const tableExists = await checkTableExists()
    if (!tableExists) {
      console.log("[v0] Table doesn't exist, using localStorage")
      return loadFromLocalStorage()
    }

    const supabase = createBrowserClient()

    console.log("[v0] Loading sales history from database...")

    const { data, error } = await supabase
      .from("sales_history")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false })

    if (error) {
      console.error("[v0] Database error:", error)
      console.log("[v0] Falling back to localStorage")
      return loadFromLocalStorage()
    }

    if (!data || data.length === 0) {
      console.log("[v0] No data in database, checking localStorage")
      return loadFromLocalStorage()
    }

    const history: SavedHistory = {}
    data.forEach((row) => {
      const key = `${row.year}-${row.month}`
      history[key] = {
        year: row.year,
        month: row.month,
        vehicles: row.vehicles || [],
        condos: row.condos || [],
        totalVehicles: Number(row.total_vehicles) || 0,
        totalCondos: Number(row.total_condos) || 0,
      }
    })

    console.log("[v0] Loaded from database:", Object.keys(history).length, "months")
    return history
  } catch (error) {
    console.error("[v0] Error loading sales history:", error)
    return loadFromLocalStorage()
  }
}

/**
 * Fallback: Load from localStorage
 */
function loadFromLocalStorage(): SavedHistory {
  if (typeof window === "undefined") return {}

  try {
    const saved = localStorage.getItem("salesHistory")
    if (!saved) {
      console.log("[v0] No localStorage data found")
      return {}
    }

    const history = JSON.parse(saved) as SavedHistory
    console.log("[v0] Loaded from localStorage:", Object.keys(history).length, "months")
    return history
  } catch (error) {
    console.error("[v0] Failed to load from localStorage:", error)
    return {}
  }
}

/**
 * Save sales history to database
 */
export async function saveSalesHistory(history: SavedHistory): Promise<void> {
  try {
    console.log("[v0] ===== SAVE TO DATABASE STARTED =====")
    console.log("[v0] Attempting to save", Object.keys(history).length, "months")

    const tableExists = await checkTableExists()
    console.log("[v0] Table exists check result:", tableExists)

    if (!tableExists) {
      const errorMsg =
        "❌ DATABASE NOT SET UP! The sales_history table doesn't exist. Click 'Auto Setup Database' button at the top of the homepage to create tables."
      console.error("[v0]", errorMsg)
      alert(errorMsg)
      throw new Error("Database tables not created. Please run database setup first.")
    }

    const supabase = createBrowserClient()

    console.log("[v0] Saving", Object.keys(history).length, "months to database...")

    let successCount = 0
    let failCount = 0

    for (const [key, data] of Object.entries(history)) {
      console.log(`[v0] Saving month: ${key}`)
      console.log(`[v0] Data:`, {
        year: data.year,
        month: data.month,
        vehicleCount: data.vehicles.length,
        condoCount: data.condos.length,
        totalVehicles: data.totalVehicles,
        totalCondos: data.totalCondos,
      })

      const { data: result, error } = await supabase.from("sales_history").upsert(
        {
          year: data.year,
          month: data.month,
          vehicles: data.vehicles,
          condos: data.condos,
          total_vehicles: data.totalVehicles,
          total_condos: data.totalCondos,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "year,month" },
      )

      if (error) {
        console.error(`[v0] ❌ Failed to save month ${key}:`, error)
        failCount++
        throw error
      }

      console.log(`[v0] ✅ Successfully saved ${key}`)
      successCount++
    }

    console.log(`[v0] ===== SAVE COMPLETE =====`)
    console.log(`[v0] Success: ${successCount}, Failed: ${failCount}`)

    // Also save to localStorage as backup
    saveToLocalStorage(history)

    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("salesHistoryUpdated", { detail: history }))
    }

    alert(`✅ Successfully saved ${successCount} month(s) to database!`)
  } catch (error) {
    console.error("[v0] ===== SAVE FAILED =====")
    console.error("[v0] Error:", error)

    // Don't fallback to localStorage - force user to fix database
    throw error
  }
}

/**
 * Save to localStorage as backup
 */
function saveToLocalStorage(history: SavedHistory): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("salesHistory", JSON.stringify(history))
    console.log("[v0] Saved to localStorage as backup")
  } catch (error) {
    console.error("[v0] Failed to save to localStorage:", error)
  }
}

/**
 * Get data for a specific month
 */
export async function getMonthData(year: string, month: string): Promise<MonthData | null> {
  const history = await loadSalesHistory()
  const key = `${year}-${month}`
  const data = history[key]

  console.log("[v0] Getting month data for:", key)
  console.log("[v0] Found:", data ? "yes" : "no")

  return data || null
}

/**
 * Get all available years from saved history
 */
export async function getAvailableYears(): Promise<string[]> {
  const history = await loadSalesHistory()
  const years = Array.from(new Set(Object.keys(history).map((key) => key.split("-")[0])))
  return years.sort((a, b) => Number(b) - Number(a))
}

/**
 * Get available months for a specific year
 */
export async function getAvailableMonths(year: string): Promise<string[]> {
  const history = await loadSalesHistory()
  return Object.keys(history)
    .filter((key) => key.startsWith(`${year}-`))
    .map((key) => key.split("-")[1])
}

/**
 * Subscribe to sales history updates
 */
export function subscribeSalesHistory(callback: (history: SavedHistory) => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handler = async (event: Event) => {
    const customEvent = event as CustomEvent<SavedHistory>
    console.log("[v0] Sales history updated event received")
    callback(customEvent.detail || (await loadSalesHistory()))
  }

  window.addEventListener("salesHistoryUpdated", handler)

  return () => {
    window.removeEventListener("salesHistoryUpdated", handler)
  }
}

/**
 * Migrate data from localStorage to database
 */
export async function migrateFromLocalStorage(): Promise<{ success: boolean; message: string }> {
  try {
    const localData = loadFromLocalStorage()
    const keys = Object.keys(localData)

    if (keys.length === 0) {
      return { success: false, message: "No data found in localStorage to migrate" }
    }

    await saveSalesHistory(localData)

    return {
      success: true,
      message: `Successfully migrated ${keys.length} month(s) of data to database`,
    }
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    return {
      success: false,
      message: "Migration failed. Please try again.",
    }
  }
}
