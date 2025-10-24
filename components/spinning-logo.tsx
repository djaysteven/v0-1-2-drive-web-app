"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"

export function SpinningLogo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startSpin = () => {
    if (!ballRef.current) return
    ballRef.current.classList.remove("paused")
  }

  const stopAndReset = () => {
    if (!ballRef.current) return
    ballRef.current.classList.add("paused")

    // Clear any pending resume
    if (timerRef.current) clearTimeout(timerRef.current)

    // Resume after 1 second
    timerRef.current = setTimeout(() => {
      startSpin()
    }, 1000)
  }

  useEffect(() => {
    // Start spinning immediately
    startSpin()

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="rounded-2xl bg-background p-2 sm:p-4 border border-border flex items-center justify-center">
      <div ref={containerRef} onClick={stopAndReset} className="logo-container">
        <div ref={ballRef} className="logo-ball">
          <Image
            src="/logo.png"
            alt="1-2 DRIVE Logo"
            width={400}
            height={400}
            className="w-full max-w-[300px] lg:max-w-[400px] h-auto"
            style={{
              mixBlendMode: "screen",
              filter: "drop-shadow(0 0 20px rgba(0, 255, 60, 0.6)) drop-shadow(0 0 40px rgba(0, 255, 60, 0.3))",
              pointerEvents: "none",
            }}
            priority
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
