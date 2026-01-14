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
    const abortController = new AbortController()

    async function loadProfile() {
      try {
        if (abortController.signal.aborted) return

        const session = await getSession()

        if (abortController.signal.aborted) return

        if (session) {
          const userProfile = await getProfile()
          if (!abortController.signal.aborted) {
            setProfile(userProfile)
          }
        } else {
          setProfile(null)
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error("Error loading profile:", error)
        setProfile(null)
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (abortController.signal.aborted) return

      if (session) {
        loadProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
      abortController.abort()
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
