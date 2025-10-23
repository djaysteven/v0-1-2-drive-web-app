-- Add display_order column to vehicles table for manual sorting
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_vehicles_display_order ON vehicles(display_order);

-- Set initial display_order values based on created_at
UPDATE vehicles 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM vehicles
  WHERE display_order IS NULL
) AS subquery
WHERE vehicles.id = subquery.id AND vehicles.display_order IS NULL;
