"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface RenterNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName?: string
  onSave: (name: string) => Promise<void>
  assetType: "vehicle" | "condo"
  assetId: string
}

export function RenterNameDialog({
  open,
  onOpenChange,
  currentName = "",
  onSave,
  assetType,
  assetId,
}: RenterNameDialogProps) {
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Sync name when dialog opens or currentName changes
  useEffect(() => {
    if (open) {
      setName(currentName)
      setError(null)
    }
  }, [open, currentName])

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const endpoint = assetType === "vehicle" ? "/api/vehicles/renter" : "/api/condos/renter"
      const idField = assetType === "vehicle" ? "vehicleId" : "condoId"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [idField]: assetId,
          renterName: name.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to save renter name"
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Call parent callback for state sync
      await onSave(name.trim())

      toast({
        title: "Success",
        description: `Renter name saved to ${name.trim() ? name.trim() : "empty"}`,
      })

      onOpenChange(false)
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to save renter name"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    setError(null)
    setIsSaving(true)

    try {
      const endpoint = assetType === "vehicle" ? "/api/vehicles/renter" : "/api/condos/renter"
      const idField = assetType === "vehicle" ? "vehicleId" : "condoId"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [idField]: assetId,
          renterName: "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to clear renter name"
        setError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      await onSave("")
      setName("")

      toast({
        title: "Success",
        description: "Renter name cleared",
      })

      onOpenChange(false)
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to clear renter name"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Renter Name</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track who is currently renting this {assetType}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="renter-name" className="text-foreground">
              Name
            </Label>
            <Input
              id="renter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter renter's name"
              className="bg-background border-border text-foreground"
              autoFocus
              disabled={isSaving}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
        <DialogFooter className="flex gap-2">
          {currentName && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSaving}
              className="rounded-xl bg-transparent"
            >
              Clear
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: "#00FF3C", color: "#000" }}
            className="rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
