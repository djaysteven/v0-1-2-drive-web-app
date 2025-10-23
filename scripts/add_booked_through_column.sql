-- Add booked_through column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booked_through TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN bookings.booked_through IS 'Channel through which the booking was made (whatsapp, instagram, messenger, line, phone)';

-- Create an index for faster filtering by booking channel
CREATE INDEX IF NOT EXISTS idx_bookings_booked_through ON bookings(booked_through);
