-- 1-2 DRIVE Database Schema
-- Run this script to create all tables for the rental management system

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('owner', 'manager', 'staff', 'customer')),
  display_name text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Profiles policies
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Vehicles table
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('bike', 'car')),
  brand text not null,
  model text not null,
  year integer not null,
  license_plate text not null unique,
  color text not null,
  daily_rate numeric(10,2) not null,
  weekly_rate numeric(10,2),
  monthly_rate numeric(10,2),
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance')),
  mileage integer default 0,
  fuel_type text,
  transmission text,
  seats integer,
  features text[],
  photos text[],
  tax_expires date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vehicles enable row level security;

-- Vehicles policies (staff+ can manage, all can view)
create policy "vehicles_select_all" on public.vehicles for select using (true);
create policy "vehicles_insert_staff" on public.vehicles for insert 
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "vehicles_update_staff" on public.vehicles for update 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "vehicles_delete_owner" on public.vehicles for delete 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- Condos table
create table if not exists public.condos (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  bedrooms integer not null,
  bathrooms numeric(3,1) not null,
  size_sqft integer,
  floor integer,
  daily_rate numeric(10,2) not null,
  weekly_rate numeric(10,2),
  monthly_rate numeric(10,2),
  pricing_mode text not null default 'daily' check (pricing_mode in ('daily', 'weekly', 'monthly')),
  status text not null default 'available' check (status in ('available', 'rented', 'maintenance')),
  amenities text[],
  photos text[],
  tags text[],
  airbnb_ical_url text,
  airbnb_last_synced timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.condos enable row level security;

-- Condos policies
create policy "condos_select_all" on public.condos for select using (true);
create policy "condos_insert_staff" on public.condos for insert 
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "condos_update_staff" on public.condos for update 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "condos_delete_owner" on public.condos for delete 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- Customers table
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text not null,
  address text,
  id_number text,
  license_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;

-- Customers policies
create policy "customers_select_staff" on public.customers for select 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "customers_insert_staff" on public.customers for insert 
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "customers_update_staff" on public.customers for update 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "customers_delete_owner" on public.customers for delete 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- Bookings table
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  asset_type text not null check (asset_type in ('vehicle', 'condo')),
  asset_id uuid not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  total_price numeric(10,2) not null,
  deposit numeric(10,2) default 0,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'refunded')),
  delivery_required boolean default false,
  delivery_address text,
  pickup_required boolean default false,
  pickup_address text,
  source text default 'manual' check (source in ('manual', 'airbnb', 'booking.com', 'website')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bookings enable row level security;

-- Bookings policies
create policy "bookings_select_staff" on public.bookings for select 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "bookings_insert_staff" on public.bookings for insert 
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "bookings_update_staff" on public.bookings for update 
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'manager', 'staff')));
create policy "bookings_delete_owner" on public.bookings for delete 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- Create indexes for better performance
create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_condos_status on condos(status);
create index if not exists idx_bookings_dates on bookings(start_date, end_date);
create index if not exists idx_bookings_customer on bookings(customer_id);
create index if not exists idx_bookings_asset on bookings(asset_type, asset_id);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();
create trigger update_vehicles_updated_at before update on vehicles
  for each row execute function update_updated_at_column();
create trigger update_condos_updated_at before update on condos
  for each row execute function update_updated_at_column();
create trigger update_customers_updated_at before update on customers
  for each row execute function update_updated_at_column();
create trigger update_bookings_updated_at before update on bookings
  for each row execute function update_updated_at_column();
