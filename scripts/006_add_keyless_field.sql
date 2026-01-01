-- Add keyless field to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS keyless boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN vehicles.keyless IS 'Indicates if the vehicle has a keyless ignition system';
