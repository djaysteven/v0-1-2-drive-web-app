-- Update bookings table to match new schema requirements

-- Add vehicle_id and condo_id columns if they don't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS condo_id UUID REFERENCES condos(id);

-- Add price and priceMode columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priceMode TEXT DEFAULT 'day';

-- Rename columns to match requirements
ALTER TABLE bookings RENAME COLUMN IF EXISTS total_price TO total_amount;
ALTER TABLE bookings RENAME COLUMN IF EXISTS deposit_paid TO deposit;

-- Update status column to use correct values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'checked_out', 'returned', 'cancelled'));

-- Add source column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

-- Create index for faster overlap queries
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON bookings(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_condo_dates ON bookings(condo_id, start_date, end_date);

-- Add comment
COMMENT ON TABLE bookings IS 'Updated schema to support vehicle/condo bookings with availability checking';
