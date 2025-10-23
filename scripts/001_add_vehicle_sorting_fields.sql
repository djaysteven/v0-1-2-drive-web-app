-- Add CC and popularity fields to vehicles table for sorting

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS cc INTEGER,
ADD COLUMN IF NOT EXISTS popularity INTEGER CHECK (popularity >= 1 AND popularity <= 10);

-- Add index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_vehicles_popularity ON vehicles(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_cc ON vehicles(cc DESC);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
