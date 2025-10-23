-- Add is_long_term column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS is_long_term BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN bookings.is_long_term IS 'Indicates if this booking auto-renews monthly (long-term rental)';
