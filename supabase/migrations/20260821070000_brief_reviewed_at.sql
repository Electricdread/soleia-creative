-- An unread badge needs a notion of read.
--
-- notified_at records that an email went out. That is not the same thing as
-- somebody having looked: the point of a badge is to survive a missed inbox.
-- reviewed_at is stamped when an admin actually opens the brief, so the count
-- clears by reading rather than by receiving.

ALTER TABLE public.creative_briefs
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.creative_briefs.reviewed_at IS
  'When someone at the studio opened this brief. Null on a submitted brief means unread, which is what the navigation badge counts. Distinct from notified_at, which only records that an email was sent.';

-- Anything already submitted predates the badge and should not arrive as unread.
UPDATE public.creative_briefs
   SET reviewed_at = submitted_at
 WHERE submitted_at IS NOT NULL
   AND reviewed_at IS NULL;

-- Clients write briefs through token RPCs and never read this column, but the
-- admin UI stamps it directly, so the existing admin-only policy has to cover
-- the update. Confirm rather than assume: this is a no-op if it already does.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'creative_briefs'
       AND cmd IN ('ALL', 'UPDATE')
  ) THEN
    RAISE EXCEPTION 'creative_briefs has no admin update policy — the badge cannot clear';
  END IF;
END$$;
