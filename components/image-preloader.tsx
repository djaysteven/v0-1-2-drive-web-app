"use client"

import { useEffect } from "react"
import { vehiclesApi, condosApi } from "@/lib/api"

export function ImagePreloader() {
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const [vehicles, condos] = await Promise.all([vehiclesApi.getAll(), condosApi.getAll()])

        const imageUrls: string[] = []

        vehicles.forEach((vehicle) => {
          if (vehicle.images?.length) {
            imageUrls.push(...vehicle.images)
          }
        })

        condos.forEach((condo) => {
          if (condo.images?.length) {
            imageUrls.push(...condo.images)
          }
        })

        imageUrls.forEach((url) => {
          // Use link preload for critical images
          const link = document.createElement("link")
          link.rel = "preload"
          link.as = "image"
          link.href = url
          document.head.appendChild(link)

          // Also create Image object for immediate cache
          const img = new Image()
          img.src = url
        })

        console.log("[v0] Preloaded", imageUrls.length, "images")
      } catch (error) {
        console.error("[v0] Failed to preload images:", error)
      }
    }

    preloadImages()
  }, [])

  return null
}
