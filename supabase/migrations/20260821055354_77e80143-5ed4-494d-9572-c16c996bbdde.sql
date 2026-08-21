CREATE TABLE IF NOT EXISTS public.job_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

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