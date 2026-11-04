---
type: agent-instructions
---
# Instructions for agents (read this first)

You are working for the CEO of Soleia. **The CEO does not read or write code.** This vault is how they talk to you. Treat it as the source of truth for *what* to build and *why*; the code is yours.

## Before you start any work
1. Read [[Home]], then every note in `02 Decisions/` — decisions are standing rules.
2. Read the relevant note in `03 Projects/` and anything it links to in `04 Knowledge/`.
3. If asked to "work the briefs", take notes in `01 Briefs/` whose frontmatter is `status: ready`, highest priority first (`p1` before `p2`).

## While working a brief
- Set its `status: in-progress` and `updated:` date, commit that change first so others can see it's taken.
- If something in the brief is unclear and blocks you, add a `## Questions` section to the brief, set `status: blocked`, and stop on that brief.

## When you finish
- Set the brief to `status: review` (the CEO marks `done`).
- Write a report in `07 Agent Reports/` named `YYYY-MM-DD <brief name>.md` using `Templates/Agent Report.md`. Write it in plain English for a non-technical CEO: what changed, what they should click to see it, what's left, any risk. No code, no jargon, no file paths unless asked.
- Link the report from the brief (`report: "[[...]]"`).

## Rules
- Never delete or rewrite the CEO's notes. You may append sections and change frontmatter.
- Never put passwords, API keys, or tokens in the vault.
- Keep notes short. Bullets over paragraphs.
- Use `[[wikilinks]]` between notes so they show up in Obsidian's graph and backlinks.
- New facts you learn that will matter later go in `04 Knowledge/` (one topic per note).
