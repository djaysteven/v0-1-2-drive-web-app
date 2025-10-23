"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Database, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function DatabaseSetupBanner() {
  const [needsSetup, setNeedsSetup] = useState(false)
  const [checking, setChecking] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    checkDatabaseSetup()
  }, [])

  async function checkDatabaseSetup() {
    try {
      const supabase = createClient()

      const { error: salesError } = await supabase.from("sales").select("id").limit(1)
      const { error: historyError } = await supabase.from("sales_history").select("id").limit(1)

      const salesMissing =
        salesError && (salesError.message.includes("relation") || salesError.message.includes("does not exist"))
      const historyMissing =
        historyError && (historyError.message.includes("relation") || historyError.message.includes("does not exist"))

      if (salesMissing || historyMissing) {
        console.log("[v0] Database tables missing - setup required")
        setNeedsSetup(true)
      } else {
        console.log("[v0] Database tables exist")
      }
    } catch (error) {
      console.error("[v0] Error checking database:", error)
    } finally {
      setChecking(false)
    }
  }

  async function setupDatabase() {
    setExecuting(true)
    try {
      const supabase = createClient()

      console.log("[v0] Starting database setup...")

      const sqlScript = `
        -- SALES TABLE
        CREATE TABLE IF NOT EXISTS sales (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          amount NUMERIC NOT NULL DEFAULT 0,
          category TEXT NOT NULL CHECK (category IN ('vehicle', 'condo')),
          notes TEXT,
          created_at DATE NOT NULL DEFAULT CURRENT_DATE
        );

        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
        CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);

        ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
        CREATE POLICY "Allow all operations on sales" ON sales
          FOR ALL
          USING (true)
          WITH CHECK (true);

        -- SALES HISTORY TABLE
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
        CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(created_at);

        ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow all operations on sales_history" ON sales_history;
        CREATE POLICY "Allow all operations on sales_history" ON sales_history
          FOR ALL
          USING (true)
          WITH CHECK (true);

        -- Reload schema cache
        NOTIFY pgrst, 'reload schema';
      `

      // Execute the script
      const { error } = await supabase.rpc("exec_sql", { sql: sqlScript })

      if (error) {
        console.error("[v0] SQL execution error:", error)
        throw error
      }

      console.log("[v0] Database setup complete, verifying...")

      // Wait a moment for schema reload
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verify setup
      const { error: verifyError } = await supabase.from("sales").select("id").limit(1)

      if (!verifyError || !verifyError.message.includes("relation")) {
        setNeedsSetup(false)
        alert("✅ Database setup complete! Please refresh the page to start using sales history features.")
        setTimeout(() => window.location.reload(), 1000)
      } else {
        throw new Error("Verification failed")
      }
    } catch (error: any) {
      console.error("[v0] Error setting up database:", error)
      alert(
        "⚠️ Automatic setup failed. Please:\n\n" +
          "1. Go to your Supabase dashboard\n" +
          "2. Open SQL Editor\n" +
          "3. Copy and run the script from scripts/000_setup_database.sql\n" +
          "4. Then run: NOTIFY pgrst, 'reload schema';\n" +
          "5. Refresh this page",
      )
    } finally {
      setExecuting(false)
    }
  }

  if (checking || !needsSetup) return null

  return (
    <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
      <AlertCircle className="h-5 w-5 text-yellow-500" />
      <AlertTitle className="text-yellow-500 font-semibold">Database Setup Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          Your database needs to be set up before you can use the sales history features. This will create the necessary
          tables and configure permissions.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={setupDatabase} disabled={executing} className="bg-yellow-600 hover:bg-yellow-700">
            <Database className="h-4 w-4 mr-2" />
            {executing ? "Setting up..." : "Auto Setup Database"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Already Done - Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          If auto-setup fails, manually run the SQL script from{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">scripts/000_setup_database.sql</code> in your Supabase
          SQL Editor, then run{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">NOTIFY pgrst, 'reload schema';</code>
        </p>
      </AlertDescription>
    </Alert>
  )
}
