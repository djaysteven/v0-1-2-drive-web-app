"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from "lucide-react"

export default function ContactPage() {
  return (
    <AppShell header={<h1 className="text-xl font-bold text-foreground">Contact Us</h1>}>
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        <Card className="rounded-2xl border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Get in Touch</CardTitle>
            <p className="text-muted-foreground">We're here to help with your rental needs</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                <a href="tel:+66884866866" className="text-muted-foreground hover:text-primary transition-colors">
                  +66 884 866 866
                </a>
                <p className="text-sm text-muted-foreground mt-1">Office: 038 195 250</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <a
                  href="mailto:djaysteven@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  djaysteven@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
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

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
              <div className="flex items-center gap-6">
                <a
                  href="https://wa.me/66884866866"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">WhatsApp</span>
                </a>

                <a
                  href="https://instagram.com/djaysteven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <Instagram className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">djaysteven</span>
                </a>

                <a
                  href="https://facebook.com/djaysteven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <Facebook className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">djaysteven</span>
                </a>

                <a
                  href="https://line.me/ti/p/djaysteven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                    <svg
                      className="h-6 w-6 text-primary"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .628.285.628.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                  </div>
                  <span className="text-xs text-muted-foreground">djaysteven</span>
                </a>
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
    </AppShell>
  )
}
