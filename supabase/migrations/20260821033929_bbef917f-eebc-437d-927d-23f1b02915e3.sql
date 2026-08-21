-- Give a job a row of its own.
--
-- A job — a client who landed a booking — has never existed in the schema. It
-- lives as two to four records across proposals, pre_call_packets and
-- creative_sessions, each carrying a re-typed client name and event date, with
-- creative_sessions.proposal_id the only link between any of them. So the same
-- job goes by several names at once: Ascend is also MRI, Interstate15 is also
-- G2E, MOC&CO x ZAXBYS is also 525 Productions. Nothing can group them, search
-- cannot find them, and the same drift splits their Drive folders in two.
--
-- Schema only. No rows are created or attached here; the backfill is a separate,
-- reviewable step.

-- The venue in-house basic package buys no Soleia creative services and is run
-- internally — no packet, no proposal, no sign-off. Such a job must never be
-- chased for a proposal it was never going to have.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_track') THEN
    CREATE TYPE public.job_track AS ENUM ('creative', 'in_house');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What the owner calls it. Usually the shortest of the names its records use.
  title text NOT NULL,
  client_name text NOT NULL,
  event_date date,

  track public.job_track NOT NULL DEFAULT 'creative',

  -- The creative call had nowhere to live: proposals.creative_call_url stores a
  -- link, but nothing recorded that the call actually happened, so that stage
  -- of the pipeline was invisible.
  call_held_on date,

  -- One folder per job. Two folders per job is the bug this replaces:
  -- create-client-drive-folder named the folder from a hand-typed string, so a
  -- leading zero or a trailing comma produced a second one beside the first.
  drive_folder_id text,
  drive_folder_url text,

  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_event_date_idx ON public.jobs (event_date);
CREATE INDEX IF NOT EXISTS jobs_active_idx ON public.jobs (is_active);

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage jobs" ON public.jobs;
CREATE POLICY "Admins manage jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Attach the existing records. ON DELETE SET NULL: deleting a job must never
-- take a signed proposal with it.
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.pre_call_packets
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.creative_sessions
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS proposals_job_id_idx ON public.proposals (job_id);
CREATE INDEX IF NOT EXISTS pre_call_packets_job_id_idx ON public.pre_call_packets (job_id);
CREATE INDEX IF NOT EXISTS creative_sessions_job_id_idx ON public.creative_sessions (job_id);

-- The client has a deadline to sign. validity_days exists but nothing ever
-- counted down to a date or chased it, so "awaiting signature, 11 days" was the
-- most the dashboard could say.
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS signoff_due_on date;

COMMENT ON TABLE public.jobs IS
  'A client booking, and the spine the pipeline hangs off. Proposals, packets and creative sessions attach via job_id.';
COMMENT ON COLUMN public.jobs.track IS
  'creative = the full pipeline. in_house = venue basic package, run internally, never chased for a proposal.';
COMMENT ON COLUMN public.jobs.call_held_on IS
  'Date the creative call happened. Null means it has not, which is a stage the pipeline could not previously see.';
COMMENT ON COLUMN public.proposals.signoff_due_on IS
  'Date the client is expected to sign by.';