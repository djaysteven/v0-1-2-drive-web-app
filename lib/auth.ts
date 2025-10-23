import { createClient as createBrowserClient } from "./supabase/client"
import type { UserRole, Profile } from "./types"

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || "owner@1-2drive.com"

console.log("[v0] OWNER_EMAIL configured as:", OWNER_EMAIL)

/**
 * Client-side auth utilities
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = createBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  console.log("[v0] User email:", user.email)
  console.log("[v0] Checking against OWNER_EMAIL:", OWNER_EMAIL)

  // Check if user is the owner based on email
  const isOwner = user.email === OWNER_EMAIL
  console.log("[v0] Is owner?", isOwner)

  // Try to get profile from database
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  // If profile exists in database, use it
  if (profile) {
    return {
      id: profile.id,
      userId: profile.user_id,
      role: isOwner ? "owner" : (profile.role as UserRole),
      displayName: profile.display_name,
      email: user.email!,
      phone: profile.phone,
      createdAt: profile.created_at,
    }
  }

  // If no profile in database, create a basic profile based on email
  return {
    id: user.id,
    userId: user.id,
    role: isOwner ? "owner" : "customer",
    displayName: user.email!.split("@")[0],
    email: user.email!,
    phone: null,
    createdAt: user.created_at,
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, displayName: string, phone?: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  await supabase.auth.signOut()
}

export function hasRole(profile: Profile | null, ...allowedRoles: UserRole[]): boolean {
  if (!profile) return false
  return allowedRoles.includes(profile.role)
}

export async function requireRole(...allowedRoles: UserRole[]): Promise<boolean> {
  const profile = await getProfile()
  return hasRole(profile, ...allowedRoles)
}

export function isOwner(profile: Profile | null): boolean {
  return profile?.email === OWNER_EMAIL || profile?.role === "owner"
}
