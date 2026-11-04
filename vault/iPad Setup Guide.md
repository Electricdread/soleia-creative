---
type: guide
---
# iPad Setup Guide

One-time setup, ~15 minutes. After that, syncing is one tap.

## 0. Make the repo private (do this first)
The soleia-creative repo is public, so anything in this vault would be readable by anyone.
1. On github.com open **Electricdread/soleia-creative** → **Settings**.
2. Scroll to **Danger Zone** → **Change visibility** → **Make private** → confirm.
Lovable and Netlify keep working with a private repo.

## 1. Install two apps (App Store)
- **Obsidian** (free)
- **Working Copy** (free to read; unlock **Pro** in the app to push your notes — one-time purchase)

## 2. Clone the repo in Working Copy
1. Open Working Copy → **+** → **Clone repository** → sign in to **GitHub**.
2. Pick **soleia-creative**. Wait for it to finish (~220 MB, a few minutes on Wi-Fi).
3. Make sure the branch shown is **main**.

## 3. Create the vault in Obsidian
1. Open Obsidian → **Create new vault** → name it **Soleia**.
2. **Store in iCloud: OFF.** → Create.
3. Close Obsidian (swipe it away).

## 4. Link the vault folder
1. In Working Copy, open **soleia-creative** and tap the **vault** folder.
2. Tap the **share / ⋯** button for that folder → **Setup Folder Sync**.
3. Choose **On My iPad › Obsidian › Soleia** → **Open**.
4. If it asks which side wins, choose the **repository**.
5. Open Obsidian → the **Soleia** vault now shows **Home**, Briefs, Projects, etc.

## 5. Make syncing one tap (Shortcuts app)
Create a shortcut called **Sync Soleia**:
1. Working Copy → **Pull Repository** → soleia-creative
2. Working Copy → **Commit Repository** → soleia-creative, message `Notes from iPad`, what: **modified**
3. Working Copy → **Push Repository** → soleia-creative

Add it to your Home Screen. Optional: Shortcuts → **Automation** → **App** → *Obsidian* → *Is Closed* → run **Sync Soleia**, "Run Immediately".

## Daily use
- Write in Obsidian. New notes go to **00 Inbox**.
- To hand work to an agent: new note → template **Brief** → set `status: ready` → **Sync Soleia** → tell Claude "work the ready briefs".
- Before reading agent reports: run **Sync Soleia** (it pulls first).

## Tips
- Pin Home: it's already bookmarked (bookmark icon in the sidebar).
- Swipe down in a note for the command palette; type "template" to insert one.
- If a sync ever complains, open Working Copy and it will show what's different — or ask an agent to fix it.
