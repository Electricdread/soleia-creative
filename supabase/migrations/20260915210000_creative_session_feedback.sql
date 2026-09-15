-- Client feedback on creative sessions (owner, 2026-09-15: "for soleiacreative.app in creative sessions clients
-- when approving or declining, commenting is not registering").
--
-- 1. Decline. The button was added on 2026-04-07 and writes reaction_type 'decline', but the check constraint only
--    ever allowed love, fire, question and star, so every Decline was refused (23514) and the page never checked.
--    Not one decline row exists. Measured 2026-09-15 as the anon role: approve and comment insert, decline fails.
alter table public.mood_board_reactions drop constraint if exists mood_board_reactions_reaction_type_check;
alter table public.mood_board_reactions add constraint mood_board_reactions_reaction_type_check
  check (reaction_type = any (array['love'::text, 'fire'::text, 'question'::text, 'star'::text, 'decline'::text]));

-- 2. The client's typed-name "Confirm Approval" on the approval summary. It only ever set page state, so a
--    client's sign-off was never stored and nobody was told.
create table if not exists public.creative_session_signoffs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.creative_sessions(id) on delete cascade,
  signer_name text not null check (length(btrim(signer_name)) between 1 and 200),
  approved_item_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists creative_session_signoffs_session_idx on public.creative_session_signoffs (session_id, created_at desc);

alter table public.creative_session_signoffs enable row level security;
grant insert on public.creative_session_signoffs to anon;
grant select, insert, update, delete on public.creative_session_signoffs to authenticated;
grant all on public.creative_session_signoffs to service_role;

-- The same reach as the session's reactions and comments: a client can sign off a live, public session.
-- There is no public read; admins read sign-offs in the session card.
drop policy if exists "Public can sign off active public sessions" on public.creative_session_signoffs;
create policy "Public can sign off active public sessions"
  on public.creative_session_signoffs
  for insert
  to anon, authenticated
  with check (exists (
    select 1 from public.creative_sessions cs
     where cs.id = creative_session_signoffs.session_id and cs.is_active = true and cs.is_public = true
  ));

drop policy if exists "Admins can manage session sign-offs" on public.creative_session_signoffs;
create policy "Admins can manage session sign-offs"
  on public.creative_session_signoffs
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Where each digest got to, so every client action is emailed once. Service role only: RLS on, no policies.
create table if not exists public.notification_watermarks (
  key text primary key,
  last_run_at timestamptz not null
);
alter table public.notification_watermarks enable row level security;
grant all on public.notification_watermarks to service_role;

-- Seeded now, so the first digest reports what happens from here on, not every approval since March.
insert into public.notification_watermarks (key, last_run_at)
values ('creative-feedback-digest', now())
on conflict (key) do nothing;
