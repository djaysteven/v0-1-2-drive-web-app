-- Drop the table if it exists to recreate it properly
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table for owner and customer reminders
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('owner', 'customer')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_email = auth.email());

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_email = auth.email());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_email = auth.email());

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
