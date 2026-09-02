# studio-sync — the contract Soleia publishes for DSX Studio OS

**Version 1.** `GET https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/studio-sync?v=1`

Source: `supabase/functions/studio-sync/index.ts`.

## Why this exists

Studio OS used to sign in as the owner's admin account and issue raw PostgREST
selects naming this database's internal columns. When `proposals.total_amount`,
`pre_call_packets.deployed_at` and `creative_sessions.title` were renamed or
dropped — all legitimate changes — every pull began failing with PostgREST
`42703`, and kept failing silently for weeks.

Soleia is entitled to rename its own columns. Studio OS is not entitled to know
them. This endpoint is the seam: Soleia decides what it publishes, Studio OS
consumes only that, and the next rename is a change to one TypeScript file
instead of a broken consumer.

## Authentication

`x-api-key: soleia_sync_…`, checked against the Supabase secret
`STUDIO_OS_SYNC_KEY`, and against `STUDIO_OS_SYNC_KEY_PREVIOUS` if it is set.

- Two accepted keys is what makes rotation survivable: set the new key, move the
  old one to `_PREVIOUS`, update the consumer whenever its owner is next at the
  machine, then clear `_PREVIOUS`.
- The comparison hashes both sides and compares 32 fixed bytes
  (`_shared/constantTimeEqual.ts`), so neither the content nor the length of the
  provided key is observable from timing.
- **Neither secret set → `503 sync_not_configured`**, checked before the
  request's key is read. An unset secret must never let `undefined === undefined`
  authorise anyone, and `503` tells the owner "Soleia is not set up yet" — a
  different problem from a wrong key, and the signal that separates the two
  failure modes when verifying a deploy.
- There is **no admin-JWT fallback**. `proposal-export` has one; this does not,
  deliberately. Keeping a password-backed path alive on the server invites
  someone to reinstate one on the client, which is what this work removed.
- **No CORS headers.** The only consumer is an Electron main process, which is
  not subject to CORS. `OPTIONS` returns `405`.

**This key reads more than `DSXBOOKS_EXPORT_KEY` does** — the whole jobs
pipeline, not just accepted proposals. Do not reuse it for DSXBooks.

## Versioning

- `?v=` selects the shape. `?v=1` returns v1 forever; when v2 exists, v1 keeps
  being served.
- No `?v=` defaults to `1`, and that default never floats.
- An unsupported value returns `400 unsupported_contract_version` with the
  supported list.
- **Additive-only within a version.** New *optional* fields may appear in v1
  without a bump. Removing a field, or changing what one means, requires v2.

Consumers should read fields defensively and ignore ones they don't know.

## Response

```jsonc
{
  "contract": { "name": "soleia.studio-sync", "version": 1, "build": "<commit short SHA>" },
  "generated_at": "2026-08-29T19:04:11.882Z",
  "source": "soleia",
  "counts": { "jobs": 24, "proposals": 31, "packets": 19, "sessions": 12, "drive_files_scanned": 1840 },
  "truncated": false,
  "jobs": [ /* below */ ]
}
```

`counts` is load-bearing, not decoration. It is what lets a consumer tell
"Soleia genuinely has no jobs" from "the read broke" — a distinction whose
absence let Studio OS overwrite a good cache with an empty one and report it as
live. A `jobs` array that disagrees with `counts.jobs` is a corrupt response and
should be rejected, not cached.

`truncated` goes true if the `drive_seen_files` read hit its page ceiling, so an
undercount is visible rather than inferred.

`ETag` / `If-None-Match` are supported over the data (excluding `generated_at`);
a `304` means keep what you have.

### Per job

| Field | Notes |
|---|---|
| `id` `title` `client_name` `event_date` `track` `is_active` `notes` `call_held_on` `drive_folder_id` `drive_folder_url` | Straight from `jobs`. `track` is `creative` or `in_house`. |
| `stage` | `{ value, reason, done[] }` from `jobStage.ts`. `value` is one of `booked`, `packet_sent`, `call_held`, `proposal_out`, `awaiting_assets`, `in_production`. Not every job has a creative call (owner, 2026-09-01): `call_held` appears only for a job with a meeting scheduled on its calendar events or a `call_held_on` actually logged; other jobs go straight from `packet_sent` towards `proposal_out` and are never chased for a call. |
| `next_action` | `{ kind, label, verb }` or `null`. `kind` is one of `call`, `quote`, `sign`, `session`, `assets`, `date`. `call` is only ever returned when a meeting is scheduled. |
| `proposal` | `null` when the job has none. See below. |
| `packet` | `{ id, title, kind, deployed, created_at }` or `null`. |
| `creative_session` | `{ id, project_name, live }` or `null`. |
| `assets` | `{ count, folders_scanned, latest }`. |

Absent means `null` — never `{}`, never a zero-valued stand-in.

**`next_action` does not carry `href` or `weight`.** Those are Soleia's own
routing table and the sort order of its triage screen. Publishing them would
mean a route rename breaks a consumer, and would hand Studio OS an order tuned
for a screen it does not have.

**`packet.deployed` is `pre_call_packets.is_active`** — the field Soleia's own
admin UI labels "Deployed". There is no deployment timestamp in this schema;
`created_at` is a creation time and is named as one. A consumer that previously
lit a "Packet" indicator on *any* packet existing will now light it only on a
deployed one. That is the correct reading, but it is a behaviour change.

**`assets.count` is counted over the union** of the job's own Drive folder and
every attached proposal's and packet's, because a job folder is shared and that
is what "the brand assets are in" means here. Files the watcher has marked
`missing_since` are not counted.

### `proposal`

```jsonc
{
  "id": "…", "status": "accepted", "signed_at": "…", "signoff_due_on": "…", "is_active": true,
  "total": 42500.00,
  "total_status": "computed",
  "signature_history_total": 45500.00,
  "totals_disagree": true
}
```

`status` is Soleia's own vocabulary: `draft`, `sent`, `accepted`. Soleia says
**`accepted`** where DSX Studios says "signed".

`total` is **`null` unless `total_status` is `computed`**:

| `total_status` | Means |
|---|---|
| `computed` | The total is present and trustworthy. |
| `not_signed` | The proposal exists but is unsigned. Its "total" is whatever the client currently has ticked in their browser — live UI state, not a committed figure. Publishing a number would be inventing one. |
| `no_line_items` | Signed, but the proposal has no line items. |
| `none_selected` | Signed, items exist, none are `client_selected`. Arithmetically $0, but far more likely a data problem than a free job. **Render this as "scope not recorded", never as "$0".** |
| `items_unreadable` | The line-item read failed. The rest of the job is still served. |

The total is computed live from `proposal_items` using `proposalTotals.ts`
semantics — `client_selected` items only, `is_flat_fee` ignoring quantity, a
non-finite or non-positive quantity coerced to 1. That is what the proposal
page, the signed view, the PDF and the emails all render, so it is what the
client actually saw.

`signature_history_total` is the figure `capture_proposal_signature` stored at
signing. It is reported **beside** the computed one rather than instead of it,
because the two use different rules: the SQL computes
`sum(price * GREATEST(quantity,1))` and does **not** honour `is_flat_fee`, so a
flat-fee item with quantity 3 is counted three times. `totals_disagree` says when
they differ by more than a cent. It is `null`/`false` for signings recorded
before 2026-08-20, which are backfills and are not evidence of what a client
ticked.

## Deliberately not published in v1

`proposal.token` and `packet.token` (client-facing signing links — a read-only
cockpit has no use for them and they widen the blast radius of a leaked key),
`client_signature` (a legal artefact, not a sync field), line-item detail,
assignees, call notes and summaries, and `?since=`.

**On `?since=`:** there is no cross-table watermark. `jobs.updated_at` does not
move when a proposal is signed, a packet is deactivated, or a file lands in
Drive — so a `since` filter built on it would omit exactly the jobs whose *state*
changed while their row did not. Use `If-None-Match` instead.

## Errors

| Status | Body | Meaning |
|---|---|---|
| `304` | — | `If-None-Match` matched; keep the cached copy. |
| `400` | `unsupported_contract_version` | Unknown `?v=`. |
| `401` | `unauthorized` | Missing or wrong `x-api-key`. Identical body for both, so there is no oracle. |
| `405` | `method_not_allowed` | Anything but `GET`. |
| `502` | `sync_failed` + `detail` | A table refused. `detail` names it, because "Soleia is unreachable" is the unhelpful report this endpoint exists to replace. |
| `503` | `sync_not_configured` | No sync key is set on Soleia. |

## Maintaining it

`supabase/functions/_shared/proposalTotals.ts` and
`supabase/functions/_shared/jobStage.ts` are **copies** of the modules in
`src/lib/`, because edge functions cannot import from `src/`.
`src/lib/proposalTotals.deno.test.ts` and `src/lib/jobStage.deno.test.ts` fail
unless everything from the first `export` is byte-identical.

**Run `npm run test` before any push that touches `src/lib/proposalTotals.ts`,
`src/lib/jobStage.ts`, or `supabase/functions/_shared/`.** There is no CI here,
so the guard only protects if someone runs it.

The job rollup mirrors `src/hooks/useJobs.ts` query for query. If they diverge,
Studio OS and Soleia's own Jobs screen will show different stages for the same
job — which is worse than showing no stage, because both look authoritative.
