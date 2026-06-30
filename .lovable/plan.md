## Issue
The Fudale × GitHub proposal (`8d55d68d…`) is in status `archived`. The `sign_proposal_by_token` DB function only signs proposals where `status = 'sent'`, so the client's signature attempt silently fails / errors out.

## Fix
Flip that single proposal back to `status = 'sent'` so the client can complete signing.

```sql
UPDATE public.proposals
   SET status = 'sent'
 WHERE token = '8d55d68d42dba309ecebc01067ff56c6047a9c6963c87b7da9b8783bd6db08de'
   AND signed_at IS NULL;
```

No code or schema changes. Once signed, the RPC will automatically move it to `accepted` and trigger the signed-notification flow.

## Optional follow-up (ask before doing)
If archived proposals being unsignable has bitten you before, I can either:
- Add a small admin "Reopen for signing" button on archived proposals, or
- Extend the RPC to also accept `archived` status.

Tell me if you want either; otherwise the SQL above resolves the immediate client issue.
