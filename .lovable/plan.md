

## Fix Proposal Timeline Disclaimer

Change "Applying Fixes & Delivery" from "2 Business Days" to "may take up to 7 Business Days" in the default proposal timeline template.

### What to change

Update the timeline insertion in `src/pages/AdminProposals.tsx` (lines 128-134) that creates the default phases when a new proposal is created.

**Current code (line 133):**
```typescript
{ proposal_id: proposal.id, phase: 'Applying Fixes & Delivery', duration: '2 Business Days', details: 'Time allocated to implement the approved revisions. Final results sent.', sort_order: 3 }
```

**New code:**
```typescript
{ proposal_id: proposal.id, phase: 'Applying Fixes & Delivery', duration: 'may take up to 7 Business Days', details: 'Time allocated to implement the approved revisions. Final results sent.', sort_order: 3 }
```

### Files
- `src/pages/AdminProposals.tsx` — line 133 only

### QA
- Create a new proposal → verify "Applying Fixes & Delivery" shows "may take up to 7 Business Days" instead of "2 Business Days".

