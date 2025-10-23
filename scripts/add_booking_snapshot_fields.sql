-- Add snapshot fields to bookings table to preserve vehicle/condo info even if deleted
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS vehicle_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS condo_name TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_name ON public.bookings(vehicle_name);

COMMENT ON COLUMN public.bookings.vehicle_name IS 'Snapshot of vehicle name at booking time';
COMMENT ON COLUMN public.bookings.vehicle_plate IS 'Snapshot of vehicle plate at booking time';
COMMENT ON COLUMN public.bookings.condo_name IS 'Snapshot of condo name at booking time';
