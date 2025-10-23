-- Add tax_override_until column to vehicles table for tax snooze feature
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS tax_override_until DATE;

COMMENT ON COLUMN vehicles.tax_override_until IS 'Date until which tax expiry warnings are snoozed';
