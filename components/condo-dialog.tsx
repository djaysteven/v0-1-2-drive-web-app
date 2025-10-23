"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { condosApi } from "@/lib/api"
import type { Condo, CondoStatus, PriceMode } from "@/lib/types"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

interface CondoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condo?: Condo
  onSave: () => void
}

export function CondoDialog({ open, onOpenChange, condo, onSave }: CondoDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    building: "",
    unitNo: "",
    bedrooms: "",
    bathrooms: "",
    priceMode: "night" as PriceMode,
    price: "",
    deposit: "",
    sizeSqm: "",
    floor: "",
    status: "available" as CondoStatus,
    photos: [] as string[],
    tags: "",
    notes: "",
  })

  useEffect(() => {
    if (condo) {
      setFormData({
        building: condo.building,
        unitNo: condo.unitNo,
        bedrooms: condo.bedrooms.toString(),
        bathrooms: condo.bathrooms.toString(),
        priceMode: condo.priceMode,
        price: condo.price.toString(),
        deposit: condo.deposit.toString(),
        sizeSqm: condo.sizeSqm?.toString() || "",
        floor: condo.floor?.toString() || "",
        status: condo.status,
        photos: condo.photos,
        tags: condo.tags.join(", "),
        notes: condo.notes || "",
      })
    } else {
      setFormData({
        building: "",
        unitNo: "",
        bedrooms: "",
        bathrooms: "",
        priceMode: "night",
        price: "",
        deposit: "",
        sizeSqm: "",
        floor: "",
        status: "available",
        photos: [],
        tags: "",
        notes: "",
      })
    }
  }, [condo, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const condoData = {
        building: formData.building,
        unitNo: formData.unitNo,
        bedrooms: Number.parseInt(formData.bedrooms),
        bathrooms: Number.parseInt(formData.bathrooms),
        priceMode: formData.priceMode,
        price: Number.parseFloat(formData.price),
        deposit: Number.parseFloat(formData.deposit),
        sizeSqm: formData.sizeSqm ? Number.parseFloat(formData.sizeSqm) : undefined,
        floor: formData.floor ? Number.parseInt(formData.floor) : undefined,
        status: formData.status,
        photos: formData.photos.length > 0 ? formData.photos : ["/modern-apartment-interior.jpg"],
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: formData.notes || undefined,
      }

      console.log("[v0] Submitting condo data:", condoData)

      if (condo) {
        await condosApi.update(condo.id, condoData)
        toast({
          title: "Condo updated",
          description: "The condo has been updated successfully.",
        })
      } else {
        await condosApi.create(condoData)
        toast({
          title: "Condo created",
          description: "The condo has been added successfully.",
        })
      }

      onSave()
    } catch (error) {
      console.error("[v0] Failed to save condo:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save condo. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhotoUrl = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      setFormData({ ...formData, photos: [...formData.photos, url] })
    }
  }

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{condo ? "Edit Condo" : "Add New Condo"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {condo ? "Update condo information" : "Add a new condo to your listings"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Photos</Label>
            <div className="grid grid-cols-3 gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-secondary group">
                  <Image src={photo || "/placeholder.svg"} alt={`Photo ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="aspect-video rounded-lg border-2 border-dashed border-border bg-secondary hover:bg-secondary/80 flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add Photo</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="building" className="text-foreground">
                Building Name *
              </Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="Sunset Tower"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitNo" className="text-foreground">
                Unit Number *
              </Label>
              <Input
                id="unitNo"
                value={formData.unitNo}
                onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                placeholder="12A"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms" className="text-foreground">
                Bedrooms *
              </Label>
              <Select
                value={formData.bedrooms}
                onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
              >
                <SelectTrigger id="bedrooms" className="rounded-xl bg-secondary border-border">
                  <SelectValue placeholder="Select bedroom type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="0">Studio</SelectItem>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms" className="text-foreground">
                Bathrooms *
              </Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                placeholder="2"
                required
                min="0"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceMode" className="text-foreground">
                Price Mode *
              </Label>
              <Select
                value={formData.priceMode}
                onValueChange={(value: PriceMode) => setFormData({ ...formData, priceMode: value })}
              >
                <SelectTrigger id="priceMode" className="rounded-xl bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="night">Per Night</SelectItem>
                  <SelectItem value="month">Per Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-foreground">
                Price (฿) *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2500"
                required
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit" className="text-foreground">
                Deposit (฿) *
              </Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                placeholder="5000"
                required
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizeSqm" className="text-foreground">
                Size (m²)
              </Label>
              <Input
                id="sizeSqm"
                type="number"
                value={formData.sizeSqm}
                onChange={(e) => setFormData({ ...formData, sizeSqm: e.target.value })}
                placeholder="65"
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor" className="text-foreground">
                Floor
              </Label>
              <Input
                id="floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="12"
                min="0"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground">
                Status *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: CondoStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="rounded-xl bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-foreground">
              Tags
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="pool, gym, parking (comma separated)"
              className="rounded-xl bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this condo..."
              rows={3}
              className="rounded-xl bg-secondary border-border resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {condo ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
