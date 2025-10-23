-- ============================================
-- 1-2 DRIVE DATABASE SETUP
-- ============================================
-- This script creates all necessary tables for the 1-2 Drive app
-- Run this script ONCE to set up your database

-- ============================================
-- SALES TABLE (Individual Sales Entries)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('vehicle', 'condo')),
  notes TEXT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;

-- Create policy to allow all operations (no authentication required)
CREATE POLICY "Allow all operations on sales" ON sales
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SALES HISTORY TABLE (Monthly Aggregated Data)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_sales_history_year_month ON sales_history(year, month);
CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(created_at);

-- Enable Row Level Security
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on sales_history" ON sales_history;

-- Create policy to allow all operations (no authentication required)
CREATE POLICY "Allow all operations on sales_history" ON sales_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ============================================
-- Force PostgREST to reload the schema cache so new tables are immediately available
NOTIFY pgrst, 'reload schema';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- Database setup complete!
-- Schema cache reloaded.
-- You can now use the sales history features in your app.
