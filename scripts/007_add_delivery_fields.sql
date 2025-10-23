-- Add delivery fields to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS delivery_method TEXT
    CHECK (delivery_method IN ('pickup', 'delivery')) DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS pickup_location_label TEXT,
  ADD COLUMN IF NOT EXISTS pickup_location_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_hotel TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_eta TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.delivery_method IS 'Delivery method: pickup (customer picks up) or delivery (free delivery to customer location)';
COMMENT ON COLUMN public.bookings.pickup_location_label IS 'Pickup location name (e.g., Unixx South Pattaya)';
COMMENT ON COLUMN public.bookings.pickup_location_url IS 'Google Maps URL for pickup location';
COMMENT ON COLUMN public.bookings.delivery_hotel IS 'Hotel/Condo name for delivery';
COMMENT ON COLUMN public.bookings.delivery_address IS 'Full address for delivery';
COMMENT ON COLUMN public.bookings.delivery_eta IS 'Estimated time of arrival for delivery';
