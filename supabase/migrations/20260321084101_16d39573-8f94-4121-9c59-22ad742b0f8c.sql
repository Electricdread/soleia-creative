
-- Meeting links per event (zoom, google meet, etc.)
CREATE TABLE public.calendar_event_meeting_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uid TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'meeting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_event_meeting_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage meeting links" ON public.calendar_event_meeting_links FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Circleback notes per event
CREATE TABLE public.calendar_event_circleback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uid TEXT NOT NULL,
  circleback_url TEXT,
  circleback_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_event_circleback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage circleback" ON public.calendar_event_circleback FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Associate portal entities (creative_sessions, proposals, client_links) to calendar events
CREATE TABLE public.calendar_event_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uid TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_uid, entity_type, entity_id)
);
ALTER TABLE public.calendar_event_associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage associations" ON public.calendar_event_associations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Client info per event (contact details, loading fees, deadlines)
CREATE TABLE public.calendar_event_client_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uid TEXT NOT NULL UNIQUE,
  client_contact_name TEXT,
  client_contact_email TEXT,
  client_contact_phone TEXT,
  loading_fee_notes TEXT,
  content_deadline TIMESTAMPTZ,
  deadline_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_event_client_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage client info" ON public.calendar_event_client_info FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
