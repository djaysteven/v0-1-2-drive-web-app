"use client"

import { AppShell } from "@/components/app-shell"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Upload, LogOut, Shield, Mail, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRole } from "@/hooks/use-role"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { toast } = useToast()
  const { profile } = useRole()
  const router = useRouter()
  const [brandColor, setBrandColor] = useState("#00FF3C")
  const [darkMode, setDarkMode] = useState(true)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)

  const handleColorChange = (color: string) => {
    setBrandColor(color)
    document.documentElement.style.setProperty("--brand", color)
    document.documentElement.style.setProperty("--primary", color)
    toast({
      title: "Brand color updated",
      description: "Your brand color has been changed successfully.",
    })
  }

  const handleSignOut = () => {
    signOut()
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    })
    router.push("/sign-in")
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test to",
        variant: "destructive",
      })
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch("/api/booking/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          customerName: "Test User",
          assetName: "Test Vehicle",
          startDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          endDate: new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          total: 1234,
        }),
      })

      const result = await response.json()

      if (result.ok) {
        toast({
          title: "✅ Test email sent",
          description: `Successfully sent test email to ${testEmail}`,
        })
        setTestEmail("")
      } else {
        toast({
          title: "Email failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Email failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-primary text-primary-foreground"
      case "manager":
        return "bg-blue-500 text-white"
      case "staff":
        return "bg-purple-500 text-white"
      case "customer":
        return "bg-gray-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <AuthGuard allowedRoles={["owner"]}>
      <AppShell header={<h1 className="text-xl font-bold text-foreground">Settings</h1>}>
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          <Card className="rounded-2xl border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Profile</CardTitle>
              <CardDescription className="text-muted-foreground">Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground text-base">{profile?.displayName}</Label>
                    <Badge className={getRoleBadgeColor(profile?.role || "")} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile?.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
                </div>
                <Button onClick={handleSignOut} variant="outline" className="gap-2 rounded-xl bg-transparent">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Test booking confirmation emails (powered by Resend)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail" className="text-foreground">
                  Test Email Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="rounded-xl bg-secondary border-border"
                  />
                  <Button
                    onClick={sendTestEmail}
                    disabled={sendingTest || !testEmail}
                    className="rounded-xl gap-2"
                    style={{ backgroundColor: "#00FF3C", color: "#000" }}
                  >
                    {sendingTest ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will send a test booking confirmation email to verify your email configuration
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="text-sm font-medium text-foreground">Environment Variables Required:</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    • <code className="bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> - Your Resend API key
                  </li>
                  <li>
                    • <code className="bg-muted px-1 py-0.5 rounded">EMAIL_FROM</code> - Sender email (e.g.,
                    onboarding@resend.dev)
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure these in the <strong>Vars</strong> tab in the sidebar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Brand Settings</CardTitle>
              <CardDescription className="text-muted-foreground">Customize your app appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-foreground">
                  Logo
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary">
                    <span className="text-2xl font-bold text-primary-foreground">1-2</span>
                  </div>
                  <Button variant="outline" className="gap-2 rounded-xl bg-transparent">
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recommended size: 512x512px</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor" className="text-foreground">
                  Brand Color
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="brandColor"
                    type="color"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-12 w-24 rounded-xl cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="flex-1 rounded-xl bg-secondary border-border font-mono"
                    placeholder="#00FF3C"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Choose your primary brand color</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode" className="text-foreground">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Use dark theme throughout the app</p>
                </div>
                <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Business Information</CardTitle>
              <CardDescription className="text-muted-foreground">Details for invoices and receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-foreground">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  defaultValue="1-2 DRIVE Rentals"
                  className="rounded-xl bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">
                  Address
                </Label>
                <Input
                  id="address"
                  defaultValue="123 Main Street, Bangkok, Thailand"
                  className="rounded-xl bg-secondary border-border"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone
                  </Label>
                  <Input id="phone" defaultValue="+66 2 123 4567" className="rounded-xl bg-secondary border-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="info@12drive.com"
                    className="rounded-xl bg-secondary border-border"
                  />
                </div>
              </div>

              <Button className="rounded-xl">Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  )
}
