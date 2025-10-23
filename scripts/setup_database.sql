-- Complete database setup for 1-2 DRIVE
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/jmeuyzklrfbovnreicjw/sql

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.condos CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('owner', 'manager', 'staff', 'customer')),
  display_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bike', 'car')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  daily_rate numeric NOT NULL,
  weekly_rate numeric,
  monthly_rate numeric,
  plate_number text,
  tax_expiry date,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create condos table
CREATE TABLE public.condos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building text NOT NULL,
  unit_no text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  bedrooms integer NOT NULL,
  bathrooms integer NOT NULL,
  price_mode text NOT NULL CHECK (price_mode IN ('daily', 'monthly')),
  price numeric NOT NULL,
  deposit numeric NOT NULL,
  size_sqm numeric,
  floor integer,
  photos text[],
  tags text[],
  airbnb_ical_url text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  whatsapp text,
  id_number text,
  id_photo_url text,
  license_photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('vehicle', 'condo')),
  asset_id uuid NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  total_price numeric NOT NULL,
  deposit_paid numeric NOT NULL DEFAULT 0,
  delivery_address text,
  pickup_address text,
  notes text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_asset ON public.bookings(asset_type, asset_id);
CREATE INDEX idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_condos_status ON public.condos(status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read condos" ON public.condos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read bookings" ON public.bookings FOR SELECT TO authenticated USING (true);

-- RLS Policies: Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert condos" ON public.condos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update condos" ON public.condos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete condos" ON public.condos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update bookings" ON public.bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete bookings" ON public.bookings FOR DELETE TO authenticated USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.vehicles (name, type, status, daily_rate, weekly_rate, monthly_rate, plate_number, tax_expiry, image_url) VALUES
('Honda PCX 160', 'bike', 'available', 300, 1800, 6000, 'ABC-1234', '2025-06-15', '/honda-pcx-motorcycle-black.jpg'),
('Yamaha Aerox 155', 'bike', 'available', 350, 2100, 7000, 'XYZ-5678', '2025-12-20', '/yamaha-aerox-motorcycle-blue.jpg'),
('Toyota Yaris', 'car', 'rented', 1200, 7000, 25000, 'DEF-9012', '2025-03-10', '/toyota-yaris-white-car.jpg');

INSERT INTO public.condos (building, unit_no, status, bedrooms, bathrooms, price_mode, price, deposit, size_sqm, floor, tags) VALUES
('Sunset Tower', '12A', 'available', 2, 2, 'monthly', 25000, 50000, 65, 12, ARRAY['pool', 'gym', 'parking']),
('Ocean View', '5B', 'available', 1, 1, 'daily', 1500, 5000, 35, 5, ARRAY['sea-view', 'furnished']);
