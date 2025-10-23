"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/hooks/use-role"
import type { UserRole } from "@/lib/types"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function AuthGuard({ children, allowedRoles, fallbackPath = "/403" }: AuthGuardProps) {
  const { role, loading } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!role) {
      router.push("/sign-in")
      return
    }

    if (!allowedRoles.includes(role)) {
      router.push(fallbackPath)
    }
  }, [role, loading, allowedRoles, fallbackPath, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return null
  }

  return <>{children}</>
}
