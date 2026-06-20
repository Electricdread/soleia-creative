## Update Creative Sessions sort order

In `src/components/admin/CreativeSessionManager.tsx`, change `fetchSessions` to order by:

1. `is_active` DESC — active sessions on top, inactive at the bottom
2. `created_at` DESC — within each group, newest first / oldest last

```ts
.order('is_active', { ascending: false })
.order('created_at', { ascending: false });
```

Also update the project memory (`mem://features/creative-sessions/management-and-layout`) to reflect the new rule: active-before-inactive, then newest-first.

No other files affected.