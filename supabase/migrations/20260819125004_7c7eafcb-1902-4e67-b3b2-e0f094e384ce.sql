ALTER TABLE public.pre_call_packets
  DROP CONSTRAINT IF EXISTS pre_call_packets_kind_check;

ALTER TABLE public.pre_call_packets
  ADD CONSTRAINT pre_call_packets_kind_check
  CHECK (kind IN ('pre_call', 'post_call', 'custom', 'creative_pre_call'));

COMMENT ON COLUMN public.pre_call_packets.kind IS
  'Packet version: pre_call | post_call | custom. creative_pre_call is legacy, retained so existing client links keep working.';