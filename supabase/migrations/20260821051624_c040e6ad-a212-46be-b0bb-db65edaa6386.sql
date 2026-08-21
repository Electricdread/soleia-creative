ALTER TABLE public.creative_briefs
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

COMMENT ON COLUMN public.creative_briefs.notified_at IS
  'When the studio was emailed about this submission. Null means not yet told. Set by notify-brief-submitted, and only after a delivery succeeds, so a failed send is retried rather than silently swallowed.';

UPDATE public.creative_briefs
   SET notified_at = submitted_at
 WHERE submitted_at IS NOT NULL
   AND notified_at IS NULL;