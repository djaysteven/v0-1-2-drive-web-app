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
import { vehiclesApi } from "@/lib/api"
import type { Vehicle, VehicleType, VehicleStatus } from "@/lib/types"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

interface VehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle
  onSave: () => void
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSave }: VehicleDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "bike" as VehicleType,
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    deposit: "",
    plate: "",
    vin: "",
    color: "",
    year: "",
    mileage: "",
    cc: "", // Added CC field
    keyless: false, // Added keyless field
    popularity: "", // Added popularity field
    taxExpires: "",
    status: "available" as VehicleStatus,
    photos: [] as string[],
    tags: "",
    notes: "",
  })

  useEffect(() => {
    if (vehicle) {
      let taxExpiresDisplay = ""
      if (vehicle.taxExpires) {
        const date = new Date(vehicle.taxExpires)
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0")
        taxExpiresDisplay = `${day}/${month}`
      }

      setFormData({
        name: vehicle.name,
        type: vehicle.type,
        dailyPrice: vehicle.dailyPrice.toString(),
        weeklyPrice: vehicle.weeklyPrice?.toString() || "",
        monthlyPrice: vehicle.monthlyPrice?.toString() || "",
        deposit: vehicle.deposit.toString(),
        plate: vehicle.plate,
        vin: vehicle.vin || "",
        color: vehicle.color || "",
        year: vehicle.year?.toString() || "",
        mileage: vehicle.mileage?.toString() || "",
        cc: vehicle.cc?.toString() || "", // Load CC value
        keyless: vehicle.keyless || false, // Load keyless value
        popularity: vehicle.popularity?.toString() || "", // Load popularity value
        taxExpires: taxExpiresDisplay,
        status: vehicle.status,
        photos: vehicle.photos,
        tags: vehicle.tags.join(", "),
        notes: vehicle.notes || "",
      })
    } else {
      setFormData({
        name: "",
        type: "bike",
        dailyPrice: "",
        weeklyPrice: "",
        monthlyPrice: "",
        deposit: "",
        plate: "",
        vin: "",
        color: "",
        year: "",
        mileage: "",
        cc: "",
        keyless: false, // Reset keyless to false
        popularity: "",
        taxExpires: "",
        status: "available",
        photos: [],
        tags: "",
        notes: "",
      })
    }
  }, [vehicle, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let taxExpiresDate: string | undefined
      if (formData.taxExpires) {
        const [day, month] = formData.taxExpires.split("/")
        if (day && month) {
          const currentYear = new Date().getFullYear()
          taxExpiresDate = `${currentYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        }
      }

      const vehicleData = {
        name: formData.name,
        type: formData.type,
        dailyPrice: Number.parseFloat(formData.dailyPrice),
        weeklyPrice: formData.weeklyPrice ? Number.parseFloat(formData.weeklyPrice) : undefined,
        monthlyPrice: formData.monthlyPrice ? Number.parseFloat(formData.monthlyPrice) : undefined,
        deposit: Number.parseFloat(formData.deposit),
        plate: formData.plate,
        vin: formData.vin || undefined,
        color: formData.color || undefined,
        year: formData.year ? Number.parseInt(formData.year) : undefined,
        mileage: formData.mileage ? Number.parseInt(formData.mileage) : undefined,
        cc: formData.cc ? Number.parseInt(formData.cc) : undefined, // Save CC value
        keyless: formData.keyless, // Save keyless value
        popularity: formData.popularity ? Number.parseInt(formData.popularity) : undefined, // Save popularity value
        taxExpires: taxExpiresDate,
        status: formData.status,
        photos: formData.photos.length > 0 ? formData.photos : ["/diverse-city-street.png"],
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: formData.notes || undefined,
      }

      console.log("[v0] Saving vehicle:", vehicleData)

      if (vehicle) {
        await vehiclesApi.update(vehicle.id, vehicleData)
        toast({
          title: "Vehicle updated",
          description: "The vehicle has been updated successfully.",
        })
      } else {
        await vehiclesApi.create(vehicleData)
        toast({
          title: "Vehicle created",
          description: "The vehicle has been added successfully.",
        })
      }

      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save vehicle:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle. Please try again.",
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
          <DialogTitle className="text-foreground">{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {vehicle ? "Update vehicle information" : "Add a new vehicle to your fleet"}
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
              <Label htmlFor="name" className="text-foreground">
                Vehicle Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Honda PCX 160"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-foreground">
                Type *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: VehicleType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type" className="rounded-xl bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyPrice" className="text-foreground">
                Daily Price (฿) *
              </Label>
              <Input
                id="dailyPrice"
                type="number"
                value={formData.dailyPrice}
                onChange={(e) => setFormData({ ...formData, dailyPrice: e.target.value })}
                placeholder="300"
                required
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyPrice" className="text-foreground">
                Weekly Price (฿)
              </Label>
              <Input
                id="weeklyPrice"
                type="number"
                value={formData.weeklyPrice}
                onChange={(e) => setFormData({ ...formData, weeklyPrice: e.target.value })}
                placeholder="1800"
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPrice" className="text-foreground">
                Monthly Price (฿)
              </Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                placeholder="6000"
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
                placeholder="3000"
                required
                min="0"
                step="0.01"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate" className="text-foreground">
                License Plate *
              </Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                placeholder="ABC-1234"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin" className="text-foreground">
                VIN
              </Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="1HGBH41JXMN109186"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-foreground">
                Color
              </Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Black"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-foreground">
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2023"
                min="1900"
                max={new Date().getFullYear() + 1}
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage" className="text-foreground">
                Mileage (km)
              </Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                placeholder="5000"
                min="0"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxExpires" className="text-foreground">
                Tax Expires (DD/MM)
              </Label>
              <Input
                id="taxExpires"
                type="text"
                value={formData.taxExpires}
                onChange={(e) => setFormData({ ...formData, taxExpires: e.target.value })}
                placeholder="15/06"
                pattern="\d{2}/\d{2}"
                maxLength={5}
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground">
                Status *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: VehicleStatus) => setFormData({ ...formData, status: value })}
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

            <div className="space-y-2">
              <Label htmlFor="cc" className="text-foreground">
                CC (Engine Size)
              </Label>
              <Input
                id="cc"
                type="number"
                value={formData.cc}
                onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                placeholder="150"
                min="0"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input
                id="keyless"
                type="checkbox"
                checked={formData.keyless}
                onChange={(e) => setFormData({ ...formData, keyless: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="keyless" className="text-foreground cursor-pointer">
                Keyless System
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="popularity" className="text-foreground">
                Popularity (1-10) *
              </Label>
              <Input
                id="popularity"
                type="number"
                value={formData.popularity}
                onChange={(e) => setFormData({ ...formData, popularity: e.target.value })}
                placeholder="5"
                min="1"
                max="10"
                required
                className="rounded-xl bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Higher number = more popular</p>
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
              placeholder="automatic, popular, new (comma separated)"
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
              placeholder="Additional notes about this vehicle..."
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
              {vehicle ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
