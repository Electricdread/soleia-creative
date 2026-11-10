CREATE TABLE public.pixel_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  key_sha256 text NOT NULL UNIQUE CHECK (key_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);
GRANT ALL ON public.pixel_access TO service_role;
ALTER TABLE public.pixel_access ENABLE ROW LEVEL SECURITY;