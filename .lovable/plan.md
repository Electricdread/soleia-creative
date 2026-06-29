# Plan — Expose Soleia signed proposals to DSXBooks

## Root cause

DSXBooks already pulls from DSX Studios via the `proposal-export` edge function in that project (`supabase/functions/proposal-export/index.ts`, returns `{ proposals, items, clients, events, source: "dsx" }`).

This Soleia Creative project has **no equivalent edge function**. There is nothing for DSXBooks to call here, which is why Transperfect's signed proposal (id `b900896b…`, status `accepted`, signed 2026‑06‑17) never reaches DSXBooks even though it's linked to the Tripleseat calendar event.

The fix is to add a matching export endpoint on the Soleia side, shaped so DSXBooks can consume it with the same code path it already uses for DSX.

## Changes

### 1. New edge function: `supabase/functions/proposal-export/index.ts`

Auth-protected, admin-only, returns the data DSXBooks needs.

- CORS preflight handled (`npm:@supabase/supabase-js@2/cors`).
- Require `Authorization` header; validate user via anon client `auth.getUser()`.
- Authorize via `public.has_role(user.id, 'admin')` (Soleia's existing role check — DSX uses `is_admin`, we map to our equivalent).
- Use service-role client for the actual data reads.
- Query params:
  - `status` — default `accepted` (Soleia uses `accepted`, not `signed`; DSX side already passes `status` so DSXBooks just needs to send `accepted` for this source).
  - `since` — optional ISO date, filters `signed_at >= since`.
- Pull from `proposals` where `is_active = true` and `status = <status>`, ordered by `signed_at desc`.
- Pull `proposal_items` for those proposal ids (ordered by `sort_order`).
- Join calendar linkage: read `calendar_event_associations` where `entity_type = 'proposal'` and `entity_id IN (...)` to surface the linked Tripleseat `event_uid` per proposal (this is how Transperfect ties to its calendar event).
- No `clients` or `events` tables exist in Soleia — return empty arrays for those keys so the DSXBooks consumer's shape stays identical to DSX's response.
- Response:
  ```json
  {
    "proposals": [...],
    "items": [...],
    "clients": [],
    "events": [],
    "associations": [{ "proposal_id": "...", "event_uid": "..." }],
    "exported_at": "...",
    "source": "soleia"
  }
  ```
- Errors return JSON with CORS headers; never leak internals.

No `supabase/config.toml` change needed (default `verify_jwt = false`; we validate in code, same pattern as DSX).

### 2. DSXBooks consumer side (DSX Studios project)

Out of scope for this plan unless you want me to also edit the DSX Studios project. To consume Soleia, DSXBooks needs to call:

```
POST https://<soleia-project>.supabase.co/functions/v1/proposal-export?status=accepted&since=...
Authorization: Bearer <admin user JWT for soleia>
```

with an admin account that exists in the Soleia project. Tell me if you want me to wire that call into DSX Studios in a follow-up.

## Out of scope

- No schema changes, no new tables, no migrations.
- No changes to existing proposal flows, totals, signing, or PDFs.
- No edits to DSX Studios in this plan (separate project, separate approval).
- No new secrets (uses existing `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## Verification

After deploy:
1. `curl` the function with an admin JWT and `status=accepted` — confirm Transperfect proposal (`b900896b-2818-4001-96fd-b201bc219964`) appears with its items and its `event_uid` association.
2. Confirm a non‑admin token returns `403`.
3. Confirm no `Authorization` header returns `401`.
