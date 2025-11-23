"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)

    const timeout = setTimeout(() => {
      setIsTransitioning(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [pathname])

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(20px)" : "translateY(0)",
      }}
    >
      {children}
    </div>
  )
}
