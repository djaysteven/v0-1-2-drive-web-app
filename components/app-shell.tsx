"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Home,
  Car,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  LogIn,
  LogOut,
  MoreHorizontal,
  Phone,
} from "lucide-react"
import { useRole } from "@/hooks/use-role"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { PageTransition } from "@/components/page-transition"

interface AppShellProps {
  children: ReactNode
  header?: ReactNode
  actions?: ReactNode
}

const customerNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/vehicles", icon: Car, label: "Vehicles" },
  { href: "/condos", icon: Building2, label: "Condos" },
  { href: "/contact", icon: Phone, label: "Contact" }, // Added Contact tab
]

const adminNavItems = [
  { href: "/bookings", icon: Calendar, label: "Bookings", roles: ["owner", "manager", "staff", "customer"] },
  { href: "/calendar", icon: Calendar, label: "Calendar", roles: ["owner", "manager", "staff"] },
  { href: "/sales", icon: TrendingUp, label: "Sales", roles: ["owner"] },
  { href: "/customers", icon: Users, label: "Customers", roles: ["owner", "manager", "staff"] },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["owner"] },
]

export function AppShell({ children, header, actions }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, isAuthenticated } = useRole()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  useEffect(() => {
    const preventHorizontalScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    let touchStartX = 0
    const preventSwipeNavigation = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }

    const preventSwipeNavigationMove = (e: TouchEvent) => {
      const touchEndX = e.touches[0].clientX
      const diff = touchStartX - touchEndX

      if (Math.abs(diff) > 10 && (touchStartX < 50 || touchStartX > window.innerWidth - 50)) {
        e.preventDefault()
      }
    }

    const preventPopState = (e: PopStateEvent) => {
      e.preventDefault()
      window.history.pushState(null, "", window.location.href)
    }

    window.history.pushState(null, "", window.location.href)

    document.addEventListener("wheel", preventHorizontalScroll, { passive: false })
    document.addEventListener("touchstart", preventSwipeNavigation, { passive: false })
    document.addEventListener("touchmove", preventSwipeNavigationMove, { passive: false })
    window.addEventListener("popstate", preventPopState)

    return () => {
      document.removeEventListener("wheel", preventHorizontalScroll)
      document.removeEventListener("touchstart", preventSwipeNavigation)
      document.removeEventListener("touchmove", preventSwipeNavigationMove)
      window.removeEventListener("popstate", preventPopState)
    }
  }, [])

  const visibleNavItems = [
    ...customerNavItems,
    ...adminNavItems.filter((item) => isAuthenticated && item.roles.includes(role || "")),
  ]

  const mobileMainItems = visibleNavItems.slice(0, 4)
  const mobileMoreItems = visibleNavItems.slice(4)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <div
      className="flex h-screen flex-col bg-background lg:flex-row"
      style={{
        touchAction: "pan-y pinch-zoom",
        overscrollBehaviorX: "none",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <Image
            src="/logo.png"
            alt="1-2 DRIVE Logo"
            width={40}
            height={40}
            className="rounded-lg"
            style={{
              filter: "drop-shadow(0 0 8px rgba(0, 255, 60, 0.5))",
            }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none text-foreground">1-2 DRIVE</span>
            <span className="text-xs text-muted-foreground">Rental Manager</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group",
                  "min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "bg-primary/10" : "hover:bg-secondary",
                )}
                style={{
                  filter: isActive ? "drop-shadow(0 0 10px rgba(0, 255, 60, 0.5))" : undefined,
                }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary",
                  )}
                  style={{
                    filter: isActive ? "drop-shadow(0 0 8px rgba(0, 255, 60, 0.8))" : undefined,
                  }}
                />
                <span
                  className={cn(
                    "transition-all",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary",
                  )}
                  style={{
                    filter: isActive ? "drop-shadow(0 0 6px rgba(0, 255, 60, 0.7))" : undefined,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          {isAuthenticated ? (
            <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link href="/sign-in">
              <Button className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Staff Sign In
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {header && (
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <div className="lg:hidden flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="1-2 DRIVE Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(0, 255, 60, 0.5))",
                  }}
                />
                <span className="font-bold text-foreground">1-2 DRIVE</span>
              </div>
              {header}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {!isAuthenticated && (
                <Link href="/sign-in" className="lg:hidden">
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Staff</span>
                  </Button>
                </Link>
              )}
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-40 lg:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border bg-card lg:hidden pb-safe">
          {mobileMainItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 relative transition-all group",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                style={{
                  filter: isActive ? "drop-shadow(0 0 10px rgba(0, 255, 60, 0.5))" : undefined,
                }}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-all",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary group-active:text-primary",
                  )}
                  style={{
                    filter: isActive ? "drop-shadow(0 0 10px rgba(0, 255, 60, 0.9))" : undefined,
                  }}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-all",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary group-active:text-primary",
                  )}
                  style={{
                    filter: isActive ? "drop-shadow(0 0 8px rgba(0, 255, 60, 0.8))" : undefined,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {mobileMoreItems.length > 0 && (
            <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <MoreHorizontal className="h-6 w-6 transition-all text-foreground group-hover:text-primary group-active:text-primary" />
                  <span className="text-xs font-medium text-foreground group-hover:text-primary group-active:text-primary">
                    More
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle>More Options</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-2">
                  {mobileMoreItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group",
                          "min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive ? "bg-primary/10" : "hover:bg-secondary",
                        )}
                        style={{
                          filter: isActive ? "drop-shadow(0 0 10px rgba(0, 255, 60, 0.5))" : undefined,
                        }}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-all",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary",
                          )}
                          style={{
                            filter: isActive ? "drop-shadow(0 0 8px rgba(0, 255, 60, 0.8))" : undefined,
                          }}
                        />
                        <span
                          className={cn(
                            "transition-all",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary",
                          )}
                          style={{
                            filter: isActive ? "drop-shadow(0 0 6px rgba(0, 255, 60, 0.7))" : undefined,
                          }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent mt-4"
                      onClick={() => {
                        setMoreMenuOpen(false)
                        handleSignOut()
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </div>
    </div>
  )
}
