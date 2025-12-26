"use client"

import { Button } from "@/components/ui/button"
import { Share2, LinkIcon, MessageCircle, Mail, Check } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function ShareButton({
  url,
  title,
  description,
  variant = "outline",
  size = "default",
  className = "",
  showText = true,
}: ShareButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const fullUrl = url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        })
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Share failed:", error)
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  const handleWhatsApp = () => {
    const text = description ? `${title}\n${description}\n${fullUrl}` : `${title}\n${fullUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(title)
    const body = description
      ? encodeURIComponent(`${description}\n\nView here: ${fullUrl}`)
      : encodeURIComponent(`View here: ${fullUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  // If Web Share API is available, use native share
  const hasNativeShare = typeof window !== "undefined" && navigator.share

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`rounded-xl gap-2 ${className}`}>
          <Share2 className="h-4 w-4" />
          {showText && size !== "icon" && "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare} className="gap-2 cursor-pointer">
              <Share2 className="h-4 w-4" />
              <span>Share...</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4" />
          <span>WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmail} className="gap-2 cursor-pointer">
          <Mail className="h-4 w-4" />
          <span>Email</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
