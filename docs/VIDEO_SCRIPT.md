# Walkthrough video script

Target length: ~4 minutes. Record against the **live deployment** (`https://kalam-docs.vercel.app`), not localhost — it proves the deploy actually works. Two browser windows/profiles side by side for the sharing beat (one as Alice, one as Bob) makes that section much clearer than switching tabs in one window.

Each row is one beat: **ACTION** is what you click/show, **SUBTITLE** is what you say while doing it. Read the subtitle as you perform the action, not before — the video should feel like a live demo, not narration over static screenshots.

---

### 0:00 – 0:25 — Cold open: what it is, what I cut

**ACTION:** Start on the login screen. Don't click anything yet.
**SUBTITLE:** "This is Kalam — a lightweight collaborative document editor. Before I show it working, the one-sentence version of what I deliberately didn't build: no real-time multiplayer cursors. That needs a CRDT and a persistent WebSocket server, which doesn't fit a serverless free-tier deploy in this timebox — so instead you get debounced autosave with a visible save-state indicator, and I'd rather show that honestly than pretend otherwise."

**ACTION:** Click the "Alice" quick-sign-in button.
**SUBTITLE:** "Three seeded accounts — Alice, Bob, Carol — so switching between an owner, an editor, and a viewer takes one click instead of typing credentials every time."

---

### 0:25 – 1:20 — Core editing: create, format, autosave

**ACTION:** Land on the dashboard. Point out the two cards — "My documents" and "Shared with me."
**SUBTITLE:** "Alice's dashboard — documents she owns, and documents shared with her, each in its own container."

**ACTION:** Click "New document."
**SUBTITLE:** "Creating a new document — and I want to call this out directly: a real page, on a visible canvas. Earlier in testing, this editor was just floating text with no visible boundary — no card, no border, nothing telling you where to type until you clicked. That's the fix."

**ACTION:** Type a heading, hit Enter, type a paragraph. Select some text, click Bold, then Italic.
**SUBTITLE:** "Rich text formatting — headings, bold, italic, underline, lists — through Tiptap. Watch the top right corner."

**ACTION:** Point at the "Saving…" → "All changes saved" indicator.
**SUBTITLE:** "Debounced autosave, about 800 milliseconds after you stop typing. No save button, no data loss on refresh."

**ACTION:** Select a run of mixed-formatted text (bold+italic+underline stacked), click "Clear."
**SUBTITLE:** "And this Clear Formatting button is a direct answer to real feedback — stacking bold, underline, and italic and wanting to strip it all in one click, rather than toggling each mark off individually one at a time. One click, back to plain text."

**ACTION:** Click the document title, rename it, click away.
**SUBTITLE:** "Title is editable inline too — click it, type, it saves."

---

### 1:20 – 2:00 — Import

**ACTION:** Back to Documents. Click "Import file," pick a `.docx` file.
**SUBTITLE:** "Import supports .txt, .md, and .docx — capped at 2 megabytes, stated right in the UI, not just the README."

**ACTION:** Show the imported document opening with structure intact (headings, lists preserved).
**SUBTITLE:** "The docx's headings and lists survive the conversion — this goes through mammoth server-side, then through a strict HTML sanitizer before it ever touches the database, since imported files are exactly the kind of input you don't trust blindly."

**ACTION:** Click "Export .md" on any document.
**SUBTITLE:** "And it exports back out to Markdown just as easily."

---

### 2:00 – 3:00 — Sharing and permissions (the two-account beat)

**ACTION:** Click "Share" on a document Alice owns. Enter Bob's email, pick "Viewer," click Share.
**SUBTITLE:** "Sharing — grant access by email, pick a role. I'll add Bob as a Viewer first."

**ACTION:** Switch to the second browser window, already signed in as Bob. Refresh the dashboard — show the document appearing under "Shared with me" with a Viewer badge.
**SUBTITLE:** "On Bob's side, it shows up under Shared with me, tagged Viewer."

**ACTION:** Bob opens the document. Point out: no toolbar, "View only" badge, attempt to type — nothing happens.
**SUBTITLE:** "As a Viewer, no toolbar, and typing is actually blocked — not just hidden in the UI. The API rejects the edit server-side too, even if you try to force it through devtools."

**ACTION:** Switch back to Alice's window. In the Share modal, change Bob's role dropdown from Viewer to Editor.
**SUBTITLE:** "Upgrading Bob to Editor, live."

**ACTION:** Switch to Bob's window, refresh. Toolbar now appears. Type something.
**SUBTITLE:** "And now Bob can edit — the toolbar appears, and his changes save just like Alice's would."

**ACTION:** Switch to Alice's window, revoke Bob's access.
**SUBTITLE:** "Revoke removes it immediately — Bob loses access entirely, not just a downgrade."

---

### 3:00 – 3:30 — Under the hood, briefly

**ACTION:** Optional — show the repo file tree or `docs/ARCHITECTURE.md` for a couple seconds. Don't read code line by line.
**SUBTITLE:** "Quickly on architecture: Next.js 16 on Vercel, Postgres on Neon, Prisma. One permissions module — `accessLevelFor` plus a handful of `can*` predicates — is imported by both the API routes and the UI, so server enforcement and client-side hiding can never drift apart. Content is stored as sanitized HTML rather than structured JSON, which is what makes import and export both nearly free — the tradeoff is it wouldn't be the right foundation if real-time collaboration were on the roadmap, which, as I said up front, it deliberately isn't."

---

### 3:30 – 4:00 — AI workflow, closing

**ACTION:** No specific screen needed — talking head, or stay on the dashboard.
**SUBTITLE:** "On AI usage: I used a two-model workflow — Claude Opus for architecture planning and an adversarial stress-test of the stack before writing any code, then Claude Sonnet for the actual implementation against that plan. That upfront review caught real issues before they cost debugging time — a Prisma connection-pooling footgun, a Tailwind CSS cascade-layers bug that would've silently broken the editor's formatting, a test-isolation bug in the Postgres driver adapter. I also rejected a few AI suggestions along the way — the obvious `next/dynamic` wrapper for the editor, for one, which doesn't actually work in this version of Next.js and wasn't needed anyway. And after the initial build, I ran an actual hands-on test pass myself and caught a real bug the test suite missed — a Viewer briefly saw a 'save failed' error on a document they weren't even trying to edit, from an update handler that fired on selection changes, not just content changes. All of that reasoning is logged as I went, not reconstructed afterward — it's in `docs/DECISIONS.md` in the repo if you want the detail. That's Kalam."

**ACTION:** End recording.

---

## Notes before recording

- Have both browser windows (Alice, Bob) already logged in before you hit record, so you're not typing passwords on camera.
- Pre-create one `.docx` test file so the import beat doesn't stall looking for a file.
- If a beat runs long, cut from the architecture section (3:00–3:30) first — it's the most skippable without losing the "does it work" proof.
- Keep it under 5 minutes total per the brief's stated limit.
