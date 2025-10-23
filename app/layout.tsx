import type React from "react"
import type { Metadata, Viewport } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { SplashScreen } from "@/components/splash-screen"
import { Suspense } from "react"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "1-2 DRIVE | Rental Management",
  description: "Vehicle and condo rental management system",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "1-2 DRIVE",
  },
}

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${poppins.variable} antialiased`}>
        <SplashScreen />
        <Suspense>{children}</Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
