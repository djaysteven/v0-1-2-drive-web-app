-- Check current bookings table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- If the columns are named differently, this script will fix them
-- Run this ONLY if the above query shows different column names

-- Example: If your columns are startDate/endDate instead of start_date/end_date
-- ALTER TABLE bookings RENAME COLUMN "startDate" TO start_date;
-- ALTER TABLE bookings RENAME COLUMN "endDate" TO end_date;
