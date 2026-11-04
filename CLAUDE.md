# Soleia Creative — agent notes

**The CEO's direction lives in the DreamLinkX vault**, a separate private repo: `Electricdread/dreamlinkx-copilots`. Before product work, attach and read that repo's `AGENT.md`, the briefs in `01 Briefs/` and decisions in `02 Decisions/`. Report back there in `07 Agent Reports/`, in plain English. The CEO does not read code.

Repo rules (details in `docs/SESSION-HANDOFF.md`):
- Lovable auto-commits to `main`; **`main` is production**. Always fetch and check divergence before work; never push a stale tree.
- Write Supabase migrations only on top of up-to-date `origin/main`.
- Verify with `npm run build` before pushing app changes.
