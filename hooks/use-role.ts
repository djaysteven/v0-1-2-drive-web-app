"use client"

import { useEffect, useState } from "react"
import { getProfile, getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

export function useRole() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function loadProfile() {
      try {
        const session = await getSession()

        if (!mounted) return

        if (session) {
          const userProfile = await getProfile()
          if (mounted) {
            setProfile(userProfile)
          }
        } else {
          if (mounted) {
            setProfile(null)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading profile:", error)
        if (mounted) {
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session) {
        loadProfile()
      } else {
        if (mounted) {
          setProfile(null)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const role = profile?.role || null
  const isAuthenticated = !!profile

  return {
    profile,
    role,
    isOwner: profile?.role === "owner",
    isManager: profile?.role === "manager",
    isStaff: profile?.role === "staff",
    isCustomer: profile?.role === "customer",
    isAuthenticated,
    loading,
  }
}
