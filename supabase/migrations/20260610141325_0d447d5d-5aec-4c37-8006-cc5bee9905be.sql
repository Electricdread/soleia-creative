
CREATE TABLE public.drive_seen_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  drive_folder_id text NOT NULL,
  drive_file_id text NOT NULL,
  file_name text,
  mime_type text,
  file_size bigint,
  web_view_link text,
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drive_folder_id, drive_file_id)
);

GRANT ALL ON public.drive_seen_files TO service_role;
GRANT SELECT ON public.drive_seen_files TO authenticated;

ALTER TABLE public.drive_seen_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view drive_seen_files"
  ON public.drive_seen_files
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX drive_seen_files_proposal_idx ON public.drive_seen_files(proposal_id);
CREATE INDEX drive_seen_files_notified_at_idx ON public.drive_seen_files(notified_at DESC);
