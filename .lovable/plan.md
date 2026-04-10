

## Plan: Adapt Creative Session ↔ Proposal Linking (DSX-style)

### What changes

The DSX project links creative sessions to proposals using a `proposal_id` column on the `creative_sessions` table, and shows a "View Proposal" card on the client-facing session page. The current Soleia project uses the inverse (`session_id` on `proposals`). This plan adapts the Soleia project to match the DSX approach.

### Database Migration

Add a `proposal_id` column to `creative_sessions`:

```sql
ALTER TABLE public.creative_sessions
  ADD COLUMN proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL;
```

Migrate existing links from `proposals.session_id` → `creative_sessions.proposal_id`, then drop the old column:

```sql
UPDATE public.creative_sessions cs
SET proposal_id = p.id
FROM public.proposals p
WHERE p.session_id = cs.id;

ALTER TABLE public.proposals DROP COLUMN session_id;
```

### Code Changes

**1. `src/pages/CreativeSession.tsx`**
- Add `proposal_id` to the `CreativeSessionData` interface
- Fetch the linked proposal's token when `session.proposal_id` is set
- Add a "View Proposal" link card at the bottom of the session (matching DSX: FileText icon, "Review and sign the project proposal" subtitle)

**2. `src/components/admin/ProposalSessionLinker.tsx`**
- Reverse the linking direction: instead of updating `proposals.session_id`, update `creative_sessions.proposal_id` with the selected proposal's ID
- Adjust the query and UI labels accordingly (now selecting a proposal to link to a session, rather than a session to link to a proposal)

**3. `src/components/admin/CreativeSessionCard.tsx`**
- Add a "Link Proposal" button (Link2 icon) that opens a proposal picker dialog
- Show linked proposal badge/indicator when `proposal_id` is set

**4. `src/components/admin/CreativeSessionManager.tsx`**
- Pass proposal linking capability down to session cards

**5. `src/components/calendar/EventLinkedItems.tsx`**
- Update any queries that reference `proposals.session_id` to use the new `creative_sessions.proposal_id` relationship

**6. `src/components/proposal/ProposalApprovedClips.tsx`**
- Update query to find linked session via `creative_sessions.proposal_id` instead of `proposals.session_id`

### Technical Details

- The `proposal_id` foreign key uses `ON DELETE SET NULL` so deleting a proposal doesn't break the session
- Existing linked data will be migrated automatically in the migration SQL
- The client-facing "View Proposal" card only appears when `proposalToken` is resolved (proposal exists and is active)
- Cover image auto-pull logic in the linker remains the same, just the direction of the FK update changes

