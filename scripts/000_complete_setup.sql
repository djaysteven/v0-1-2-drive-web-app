-- Complete database setup for 1-2 DRIVE
-- Run this script in your Supabase SQL Editor

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
  name text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  bedrooms integer NOT NULL,
  daily_rate numeric NOT NULL,
  location text,
  tags text[],
  airbnb_ical_url text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  passport_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  condo_id uuid REFERENCES public.condos(id) ON DELETE SET NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  total_price numeric NOT NULL,
  notes text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT booking_has_resource CHECK (
    (vehicle_id IS NOT NULL AND condo_id IS NULL) OR
    (vehicle_id IS NULL AND condo_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_vehicle ON public.bookings(vehicle_id);
CREATE INDEX idx_bookings_condo ON public.bookings(condo_id);
CREATE INDEX idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_condos_status ON public.condos(status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for vehicles (staff and above can manage)
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Staff can manage vehicles" ON public.vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

-- RLS Policies for condos (staff and above can manage)
CREATE POLICY "Anyone can view condos" ON public.condos FOR SELECT USING (true);
CREATE POLICY "Staff can manage condos" ON public.condos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

-- RLS Policies for customers (staff and above can manage)
CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

-- RLS Policies for bookings
CREATE POLICY "Staff can view all bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p JOIN public.customers c ON p.email = c.email WHERE p.id = auth.uid() AND c.id = customer_id)
);
CREATE POLICY "Staff can manage bookings" ON public.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.condos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, display_name)
  VALUES (NEW.id, NEW.email, 'customer', COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing
INSERT INTO public.vehicles (name, type, status, daily_rate, weekly_rate, monthly_rate, plate_number, image_url) VALUES
('Honda PCX 160', 'bike', 'available', 300, 1800, 6000, 'BKK-1234', '/honda-pcx-motorcycle-black.jpg'),
('Yamaha Aerox', 'bike', 'available', 350, 2000, 7000, 'BKK-5678', '/yamaha-aerox-motorcycle-blue.jpg'),
('Toyota Yaris', 'car', 'available', 1200, 7000, 25000, 'BKK-9012', '/toyota-yaris-white-car.jpg');

INSERT INTO public.condos (name, status, bedrooms, daily_rate, location, tags, image_url) VALUES
('Beachfront Studio', 'available', 1, 2500, 'Patong Beach', ARRAY['pool', 'gym', 'beach'], '/studio-condo-ocean-view.jpg'),
('Modern 2BR Condo', 'available', 2, 4000, 'Kata Beach', ARRAY['pool', 'gym', 'parking'], '/modern-condo-interior-2-bedroom.jpg');

INSERT INTO public.customers (name, email, phone, passport_number) VALUES
('John Smith', 'john@example.com', '+66-123-4567', 'US123456'),
('Sarah Johnson', 'sarah@example.com', '+66-234-5678', 'UK789012');
