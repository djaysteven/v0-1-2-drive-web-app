-- Create notifications table for storing user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('owner', 'customer')),
  type TEXT NOT NULL CHECK (type IN ('tax_expiry', 'booking_start', 'booking_end', 'booking_created', 'booking_cancelled', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('vehicle', 'condo', 'booking')),
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_send_at ON notifications(send_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we don't have user auth yet)
CREATE POLICY "Allow all operations on notifications" ON notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
