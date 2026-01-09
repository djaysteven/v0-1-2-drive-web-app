"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { enGB } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import type { AssetType } from "@/lib/types"

interface RequestLaterDateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetType: AssetType
  assetId: string
  assetName: string
}

export function RequestLaterDateModal({
  open,
  onOpenChange,
  assetType,
  assetId,
  assetName,
}: RequestLaterDateModalProps) {
  const [customerName, setCustomerName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [sending, setSending] = useState(false)
  const [openStartPicker, setOpenStartPicker] = useState(false)
  const [openEndPicker, setOpenEndPicker] = useState(false)
  const { toast } = useToast()

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date)
      if (!endDate || endDate < date) {
        setEndDate(date)
      }
      setOpenStartPicker(false)
      setTimeout(() => setOpenEndPicker(true), 100)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date)
      setOpenEndPicker(false)
    }
  }

  const handleSubmit = async () => {
    if (!customerName || !email || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const response = await fetch("/api/booking/request-later-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail: email,
          customerPhone: phone,
          assetType,
          assetId,
          assetName,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          notes,
        }),
      })

      const result = await response.json()

      if (result.ok) {
        toast({
          title: "Request Sent!",
          description: "We'll respond to your booking request within 24 hours.",
        })
        // Reset form
        setCustomerName("")
        setEmail("")
        setPhone("")
        setStartDate(undefined)
        setEndDate(undefined)
        setNotes("")
        onOpenChange(false)
      } else {
        throw new Error(result.error || "Failed to send request")
      }
    } catch (error: any) {
      console.error("[v0] Error sending request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send booking request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Later Date</DialogTitle>
          <DialogDescription>
            This {assetType} is currently rented. Submit your preferred dates and we'll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="font-semibold text-center">{assetName}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestName">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="requestName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestEmail">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="requestEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestPhone">Phone</Label>
            <Input
              id="requestPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Requested Dates <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              <Popover open={openStartPicker} onOpenChange={setOpenStartPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal bg-background hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Start:</span>
                      {startDate ? format(startDate, "dd MMM yyyy", { locale: enGB }) : "Select start date"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <div className="px-3 py-2 border-b bg-secondary/50">
                    <p className="text-sm font-semibold text-center">Start Date</p>
                  </div>
                  <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} />
                </PopoverContent>
              </Popover>

              <Popover open={openEndPicker} onOpenChange={setOpenEndPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal bg-background hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">End:</span>
                      {endDate ? format(endDate, "dd MMM yyyy", { locale: enGB }) : "Select end date"}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <div className="px-3 py-2 border-b bg-secondary/50">
                    <p className="text-sm font-semibold text-center">End Date</p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => !startDate || date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestNotes">Additional Notes</Label>
            <Textarea
              id="requestNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or questions..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
