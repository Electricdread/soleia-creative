# Soleia Creative — agent notes

**Read `vault/AGENT.md` first.** The `vault/` folder is the CEO's Obsidian vault: priorities, briefs (`vault/01 Briefs/`), standing decisions (`vault/02 Decisions/`) and project context. When asked to "work the briefs", follow `vault/AGENT.md`, and report back in `vault/07 Agent Reports/` in plain English — the CEO does not read code.

Repo rules (details in `docs/SESSION-HANDOFF.md`):
- Lovable auto-commits to `main`; **`main` is production**. Always fetch and check divergence before work; never push a stale tree.
- Write Supabase migrations only on top of up-to-date `origin/main`.
- Verify with `npm run build` before pushing app changes.
- Changes only inside `vault/` skip the Netlify build (see `netlify.toml` `ignore`).
