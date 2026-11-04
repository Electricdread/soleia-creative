---
type: knowledge
---
# Working with Lovable

- Lovable edits the app and auto-saves to GitHub `main`. **`main` = the live site.**
- Agents must pull the latest `main` before working, and never push an out-of-date copy over it.
- Database changes (Supabase migrations) are only written on top of the latest `main`.
- This vault lives in the same repo, in the `vault/` folder. Lovable ignores it, and note-only changes don't trigger a site rebuild.
