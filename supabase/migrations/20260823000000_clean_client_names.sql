-- Two client names that read as two clients.
--
-- `MOC&CO x ZAXBYS,` carries a trailing comma on the job and the proposal while
-- the packet spells it clean, and that difference is not cosmetic: the Drive
-- folder lookup in create-client-drive-folder matches on the name, so the comma
-- is what split that booking across two sibling folders.
--
-- `Ceasars Entertainment` is a misspelling on the job and the proposal. The
-- correct spelling is already in the data — the creative session for the same
-- booking says `CAESARS Entertainment` — so this adopts the one the client
-- actually uses rather than inventing a third.
--
-- The trailing-separator sweep is written as a rule rather than as two ids so
-- it stays true if it is ever re-run; on today's data it touches exactly the
-- two MOC&CO rows.

-- 1. Trailing separators and doubled spaces, everywhere a client is named.
update public.jobs
   set client_name = regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g')
 where client_name is not null
   and regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g') is distinct from client_name;

update public.proposals
   set client_name = regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g')
 where client_name is not null
   and regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g') is distinct from client_name;

update public.pre_call_packets
   set client_name = regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g')
 where client_name is not null
   and regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g') is distinct from client_name;

update public.creative_sessions
   set client_name = regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g')
 where client_name is not null
   and regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g') is distinct from client_name;

update public.client_links
   set client_name = regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g')
 where client_name is not null
   and regexp_replace(regexp_replace(btrim(client_name), '[[:space:],;:|/\-]+$', ''), '[[:space:]]+', ' ', 'g') is distinct from client_name;

-- 2. The Caesars spelling, matched loosely enough to catch the casing variants
--    of the same typo and nothing else.
update public.jobs
   set client_name = 'CAESARS Entertainment'
 where client_name ilike 'ceasars%';

update public.proposals
   set client_name = 'CAESARS Entertainment'
 where client_name ilike 'ceasars%';

update public.pre_call_packets
   set client_name = 'CAESARS Entertainment'
 where client_name ilike 'ceasars%';

update public.creative_sessions
   set client_name = 'CAESARS Entertainment'
 where client_name ilike 'ceasars%';

update public.client_links
   set client_name = 'CAESARS Entertainment'
 where client_name ilike 'ceasars%';
