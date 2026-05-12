
INSERT INTO storage.buckets (id, name, public)
VALUES ('creative-guide-template', 'creative-guide-template', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Creative guide template is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'creative-guide-template');

CREATE POLICY "Admins can manage creative guide template"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'creative-guide-template' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'creative-guide-template' AND has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value)
VALUES ('creative_guide_template_url', '')
ON CONFLICT (key) DO NOTHING;
