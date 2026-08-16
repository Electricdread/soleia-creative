DROP POLICY IF EXISTS "Anyone can view session uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read session uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read session uploads" ON storage.objects;

CREATE POLICY "Active-link or admin read of session uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'session-uploads'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (
        (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
        AND public.is_active_link(((storage.foldername(name))[1])::uuid)
      )
    )
  );