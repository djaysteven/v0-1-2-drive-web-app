"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Customer } from "@/lib/types"
import { Edit, Trash2, Phone, Mail, MessageSquare } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CustomerCardProps {
  customer: Customer
  onEdit: () => void
  onDelete: () => void
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`
  }

  const handleWhatsApp = () => {
    const phone = customer.phone.replace(/[^0-9]/g, "")
    window.open(`https://wa.me/${phone}`, "_blank")
  }

  const handleSMS = () => {
    window.location.href = `sms:${customer.phone}`
  }

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg group hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={customer.avatarUrl || "/placeholder.svg"} alt={customer.name} />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-balance truncate">{customer.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{customer.phone}</p>
            {customer.email && <p className="text-xs text-muted-foreground truncate">{customer.email}</p>}
          </div>
        </div>

        {(customer.idNumber || customer.driverLicense) && (
          <div className="space-y-1 text-xs">
            {customer.idNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="text-foreground font-mono">{customer.idNumber}</span>
              </div>
            )}
            {customer.driverLicense && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">License:</span>
                <span className="text-foreground font-mono">{customer.driverLicense}</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="flex-1 gap-2 rounded-xl bg-transparent text-xs"
          >
            <Phone className="h-3 w-3" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="flex-1 gap-2 rounded-xl bg-transparent text-xs"
          >
            <MessageSquare className="h-3 w-3" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSMS}
            className="flex-1 gap-2 rounded-xl bg-transparent text-xs"
          >
            <Mail className="h-3 w-3" />
            SMS
          </Button>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button onClick={onEdit} variant="outline" className="flex-1 gap-2 rounded-xl bg-transparent">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
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
              <AlertDialogTitle className="text-foreground">Delete Customer</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete {customer.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="rounded-xl bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
