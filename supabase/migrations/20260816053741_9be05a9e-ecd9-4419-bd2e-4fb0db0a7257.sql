DROP POLICY IF EXISTS "Anyone can upload to session uploads" ON storage.objects;

CREATE POLICY "Token-scoped client uploads to session uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'session-uploads'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        AND public.is_active_link(((storage.foldername(name))[1])::uuid)
      )
    )
  );