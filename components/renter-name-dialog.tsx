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

interface RenterNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName?: string
  onSave: (name: string) => Promise<void>
  assetType: "vehicle" | "condo"
}

export function RenterNameDialog({ open, onOpenChange, currentName = "", onSave, assetType }: RenterNameDialogProps) {
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  // Sync name when dialog opens or currentName changes
  useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [open, currentName])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(name)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save renter name:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    setIsSaving(true)
    try {
      await onSave("")
      setName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to clear renter name:", error)
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
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          {currentName && (
            <Button variant="outline" onClick={handleClear} disabled={isSaving} className="rounded-xl bg-transparent">
              Clear
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: "#00FF3C", color: "#000" }}
            className="rounded-xl font-semibold hover:opacity-90"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
