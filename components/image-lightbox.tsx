"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageLightboxProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)

  console.log("[v0] Lightbox opened with src:", src)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setDragOffset({ x: 0, y: 0 })
      setHasMoved(false)
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't drag if clicking on close button
    if ((e.target as HTMLElement).closest("button")) return

    e.stopPropagation()
    setIsDragging(true)
    setHasMoved(false)
    setStartPos({ x: e.clientX, y: e.clientY })
    setDragOffset({ x: 0, y: 0 })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return

    const newX = e.clientX - startPos.x
    const newY = e.clientY - startPos.y

    // Mark as moved if dragged more than 5px (prevents accidental drags)
    if (Math.abs(newX) > 5 || Math.abs(newY) > 5) {
      setHasMoved(true)
    }

    setDragOffset({ x: newX, y: newY })
  }

  const handlePointerUp = () => {
    if (!isDragging) return

    setIsDragging(false)
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2)

    // Close if dragged more than 100px
    if (distance > 100) {
      onClose()
    } else {
      // Spring back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const opacity = Math.max(0.3, 1 - Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2) / 400)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.9 * opacity})`,
        transition: isDragging ? "none" : "background-color 300ms ease-out",
      }}
      onClick={(e) => {
        // Only close on backdrop click if not dragging
        if (e.target === e.currentTarget && !hasMoved) {
          onClose()
        }
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 h-12 w-12 rounded-full bg-black/70 hover:bg-black/90 text-white border-2 border-green-500 hover:border-green-400 shadow-lg"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <div
        className="relative w-full h-full max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden border-4 border-green-500 shadow-[0_0_40px_rgba(0,255,60,0.6)]"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${isDragging ? 0.95 : 1})`,
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none", // Prevent browser touch gestures
          userSelect: "none", // Prevent text selection
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 bg-black">
          <Image
            src={src || "/placeholder.svg?height=800&width=800"}
            alt={alt}
            fill
            className="object-contain"
            sizes="90vw"
            quality={95}
            priority
            unoptimized={src?.includes("blob.vercel-storage.com")}
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full border border-green-500/50">
        Drag to dismiss • Tap outside to close
      </div>
    </div>
  )
}
