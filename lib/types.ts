// Core data types for 1-2 DRIVE

export type VehicleType = "bike" | "car"
export type VehicleStatus = "available" | "rented" | "maintenance"

export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  dailyPrice: number
  weeklyPrice?: number
  monthlyPrice?: number
  deposit: number
  plate: string
  vin?: string
  color?: string
  year?: number
  mileage?: number
  cc?: number // Added CC (engine size) field for bikes
  popularity?: number // Added popularity field for sorting (1-10, higher = more popular)
  taxExpires?: string
  taxOverrideUntil?: string
  status: VehicleStatus
  photos: string[]
  tags: string[]
  notes?: string
  displayOrder?: number // Added display order for manual sorting
}

export type CondoStatus = "available" | "rented" | "maintenance"
export type PriceMode = "night" | "month"

export interface Condo {
  id: string
  building: string
  unitNo: string
  bedrooms: number
  bathrooms: number
  priceMode: PriceMode
  price: number
  deposit: number
  sizeSqm?: number
  floor?: number
  status: CondoStatus
  photos: string[]
  tags: string[]
  notes?: string
  airbnbIcalUrl?: string
  lastSyncedAt?: string
  displayOrder?: number // Added display order for manual sorting
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  whatsapp?: string
  idNumber?: string
  idPhotoUrl?: string
  licensePhotoUrl?: string
  notes?: string
}

export type BookingStatus = "pending" | "confirmed" | "checked_out" | "returned" | "cancelled"
export type AssetType = "vehicle" | "condo"
export type BookingSource = "manual" | "airbnb"
export type BookingChannel = "whatsapp" | "instagram" | "messenger" | "line" | "phone"

export interface Booking {
  id: string
  customerId: string
  customerName: string
  vehicleId?: string
  condoId?: string
  assetType: AssetType
  assetId: string
  assetName: string
  startDate: string
  endDate: string
  price: number
  priceMode: string
  totalPrice: number
  depositPaid: number
  status: string
  deliveryAddress?: string
  pickupAddress?: string
  notes?: string
  source: BookingSource
  bookedThrough?: BookingChannel
  isLongTerm?: boolean // Added long-term booking flag
  vehicleName?: string // Added snapshot fields to preserve vehicle/condo info
  vehiclePlate?: string
  condoName?: string
  deliveryMethod?: "pickup" | "delivery"
  pickupLocationLabel?: string
  pickupLocationUrl?: string
  deliveryHotel?: string
  deliveryEta?: string
}

export type UserRole = "owner" | "manager" | "staff" | "customer"

export interface Profile {
  id: string
  userId: string
  role: UserRole
  displayName: string
  phone?: string
  email: string
  createdAt: string
}

export interface AuthSession {
  userId: string
  email: string
  expiresAt: string
}
