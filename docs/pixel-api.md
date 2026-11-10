# PIXEL machine API (read-only)

`GET https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/pixel?view=<view>&...`

Server-to-server only. No CORS (browsers cannot call it), `OPTIONS` and all non-GET → 405.
Every response is JSON with `Cache-Control: no-store`.

## Auth
`Authorization: Bearer <key>`. The key is SHA-256 hashed (hex) and must match an
unrevoked row in `public.pixel_access` (`revoked_at is null`). `last_used_at` is
stamped on each successful call. Anything else → `401 {"error":"Unauthorized"}`.

Add a key: insert `label` + `key_sha256` (lowercase hex sha256 of the key). Revoke: set `revoked_at`.

## Parameters (unknown or duplicate params → 400)
| param | rule |
|---|---|
| view | required, one of the views below |
| id | uuid (required for `job`, `proposal`, `session`) |
| q | text ≤ 200 |
| from / to | `YYYY-MM-DD` |
| status | text ≤ 40 |
| limit | 1–200, default 50 |

Success: `{"build","view","data"}`. Errors: 400 `{"error":"<short message>"}`, 404 for unknown id.

## Views
- **summary** — `active_jobs`, `proposals_by_status`, `sessions {total,active}`, `packets {total,active}`, `next_jobs` (next 10 by event_date from today).
- **jobs** (q: title/client_name, from/to: event_date, status) — id, title, client_name, event_date, track, status, is_active, call_held_on, drive_folder_url, updated_at, proposal_count, session_count, packet_count.
- **job** (id) — job fields + notes, `assignees` (display_name, email), `proposals` (as `proposal`), `creative_sessions` (as `session`), `pre_call_packets` (title, kind, event_date, intro, inclusions, scope, notes, is_active, drive_folder_url, creative_guide_url, deploy_notified_at), `calendar_events` (each: local_event, brief, notes, tasks, client_info, meeting_links, metadata, associations).
- **proposals** (q: event_name/client_name/venue_name, from/to, status) — id, event_name, client_name, venue_name, event_date, quote_date, status, sent_at, signed_at, job_id, assigned_pm_name, total (signed → client-selected total after discount; unsigned → full quote after discount).
- **proposal** (id) — all proposal fields except `token`/`client_signature`; `discount`; `line_items` (title, description, category, unit, quantity, price, is_flat_fee, client_selected, sort_order, line_total); `totals` (subtotal, discount_amount, total, selected_subtotal, selected_discount_amount, selected_total); `timeline`; `gallery`; `signature_history` (signed_at, total, selected_items).
- **sessions** (q: project_name/client_name) — id, project_name, client_name, event_date, job_id, proposal_id, is_active, updated_at.
- **session** (id) — all fields except `token`; `scenes`; `creative_briefs`; `signoffs` (signer_name, created_at, approved_items); `mood_board_items` (title, item_type, url, thumbnail_url, description, scene, comment_count, reaction_count, comments[commenter_name, content, created_at]).
- **contacts** (q filters name/company/email/phone) — distinct people/companies: name, company, email, phone, role (`client`, `company`, `project_manager`, `job_assignee`, `event_client_contact`), sources (proposal/job/event they come from).
- **calendar** (from/to on dtstart) — `local_events` in range, `tracked_events` (other event_uids with metadata/associations), each with full event detail and associations.
- **templates** — line_item_templates (price library).

## Never returned
Any `token` column, `client_signature`, site_settings, Tripleseat/iCal feed URLs, auth/user tables, email logs, admin login events, pixel_access.
