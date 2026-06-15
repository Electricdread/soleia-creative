# Reset Transperfect proposal for re-signing

Reset proposal `b900896b-2818-4001-96fd-b201bc219964` (06.24.26 | Transperfect Event) so Michelle can sign again with the fixed selection flow:

1. **proposals** row: set `status = 'sent'`, clear `signed_at`, clear `client_signature`.
2. **proposal_items** for this proposal: reset `client_selected = true` on all rows so the client sees a clean checklist again.

After this, the client can revisit the link and pick the items they actually want; the new signing flow will persist the correct selections and total.
