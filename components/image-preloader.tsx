"use client"

import { useEffect } from "react"
import { vehiclesApi, condosApi } from "@/lib/api"

export function ImagePreloader() {
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const [vehicles, condos] = await Promise.all([vehiclesApi.getAllWithBookingStatus(), condosApi.getAll()])

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
