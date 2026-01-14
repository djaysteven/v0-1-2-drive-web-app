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
  const [scale, setScale] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const [lastPinchDistance, setLastPinchDistance] = useState(0)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setDragOffset({ x: 0, y: 0 })
      setHasMoved(false)
      setScale(1)
      setIsPinching(false)
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    e.stopPropagation()
    setIsDragging(true)
    setHasMoved(false)
    setStartPos({ x: e.clientX, y: e.clientY })
    setDragOffset({ x: 0, y: 0 })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isPinching) return

    const newX = e.clientX - startPos.x
    const newY = e.clientY - startPos.y

    if (Math.abs(newX) > 3 || Math.abs(newY) > 3) {
      setHasMoved(true)
    }

    setDragOffset({ x: newX, y: newY })
  }

  const handlePointerUp = () => {
    if (!isDragging) return

    setIsDragging(false)
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2)

    if (distance > 50 && !isPinching) {
      onClose()
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      setIsPinching(true)
      setIsDragging(false)
      setLastPinchDistance(getDistance(e.touches))
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault()
      const currentDistance = getDistance(e.touches)
      const delta = currentDistance - lastPinchDistance
      const newScale = Math.max(1, Math.min(4, scale + delta / 200))
      setScale(newScale)
      setLastPinchDistance(currentDistance)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false)
      if (scale < 1.1) {
        setScale(1)
      }
    }
  }

  const opacity = Math.max(0.3, 1 - Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2) / 400)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.9 * opacity})`,
        transition: isDragging ? "none" : "background-color 300ms ease-out",
      }}
      onClick={(e) => {
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
        className="relative rounded-2xl overflow-hidden border-4 border-green-500 shadow-[0_0_40px_rgba(0,255,60,0.6)] bg-black"
        style={{
          width: "95vw",
          height: "90vh",
          maxWidth: "1800px",
          maxHeight: "1200px",
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${isDragging ? 0.95 : 1})`,
          transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full transition-transform duration-200"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <Image
            src={src || "/placeholder.svg?height=1200&width=1200"}
            alt={alt}
            fill
            className="object-cover"
            sizes="95vw"
            quality={95}
            priority
            unoptimized={src?.includes("blob.vercel-storage.com")}
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full border border-green-500/50">
        Pinch to zoom • Swipe to close
      </div>
    </div>
  )
}
