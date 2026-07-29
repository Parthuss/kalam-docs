# Video script — target 4 minutes, record against the live deployment

| Time | Beat |
|---|---|
| 0:00–0:30 | What Kalam is. What I chose to build deeply (editing, sharing, import/export) and what I explicitly cut (real-time collaboration, version history, presence) and why — lead with the cut, it signals judgment immediately. |
| 0:30–1:30 | Log in as Alice via quick-switch → create a document → apply every toolbar format so headings/lists/bold are visibly distinct → show the autosave indicator go Saving… → All changes saved → rename the document from the header. |
| 1:30–2:15 | Import a `.docx` file → show it becomes a fully editable document with headings and lists preserved. Mention the 2 MB limit and supported types shown in the UI. |
| 2:15–3:00 | Share the document with Bob as Viewer → open a second browser profile, log in as Bob → show read-only mode: no toolbar, "View only" badge, typing does nothing → back in Alice's tab, upgrade Bob to Editor → refresh Bob's tab → he can now edit and it saves. |
| 3:00–3:30 | Quick architecture tour: the schema (User/Document/DocumentShare), the single `permissions.ts` module imported by both API routes and UI components, the sanitize-html boundary on every write. |
| 3:30–4:00 | AI workflow: the two-model split (Opus for planning/stress-test, Sonnet for execution), one concrete rejected suggestion (adapter-neon or the ?schema=test trap), and how correctness was verified (tests + manual multi-account clicking, not just a green checkmark). |

Record against `https://kalam-docs.vercel.app`, not localhost — it's the only way the video also proves the deployment works.
