-- Video Mapping previz movie: a public bucket for the active show movie plus a
-- site_settings key pointing at it. Mirrors the creative-guide-template setup.

-- Public bucket holding the active previz movie (500MB limit, like the clips bucket).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('venue-previz', 'venue-previz', true, 524288000)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Venue previz is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-previz');

CREATE POLICY "Admins can manage venue previz"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'venue-previz' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'venue-previz' AND has_role(auth.uid(), 'admin'));

-- Active previz movie URL. Empty default → the app falls back to the bundled
-- static movie until an admin uploads one.
INSERT INTO public.site_settings (key, value)
VALUES ('venue_previz_url', '')
ON CONFLICT (key) DO NOTHING;

-- The /creative-guide/video-mapping page is publicly shareable, so anonymous
-- visitors must be able to read this one key (site_settings is otherwise
-- restricted to admins + a small public whitelist).
CREATE POLICY "Public read of venue previz url"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (key = 'venue_previz_url');
