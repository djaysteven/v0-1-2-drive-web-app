"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const logoImageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number>()
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Load logo image
    const img = new Image()
    img.src = "/logo.png"
    img.onload = () => {
      logoImageRef.current = img
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          active: true,
        }
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("mouseleave", handleMouseLeave)

    // Initialize particles with seeded random for consistency
    const initParticles = () => {
      const particles: Particle[] = []
      const particleCount = 30

      // Create a grid distribution for initial positions
      const cols = Math.ceil(Math.sqrt(particleCount * (window.innerWidth / window.innerHeight)))
      const rows = Math.ceil(particleCount / cols)

      for (let i = 0; i < particleCount; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)

        // Distribute particles across the viewport
        const x = (col + 0.5) * (window.innerWidth / cols)
        const y = (row + 0.5) * (window.innerHeight / rows)

        // 60% small particles, 40% larger ones
        const isSmall = i < particleCount * 0.6
        const size = isSmall ? 15 + (i % 15) : 35 + (i % 30)

        // Random direction
        const angle = i * 137.5 * (Math.PI / 180) // Golden angle for distribution
        const speed = 0.5 + (i % 10) * 0.08

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          rotation: (i * 45) % 360,
          rotationSpeed: (i % 2 === 0 ? 1 : -1) * (2 + (i % 4)),
        })
      }

      particlesRef.current = particles
    }

    initParticles()

    // Get main logo position and size (only on homepage)
    const getMainLogoRect = () => {
      const logoContainer = document.querySelector(".animate-wheel-spin")
      if (!logoContainer) return null

      const rect = logoContainer.getBoundingClientRect()
      // Use fixed base size of 150px for collision detection (half of 300px max-width)
      const radius = 75 + 40 // 75px base radius + 40px glow barrier

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius,
      }
    }

    // Check collision between two particles
    const checkCollision = (p1: Particle, p2: Particle) => {
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDistance = (p1.size + p2.size) / 2

      return distance < minDistance
    }

    // Bounce particles off each other
    const bounceParticles = (p1: Particle, p2: Particle) => {
      // Simple velocity swap for collision
      const tempVx = p1.vx
      const tempVy = p1.vy
      p1.vx = p2.vx
      p1.vy = p2.vy
      p2.vx = tempVx
      p2.vy = tempVy

      // Separate particles to prevent sticking
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const overlap = (p1.size + p2.size) / 2 - distance

      if (overlap > 0) {
        const angle = Math.atan2(dy, dx)
        const moveX = (Math.cos(angle) * overlap) / 2
        const moveY = (Math.sin(angle) * overlap) / 2

        p1.x -= moveX
        p1.y -= moveY
        p2.x += moveX
        p2.y += moveY
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mainLogo = getMainLogoRect()
      const particles = particlesRef.current
      const mouse = mouseRef.current

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed

        if (mouse.active) {
          const dx = particle.x - mouse.x
          const dy = particle.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const interactionRadius = 100

          if (distance < interactionRadius && distance > 0) {
            const force = (interactionRadius - distance) / interactionRadius
            const pushX = (dx / distance) * force * 3
            const pushY = (dy / distance) * force * 3

            particle.x += pushX
            particle.y += pushY
          }
        }

        // Wrap around screen edges
        const padding = particle.size
        if (particle.x < -padding) particle.x = canvas.width + padding
        if (particle.x > canvas.width + padding) particle.x = -padding
        if (particle.y < -padding) particle.y = canvas.height + padding
        if (particle.y > canvas.height + padding) particle.y = -padding

        // Check collision with main logo
        if (mainLogo) {
          const dx = particle.x - mainLogo.x
          const dy = particle.y - mainLogo.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < mainLogo.radius + particle.size / 2) {
            // Reflect velocity
            const angle = Math.atan2(dy, dx)
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
            particle.vx = Math.cos(angle) * speed
            particle.vy = Math.sin(angle) * speed

            // Push particle away from logo
            const pushDistance = mainLogo.radius + particle.size / 2 - distance + 2
            particle.x += Math.cos(angle) * pushDistance
            particle.y += Math.sin(angle) * pushDistance
          }
        }

        // Check collisions with other particles
        for (let j = i + 1; j < particles.length; j++) {
          if (checkCollision(particle, particles[j])) {
            bounceParticles(particle, particles[j])
          }
        }

        // Draw particle
        if (logoImageRef.current) {
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate((particle.rotation * Math.PI) / 180)
          ctx.globalAlpha = 0.4
          ctx.filter = "drop-shadow(0 0 8px rgba(0, 255, 60, 0.5))"
          ctx.drawImage(logoImageRef.current, -particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation after a short delay to ensure logo is rendered
    const startTimer = setTimeout(() => {
      animate()
    }, 100)

    return () => {
      clearTimeout(startTimer)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener("resize", resizeCanvas)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />
}
