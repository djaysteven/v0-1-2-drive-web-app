"use client"

import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRole } from "@/hooks/use-role"

export default function ForbiddenPage() {
  const router = useRouter()
  const { profile } = useRole()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
              {profile && (
                <span className="mt-2 block">
                  Current role: <span className="font-medium text-foreground">{profile.role}</span>
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => router.push("/")} className="w-full" size="lg">
            Go Home
          </Button>
          <Button onClick={() => router.back()} variant="outline" className="w-full" size="lg">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
