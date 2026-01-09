"use client"

import { useEffect, useState } from "react"
import { vehiclesApi, condosApi } from "@/lib/api"
import Image from "next/image"

export function ImagePreloader() {
  const [imageUrls, setImageUrls] = useState<string[]>([])

  useEffect(() => {
    const preloadImages = async () => {
      try {
        const [vehicles, condos] = await Promise.all([vehiclesApi.getAllWithBookingStatus(), condosApi.getAll()])

        const urls: string[] = []

        vehicles.forEach((vehicle) => {
          if (vehicle.photos?.length) {
            urls.push(...vehicle.photos)
          }
        })

        condos.forEach((condo) => {
          if (condo.photos?.length) {
            urls.push(...condo.photos)
          }
        })

        setImageUrls(urls)
        console.log("[v0] Preloading", urls.length, "images")
      } catch (error) {
        console.error("[v0] Failed to preload images:", error)
      }
    }

    preloadImages()
  }, [])

  return (
    <div className="fixed -z-50 opacity-0 pointer-events-none" aria-hidden="true">
      {imageUrls.map((url, index) => (
        <Image
          key={`preload-${index}`}
          src={url || "/placeholder.svg"}
          alt=""
          width={1}
          height={1}
          priority
          loading="eager"
        />
      ))}
    </div>
  )
}
