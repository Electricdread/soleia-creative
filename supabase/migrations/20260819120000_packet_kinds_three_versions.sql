-- Creative packets: allow the three intended versions.
--
-- The packet kind was constrained to ('pre_call','creative_pre_call'). The
-- product now has three: Pre-Call, Post-Call, and an open Custom build.
--
-- Deliberately additive. 'creative_pre_call' stays permitted so existing rows
-- — which have live, client-facing /packet/:token links — keep resolving. The
-- editor offers only the three current kinds for new packets and presents any
-- surviving legacy row as Custom, so nothing breaks and no data is rewritten
-- while a decision on remapping those rows is still open.

ALTER TABLE public.pre_call_packets
  DROP CONSTRAINT IF EXISTS pre_call_packets_kind_check;

ALTER TABLE public.pre_call_packets
  ADD CONSTRAINT pre_call_packets_kind_check
  CHECK (kind IN ('pre_call', 'post_call', 'custom', 'creative_pre_call'));

COMMENT ON COLUMN public.pre_call_packets.kind IS
  'Packet version: pre_call | post_call | custom. creative_pre_call is legacy, retained so existing client links keep working.';
