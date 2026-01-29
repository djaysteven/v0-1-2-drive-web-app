"use client"

import { AlertDialogAction } from "@/components/ui/alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"
import { AlertDialogFooter } from "@/components/ui/alert-dialog"
import { AlertDialogDescription } from "@/components/ui/alert-dialog"
import { AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertDialogHeader } from "@/components/ui/alert-dialog"
import { AlertDialogContent } from "@/components/ui/alert-dialog"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { useEffect } from "react"
import { useState } from "react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type React from "react"
import { Edit, Trash2, Bed, Bath, Maximize, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { condosApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ShareButton } from "./share-button"
import { BookingWizard } from "./booking-wizard"
import { RequestLaterDateModal } from "./request-later-date-modal"
import { ImageLightbox } from "./image-lightbox"
import { Condo } from "@/lib/types"

interface CondoCardProps {
  condo: Condo & { isCurrentlyBooked?: boolean }
  isAuthenticated?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function CondoCard({ condo, isAuthenticated = false, onEdit, onDelete, onMoveUp, onMoveDown, onRenterNameSaved }: CondoCardProps) {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [showBookingWizard, setShowBookingWizard] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false) // Added state for image lightbox
  const [localCondo, setLocalCondo] = useState(condo) // Local state for optimistic updates
  const [renterNameInput, setRenterNameInput] = useState(localCondo.renterName || "")
  const [editingRenterName, setEditingRenterName] = useState(false)
  const [savingRenterName, setSavingRenterName] = useState(false)
  const { toast } = useToast()
  const statusBadgeRef = useRef<HTMLDivElement>(null)

  // Sync localCondo with condo prop when it changes (e.g., after update from parent)
  useEffect(() => {
    setLocalCondo(condo)
  }, [condo])

  const statusColors = {
    available: "bg-green-500/70 text-white border-green-500",
    rented: "bg-blue-500/70 text-white border-blue-500",
    maintenance: "bg-destructive/20 text-destructive border-destructive/30",
  }

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated || isTogglingStatus) return

    const newStatus = localCondo.status === "available" ? "rented" : "available"

    // Optimistic update
    setLocalCondo({ ...localCondo, status: newStatus })
    setIsTogglingStatus(true)

    try {
      await condosApi.update(condo.id, {
        status: newStatus,
      })

      toast({
        title: "Status updated",
        description: `Condo status changed to ${newStatus}`,
      })
    } catch (error) {
      // Revert on error
      setLocalCondo({ ...localCondo, status: localCondo.status })
      toast({
        title: "Error",
        description: "Failed to update condo status",
        variant: "destructive",
      })
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleSaveRenterName = async () => {
    const trimmed = renterNameInput.trim()
    setSavingRenterName(true)
    try {
      await condosApi.update(condo.id, { renterName: trimmed || undefined })
      setLocalCondo({ ...localCondo, renterName: trimmed || undefined })
      setEditingRenterName(false)
      toast({ title: "Renter name saved" })
    } catch (error) {
      toast({ title: "Error saving renter name", variant: "destructive" })
    } finally {
      setSavingRenterName(false)
    }
  }

  const displayStatus = condo.isCurrentlyBooked ? "rented" : localCondo.status // Use localCondo for display

  const handleBookingClick = () => {
    if (displayStatus === "rented") {
      setShowRequestModal(true)
    } else {
      setShowBookingWizard(true)
    }
  }

  const [clickStart, setClickStart] = useState<{ x: number; y: number } | null>(null)

  const handleImagePointerDown = (e: React.PointerEvent) => {
    setClickStart({ x: e.clientX, y: e.clientY })
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (!clickStart) return
    const dx = e.clientX - clickStart.x
    const dy = e.clientY - clickStart.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 10) {
      setLightboxOpen(true)
    }
    setClickStart(null)
  }

  return (
    <>
      <Card className="rounded-2xl border-2 border-green-500/30 bg-card shadow-lg overflow-hidden group hover:border-green-500 hover:shadow-[0_0_20px_rgba(0,255,60,0.4)] transition-all duration-200">
        <div className="relative">
          <div className="relative aspect-video overflow-hidden bg-secondary">
            {/* Image container - clickable for lightbox */}
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={handleImageClick}
              onPointerDown={handleImagePointerDown}
            >
              <Image
                src={localCondo.photos[0] || "/placeholder.svg"}
                alt={`${localCondo.building} ${localCondo.unitNo}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                loading="eager"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 45vw, 400px"
                quality={85}
              />
            </div>

            {/* Type badge */}
            <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
              <Badge variant="secondary" className="gap-1 bg-secondary/90 font-semibold shadow-lg">
                Floor {localCondo.floor || "?"}
              </Badge>
              {isAuthenticated && localCondo.airbnbIcalUrl && (
                <Badge
                  variant="outline"
                  className="bg-[#FF5A5F]/80 text-white border-[#FF5A5F]/90 font-semibold shadow-lg"
                >
                  Airbnb
                </Badge>
              )}
            </div>

            {/* Share button */}
            <div className="absolute bottom-3 right-3 z-10">
              <ShareButton
                title={`${localCondo.building} Unit ${localCondo.unitNo}`}
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/condos/${localCondo.id}`}
              />
            </div>
          </div>

          {/* Status badge - OUTSIDE the aspect-video container */}
          {isAuthenticated && !condo.isCurrentlyBooked ? (
            <button
              onClick={handleStatusToggle}
              style={{ cursor: "pointer", pointerEvents: "auto" }}
              className={`absolute top-3 right-3 z-[999] ${statusColors[displayStatus]} px-3 py-1 rounded-full text-xs font-semibold shadow-lg hover:opacity-80 transition-opacity`}
            >
              {isTogglingStatus ? "..." : displayStatus}
            </button>
          ) : (
            <div className="absolute top-3 right-3 z-[999]">
              <Badge className={`${statusColors[displayStatus]} font-semibold shadow-lg cursor-default`}>
                {displayStatus}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground text-balance">{localCondo.building}</h3>
            <p className="text-sm text-muted-foreground">Unit {localCondo.unitNo}</p>
            {isAuthenticated && displayStatus === "rented" && (
              editingRenterName ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={renterNameInput}
                    onChange={(e) => setRenterNameInput(e.target.value)}
                    placeholder="Enter renter name"
                    className="flex-1 px-2 py-1 text-sm bg-background border border-green-500/30 rounded-md text-foreground focus:outline-none focus:border-green-500"
                    autoFocus
                    disabled={savingRenterName}
                  />
                  <button
                    onClick={handleSaveRenterName}
                    disabled={savingRenterName}
                    className="px-3 py-1 text-sm bg-green-500/20 border border-green-500/50 rounded-md text-green-500 hover:bg-green-500/30 disabled:opacity-50"
                  >
                    {savingRenterName ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRenterName(false)
                      setRenterNameInput(localCondo.renterName || "")
                    }}
                    disabled={savingRenterName}
                    className="px-2 py-1 text-sm bg-transparent border border-muted-foreground/30 rounded-md text-muted-foreground hover:bg-muted/20 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRenterNameInput(localCondo.renterName || "")
                    setEditingRenterName(true)
                  }}
                  className="mt-2 px-2 py-1 text-sm bg-green-500/10 border border-green-500/30 rounded-md text-foreground hover:bg-green-500/20 hover:border-green-500/50 transition-colors flex items-center gap-1.5"
                >
                  <span className="font-semibold text-green-500">Renter:</span>
                  <span className="underline">{localCondo.renterName || "Click to add"}</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>
                {localCondo.bedrooms === 0
                  ? "Studio"
                  : localCondo.bedrooms === 1
                    ? "1 Bedroom"
                    : `${localCondo.bedrooms} Bedrooms`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{localCondo.bathrooms}</span>
            </div>
            {localCondo.sizeSqm && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{localCondo.sizeSqm}m²</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">฿{localCondo.price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/{localCondo.priceMode}</span>
          </div>

          {localCondo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {localCondo.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        {isAuthenticated ? (
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Link href={`/condos/${localCondo.id}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            {onEdit && (
              <Button onClick={onEdit} variant="outline" size="icon" className="rounded-xl bg-transparent">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Delete Condo</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to delete {localCondo.building} Unit {localCondo.unitNo}? This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="rounded-xl bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        ) : (
          <CardFooter className="p-4 pt-0">
            <Button className="w-full rounded-xl" onClick={handleBookingClick}>
              {displayStatus === "rented" ? "Request Later Date" : "Book Now"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <BookingWizard
        open={showBookingWizard}
        onOpenChange={setShowBookingWizard}
        onSave={() => {
          setShowBookingWizard(false)
          window.location.reload()
        }}
        isOwner={false}
      />

      <RequestLaterDateModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        assetType="condo"
        assetId={condo.id}
        assetName={`${condo.building} Unit ${condo.unitNo}`}
      />

      <ImageLightbox
        src={localCondo.photos[0] || "/placeholder.svg"}
        alt={`${localCondo.building} Unit ${localCondo.unitNo}`}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
