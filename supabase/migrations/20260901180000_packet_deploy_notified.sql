-- A deployed packet announces itself to the admins and the job's assignees
-- exactly once. The stamp lives on the packet so a deploy → unpublish →
-- deploy cycle cannot email everyone twice (see notify-packet-deployed).
alter table public.pre_call_packets
  add column if not exists deploy_notified_at timestamptz;
