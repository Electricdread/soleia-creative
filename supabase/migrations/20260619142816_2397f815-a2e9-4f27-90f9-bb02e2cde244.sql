ALTER TABLE public.pre_call_packets
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'pre_call';

ALTER TABLE public.pre_call_packets
  DROP CONSTRAINT IF EXISTS pre_call_packets_kind_check;
ALTER TABLE public.pre_call_packets
  ADD CONSTRAINT pre_call_packets_kind_check CHECK (kind IN ('pre_call','creative_pre_call'));