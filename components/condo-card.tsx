"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Condo } from "@/lib/types"
import { Edit, Trash2, Bed, Bath, Maximize, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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

interface CondoCardProps {
  condo: Condo & { isCurrentlyBooked?: boolean }
  isAuthenticated?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function CondoCard({ condo, isAuthenticated = false, onEdit, onDelete }: CondoCardProps) {
  const statusColors = {
    available: "bg-green-500/70 text-white border-green-500",
    rented: "bg-blue-500/70 text-white border-blue-500",
    maintenance: "bg-destructive/20 text-destructive border-destructive/30",
  }

  const displayStatus = condo.isCurrentlyBooked ? "rented" : condo.status
  const displayStatusText = condo.isCurrentlyBooked ? "rented" : condo.status

  return (
    <Card className="rounded-2xl border-border bg-card shadow-lg overflow-hidden group hover:border-primary/50 transition-colors">
      <div className="relative aspect-video overflow-hidden bg-secondary">
        <Image
          src={condo.photos[0] || "/placeholder.svg?height=300&width=400"}
          alt={`${condo.building} ${condo.unitNo}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
        />
        <div className="absolute top-3 right-3">
          <Badge className={`${statusColors[displayStatus]} font-semibold shadow-lg`}>{displayStatusText}</Badge>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="gap-1 bg-secondary/90 font-semibold shadow-lg">
            Floor {condo.floor || "?"}
          </Badge>
          {isAuthenticated && condo.airbnbIcalUrl && (
            <Badge variant="outline" className="bg-[#FF5A5F]/80 text-white border-[#FF5A5F]/90 font-semibold shadow-lg">
              Airbnb
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground text-balance">{condo.building}</h3>
          <p className="text-sm text-muted-foreground">Unit {condo.unitNo}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>
              {condo.bedrooms === 0 ? "Studio" : condo.bedrooms === 1 ? "1 Bedroom" : `${condo.bedrooms} Bedrooms`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{condo.bathrooms}</span>
          </div>
          {condo.sizeSqm && (
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{condo.sizeSqm}m²</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">฿{condo.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">/{condo.priceMode}</span>
        </div>

        {condo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {condo.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {isAuthenticated ? (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Link href={`/condos/${condo.id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          {onEdit && (
            <Button onClick={onEdit} variant="outline" size="icon" className="rounded-xl bg-transparent">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
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
                  <AlertDialogTitle className="text-foreground">Delete Condo</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Are you sure you want to delete {condo.building} Unit {condo.unitNo}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="rounded-xl bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      ) : (
        <CardFooter className="p-4 pt-0">
          <Button className="w-full rounded-xl">Book Now</Button>
        </CardFooter>
      )}
    </Card>
  )
}
