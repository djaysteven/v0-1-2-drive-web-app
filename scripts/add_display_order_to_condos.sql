-- Add display_order column to condos table for manual sorting

ALTER TABLE condos ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_condos_display_order ON condos(display_order);

-- Set initial display_order values based on created_at
UPDATE condos 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM condos
  WHERE display_order IS NULL
) AS subquery
WHERE condos.id = subquery.id;
