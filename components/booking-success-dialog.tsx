"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingDetails: {
    assetName: string
    customerName: string
    startDate: string
    endDate: string
    total: number
    emailSent?: boolean
  } | null
}

export function BookingSuccessDialog({ open, onOpenChange, bookingDetails }: BookingSuccessDialogProps) {
  const router = useRouter()

  if (!bookingDetails) return null

  const handleClose = () => {
    onOpenChange(false)
    router.push("/")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-center text-base">
              Thank you for your booking.
              {bookingDetails.emailSent && (
                <span className="flex items-center justify-center gap-2 mt-2 text-green-600">
                  <Mail className="h-4 w-4" />
                  Confirmation email sent
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-4 border-t border-b">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicle:</span>
            <span className="font-semibold">{bookingDetails.assetName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-semibold">{bookingDetails.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date:</span>
            <span className="font-semibold">
              {new Date(bookingDetails.startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End Date:</span>
            <span className="font-semibold">
              {new Date(bookingDetails.endDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-lg pt-2 border-t">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-primary">฿{bookingDetails.total.toLocaleString()}</span>
          </div>
        </div>

        <Button className="w-full" style={{ backgroundColor: "#00FF3C", color: "#000" }} onClick={handleClose}>
          Return to Homepage
        </Button>
      </DialogContent>
    </Dialog>
  )
}
