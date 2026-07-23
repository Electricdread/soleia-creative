## Goal
Make the item library the single source of truth for new proposals so any new client automatically gets the exact same lineup, pricing, and copy shown on `/rate-card`. No changes to existing proposals or the rate card page itself.

## How new proposals are seeded (confirmed)
`AdminProposals.handleCreate` already auto-inserts every row from `line_item_templates` into a new proposal when the admin doesn't hand-pick items. So syncing the library rows = syncing new proposals. The package row is included in that seed, satisfying "auto-added, editable."

## Data changes to `line_item_templates`

Add a `sort_order` value to each row so the seeded order matches the rate card (package → Additional Options → Video Mapping & Load Fees), and normalize `category` names to those three exact buckets.

### 1. Package (category: `Soleia Creative Package`, sort 0)
- Title: **Immersive LED Environments & Branded Overlay Design**
- Price: **$3,000** (down from $4,000)
- Description: rate-card package copy + `Includes: 1–3 looks across all venue LED screens and elevator displays. Cabana & bungalow TVs quoted separately based on asset delivery.`

### 2. Additional Options (category: `Additional Options`, in this order)
| # | Title | Price | Notes |
|---|---|---|---|
| 1 | Static Logo | $200 | **new row** |
| 2 | Transparent Logo Animation | $750 | rename from "Additional Transparent Logo Animation" |
| 3 | Elevator Dynamic Animation | $750 | keep |
| 4 | Elevator Created by Client | $500 | **new row** |
| 5 | Elevator Static Logo | $350 | move here from Video Mapping |
| 6 | Individual Cabana / Bungalow Logo | $300 | rename from "Individual dedicated…" |
| 7 | 3D Previz | $350 | rename from "Previz" and use rate-card description |

### 3. Video Mapping & Load Fees (category: `Video Mapping & Load Fees`, in this order)
| # | Title | Price |
|---|---|---|
| 1 | Mapped by Soleia Creative Team | $1,500 |
| 2 | Mapped to Spec by Client | $1,000 |
| 3 | Outside Arch Specific Video | $500 |
| 4 | Performing Artist — Mapped by Soleia Creative Team | $950 |

Each row's `description` gets set to the rate-card copy verbatim.

### 4. Rows to delete (stale / not on rate card)
- `In-Person Preview` ($400, "Additional Items")
- `Previz Preview` ($350, "Additional Items")
- `On-Site Recorded Client Mapped Preview` ($250, "Addition Items")
- Old duplicate `Previz` row once "3D Previz" replaces it

### 5. Category headers
Upsert three rows in `line_item_categories` with `sort_order` 0/1/2 so the admin item picker and future rate-card RPCs render them in the same order: `Soleia Creative Package`, `Additional Options`, `Video Mapping & Load Fees`.

## Technical notes
- Data-only change: one `supabase--insert` call for the UPDATE/INSERT/DELETE statements on `line_item_templates` and `line_item_categories`. No migration, no schema change, no code change.
- The existing `get_rate_card_addons()` RPC filter (`title NOT ILIKE '%Immersive LED Environments%'`) still excludes the package from the addons list — no adjustment needed.
- Existing proposals and the `/rate-card` page are untouched.

## Out of scope
- Restyling `ProposalView` / proposal PDF to the rate-card layout.
- Backfilling any existing proposal (drafts included).
