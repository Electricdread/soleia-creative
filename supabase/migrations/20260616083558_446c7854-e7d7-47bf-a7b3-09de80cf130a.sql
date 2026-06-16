CREATE TABLE public.pre_call_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_name text,
  event_date date,
  intro text,
  inclusions jsonb NOT NULL DEFAULT '[]'::jsonb,
  scope text,
  notes text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_call_packets TO authenticated;
GRANT SELECT ON public.pre_call_packets TO anon;
GRANT ALL ON public.pre_call_packets TO service_role;

ALTER TABLE public.pre_call_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all packets"
  ON public.pre_call_packets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read deployed packets"
  ON public.pre_call_packets
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER pre_call_packets_set_updated_at
  BEFORE UPDATE ON public.pre_call_packets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX pre_call_packets_token_idx ON public.pre_call_packets(token);
CREATE INDEX pre_call_packets_created_at_idx ON public.pre_call_packets(created_at DESC);