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

    async function loadProfile() {
      try {
        const session = await getSession()

        if (session) {
          const userProfile = await getProfile()
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
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
