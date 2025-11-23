"use client"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  opacity: number
  baseOpacity: number // Added base opacity for dynamic adjustment
  layer: "behind" | "front"
}

export function ParticleBackground() {
  const canvasBackRef = useRef<HTMLCanvasElement>(null)
  const canvasFrontRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const [logoLoaded, setLogoLoaded] = useState(false)
  const logoRef = useRef<HTMLImageElement>()

  useEffect(() => {
    const canvasBack = canvasBackRef.current
    const canvasFront = canvasFrontRef.current
    if (!canvasBack || !canvasFront) return

    const ctxBack = canvasBack.getContext("2d", { alpha: true })
    const ctxFront = canvasFront.getContext("2d", { alpha: true })
    if (!ctxBack || !ctxFront) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth * dpr
      const height = window.innerHeight * dpr

      canvasBack.width = width
      canvasBack.height = height
      canvasBack.style.width = `${window.innerWidth}px`
      canvasBack.style.height = `${window.innerHeight}px`
      ctxBack.scale(dpr, dpr)

      canvasFront.width = width
      canvasFront.height = height
      canvasFront.style.width = `${window.innerWidth}px`
      canvasFront.style.height = `${window.innerHeight}px`
      ctxFront.scale(dpr, dpr)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    if (!logoRef.current) {
      const logo = new window.Image()
      logo.crossOrigin = "anonymous"
      logo.onload = () => {
        logoRef.current = logo
        setLogoLoaded(true)
      }
      logo.onerror = () => {
        setLogoLoaded(false)
      }
      logo.src = "/logo.png"
    }

    const particleCount = 25
    if (particlesRef.current.length === 0) {
      const particles: Particle[] = []
      for (let i = 0; i < particleCount; i++) {
        const isFront = Math.random() < 0.3
        const baseOpacity = isFront ? 0.08 + Math.random() * 0.1 : 0.25 + Math.random() * 0.25
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: 25 + Math.random() * 35,
          speedX: (Math.random() - 0.5) * 2.5, // Increased from 0.8 to 2.5
          speedY: (Math.random() - 0.5) * 2.5, // Increased from 0.8 to 2.5
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 5, // Increased from 3 to 5
          opacity: baseOpacity,
          baseOpacity: baseOpacity,
          layer: isFront ? "front" : "behind",
        })
      }
      particlesRef.current = particles
      console.log("[v0] Created", particleCount, "particles with dual-layer system")
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
      } else if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true }
      }
    }

    const handlePointerEnd = () => {
      mouseRef.current.active = false
    }

    document.addEventListener("mousemove", handlePointerMove, { passive: true })
    document.addEventListener("touchmove", handlePointerMove, { passive: true })
    document.addEventListener("mouseleave", handlePointerEnd)
    document.addEventListener("touchend", handlePointerEnd)
    document.addEventListener("touchcancel", handlePointerEnd)

    const isOverElement = (x: number, y: number): boolean => {
      const elements = document.elementsFromPoint(x, y)
      // Check if any element is a card, dialog, or main content window
      return elements.some(
        (el) =>
          el.classList.contains("card-with-glow") ||
          el.classList.contains("group") ||
          el.tagName === "DIALOG" ||
          el.getAttribute("role") === "dialog" ||
          el.classList.contains("sheet") ||
          el.closest("[data-radix-dialog-content]") !== null,
      )
    }

    const animate = () => {
      ctxBack.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctxFront.clearRect(0, 0, window.innerWidth, window.innerHeight)

      particlesRef.current.forEach((particle) => {
        if (mouseRef.current.active) {
          const dx = particle.x - mouseRef.current.x
          const dy = particle.y - mouseRef.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 150

          if (distance < maxDistance && distance > 0) {
            const force = (maxDistance - distance) / maxDistance
            particle.speedX += (dx / distance) * force * 1.5
            particle.speedY += (dy / distance) * force * 1.5
          }
        }

        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.rotation += particle.rotationSpeed

        particle.speedX *= 0.99 // Was 0.98
        particle.speedY *= 0.99

        const minSpeed = 0.6 // Was 0.3
        if (Math.abs(particle.speedX) < minSpeed) {
          particle.speedX = (Math.random() - 0.5) * 2.5
        }
        if (Math.abs(particle.speedY) < minSpeed) {
          particle.speedY = (Math.random() - 0.5) * 2.5
        }

        const padding = particle.size * 2
        if (particle.x < -padding) particle.x = window.innerWidth + padding
        if (particle.x > window.innerWidth + padding) particle.x = -padding
        if (particle.y < -padding) particle.y = window.innerHeight + padding
        if (particle.y > window.innerHeight + padding) particle.y = -padding

        const overElement = isOverElement(particle.x, particle.y)
        if (overElement) {
          // Over an element - use base opacity (more transparent)
          particle.opacity = particle.baseOpacity
        } else {
          // In open space between windows - increase opacity (less transparent)
          particle.opacity =
            particle.layer === "behind"
              ? Math.min(particle.baseOpacity * 2.2, 0.8) // Behind layer: up to 80% opacity in gaps
              : Math.min(particle.baseOpacity * 3, 0.4) // Front layer: up to 40% opacity in gaps
        }

        const ctx = particle.layer === "behind" ? ctxBack : ctxFront

        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate((particle.rotation * Math.PI) / 180)
        ctx.globalAlpha = particle.opacity

        if (particle.layer === "behind") {
          ctx.shadowColor = overElement ? "rgba(0, 255, 60, 0.5)" : "rgba(0, 255, 60, 0.9)" // Stronger glow in gaps
          ctx.shadowBlur = overElement ? 20 : 35 // More blur in gaps
        } else {
          ctx.shadowColor = overElement ? "rgba(0, 255, 60, 0.2)" : "rgba(0, 255, 60, 0.5)"
          ctx.shadowBlur = overElement ? 12 : 25
        }

        if (logoLoaded && logoRef.current) {
          ctx.drawImage(logoRef.current, -particle.size / 2, -particle.size / 2, particle.size, particle.size)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
          ctx.fillStyle = particle.layer === "behind" ? "rgba(0, 255, 60, 0.4)" : "rgba(0, 255, 60, 0.15)"
          ctx.fill()
        }

        ctx.restore()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      document.removeEventListener("mousemove", handlePointerMove)
      document.removeEventListener("touchmove", handlePointerMove)
      document.removeEventListener("mouseleave", handlePointerEnd)
      document.removeEventListener("touchend", handlePointerEnd)
      document.removeEventListener("touchcancel", handlePointerEnd)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [logoLoaded])

  return (
    <>
      <canvas
        ref={canvasBackRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
        }}
      />
      <canvas
        ref={canvasFrontRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 50,
        }}
      />
    </>
  )
}
