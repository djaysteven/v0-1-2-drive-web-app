-- Add renter_name column to vehicles and condos tables for tracking who is currently renting

-- Add renter_name to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS renter_name text;

COMMENT ON COLUMN vehicles.renter_name IS 'Name of the person currently renting this vehicle (for quick reference by owner)';

-- Add renter_name to condos table
ALTER TABLE condos 
ADD COLUMN IF NOT EXISTS renter_name text;

COMMENT ON COLUMN condos.renter_name IS 'Name of the person currently renting this condo (for quick reference by owner)';
