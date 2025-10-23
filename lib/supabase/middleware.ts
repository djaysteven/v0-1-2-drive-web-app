import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Supabase configuration
  const supabaseUrl = "https://jmeuyzklrfbovnreicjw.supabase.co"
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXV5emtscmZib3ZucmVpY2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTkxNDIsImV4cCI6MjA3NjI3NTE0Mn0.X6rA3NNOSAIlsDT-ZjSISvveMHxVa3HenFjDOrB9Rmo"

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  await supabase.auth.getUser()
  return response
}
