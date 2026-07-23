## Verify token-scoped RPCs against live proposals

Run an automated end-to-end check against the two known client proposal tokens (Whatnot and the GitHub one previously reset) to confirm the security fixes did not break the anonymous client flow.

### What the check does

For each token, in a fresh headless Chromium session with no auth:

1. Navigate to `https://soleiacreative.app/proposal/<token>` and wait for network idle.
2. Capture:
   - Final URL and HTTP status
   - Console errors / warnings
   - Network calls to `get_proposal_by_token`, `get_proposal_items_by_token`, `get_proposal_gallery_by_token`, `get_proposal_timeline_by_token` — status codes and row counts
3. Assert the rendered page shows:
   - Proposal title / client name
   - At least one line item row
   - Signature panel present (or the "closed for signing" alert if `status != 'sent'`)
4. Screenshot the top of the page and the line-items section for visual confirmation.
5. Repeat for `/packet/<token>` and `/creative/<token>` if tokens are available, to cover the other RPCs changed in the same migration (`get_packet_by_token`, `get_client_link_by_token`).

### Deliverable

A short report per token: pass/fail, any failing RPC with its error, and the screenshots. No code changes unless the check surfaces a regression — in which case I'll come back with a follow-up plan describing the exact fix.

### Tokens I'll use

- Whatnot: known active proposal token
- GitHub: the one reset earlier in this thread

Let me know if you'd like me to include a different token (e.g. Transperfect) or skip the packet/session-link checks.
