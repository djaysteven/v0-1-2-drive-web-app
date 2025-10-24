import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Supabase configuration
  const supabaseUrl = "https://jmeuyzklrfbovnreicjw.supabase.co"
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXV5emtscmZib3ZucmVpY2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTkxNDIsImV4cCI6MjA3NjI3NTE0Mn0.X6rA3NNOSAIlsDT-ZjSISvveMHxVa3HenFjDOrB9Rmo"

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  })
}

export function createBrowserClient() {
  return createClient()
}
