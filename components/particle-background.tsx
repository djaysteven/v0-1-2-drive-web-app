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
  layer: "behind" | "front"
  angle: number
  baseSpeed: number
  justBouncedOffLogo: boolean
}

export function ParticleBackground() {
  const canvasBackRef = useRef<HTMLCanvasElement>(null)
  const canvasFrontRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()
  const [logoLoaded, setLogoLoaded] = useState(false)
  const logoRef = useRef<HTMLImageElement>()
  const lastMousePosRef = useRef<{ x: number; y: number; time: number } | null>(null)

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

    const particleCount = 45
    if (particlesRef.current.length === 0) {
      const particles: Particle[] = []
      let seed = 12345
      const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }

      const cols = 9
      const rows = 5
      const cellWidth = window.innerWidth / cols
      const cellHeight = window.innerHeight / rows

      for (let i = 0; i < particleCount; i++) {
        const isFront = seededRandom() < 0.3
        const opacity = isFront ? 0.15 : 0.4

        let size: number
        if (seededRandom() < 0.6) {
          size = 15 + seededRandom() * 15
        } else {
          size = 35 + seededRandom() * 30
        }

        const angle = seededRandom() * Math.PI * 2
        const baseSpeed = 0.5 + seededRandom() * 0.8

        const cellIndex = i % (cols * rows)
        const col = cellIndex % cols
        const row = Math.floor(cellIndex / cols)
        const x = col * cellWidth + seededRandom() * cellWidth
        const y = row * cellHeight + seededRandom() * cellHeight

        particles.push({
          x,
          y,
          size,
          speedX: Math.cos(angle) * baseSpeed,
          speedY: Math.sin(angle) * baseSpeed,
          rotation: seededRandom() * 360,
          rotationSpeed: (seededRandom() - 0.5) * 12,
          opacity,
          layer: isFront ? "front" : "behind",
          angle,
          baseSpeed,
          justBouncedOffLogo: false,
        })
      }
      particlesRef.current = particles
      console.log("[v0] Created", particleCount, "evenly distributed particles")
    }

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const x = e instanceof MouseEvent ? e.clientX : e.touches[0]?.clientX
      const y = e instanceof MouseEvent ? e.clientY : e.touches[0]?.clientY

      if (!x || !y) return

      const now = Date.now()

      if (lastMousePosRef.current) {
        const dt = now - lastMousePosRef.current.time
        if (dt > 0 && dt < 100) {
          const velocityX = (x - lastMousePosRef.current.x) / dt
          const velocityY = (y - lastMousePosRef.current.y) / dt
          const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY)

          if (speed > 0.5) {
            particlesRef.current.forEach((particle) => {
              const dx = particle.x - x
              const dy = particle.y - y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 80) {
                const kickStrength = Math.min(speed * 2, 3)
                particle.speedX = velocityX * kickStrength * 20
                particle.speedY = velocityY * kickStrength * 20
                particle.angle = Math.atan2(particle.speedY, particle.speedX)

                setTimeout(() => {
                  particle.speedX = Math.cos(particle.angle) * particle.baseSpeed
                  particle.speedY = Math.sin(particle.angle) * particle.baseSpeed
                }, 500)
              }
            })
          }
        }
      }

      lastMousePosRef.current = { x, y, time: now }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleMouseMove, { passive: true })

    const getMainLogoRect = (): { x: number; y: number; radius: number } | null => {
      const logoElements = document.querySelectorAll('img[alt*="1-2 DRIVE Logo"]')
      for (const logoEl of Array.from(logoElements)) {
        const rect = logoEl.getBoundingClientRect()
        if (rect.width > 200) {
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: rect.width / 2 + 90,
          }
        }
      }
      return null
    }

    const checkCollision = (p1: Particle, p2: Particle): boolean => {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < (p1.size + p2.size) / 2
    }

    const animate = () => {
      const canvasBack = canvasBackRef.current
      const canvasFront = canvasFrontRef.current
      if (!canvasBack || !canvasFront) return

      const ctxBack = canvasBack.getContext("2d", { alpha: true })
      const ctxFront = canvasFront.getContext("2d", { alpha: true })
      if (!ctxBack || !ctxFront) return

      ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height)
      ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height)

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i]
          const p2 = particlesRef.current[j]

          if (checkCollision(p1, p2)) {
            const tempSpeedX = p1.speedX
            const tempSpeedY = p1.speedY
            const tempAngle = p1.angle

            p1.speedX = p2.speedX
            p1.speedY = p2.speedY
            p1.angle = p2.angle

            p2.speedX = tempSpeedX
            p2.speedY = tempSpeedY
            p2.angle = tempAngle

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const overlap = (p1.size + p2.size) / 2 - dist
            if (overlap > 0) {
              const nx = dx / dist
              const ny = dy / dist
              p1.x -= (nx * overlap) / 2
              p1.y -= (ny * overlap) / 2
              p2.x += (nx * overlap) / 2
              p2.y += (ny * overlap) / 2
            }
          }
        }
      }

      const mainLogo = getMainLogoRect()

      particlesRef.current.forEach((particle) => {
        if (mainLogo) {
          const dx = particle.x - mainLogo.x
          const dy = particle.y - mainLogo.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const barrierDistance = particle.size / 2 + mainLogo.radius

          if (distance < barrierDistance) {
            if (!particle.justBouncedOffLogo) {
              const normalAngle = Math.atan2(dy, dx)
              const incidentAngle = Math.atan2(particle.speedY, particle.speedX)
              const reflectionAngle = 2 * normalAngle - incidentAngle

              particle.angle = reflectionAngle
              particle.speedX = Math.cos(reflectionAngle) * particle.baseSpeed
              particle.speedY = Math.sin(reflectionAngle) * particle.baseSpeed
              particle.justBouncedOffLogo = true
            }

            const pushDistance = barrierDistance - distance + 2
            particle.x += (dx / distance) * pushDistance
            particle.y += (dy / distance) * pushDistance
          } else if (distance > barrierDistance + 10) {
            particle.justBouncedOffLogo = false
          }
        }

        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.rotation += particle.rotationSpeed

        const padding = particle.size
        if (particle.x < -padding) particle.x = window.innerWidth + padding
        if (particle.x > window.innerWidth + padding) particle.x = -padding
        if (particle.y < -padding) particle.y = window.innerHeight + padding
        if (particle.y > window.innerHeight + padding) particle.y = -padding

        const ctx = particle.layer === "behind" ? ctxBack : ctxFront

        ctx.save()
        ctx.translate(particle.x, particle.y)
        ctx.rotate((particle.rotation * Math.PI) / 180)
        ctx.globalAlpha = particle.opacity

        ctx.shadowColor = particle.layer === "behind" ? "rgba(0, 255, 60, 0.6)" : "rgba(0, 255, 60, 0.3)"
        ctx.shadowBlur = particle.layer === "behind" ? 25 : 15

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
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleMouseMove)
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
