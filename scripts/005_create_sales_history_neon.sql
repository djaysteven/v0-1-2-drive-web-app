-- Create sales_history table in Neon database
CREATE TABLE IF NOT EXISTS sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  vehicles JSONB DEFAULT '[]'::jsonb,
  condos JSONB DEFAULT '[]'::jsonb,
  total_vehicles NUMERIC DEFAULT 0,
  total_condos NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_history_year_month ON sales_history(year, month);
CREATE INDEX IF NOT EXISTS idx_sales_history_created_at ON sales_history(created_at DESC);
