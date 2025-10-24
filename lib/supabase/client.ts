import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = proSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export { createBrowserClient }
