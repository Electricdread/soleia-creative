-- A job can be put on hold: postponed or cancelled (owner, 2026-10-25: "in Jobs section add cancel
-- postponed/delete button", for Chefs for Heroes).
--
-- is_active stays the switch every reader already uses (the Jobs list, Needs you, the deadline digest,
-- studio-sync). status says why a job is switched off, so a held job can be told apart from a finished one
-- and brought back. The app sets both together: postponed/cancelled with is_active = false, active with true.
--
-- Nothing attached to the job is touched: its packet, proposal, creative session, client links and Drive
-- folder stay exactly as they are.

alter table public.jobs add column if not exists status text not null default 'active';
alter table public.jobs add column if not exists status_changed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_status_check') then
    alter table public.jobs
      add constraint jobs_status_check check (status in ('active', 'postponed', 'cancelled'));
  end if;
end $$;