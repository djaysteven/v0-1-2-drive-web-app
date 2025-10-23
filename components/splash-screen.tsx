"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isRolling, setIsRolling] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("splashShown") === "true") {
      setIsVisible(false)
      return
    }

    const rollTimer = setTimeout(() => {
      setIsRolling(true)
    }, 100)

    const removeTimer = setTimeout(() => {
      setIsVisible(false)
    }, 8100)

    return () => {
      clearTimeout(rollTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const handleSkip = () => {
    setIsVisible(false)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("splashShown", "true")
    }
  }

  if (!isVisible) return null

  const dustParticles = [...Array(35)].map((_, index) => {
    const size = 8 + Math.random() * 12 // 8-20px for cleaner, sharper wisps
    const horizontalOffset = -40 - Math.random() * 70 // -40 to -110px spread
    const verticalOffset = 30 + Math.random() * 70 // 30-100px spread
    const delay = Math.random() * 7 // Random delay throughout animation
    const duration = 1.5 + Math.random() * 1.0 // 1.5-2.5s for slower, more realistic motion
    const opacity = 0.3 + Math.random() * 0.3 // 0.3-0.6 for more subtle appearance
    const blur = 1 + Math.random() * 2 // 1-3px minimal blur for sharp, clean edges
    const animationIndex = Math.floor(Math.random() * 6) // 6 different smoke trails
    const rotation = Math.random() * 360 // Random initial rotation

    // Soft gradient colors for realistic smoke/dust
    const colorVariant = Math.random()
    const baseColor =
      colorVariant < 0.33
        ? "200, 190, 170" // Beige dust
        : colorVariant < 0.66
          ? "180, 180, 180" // Grey smoke
          : "190, 185, 175" // Light brown dust

    return {
      size,
      horizontalOffset,
      verticalOffset,
      delay,
      duration,
      opacity,
      blur,
      animationIndex,
      rotation,
      baseColor,
    }
  })

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0B0B] overflow-hidden cursor-pointer"
      onClick={handleSkip}
    >
      {isRolling && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            animation: "rollDust 8s ease-in-out forwards",
            transform: "translateX(-120vw) translateY(-50%)",
            zIndex: 5,
          }}
        >
          {dustParticles.map((particle, index) => (
            <div
              key={`dust-${index}`}
              className="absolute"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle at center, rgba(${particle.baseColor}, ${particle.opacity}) 0%, rgba(${particle.baseColor}, ${particle.opacity * 0.6}) 40%, rgba(${particle.baseColor}, 0) 100%)`,
                left: `${particle.horizontalOffset}px`,
                top: `${particle.verticalOffset}px`,
                animation: `smokeTrail${particle.animationIndex} ${particle.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
                animationDelay: `${particle.delay}s`,
                filter: `blur(${particle.blur}px)`,
                transform: `rotate(${particle.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="absolute"
        style={{
          top: "50%",
          animation: isRolling ? "rollGlow 8s ease-in-out forwards" : "none",
          transform: isRolling ? undefined : "translateX(-120vw) translateY(-50%)",
          zIndex: 10,
        }}
      >
        <div
          className="h-[320px] w-[320px] rounded-full blur-[100px] md:h-[384px] md:w-[384px] md:blur-[120px]"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0, 255, 60, 0.8) 0%, rgba(0, 255, 60, 0.5) 30%, rgba(0, 255, 60, 0.2) 60%, transparent 100%)",
          }}
        />
      </div>

      <div
        className="relative"
        style={{
          animation: isRolling ? "roll 8s ease-in-out forwards" : "none",
          transform: isRolling ? undefined : "translateX(-120vw)",
          zIndex: 10,
        }}
      >
        <Image
          src="/logo.png"
          alt="1-2 DRIVE"
          width={400}
          height={400}
          className="w-full max-w-[300px] lg:max-w-[400px] h-auto"
          style={{
            mixBlendMode: "screen",
            filter:
              "brightness(1.5) contrast(1.4) drop-shadow(0 0 20px rgba(0, 255, 60, 0.6)) drop-shadow(0 0 40px rgba(0, 255, 60, 0.3))",
          }}
          priority
        />
      </div>

      <div className="absolute bottom-8 text-center text-muted-foreground text-sm animate-pulse">
        Tap anywhere to skip
      </div>

      <style jsx>{`
        @keyframes roll {
          from {
            transform: translateX(-120vw) rotate(0deg);
          }
          to {
            transform: translateX(120vw) rotate(720deg);
          }
        }
        @keyframes rollGlow {
          from {
            transform: translateX(-120vw) translateY(-50%);
          }
          to {
            transform: translateX(120vw) translateY(-50%);
          }
        }
        
        @keyframes rollDust {
          from {
            transform: translateX(-120vw) translateY(-50%);
          }
          to {
            transform: translateX(120vw) translateY(-50%);
          }
        }
        
        /* Realistic smoke trail animations with turbulent, billowing motion */
        /* Curved paths with rotation and dramatic expansion for organic smoke effect */
        @keyframes smokeTrail0 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-140px, -95px) scale(4.5) rotate(-45deg);
            opacity: 0;
          }
        }
        
        @keyframes smokeTrail1 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translate(-170px, -110px) scale(5) rotate(60deg);
            opacity: 0;
          }
        }
        
        @keyframes smokeTrail2 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: translate(-110px, -75px) scale(3.8) rotate(-30deg);
            opacity: 0;
          }
        }
        
        @keyframes smokeTrail3 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-155px, -100px) scale(4.2) rotate(90deg);
            opacity: 0;
          }
        }
        
        @keyframes smokeTrail4 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translate(-125px, -85px) scale(4) rotate(-60deg);
            opacity: 0;
          }
        }
        
        @keyframes smokeTrail5 {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-160px, -105px) scale(4.8) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
