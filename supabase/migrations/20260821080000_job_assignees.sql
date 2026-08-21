-- Who is on a job, and how many of them.
--
-- proposals.assigned_pm_* holds one person, on one record. A job is a packet, a
-- proposal and a session, so assigning the same colleague meant doing it up to
-- three times and living with the drift when one of them changed. Creative
-- sessions had no field at all, which is why a brief could be submitted with
-- nobody but the studio inbox to tell.
--
-- Assignment belongs on the job for the same reason the Drive folder does:
-- it is the thing all three records share.

CREATE TABLE IF NOT EXISTS public.job_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- The profile, plus a snapshot of how to reach them. Denormalised on purpose:
  -- a notification must still know where to send if a profile is later renamed
  -- or removed, and the edge function should not have to join to find out.
  user_id uuid NOT NULL,
  email text NOT NULL,
  display_name text,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,

  CONSTRAINT job_assignees_unique UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS job_assignees_job_idx ON public.job_assignees (job_id);

ALTER TABLE public.job_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage job assignees" ON public.job_assignees;
CREATE POLICY "Admins manage job assignees" ON public.job_assignees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Carry across the PMs already named on proposals, so nobody has to re-enter
-- what the app already knows. ON CONFLICT because two proposals on one job can
-- name the same person.
INSERT INTO public.job_assignees (job_id, user_id, email, display_name)
SELECT DISTINCT ON (p.job_id, p.assigned_pm_id)
       p.job_id,
       p.assigned_pm_id,
       p.assigned_pm_email,
       p.assigned_pm_name
  FROM public.proposals p
 WHERE p.job_id IS NOT NULL
   AND p.assigned_pm_id IS NOT NULL
   AND COALESCE(btrim(p.assigned_pm_email), '') <> ''
ON CONFLICT (job_id, user_id) DO NOTHING;

COMMENT ON TABLE public.job_assignees IS
  'Colleagues assigned to a job. Many per job. Notifications about the job go to these people alongside ADMIN_NOTIFY_EMAILS.';
COMMENT ON COLUMN public.job_assignees.email IS
  'Snapshot of the address at assignment time, so a notification still knows where to send if the profile changes.';
