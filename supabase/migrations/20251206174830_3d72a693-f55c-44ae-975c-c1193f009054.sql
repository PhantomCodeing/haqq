-- Create behavior events table for tracking user actions
CREATE TABLE public.behavior_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  url TEXT,
  page_title TEXT,
  element_selector TEXT,
  element_text TEXT,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_behavior_events_created_at ON public.behavior_events(created_at DESC);
CREATE INDEX idx_behavior_events_session_id ON public.behavior_events(session_id);
CREATE INDEX idx_behavior_events_event_type ON public.behavior_events(event_type);

-- Enable Row Level Security
ALTER TABLE public.behavior_events ENABLE ROW LEVEL SECURITY;

-- Public insert policy for Chrome extension (no auth required)
CREATE POLICY "Allow public inserts" 
ON public.behavior_events 
FOR INSERT 
WITH CHECK (true);

-- Public select policy for dashboard (will add auth later if needed)
CREATE POLICY "Allow public reads" 
ON public.behavior_events 
FOR SELECT 
USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.behavior_events;