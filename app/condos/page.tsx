"use client"

import type React from "react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CondoCard } from "@/components/condo-card"
import { CondoDialog } from "@/components/condo-dialog"
import { condosApi } from "@/lib/api"
import type { Condo } from "@/lib/types"
import { Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRole } from "@/hooks/use-role"

export default function CondosPage() {
  const [condos, setCondos] = useState<(Condo & { isCurrentlyBooked?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [bedroomFilter, setBedroomFilter] = useState<"all" | "studio" | "1">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "rented">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCondo, setEditingCondo] = useState<Condo | undefined>()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const { isAuthenticated } = useRole()

  useEffect(() => {
    loadCondos()
  }, [])

  const loadCondos = async () => {
    setLoading(true)
    try {
      const data = await condosApi.getAllWithBookingStatus()
      setCondos(data)
    } catch (error) {
      console.error("[v0] Failed to load condos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRenterNameSaved = (condoId: string, renterName: string) => {
    setCondos((prevCondos) =>
      prevCondos.map((c) =>
        c.id === condoId ? { ...c, renterName } : c
      )
    )
  }

  const handleCreate = () => {
    setEditingCondo(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (condo: Condo) => {
    setEditingCondo(condo)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    await loadCondos()
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await condosApi.delete(id)
      await loadCondos()
    } catch (error) {
      console.error("[v0] Failed to delete condo:", error)
    }
  }

  const handleMoveUp = async (id: string) => {
    try {
      await condosApi.moveUp(id)
      await loadCondos()
    } catch (error) {
      console.error("[v0] Failed to move condo up:", error)
    }
  }

  const handleMoveDown = async (id: string) => {
    try {
      await condosApi.moveDown(id)
      await loadCondos()
    } catch (error) {
      console.error("[v0] Failed to move condo down:", error)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCondos = [...condos]
    const draggedItem = newCondos[draggedIndex]
    newCondos.splice(draggedIndex, 1)
    newCondos.splice(index, 0, draggedItem)

    setCondos(newCondos)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return

    try {
      await condosApi.reorder(condos.map((c) => c.id))
      await loadCondos()
    } catch (error) {
      console.error("[v0] Failed to reorder condos:", error)
      await loadCondos()
    } finally {
      setDraggedIndex(null)
    }
  }

  const filteredCondos = condos.filter((condo) => {
    const matchesSearch =
      condo.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      condo.unitNo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBedrooms =
      bedroomFilter === "all" ||
      (bedroomFilter === "studio" ? condo.bedrooms === 0 : condo.bedrooms === Number.parseInt(bedroomFilter))
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && condo.status === "available" && !condo.isCurrentlyBooked) ||
      (statusFilter === "rented" && (condo.status === "rented" || condo.isCurrentlyBooked))
    return matchesSearch && matchesBedrooms && matchesStatus
  })

  const availableCount = condos.filter((c) => c.status === "available" && !c.isCurrentlyBooked).length
  const rentedCount = condos.filter((c) => c.status === "rented" || c.isCurrentlyBooked).length

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
          <div>
            <h1 className="text-xl font-bold text-foreground">Condos</h1>
            <p className="text-sm text-muted-foreground">
              {availableCount} available • {rentedCount} rented
            </p>
          </div>
        </div>
      }
      actions={
        isAuthenticated ? (
          <Button onClick={handleCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Condo</span>
          </Button>
        ) : null
      }
    >
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by building or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-card border-border"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs
              value={bedroomFilter}
              onValueChange={(v) => setBedroomFilter(v as typeof bedroomFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="studio">Studio</TabsTrigger>
                <TabsTrigger value="1">1 Bed</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="rented">Rented</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Condo Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCondos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-secondary p-6 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            {statusFilter === "available" ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">Sorry, we are all rented out!</h3>
                <p className="text-sm text-muted-foreground">
                  All condos are currently rented. Please check back later.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">No condos found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
                {isAuthenticated && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Condo
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCondos.map((condo, index) => (
              <div
                key={condo.id}
                draggable={isAuthenticated}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggedIndex === index ? "opacity-50" : "opacity-100"} ${
                  isAuthenticated ? "cursor-move" : ""
                }`}
              >
                <CondoCard
                  condo={condo}
                  isAuthenticated={isAuthenticated}
                  onEdit={isAuthenticated ? () => handleEdit(condo) : undefined}
                  onDelete={isAuthenticated ? () => handleDelete(condo.id) : undefined}
                  onMoveUp={isAuthenticated ? () => handleMoveUp(condo.id) : undefined}
                  onMoveDown={isAuthenticated ? () => handleMoveDown(condo.id) : undefined}
                  onRenterNameSaved={handleRenterNameSaved}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CondoDialog open={dialogOpen} onOpenChange={setDialogOpen} condo={editingCondo} onSave={handleSave} />
    </AppShell>
  )
}
