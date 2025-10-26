import { createClient } from "./supabase/client"
import type { Vehicle, Condo, Customer, Booking } from "./types"
import { parseICalEvents } from "./airbnb-ical"

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "1",
    name: "Honda PCX 160",
    type: "bike",
    dailyPrice: 300,
    weeklyPrice: 1800,
    monthlyPrice: 6000,
    deposit: 3000,
    plate: "ABC-1234",
    vin: "JH2KC340XLK123456",
    color: "Black",
    year: 2023,
    mileage: 5420,
    status: "available",
    photos: ["/honda-pcx-motorcycle-black.jpg"],
    tags: ["automatic", "fuel-efficient"],
    taxExpires: "2025-06-15",
    displayOrder: 1,
    cc: 160,
    popularity: 5,
  },
  {
    id: "2",
    name: "Yamaha Aerox 155",
    type: "bike",
    dailyPrice: 350,
    weeklyPrice: 2100,
    monthlyPrice: 7000,
    deposit: 3500,
    plate: "XYZ-5678",
    vin: "MH3KE1110LK789012",
    color: "Blue",
    year: 2024,
    mileage: 1200,
    status: "available",
    photos: ["/yamaha-aerox-motorcycle-blue.jpg"],
    tags: ["sporty", "abs"],
    taxExpires: "2025-12-20",
    displayOrder: 2,
    cc: 155,
    popularity: 4,
  },
  {
    id: "3",
    name: "Toyota Yaris",
    type: "car",
    dailyPrice: 1200,
    weeklyPrice: 7000,
    monthlyPrice: 25000,
    deposit: 10000,
    plate: "DEF-9012",
    vin: "VNKKM3B10LA123456",
    color: "White",
    year: 2022,
    mileage: 28500,
    status: "rented",
    photos: ["/toyota-yaris-white-car.jpg"],
    tags: ["automatic", "air-con", "bluetooth"],
    taxExpires: "2025-03-10",
    displayOrder: 3,
    cc: null,
    popularity: 3,
  },
]

const MOCK_CONDOS: Condo[] = [
  {
    id: "1",
    building: "Sunset Tower",
    unitNo: "12A",
    bedrooms: 2,
    bathrooms: 2,
    priceMode: "monthly",
    price: 25000,
    deposit: 50000,
    sizeSqm: 65,
    floor: 12,
    status: "available",
    photos: ["/modern-condo-interior-2-bedroom.jpg"],
    tags: ["pool", "gym", "parking"],
  },
  {
    id: "2",
    building: "Ocean View",
    unitNo: "5B",
    bedrooms: 1,
    bathrooms: 1,
    priceMode: "daily",
    price: 1500,
    deposit: 5000,
    sizeSqm: 35,
    floor: 5,
    status: "available",
    photos: ["/studio-condo-ocean-view.jpg"],
    tags: ["sea-view", "furnished"],
  },
]

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+66812345678",
    whatsapp: "+66812345678",
    idNumber: "1234567890123",
    notes: "Regular customer, always on time",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+66898765432",
    whatsapp: "+66898765432",
    idNumber: "9876543210987",
    notes: "Prefers automatic bikes",
  },
]

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    customerId: "1",
    customerName: "John Smith",
    assetType: "vehicle",
    assetId: "3",
    assetName: "Toyota Yaris",
    startDate: "2025-01-15",
    endDate: "2025-01-22",
    totalPrice: 8400,
    depositPaid: 10000,
    status: "active",
    deliveryAddress: "123 Main St, Bangkok",
    pickupAddress: "456 Airport Rd, Bangkok",
    source: "manual",
  },
]

let isDatabaseAvailable: boolean | null = null

async function checkDatabaseAvailability(): Promise<boolean> {
  if (isDatabaseAvailable !== null) return isDatabaseAvailable

  try {
    const supabase = createClient()
    await supabase.from("vehicles").select("id").limit(1)
    isDatabaseAvailable = true
    return true
  } catch (error) {
    isDatabaseAvailable = false
    return false
  }
}

/**
 * Vehicles API
 */
export async function getVehicles(): Promise<Vehicle[]> {
  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    console.log("[v0] Database not available, using mock vehicles data")
    return MOCK_VEHICLES
  }

  const supabase = createClient()

  let { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  // If display_order column doesn't exist, retry without it
  if (error && error.message.includes("display_order")) {
    console.log("[v0] display_order column not found, falling back to created_at ordering")
    const fallbackQuery = await supabase.from("vehicles").select("*").order("created_at", { ascending: false })

    data = fallbackQuery.data
    error = fallbackQuery.error
  }

  if (error) {
    console.error("[v0] Error fetching vehicles:", error.message)
    return MOCK_VEHICLES
  }
  return data.map(mapVehicleFromDB)
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single()

  if (error) return null
  return mapVehicleFromDB(data)
}

export async function createVehicle(vehicle: Omit<Vehicle, "id">): Promise<Vehicle> {
  console.log("[v0] Creating vehicle with data:", vehicle)

  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    throw new Error(
      "Database is not available. Please set up the database first by running the SQL script in Supabase.",
    )
  }

  const supabase = createClient()

  const insertData = {
    name: vehicle.name,
    type: vehicle.type,
    daily_rate: vehicle.dailyPrice,
    weekly_rate: vehicle.weeklyPrice || null,
    monthly_rate: vehicle.monthlyPrice || null,
    status: vehicle.status,
    plate_number: vehicle.plate || null,
    vin: vehicle.vin || null,
    color: vehicle.color || null,
    year: vehicle.year || null,
    mileage: vehicle.mileage || null,
    tax_expiry: vehicle.taxExpires || null,
    image_url: vehicle.photos?.[0] || null,
    display_order: vehicle.displayOrder || null,
    cc: vehicle.cc || null,
    popularity: vehicle.popularity ?? 5,
  }
  console.log("[v0] Inserting vehicle data:", JSON.stringify(insertData, null, 2))

  const { data, error } = await supabase.from("vehicles").insert(insertData).select().single()

  if (error) {
    console.error("[v0] Supabase error creating vehicle:")
    console.error("[v0] Error code:", error.code)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error details:", error.details)
    console.error("[v0] Error hint:", error.hint)
    console.error("[v0] Full error object:", JSON.stringify(error, null, 2))
    throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ""}`)
  }

  console.log("[v0] Vehicle created successfully:", data)
  return mapVehicleFromDB(data)
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  console.log("[v0] Updating vehicle with data:", updates)
  const supabase = createClient()

  const updateData: any = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.dailyPrice !== undefined) updateData.daily_rate = updates.dailyPrice
  if (updates.weeklyPrice !== undefined) updateData.weekly_rate = updates.weeklyPrice
  if (updates.monthlyPrice !== undefined) updateData.monthly_rate = updates.monthlyPrice
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.plate !== undefined) updateData.plate_number = updates.plate
  if (updates.vin !== undefined) updateData.vin = updates.vin
  if (updates.color !== undefined) updateData.color = updates.color
  if (updates.year !== undefined) updateData.year = updates.year
  if (updates.mileage !== undefined) updateData.mileage = updates.mileage
  if (updates.taxExpires !== undefined) updateData.tax_expiry = updates.taxExpires
  if (updates.photos !== undefined) updateData.image_url = updates.photos?.[0] || null
  if (updates.taxOverrideUntil !== undefined) updateData.tax_override_until = updates.taxOverrideUntil
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder
  if (updates.cc !== undefined) updateData.cc = updates.cc
  if (updates.popularity !== undefined) updateData.popularity = updates.popularity

  const { data, error } = await supabase.from("vehicles").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Error updating vehicle:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Vehicle updated successfully:", data)
  return mapVehicleFromDB(data)
}

export async function moveVehicleUp(vehicleId: string): Promise<void> {
  const vehicles = await getVehicles()
  const currentIndex = vehicles.findIndex((v) => v.id === vehicleId)

  if (currentIndex <= 0) return // Already at top

  const currentVehicle = vehicles[currentIndex]
  const previousVehicle = vehicles[currentIndex - 1]

  // Swap display orders
  const currentOrder = currentVehicle.displayOrder ?? currentIndex + 1
  const previousOrder = previousVehicle.displayOrder ?? currentIndex

  try {
    await updateVehicle(currentVehicle.id, { displayOrder: previousOrder })
    await updateVehicle(previousVehicle.id, { displayOrder: currentOrder })
  } catch (error: any) {
    // If display_order column doesn't exist, silently fail
    if (error.message?.includes("display_order")) {
      console.log("[v0] display_order column not found, skipping vehicle reordering")
      return
    }
    throw error
  }
}

export async function moveVehicleDown(vehicleId: string): Promise<void> {
  const vehicles = await getVehicles()
  const currentIndex = vehicles.findIndex((v) => v.id === vehicleId)

  if (currentIndex >= vehicles.length - 1) return // Already at bottom

  const currentVehicle = vehicles[currentIndex]
  const nextVehicle = vehicles[currentIndex + 1]

  // Swap display orders
  const currentOrder = currentVehicle.displayOrder ?? currentIndex + 1
  const nextOrder = nextVehicle.displayOrder ?? currentIndex + 2

  try {
    await updateVehicle(currentVehicle.id, { displayOrder: nextOrder })
    await updateVehicle(nextVehicle.id, { displayOrder: currentOrder })
  } catch (error: any) {
    // If display_order column doesn't exist, silently fail
    if (error.message?.includes("display_order")) {
      console.log("[v0] display_order column not found, skipping vehicle reordering")
      return
    }
    throw error
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("vehicles").delete().eq("id", id)
  if (error) throw error
}

export async function reorderVehicles(vehicleIds: string[]): Promise<void> {
  const supabase = createClient()

  // Update each vehicle with its new display order
  for (let i = 0; i < vehicleIds.length; i++) {
    const { error } = await supabase
      .from("vehicles")
      .update({ display_order: i + 1 })
      .eq("id", vehicleIds[i])

    if (error && !error.message?.includes("display_order")) {
      console.error("[v0] Error reordering vehicle:", error)
      throw error
    }
  }
}

/**
 * Helper function to check if a vehicle is currently booked
 */
export async function isVehicleCurrentlyBooked(vehicleId: string): Promise<boolean> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0] // Get today's date in YYYY-MM-DD format

  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .in("status", ["active", "confirmed"])
    .lte("start_date", today)
    .gte("end_date", today)
    .limit(1)

  if (error) {
    console.error("[v0] Error checking if vehicle is booked:", error)
    return false
  }

  return data && data.length > 0
}

/**
 * Get all vehicles with their current booking status
 */
export async function getVehiclesWithBookingStatus(): Promise<(Vehicle & { isCurrentlyBooked: boolean })[]> {
  const vehicles = await getVehicles()
  const today = new Date().toISOString().split("T")[0]

  const supabase = createClient()
  const { data: activeBookings, error } = await supabase
    .from("bookings")
    .select("vehicle_id")
    .in("status", ["active", "confirmed"])
    .lte("start_date", today)
    .gte("end_date", today)

  if (error) {
    console.error("[v0] Error fetching active bookings:", error)
    return vehicles.map((v) => ({ ...v, isCurrentlyBooked: false }))
  }

  const bookedVehicleIds = new Set(activeBookings?.map((b) => b.vehicle_id).filter(Boolean) || [])

  return vehicles.map((vehicle) => ({
    ...vehicle,
    isCurrentlyBooked: bookedVehicleIds.has(vehicle.id),
  }))
}

/**
 * Condos API
 */
export async function getCondos(): Promise<Condo[]> {
  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    console.log("[v0] Database not available, using mock condos data")
    return MOCK_CONDOS
  }

  const supabase = createClient()
  let { data, error } = await supabase
    .from("condos")
    .select("*")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  // If display_order column doesn't exist, retry without it
  if (error && error.message.includes("display_order")) {
    console.log("[v0] display_order column not found for condos, falling back to created_at ordering")
    const fallbackQuery = await supabase.from("condos").select("*").order("created_at", { ascending: false })

    data = fallbackQuery.data
    error = fallbackQuery.error
  }

  if (error) {
    console.error("[v0] Error fetching condos:", error.message)
    return MOCK_CONDOS
  }
  return data.map(mapCondoFromDB)
}

export async function getCondo(id: string): Promise<Condo | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("condos").select("*").eq("id", id).single()

  if (error) return null
  return mapCondoFromDB(data)
}

export async function createCondo(condo: Omit<Condo, "id">): Promise<Condo> {
  console.log("[v0] Creating condo with data:", condo)

  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    throw new Error(
      "Database is not available. Please set up the database first by running the SQL script in Supabase.",
    )
  }

  const supabase = createClient()

  const insertData = {
    building: condo.building,
    unit_no: condo.unitNo,
    bedrooms: condo.bedrooms,
    bathrooms: condo.bathrooms,
    price_mode: condo.priceMode,
    price: condo.price,
    deposit: condo.deposit,
    size_sqm: condo.sizeSqm || null,
    floor: condo.floor || null,
    status: condo.status,
    photos: condo.photos || [],
    tags: condo.tags || [],
    notes: condo.notes,
    airbnb_ical_url: condo.airbnbIcalUrl || null,
    last_synced_at: condo.lastSyncedAt || null,
  }
  console.log("[v0] Inserting condo data:", JSON.stringify(insertData, null, 2))

  const { data, error } = await supabase.from("condos").insert(insertData).select().single()

  if (error) {
    console.error("[v0] Supabase error creating condo:")
    console.error("[v0] Error code:", error.code)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error details:", error.details)
    console.error("[v0] Error hint:", error.hint)
    console.error("[v0] Full error object:", JSON.stringify(error, null, 2))
    throw new Error(`Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ""}`)
  }

  console.log("[v0] Condo created successfully:", data)
  return mapCondoFromDB(data)
}

export async function updateCondo(id: string, updates: Partial<Condo>): Promise<Condo> {
  const supabase = createClient()

  const updateData: any = {}
  if (updates.building !== undefined) updateData.building = updates.building
  if (updates.unitNo !== undefined) updateData.unit_no = updates.unitNo
  if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms
  if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms
  if (updates.priceMode !== undefined) updateData.price_mode = updates.priceMode
  if (updates.price !== undefined) updateData.price = updates.price
  if (updates.deposit !== undefined) updateData.deposit = updates.deposit
  if (updates.sizeSqm !== undefined) updateData.size_sqm = updates.sizeSqm
  if (updates.floor !== undefined) updateData.floor = updates.floor
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.photos !== undefined) updateData.photos = updates.photos
  if (updates.tags !== undefined) updateData.tags = updates.tags
  if (updates.airbnbIcalUrl !== undefined) updateData.airbnb_ical_url = updates.airbnbIcalUrl
  if (updates.lastSyncedAt !== undefined) updateData.last_synced_at = updates.lastSyncedAt
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder

  const { data, error } = await supabase.from("condos").update(updateData).eq("id", id).select().single()

  if (error) throw error
  return mapCondoFromDB(data)
}

export async function moveCondoUp(condoId: string): Promise<void> {
  const condos = await getCondos()
  const currentIndex = condos.findIndex((c) => c.id === condoId)

  if (currentIndex <= 0) return // Already at top

  const currentCondo = condos[currentIndex]
  const previousCondo = condos[currentIndex - 1]

  // Swap display orders
  const currentOrder = currentCondo.displayOrder ?? currentIndex + 1
  const previousOrder = previousCondo.displayOrder ?? currentIndex

  try {
    await updateCondo(currentCondo.id, { displayOrder: previousOrder })
    await updateCondo(previousCondo.id, { displayOrder: currentOrder })
  } catch (error: any) {
    // If display_order column doesn't exist, silently fail
    if (error.message?.includes("display_order")) {
      console.log("[v0] display_order column not found, skipping condo reordering")
      return
    }
    throw error
  }
}

export async function moveCondoDown(condoId: string): Promise<void> {
  const condos = await getCondos()
  const currentIndex = condos.findIndex((c) => c.id === condoId)

  if (currentIndex >= condos.length - 1) return // Already at bottom

  const currentCondo = condos[currentIndex]
  const nextCondo = condos[currentIndex + 1]

  // Swap display orders
  const currentOrder = currentCondo.displayOrder ?? currentIndex + 1
  const nextOrder = nextCondo.displayOrder ?? currentIndex + 2

  try {
    await updateCondo(currentCondo.id, { displayOrder: nextOrder })
    await updateCondo(nextCondo.id, { displayOrder: currentOrder })
  } catch (error: any) {
    // If display_order column doesn't exist, silently fail
    if (error.message?.includes("display_order")) {
      console.log("[v0] display_order column not found, skipping condo reordering")
      return
    }
    throw error
  }
}

export async function deleteCondo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("condos").delete().eq("id", id)
  if (error) throw error
}

export async function reorderCondos(condoIds: string[]): Promise<void> {
  const supabase = createClient()

  // Update each condo with its new display order
  for (let i = 0; i < condoIds.length; i++) {
    const { error } = await supabase
      .from("condos")
      .update({ display_order: i + 1 })
      .eq("id", condoIds[i])

    if (error && !error.message?.includes("display_order")) {
      console.error("[v0] Error reordering condo:", error)
      throw error
    }
  }
}

export const condosApi = {
  getAll: getCondos,
  getById: getCondo,
  create: createCondo,
  update: updateCondo,
  delete: deleteCondo,
  moveUp: moveCondoUp,
  moveDown: moveCondoDown,
  async syncAirbnbCalendar(condoId: string) {
    console.log("[v0] ========== AIRBNB SYNC START ==========")
    console.log("[v0] Condo ID:", condoId)

    try {
      // Step 1: Get condo
      const condo = await getCondo(condoId)
      if (!condo?.id) {
        throw new Error("Condo not found")
      }
      if (!condo.airbnbIcalUrl) {
        throw new Error("No Airbnb iCal URL configured")
      }
      console.log("[v0] Condo found:", condo.building, condo.unitNo)
      console.log("[v0] iCal URL:", condo.airbnbIcalUrl)

      // Step 2: Fetch iCal via proxy
      const proxyUrl = `/api/ical?url=${encodeURIComponent(condo.airbnbIcalUrl)}`
      console.log("[v0] Fetching via proxy...")
      const response = await fetch(proxyUrl, { cache: "no-store" })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Proxy error:", response.status, errorText)
        throw new Error(`Proxy failed: ${response.status} - ${errorText}`)
      }

      const icsText = await response.text()
      console.log("[v0] iCal fetched, length:", icsText.length)

      // Step 3: Parse events
      const events = parseICalEvents(icsText)
      console.log("[v0] Events parsed:", events.length)

      if (events.length === 0) {
        throw new Error("No events found in calendar")
      }

      // Step 4: Convert dates and build rows
      const toISO = (dateStr: string): string | null => {
        if (!dateStr) return null

        try {
          // Handle YYYYMMDD format (8 digits)
          if (/^\d{8}$/.test(dateStr)) {
            const y = dateStr.slice(0, 4)
            const m = dateStr.slice(4, 6)
            const d = dateStr.slice(6, 8)
            return `${y}-${m}-${d}T00:00:00Z`
          }

          // Handle YYYYMMDDTHHMMSSZ format (15-16 chars)
          if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
            const clean = dateStr.replace("Z", "")
            const y = clean.slice(0, 4)
            const m = clean.slice(4, 6)
            const d = clean.slice(6, 8)
            const h = clean.slice(9, 11)
            const min = clean.slice(11, 13)
            const s = clean.slice(13, 15)
            return `${y}-${m}-${d}T${h}:${min}:${s}Z`
          }

          // Try parsing as-is
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return null
          return date.toISOString()
        } catch (e) {
          console.error("[v0] Date conversion error:", dateStr, e)
          return null
        }
      }

      const rows = events
        .map((ev) => {
          const start_date = toISO(ev.start)
          const end_date = toISO(ev.end)

          if (!start_date || !end_date) {
            console.log("[v0] Skipping event with invalid dates:", ev)
            return null
          }

          return {
            condo_id: condo.id,
            start_date,
            end_date,
            booked_through: "Airbnb",
            source: "Airbnb",
            status: "confirmed",
            notes: ev.summary || "Airbnb reservation",
            external_uid: ev.uid || null,
          }
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)

      console.log("[v0] Valid rows to insert:", rows.length)

      if (rows.length === 0) {
        throw new Error("No valid events to sync")
      }

      // Step 5: Insert into database
      const supabaseClient = createClient()
      console.log("[v0] Inserting bookings...")
      const { data: insertedData, error: insertError } = await supabaseClient.from("bookings").insert(rows).select("id")

      if (insertError) {
        console.error("[v0] Database error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })
        throw new Error(insertError.message || "Database insert failed")
      }

      const insertedCount = insertedData?.length || 0
      console.log("[v0] Successfully inserted:", insertedCount, "bookings")

      // Step 6: Update last synced timestamp
      await supabaseClient.from("condos").update({ last_synced_at: new Date().toISOString() }).eq("id", condo.id)

      console.log("[v0] ========== AIRBNB SYNC COMPLETE ==========")
      return {
        bookingsCreated: insertedCount,
        total: events.length,
      }
    } catch (error: any) {
      console.error("[v0] ========== AIRBNB SYNC FAILED ==========")
      console.error("[v0] Error:", error?.message || "Unknown error")
      console.error("[v0] Stack:", error?.stack)
      throw error
    }
  },
  reorder: reorderCondos,
}

/**
 * Customers API
 */
export async function getCustomers(): Promise<Customer[]> {
  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    console.log("[v0] Database not available, using mock customers data")
    return MOCK_CUSTOMERS
  }

  const supabase = createClient()
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching customers:", error.message)
    return MOCK_CUSTOMERS
  }
  return data.map(mapCustomerFromDB)
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

  if (error) return null
  return mapCustomerFromDB(data)
}

export async function createCustomer(customer: Omit<Customer, "id">): Promise<Customer> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      id_number: customer.idNumber,
      id_photo_url: customer.idPhotoUrl,
      license_photo_url: customer.licensePhotoUrl,
      notes: customer.notes,
    })
    .select()
    .single()

  if (error) throw error
  return mapCustomerFromDB(data)
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      whatsapp: updates.whatsapp,
      id_number: updates.idNumber,
      id_photo_url: updates.idPhotoUrl,
      license_photo_url: updates.licensePhotoUrl,
      notes: updates.notes,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return mapCustomerFromDB(data)
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("customers").delete().eq("id", id)
  if (error) throw error
}

/**
 * Bookings API
 */
export async function getBookings(): Promise<Booking[]> {
  const dbAvailable = await checkDatabaseAvailability()
  if (!dbAvailable) {
    console.log("[v0] Database not available, using mock bookings data")
    return MOCK_BOOKINGS
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      condo:condos(*)
    `,
    )
    .order("start_date", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching bookings:", error.message)
    return MOCK_BOOKINGS
  }
  return data.map(mapBookingFromDB)
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      condo:condos(*)
    `,
    )
    .eq("id", id)
    .single()

  if (error) return null
  return mapBookingFromDB(data)
}

export async function createBooking(booking: Omit<Booking, "id">): Promise<Booking> {
  const supabase = createClient()

  let vehicleName: string | undefined
  let vehiclePlate: string | undefined
  let condoName: string | undefined

  if (booking.vehicleId) {
    const vehicle = await getVehicle(booking.vehicleId)
    if (vehicle) {
      vehicleName = vehicle.name
      vehiclePlate = vehicle.plate
    }
  } else if (booking.condoId) {
    const condo = await getCondo(booking.condoId)
    if (condo) {
      condoName = `${condo.building} ${condo.unitNo}`
    }
  }

  const insertData = {
    customer_id: booking.customerId,
    vehicle_id: booking.vehicleId || null,
    condo_id: booking.condoId || null,
    start_date: booking.startDate,
    end_date: booking.endDate,
    price: booking.price,
    priceMode: booking.priceMode,
    total_amount: booking.totalPrice,
    deposit: booking.depositPaid,
    status: booking.status,
    delivery_address: booking.deliveryAddress,
    pickup_address: booking.pickupAddress,
    notes: booking.notes,
    source: booking.source || "web",
    booked_through: booking.bookedThrough || null,
    is_long_term: booking.isLongTerm || false,
    vehicle_name: vehicleName || null,
    vehicle_plate: vehiclePlate || null,
    condo_name: condoName || null,
    delivery_method: booking.deliveryMethod || "pickup",
    pickup_location_label: booking.pickupLocationLabel || null,
    pickup_location_url: booking.pickupLocationUrl || null,
    delivery_hotel: booking.deliveryHotel || null,
    delivery_eta: booking.deliveryEta || null,
  }

  console.log("[v0] Creating booking with data:", insertData)

  const { data, error } = await supabase.from("bookings").insert(insertData).select().single()

  if (error) {
    console.error("[v0] Error creating booking:", error)
    throw new Error(`Failed to create booking: ${error.message}`)
  }

  console.log("[v0] Booking created successfully:", data)
  return mapBookingFromDB(data)
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const supabase = createClient()

  let vehicleName: string | undefined
  let vehiclePlate: string | undefined

  if (updates.vehicleId) {
    const vehicle = await getVehicle(updates.vehicleId)
    if (vehicle) {
      vehicleName = vehicle.name
      vehiclePlate = vehicle.plate
    }
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({
      customer_id: updates.customerId,
      vehicle_id: updates.vehicleId,
      condo_id: updates.condoId,
      start_date: updates.startDate,
      end_date: updates.endDate,
      price: updates.price,
      priceMode: updates.priceMode,
      total_amount: updates.totalPrice,
      deposit: updates.depositPaid,
      status: updates.status,
      delivery_address: updates.deliveryAddress,
      pickup_address: updates.pickupAddress,
      notes: updates.notes,
      source: updates.source,
      booked_through: updates.bookedThrough,
      is_long_term: updates.isLongTerm,
      vehicle_name: vehicleName || updates.vehicleName,
      vehicle_plate: vehiclePlate || updates.vehiclePlate,
      delivery_method: updates.deliveryMethod,
      pickup_location_label: updates.pickupLocationLabel,
      pickup_location_url: updates.pickupLocationUrl,
      delivery_hotel: updates.deliveryHotel,
      delivery_eta: updates.deliveryEta,
    })
    .eq("id", id)
    .select(
      `
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      condo:condos(*)
    `,
    )
    .single()

  if (error) throw error
  return mapBookingFromDB(data)
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("bookings").delete().eq("id", id)
  if (error) throw error
}

export async function checkConflicts(assetId: string, startDate: string, endDate: string): Promise<Booking[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("asset_id", assetId)
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (error) throw error
  return data.map(mapBookingFromDB)
}

/**
 * Helper functions to map database rows to app types
 */
function mapVehicleFromDB(data: any): Vehicle {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    dailyPrice: data.daily_rate,
    weeklyPrice: data.weekly_rate || 0,
    monthlyPrice: data.monthly_rate || 0,
    deposit: 0,
    plate: data.plate_number || "",
    vin: data.vin || "",
    color: data.color || "",
    year: data.year ?? undefined,
    mileage: data.mileage ?? undefined,
    status: data.status,
    photos: data.image_url ? [data.image_url] : [],
    tags: [],
    taxExpires: data.tax_expiry,
    taxOverrideUntil: data.tax_override_until,
    displayOrder: data.display_order ?? undefined,
    cc: data.cc ?? undefined,
    popularity: data.popularity ?? undefined,
    notes: "",
  }
}

function mapCondoFromDB(data: any): Condo {
  return {
    id: data.id,
    building: data.building,
    unitNo: data.unit_no,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    priceMode: data.price_mode,
    price: data.price,
    deposit: data.deposit,
    sizeSqm: data.size_sqm,
    floor: data.floor,
    status: data.status,
    photos: data.photos || [],
    tags: data.tags || [],
    notes: data.notes,
    airbnbIcalUrl: data.airbnb_ical_url,
    lastSyncedAt: data.last_synced_at,
    displayOrder: data.display_order ?? undefined,
  }
}

function mapCustomerFromDB(data: any): Customer {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    idNumber: data.id_number,
    idPhotoUrl: data.id_photo_url,
    licensePhotoUrl: data.license_photo_url,
    notes: data.notes,
  }
}

function mapBookingFromDB(data: any): Booking {
  const assetName =
    data.vehicle?.name ||
    data.condo?.building + " " + data.condo?.unit_no ||
    data.vehicle_name ||
    data.condo_name ||
    "Unknown Asset"

  return {
    id: data.id,
    customerId: data.customer_id,
    customerName: data.customer?.name || "",
    vehicleId: data.vehicle_id,
    condoId: data.condo_id,
    assetType: data.vehicle_id ? "vehicle" : "condo",
    assetId: data.vehicle_id || data.condo_id,
    assetName: assetName,
    startDate: data.start_date,
    endDate: data.end_date,
    price: data.price || 0,
    priceMode: data.priceMode || "day",
    totalPrice: data.total_amount || 0,
    depositPaid: data.deposit || 0,
    status: data.status,
    deliveryAddress: data.delivery_address,
    pickupAddress: data.pickup_address,
    notes: data.notes,
    source: data.source || "web",
    bookedThrough: data.booked_through,
    isLongTerm: data.is_long_term || false,
    vehicleName: data.vehicle_name,
    vehiclePlate: data.vehicle_plate,
    condoName: data.condo_name,
    deliveryMethod: data.delivery_method || "pickup",
    pickupLocationLabel: data.pickup_location_label,
    pickupLocationUrl: data.pickup_location_url,
    deliveryHotel: data.delivery_hotel,
    deliveryEta: data.delivery_eta,
  }
}

/**
 * Reminders API
 */
export async function getReminders() {
  const vehicles = await getVehicles()
  const condos = await getCondos() // Added condos fetch
  const bookings = await getBookings()

  const now = new Date()
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

  const taxReminders = vehicles
    .filter((v) => {
      if (!v.taxExpires) return false
      if (v.taxOverrideUntil && new Date(v.taxOverrideUntil) > now) return false
      return new Date(v.taxExpires) <= sixtyDaysFromNow
    })
    .map((v) => ({
      type: "tax" as const,
      vehicleId: v.id,
      vehicleName: v.name,
      vehiclePlate: v.plate,
      vehiclePhoto: v.photos?.[0],
      expiryDate: v.taxExpires!,
      daysUntil: Math.ceil((new Date(v.taxExpires!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    }))

  const bookingStartReminders = bookings
    .filter(
      (b) => b.status === "confirmed" && new Date(b.startDate) <= sevenDaysFromNow && new Date(b.startDate) >= now,
    )
    .map((b) => {
      const vehicle = b.vehicleId ? vehicles.find((v) => v.id === b.vehicleId) : null
      const condo = b.condoId ? condos.find((c) => c.id === b.condoId) : null
      const assetPhoto = vehicle?.photos?.[0] || condo?.photos?.[0]

      return {
        type: "booking_start" as const,
        bookingId: b.id,
        customerName: b.customerName,
        assetName: b.assetName,
        assetPhoto,
        assetPlate: vehicle?.plate,
        startDate: b.startDate,
        daysUntil: Math.ceil((new Date(b.startDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        bookedThrough: b.bookedThrough, // Added bookedThrough field
        source: b.source, // Added source field
      }
    })

  const returnReminders = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.endDate) <= sevenDaysFromNow && new Date(b.endDate) > now)
    .map((b) => {
      const vehicle = b.vehicleId ? vehicles.find((v) => v.id === b.vehicleId) : null
      const condo = b.condoId ? condos.find((c) => c.id === b.condoId) : null
      const assetPhoto = vehicle?.photos?.[0] || condo?.photos?.[0]

      return {
        type: "return" as const,
        bookingId: b.id,
        customerName: b.customerName,
        assetName: b.assetName,
        assetPhoto,
        assetPlate: vehicle?.plate,
        returnDate: b.endDate,
        daysUntil: Math.ceil((new Date(b.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        isUrgent: new Date(b.endDate) <= oneDayFromNow,
        bookedThrough: b.bookedThrough, // Added bookedThrough field
        source: b.source, // Added source field
      }
    })

  return { taxReminders, bookingStartReminders, returnReminders }
}

export const vehiclesApi = {
  getAll: getVehicles,
  getAllWithBookingStatus: getVehiclesWithBookingStatus, // Added function to get vehicles with booking status
  getById: getVehicle,
  create: createVehicle,
  update: updateVehicle,
  delete: deleteVehicle,
  moveUp: moveVehicleUp,
  moveDown: moveVehicleDown,
  reorder: reorderVehicles, // Added reorder function
  isCurrentlyBooked: isVehicleCurrentlyBooked, // Added function to check if vehicle is currently booked
}

export const customersApi = {
  getAll: getCustomers,
  getById: getCustomer,
  create: createCustomer,
  update: updateCustomer,
  delete: deleteCustomer,
}

export const bookingsApi = {
  getAll: getBookings,
  getById: getBooking,
  create: createBooking,
  update: updateBooking,
  delete: deleteBooking,
  checkConflicts, // Added check conflicts function
}

// Helper function to check if booking exists
async function checkBookingExists(
  assetId: string,
  startDate: string,
  endDate: string,
  source: string,
): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("asset_id", assetId)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .eq("source", source)
    .single()

  return !error && !!data
}

/**
 * Helper function to check for overlapping bookings
 */
export async function hasOverlap(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string, // Added optional parameter to exclude current booking when editing
): Promise<{ hasConflict: boolean; conflicts: Booking[] }> {
  console.log("[v0] ===== OVERLAP CHECK IN API =====")
  console.log("[v0] Parameters:", {
    vehicleId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    excludeBookingId,
  })

  const supabase = createClient()

  let query = supabase
    .from("bookings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .in("status", ["pending", "confirmed", "checked_out", "returned"])
    .not("end_date", "lt", startDate.toISOString())
    .not("start_date", "gt", endDate.toISOString())

  if (excludeBookingId) {
    console.log("[v0] Excluding booking ID from check:", excludeBookingId)
    query = query.neq("id", excludeBookingId)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error checking overlap:", error)
    return { hasConflict: false, conflicts: [] }
  }

  console.log("[v0] Found bookings:", data.length)
  if (data.length > 0) {
    console.log(
      "[v0] Conflicting bookings:",
      data.map((b) => ({
        id: b.id,
        customer: b.customer_id,
        startDate: b.start_date,
        endDate: b.end_date,
        status: b.status,
      })),
    )
  }

  const conflicts = data.map(mapBookingFromDB)
  console.log("[v0] ===== OVERLAP CHECK COMPLETE =====")

  return {
    hasConflict: data.length > 0,
    conflicts,
  }
}

// Helper function to upsert customer (find or create)
export async function upsertCustomer(customerData: {
  name: string
  phone?: string
  email?: string
}): Promise<string> {
  const supabase = createClient()

  // Try to find existing customer by name, email, and phone
  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", customerData.name)
    .eq("email", customerData.email?.toLowerCase() || "")
    .eq("phone", customerData.phone || "")
    .single()

  if (existing && !findError) {
    return existing.id
  }

  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
    })
    .select("id")
    .single()

  if (createError) {
    console.error("[v0] Error creating customer:", createError)
    throw new Error(`Failed to create customer: ${createError.message}`)
  }

  return newCustomer.id
}
