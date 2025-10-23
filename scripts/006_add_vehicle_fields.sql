-- Add cc, popularity, vin, color, year, and mileage columns to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS cc INTEGER,
ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 5 CHECK (popularity >= 1 AND popularity <= 10),
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- Add comments to explain the columns
COMMENT ON COLUMN vehicles.cc IS 'Engine size in cubic centimeters (cc)';
COMMENT ON COLUMN vehicles.popularity IS 'Popularity ranking from 1-10, used for sorting. Higher number = more popular';
COMMENT ON COLUMN vehicles.vin IS 'Vehicle Identification Number';
COMMENT ON COLUMN vehicles.color IS 'Vehicle color';
COMMENT ON COLUMN vehicles.year IS 'Manufacturing year';
COMMENT ON COLUMN vehicles.mileage IS 'Current mileage in kilometers';
