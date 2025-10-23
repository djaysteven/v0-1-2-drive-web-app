-- Create sales_history table to store monthly sales data
CREATE TABLE IF NOT EXISTS sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  vehicles JSONB DEFAULT '[]'::jsonb,
  condos JSONB DEFAULT '[]'::jsonb,
  total_vehicles NUMERIC DEFAULT 0,
  total_condos NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_history_year_month ON sales_history(year, month);

-- Enable Row Level Security
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is owner-only data)
CREATE POLICY "Allow all operations on sales_history" ON sales_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
