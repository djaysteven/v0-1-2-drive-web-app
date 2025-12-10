-- Update bookings table to match new schema requirements

-- Add vehicle_id and condo_id columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='vehicle_id') THEN
    ALTER TABLE bookings ADD COLUMN vehicle_id UUID REFERENCES vehicles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='condo_id') THEN
    ALTER TABLE bookings ADD COLUMN condo_id UUID REFERENCES condos(id);
  END IF;
END $$;

-- Add price and priceMode columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priceMode TEXT DEFAULT 'day';

-- Rename columns to match requirements (check if old column exists first)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_price') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_amount') THEN
    ALTER TABLE bookings RENAME COLUMN total_price TO total_amount;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='deposit_paid') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='deposit') THEN
    ALTER TABLE bookings RENAME COLUMN deposit_paid TO deposit;
  END IF;
END $$;

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
