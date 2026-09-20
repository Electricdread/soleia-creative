-- CR - NW Regional Office LIUNA was deployed on 2026-09-20, raised from the calendar before a packet was
-- seeded with the dated label, so its packet and its job read "CR - NW Regional Office LIUNA" with no day.
-- Owner rule (2026-09-14): "MM.DD.YY Client - Event". The Drive folder was already named that way.
-- Data only, guarded so it changes a row only while it still carries the old title.
update public.pre_call_packets
   set title      = '09.22.26 CR - NW Regional Office LIUNA',
       updated_at = now()
 where id = 'd37f891e-797e-437c-90de-39b8bf2ddf69'
   and title = 'CR - NW Regional Office LIUNA';

update public.jobs
   set title      = '09.22.26 CR - NW Regional Office LIUNA',
       updated_at = now()
 where id = '7b923d0f-1c54-bcf6-bb6c-0d6d445d425d'
   and title = 'CR - NW Regional Office LIUNA';
