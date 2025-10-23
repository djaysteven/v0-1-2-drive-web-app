import { createClient as createServerClient } from "./supabase/server"
import type { UserRole, Profile } from "./types"

/**
 * Server-side auth utilities
 * These functions can only be used in Server Components, Server Actions, and Route Handlers
 */

export async function getServerSession() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getServerProfile(): Promise<Profile | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  if (!profile) return null

  return {
    id: profile.id,
    userId: profile.user_id,
    role: profile.role as UserRole,
    displayName: profile.display_name,
    email: user.email!,
    phone: profile.phone,
    createdAt: profile.created_at,
  }
}

export function hasRole(profile: Profile | null, ...allowedRoles: UserRole[]): boolean {
  if (!profile) return false
  return allowedRoles.includes(profile.role)
}

export async function requireServerRole(...allowedRoles: UserRole[]): Promise<boolean> {
  const profile = await getServerProfile()
  return hasRole(profile, ...allowedRoles)
}
