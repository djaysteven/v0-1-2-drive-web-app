import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

async function ensureTableExists(sql: any) {
  try {
    // Check if table exists
    const checkTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_history'
      );
    `

    if (!checkTable[0].exists) {
      console.log("[v0] sales_history table doesn't exist, creating it...")
      // Create the table
      await sql`
        CREATE TABLE IF NOT EXISTS sales_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          year TEXT NOT NULL,
          month TEXT NOT NULL,
          vehicles JSONB DEFAULT '[]'::jsonb,
          condos JSONB DEFAULT '[]'::jsonb,
          total_vehicles NUMERIC DEFAULT 0,
          total_condos NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
      console.log("[v0] sales_history table created successfully")
    }
  } catch (error: any) {
    console.error("[v0] Error ensuring table exists:", error.message)
    // Don't throw if table already exists
    if (error.code !== "42P07") {
      throw error
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  try {
    console.log("[v0] Sales API GET called")
    const sql = neon(process.env.DATABASE_URL!)

    await ensureTableExists(sql)

    let data
    if (year && month) {
      console.log("[v0] Fetching sales for:", year, month)
      data = await sql`
        SELECT id, year, month, vehicles, condos, total_vehicles, total_condos, created_at, updated_at 
        FROM sales_history
        WHERE year = ${year} AND month = ${month}
      `
    } else {
      console.log("[v0] Fetching all sales")
      data = await sql`
        SELECT id, year, month, vehicles, condos, total_vehicles, total_condos, created_at, updated_at 
        FROM sales_history
        ORDER BY year DESC, month DESC
      `
    }

    console.log("[v0] Sales API GET success, rows:", data.length)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Sales API GET error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log("[v0] Sales API POST called")

  const body = await request.json()
  console.log("[v0] Received body:", body)

  const { year, month, total_vehicles, total_condos } = body

  try {
    console.log("[v0] Connecting to database...")
    const sql = neon(process.env.DATABASE_URL!)

    await ensureTableExists(sql)

    console.log("[v0] Checking for existing record...")
    const existing = await sql`
      SELECT id FROM sales_history 
      WHERE year = ${year} AND month = ${month} 
      LIMIT 1
    `
    console.log("[v0] Existing records found:", existing.length)

    let data
    if (existing.length > 0) {
      // Update existing record
      console.log("[v0] Updating existing record:", existing[0].id)
      data = await sql`
        UPDATE sales_history 
        SET total_vehicles = ${total_vehicles}, 
            total_condos = ${total_condos}, 
            updated_at = NOW() 
        WHERE id = ${existing[0].id}
        RETURNING id, year, month, vehicles, condos, total_vehicles, total_condos, created_at, updated_at
      `
    } else {
      // Insert new record
      console.log("[v0] Inserting new record")
      data = await sql`
        INSERT INTO sales_history (year, month, total_vehicles, total_condos, vehicles, condos) 
        VALUES (${year}, ${month}, ${total_vehicles}, ${total_condos}, NULL, NULL) 
        RETURNING id, year, month, vehicles, condos, total_vehicles, total_condos, created_at, updated_at
      `
    }

    console.log("[v0] Database operation successful:", data[0])
    return NextResponse.json(data[0])
  } catch (error: any) {
    console.error("[v0] Sales API POST error:", error.message)
    console.error("[v0] Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
