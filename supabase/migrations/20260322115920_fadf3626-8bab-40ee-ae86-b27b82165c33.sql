
CREATE TABLE public.calendar_event_tripleseat_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_uid text NOT NULL,
  tripleseat_url text NOT NULL,
  scraped_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_uid)
);

ALTER TABLE public.calendar_event_tripleseat_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tripleseat cache"
  ON public.calendar_event_tripleseat_cache
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read tripleseat cache"
  ON public.calendar_event_tripleseat_cache
  FOR SELECT
  TO public
  USING (true);
