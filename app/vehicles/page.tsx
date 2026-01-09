"use client"

import type React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VehicleCard } from "@/components/vehicle-card"
import { VehicleDialog } from "@/components/vehicle-dialog"
import { vehiclesApi } from "@/lib/api"
import type { Vehicle } from "@/lib/types"
import { Plus, Search, ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRole } from "@/hooks/use-role"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type VehicleWithBookingStatus = Vehicle & { isCurrentlyBooked: boolean }
type SortOption = "popularity" | "cc" | "price-low" | "price-high"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithBookingStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "bike" | "car">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "rented">("all")
  const [sortBy, setSortBy] = useState<SortOption>("popularity")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const { isAuthenticated } = useRole()
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>()
  const [dateFilteredVehicleIds, setDateFilteredVehicleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const data = await vehiclesApi.getAllWithBookingStatus()
      setVehicles(data)
    } catch (error) {
      console.error("[v0] Failed to load vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkDateAvailability = async () => {
    if (!filterStartDate || !filterEndDate) {
      setDateFilteredVehicleIds(new Set())
      return
    }

    try {
      const startDateStr = format(filterStartDate, "yyyy-MM-dd")
      const endDateStr = format(filterEndDate, "yyyy-MM-dd")
      const availableIds = await vehiclesApi.getAvailableForDateRange(startDateStr, endDateStr)
      setDateFilteredVehicleIds(new Set(availableIds))
    } catch (error) {
      console.error("[v0] Failed to check date availability:", error)
      setDateFilteredVehicleIds(new Set())
    }
  }

  useEffect(() => {
    if (dateFilterEnabled && filterStartDate && filterEndDate) {
      checkDateAvailability()
    } else {
      setDateFilteredVehicleIds(new Set())
    }
  }, [dateFilterEnabled, filterStartDate, filterEndDate])

  const handleCreate = () => {
    setEditingVehicle(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    await loadVehicles()
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await vehiclesApi.delete(id)
      await loadVehicles()
    } catch (error) {
      console.error("[v0] Failed to delete vehicle:", error)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    try {
      const newVehicles = [...vehicles]
      const draggedItem = newVehicles[draggedIndex]
      newVehicles.splice(draggedIndex, 1)
      newVehicles.splice(dragOverIndex, 0, draggedItem)

      await vehiclesApi.reorder(newVehicles.map((v) => v.id))
      await loadVehicles()
    } catch (error) {
      console.error("[v0] Failed to reorder vehicles:", error)
      await loadVehicles() // Reload to reset order on error
    } finally {
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }

  const sortVehicles = (vehiclesToSort: VehicleWithBookingStatus[]) => {
    const sorted = [...vehiclesToSort]

    switch (sortBy) {
      case "popularity":
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      case "cc":
        return sorted.sort((a, b) => (a.cc || 0) - (b.cc || 0))
      case "price-low":
        return sorted.sort((a, b) => a.dailyPrice - b.dailyPrice)
      case "price-high":
        return sorted.sort((a, b) => b.dailyPrice - a.dailyPrice)
      default:
        return sorted
    }
  }

  const filteredVehicles = sortVehicles(
    vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || vehicle.type === typeFilter
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
      const matchesDateFilter =
        !dateFilterEnabled || (dateFilteredVehicleIds.size > 0 && dateFilteredVehicleIds.has(vehicle.id))
      return matchesSearch && matchesType && matchesStatus && matchesDateFilter
    }),
  )

  const availableCount = vehicles.filter((v) => v.status === "available" && !v.isCurrentlyBooked).length
  const rentedCount = vehicles.filter((v) => v.status === "rented" || v.isCurrentlyBooked).length

  const getSortLabel = () => {
    switch (sortBy) {
      case "popularity":
        return "Popularity"
      case "cc":
        return "CC (Low → High)"
      case "price-low":
        return "Price (Low → High)"
      case "price-high":
        return "Price: High to Low"
      default:
        return "Sort By"
    }
  }

  const hasActiveFilters =
    searchQuery !== "" || typeFilter !== "all" || statusFilter !== "all" || sortBy !== "popularity" || dateFilterEnabled

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
          <div>
            <h1 className="text-xl font-bold text-foreground">Vehicles</h1>
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
            <span className="hidden sm:inline">Add Vehicle</span>
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
              placeholder="Search by name or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-card border-border"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="date-filter-toggle"
                checked={dateFilterEnabled}
                onChange={(e) => setDateFilterEnabled(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="date-filter-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                Filter by availability dates
              </label>
            </div>

            {dateFilterEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-secondary border border-border">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-card border-border"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterStartDate ? format(filterStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={filterStartDate}
                        onSelect={setFilterStartDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-card border-border"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterEndDate ? format(filterEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={filterEndDate}
                        onSelect={setFilterEndDate}
                        initialFocus
                        disabled={(date) => !filterStartDate || date < filterStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {filterStartDate && filterEndDate && dateFilteredVehicleIds.size > 0 && (
                  <div className="col-span-full text-sm text-green-600 font-medium">
                    {dateFilteredVehicleIds.size} vehicle(s) available for selected dates
                  </div>
                )}
                {filterStartDate && filterEndDate && dateFilteredVehicleIds.size === 0 && (
                  <div className="col-span-full text-sm text-orange-600 font-medium">
                    No vehicles available for selected dates
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="bike">Bikes</TabsTrigger>
                <TabsTrigger value="car">Cars</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-3 w-full sm:w-auto">
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                className="flex-1 sm:flex-initial"
              >
                <TabsList className="grid w-full grid-cols-3 bg-secondary">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="available">Available</TabsTrigger>
                  <TabsTrigger value="rented">Rented</TabsTrigger>
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl bg-secondary border-border whitespace-nowrap h-10 px-3"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Sort by</span>
                    <span className="sm:hidden">Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={() => setSortBy("popularity")}>Popularity</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-low")}>Price (Low → High)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("cc")}>CC (Low → High)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {hasActiveFilters && isAuthenticated && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 border border-border">
              💡 Drag-and-drop reordering is disabled when filters are active. Clear all filters to reorder vehicles.
            </div>
          )}
        </div>

        {/* Vehicle Grid */}
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
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-secondary p-6 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            {statusFilter === "available" ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">Sorry, we are all rented out!</h3>
                <p className="text-sm text-muted-foreground">
                  All vehicles are currently rented. Please check back later.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">No vehicles found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
                {isAuthenticated && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Vehicle
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                draggable={isAuthenticated && !hasActiveFilters}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggedIndex === index ? "opacity-50" : "opacity-100"} ${
                  isAuthenticated && !hasActiveFilters ? "cursor-move" : ""
                }`}
              >
                <VehicleCard
                  vehicle={vehicle}
                  isCurrentlyBooked={vehicle.isCurrentlyBooked}
                  isAuthenticated={isAuthenticated}
                  onEdit={isAuthenticated ? () => handleEdit(vehicle) : undefined}
                  onDelete={isAuthenticated ? () => handleDelete(vehicle.id) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <VehicleDialog open={dialogOpen} onOpenChange={setDialogOpen} vehicle={editingVehicle} onSave={handleSave} />
    </AppShell>
  )
}
