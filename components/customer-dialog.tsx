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
import { Textarea } from "@/components/ui/textarea"
import { customersApi } from "@/lib/api"
import type { Customer } from "@/lib/types"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSave: () => void
}

export function CustomerDialog({ open, onOpenChange, customer, onSave }: CustomerDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    idNumber: "",
    driverLicense: "",
    notes: "",
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        idNumber: customer.idNumber || "",
        driverLicense: customer.driverLicense || "",
        notes: customer.notes || "",
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        idNumber: "",
        driverLicense: "",
        notes: "",
      })
    }
  }, [customer, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        idNumber: formData.idNumber || undefined,
        driverLicense: formData.driverLicense || undefined,
        notes: formData.notes || undefined,
      }

      if (customer) {
        await customersApi.update(customer.id, customerData)
        toast({
          title: "Customer updated",
          description: "The customer has been updated successfully.",
        })
      } else {
        await customersApi.create(customerData)
        toast({
          title: "Customer created",
          description: "The customer has been added successfully.",
        })
      }

      onSave()
    } catch (error) {
      console.error("[v0] Failed to save customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {customer ? "Update customer information" : "Add a new customer to your database"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66812345678"
                required
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-foreground">
                ID / Passport Number
              </Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="1234567890123"
                className="rounded-xl bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverLicense" className="text-foreground">
                Driver License
              </Label>
              <Input
                id="driverLicense"
                value={formData.driverLicense}
                onChange={(e) => setFormData({ ...formData, driverLicense: e.target.value })}
                placeholder="DL123456"
                className="rounded-xl bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this customer..."
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
              {customer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
