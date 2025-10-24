"use client"

import type React from "react"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Download, Share2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ContactPage() {
  const [showQRDialog, setShowQRDialog] = useState(false)

  const handleQRClick = () => {
    setShowQRDialog(true)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = "/qr-code.png"
    link.download = "1-2-drive-qr-code.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const response = await fetch("/qr-code.png")
        const blob = await response.blob()
        const file = new File([blob], "1-2-drive-qr-code.png", { type: "image/png" })

        await navigator.share({
          title: "1-2 DRIVE",
          text: "Check out 1-2 DRIVE for vehicle and condo rentals!",
          files: [file],
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleDownload()
    }
  }

  const handlePhoneClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.location.href = "tel:+66884866866"
  }

  return (
    <AppShell header={<h1 className="text-xl font-bold text-foreground">Contact Us</h1>}>
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        <Card className="rounded-2xl border-border bg-card shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Get in Touch</CardTitle>
            <p className="text-muted-foreground">We're here to help with your rental needs</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-4 pb-4 border-b border-border">
              <a
                href="tel:+66884866866"
                onClick={handlePhoneClick}
                className="rounded-full bg-blue-500/10 p-3 hover:bg-blue-500/20 transition-colors"
                title="Call us"
              >
                <Phone className="h-6 w-6 text-blue-500" />
              </a>

              <a
                href="mailto:info@1-2drive.com"
                className="rounded-full bg-red-500/10 p-3 hover:bg-red-500/20 transition-colors"
                title="Email us"
              >
                <Mail className="h-6 w-6 text-red-500" />
              </a>

              <a
                href="https://wa.me/66884866866"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366]/10 p-3 hover:bg-[#25D366]/20 transition-colors"
                title="WhatsApp"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>

              <a
                href="https://line.me/ti/p/djaysteven"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#00B900]/10 p-3 hover:bg-[#00B900]/20 transition-colors"
                title="Line"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#00B900" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .628.285.628.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </a>

              <a
                href="https://www.facebook.com/share/g/19NwmhkC1e/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1877F2]/10 p-3 hover:bg-[#1877F2]/20 transition-colors"
                title="Facebook"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                <a
                  href="tel:+66884866866"
                  onClick={handlePhoneClick}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  +66 884 866 866
                </a>
                <p className="text-sm text-muted-foreground mt-1">Office: 038 195 250</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <a
                  href="mailto:info@1-2drive.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@1-2drive.com
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex flex-col items-center gap-4 text-center">
                <h3 className="font-semibold text-foreground text-lg">Share the Love</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Sharing is caring! Scan or share this QR code with friends and family
                </p>
                <button
                  onClick={handleQRClick}
                  className="relative group cursor-pointer transition-transform hover:scale-105"
                >
                  <img
                    src="/qr-code.png"
                    alt="1-2 DRIVE QR Code"
                    className="w-48 h-48 rounded-xl border-2 border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                      Click to Save or Share
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Location</h3>
                  <p className="text-muted-foreground mb-2">
                    Unixx South Pattaya
                    <br />
                    หมู่ที่ 12 163 Phra Tamnak
                    <br />
                    Bang Lamung District, Chon Buri 20260
                  </p>
                  <a
                    href="https://goo.gl/maps/dn6ecwsCJrcbLpBc8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline transition-colors"
                  >
                    View on Google Maps →
                  </a>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="pt-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.8!2d100.8717!3d12.9167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU1JzAwLjEiTiAxMDDCsDUyJzE4LjEiRQ!5e1!3m2!1sen!2sth!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share 1-2 DRIVE</DialogTitle>
            <DialogDescription>Download or share this QR code to spread the word!</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <img
              src="/qr-code.png"
              alt="1-2 DRIVE QR Code"
              className="w-64 h-64 rounded-xl border-2 border-primary/20"
            />
            <div className="flex gap-3 w-full">
              <Button onClick={handleDownload} className="flex-1 gap-2 bg-transparent" variant="outline">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleShare} className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
