
-- Store notes for calendar events (linked by iCal UID)
CREATE TABLE public.calendar_event_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_uid TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_event_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event notes" ON public.calendar_event_notes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_calendar_event_notes_updated_at
  BEFORE UPDATE ON public.calendar_event_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store tasks for calendar events
CREATE TABLE public.calendar_event_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event tasks" ON public.calendar_event_tasks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_calendar_event_tasks_updated_at
  BEFORE UPDATE ON public.calendar_event_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store file attachments for calendar events
CREATE TABLE public.calendar_event_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_uid TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_event_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event attachments" ON public.calendar_event_attachments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Store custom status/color overrides for calendar events
CREATE TABLE public.calendar_event_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_uid TEXT NOT NULL UNIQUE,
  status_override TEXT,
  color_label TEXT,
  custom_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_event_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event metadata" ON public.calendar_event_metadata
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_calendar_event_metadata_updated_at
  BEFORE UPDATE ON public.calendar_event_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for calendar attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('calendar-attachments', 'calendar-attachments', false);

CREATE POLICY "Admins can upload calendar attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'calendar-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view calendar attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'calendar-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete calendar attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'calendar-attachments' AND has_role(auth.uid(), 'admin'));
