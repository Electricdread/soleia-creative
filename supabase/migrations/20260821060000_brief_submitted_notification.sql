-- Tell the studio when a client has filled the brief in.
--
-- The brief is how the content gets designed, so its arrival is the moment the
-- work can actually start — and nothing announced it. `submitted_at` has always
-- been recorded; nobody was told.
--
-- `submitted_at` is write-once (COALESCE in save_creative_brief_by_token), so
-- the submit moment is reliable. What it cannot do is stop the notification
-- firing twice: the client's browser calls the notify function, and a refresh
-- or a double-click would call it again. This column is the guard — the
-- function sends only when it is null, and stamps it once something has
-- actually been delivered.

ALTER TABLE public.creative_briefs
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

COMMENT ON COLUMN public.creative_briefs.notified_at IS
  'When the studio was emailed about this submission. Null means not yet told. Set by notify-brief-submitted, and only after a delivery succeeds, so a failed send is retried rather than silently swallowed.';

-- Briefs submitted before this existed should not trigger a burst of
-- notifications about work that is already done.
UPDATE public.creative_briefs
   SET notified_at = submitted_at
 WHERE submitted_at IS NOT NULL
   AND notified_at IS NULL;
