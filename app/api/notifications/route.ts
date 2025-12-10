import { neon } from "@neondatabase/serverless"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

async function ensureTableExists(sql: any) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email TEXT NOT NULL,
        user_role TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id UUID,
        related_type TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `

    console.log("[v0] Notifications table ensured")
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("[v0] Notifications table already exists")
    } else {
      console.error("[v0] Error ensuring notifications table:", error.message)
      throw error
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Notifications GET called")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      console.log("[v0] No user email found")
      return NextResponse.json({ notifications: [] }, { status: 200 })
    }

    console.log("[v0] User email:", user.email)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const id = searchParams.get("id")

    if (!process.env.DATABASE_URL && !process.env.SUPABASE_POSTGRES_URL) {
      console.log("[v0] No database URL configured")
      return NextResponse.json({ notifications: [] }, { status: 200 })
    }

    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_POSTGRES_URL
    const sql = neon(connectionString!)

    await ensureTableExists(sql)

    if (action === "count") {
      console.log("[v0] Counting unread notifications")
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_email = ${user.email} AND is_read = false
      `
      return NextResponse.json({ count: Number.parseInt(result[0]?.count || "0") })
    }

    if (action === "get" && id) {
      console.log("[v0] Getting single notification:", id)
      const result = await sql`
        SELECT * FROM notifications 
        WHERE id = ${id} AND user_email = ${user.email}
        LIMIT 1
      `
      return NextResponse.json({ notification: result[0] || null })
    }

    console.log("[v0] Getting all notifications for:", user.email)
    const result = await sql`
      SELECT * FROM notifications 
      WHERE user_email = ${user.email}
      ORDER BY created_at DESC 
      LIMIT 50
    `
    console.log("[v0] Found notifications:", result?.length || 0)
    return NextResponse.json({ notifications: result || [] })
  } catch (error: any) {
    console.error("[v0] Notifications GET error:", error.message)
    return NextResponse.json({ notifications: [], error: error.message }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, id, notification } = body

    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_POSTGRES_URL
    const sql = neon(connectionString!)

    await ensureTableExists(sql)

    if (action === "create" && notification) {
      const result = await sql`
        INSERT INTO notifications (user_email, user_role, type, title, message, is_read, send_at)
        VALUES (
          ${notification.user_email},
          ${notification.user_role},
          ${notification.type},
          ${notification.title},
          ${notification.message},
          ${notification.is_read || false},
          ${notification.send_at || null}
        )
        RETURNING *
      `
      return NextResponse.json({ notification: result[0] })
    }

    if (action === "markRead" && id) {
      const result = await sql`
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = ${id} AND user_email = ${user.email}
        RETURNING *
      `
      return NextResponse.json({ notification: result[0] })
    }

    if (action === "markUnread" && id) {
      const result = await sql`
        UPDATE notifications 
        SET is_read = false, read_at = NULL
        WHERE id = ${id} AND user_email = ${user.email}
        RETURNING *
      `
      return NextResponse.json({ notification: result[0] })
    }

    if (action === "delete" && id) {
      await sql`
        DELETE FROM notifications 
        WHERE id = ${id} AND user_email = ${user.email}
      `
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Notifications POST error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
