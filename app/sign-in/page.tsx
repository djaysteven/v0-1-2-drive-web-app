"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { signIn, getSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession()
        if (session) {
          // Already authenticated, redirect to calendar
          router.push("/calendar")
        }
      } catch (error) {
        console.error("[v0] Error checking auth:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signIn(email, password)

      toast({
        title: "Success",
        description: "Signed in successfully",
      })

      // Redirect to calendar after successful sign-in
      router.push("/calendar")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <Image
              src="/logo.png"
              alt="1-2 DRIVE Logo"
              width={80}
              height={80}
              className="rounded-2xl"
              style={{
                filter: "drop-shadow(0 0 12px rgba(0, 255, 60, 0.6))",
              }}
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Staff Sign In</CardTitle>
            <CardDescription>Sign in to access the rental management system</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="keep-signed-in"
                checked={keepSignedIn}
                onCheckedChange={(checked) => setKeepSignedIn(checked === true)}
              />
              <Label htmlFor="keep-signed-in" className="text-sm font-normal cursor-pointer">
                Keep me signed in
              </Label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium">Staff Access Only</p>
              <p className="mt-1">
                This sign-in is for staff and administrators only. Customers can browse vehicles and condos without
                signing in.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
