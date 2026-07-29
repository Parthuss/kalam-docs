# Submission manifest

## Live product

**https://kalam-docs.vercel.app** — verify: `curl https://kalam-docs.vercel.app/api/health` → `{"ok":true,"users":3}`

## Source code

**GitHub (public):** https://github.com/Parthuss/kalam-docs
**Zip (in this Drive folder):** `kalam-docs-source.zip` — generated via `git archive`, so it's exactly what's in the repo at the submitted commit, nothing more.

## Seeded test accounts

All three use password `password123` (also documented in `README.md`, and one-click quick-switch buttons exist on the login screen):

- `alice@kalam.dev` — Alice Chen
- `bob@kalam.dev` — Bob Martinez
- `carol@kalam.dev` — Carol Singh

## Documents in this submission

| File | What it is |
|---|---|
| `README.md` | Product overview, seeded credentials, local setup, explicit cut list, what's next |
| `docs/ARCHITECTURE.md` | What was prioritized and why; the permissions-module design; the HTML-vs-ProseMirror-JSON tradeoff |
| `docs/AI_WORKFLOW.md` | The two-model workflow, landmines caught in planning, rejected AI suggestions, how correctness was verified |
| `docs/DECISIONS.md` | Raw append-only decision log, written during the build |
| `docs/VIDEO_SCRIPT.md` | Shot list used for the walkthrough video |
| `SUBMISSION.md` | This file |
| `video-link.txt` | Walkthrough video URL |
| `kalam-docs-source.zip` | Full source snapshot |

## Walkthrough video

**[link to be added]** — unlisted, 3–5 minutes, recorded against the live URL, following `docs/VIDEO_SCRIPT.md`. Also saved as a plain URL in `video-link.txt`.

## What's working

- Create, rename, delete documents
- Rich-text editing: bold, italic, underline, H1/H2/paragraph, bullet/numbered lists, undo/redo
- Debounced autosave with a visible save-status indicator
- Sharing: grant/revoke, Viewer/Editor roles, server-side enforcement on every route (independently verified via direct API calls, not just through the UI)
- Import `.txt`/`.md`/`.docx` (max 2 MB) with structure preserved; export any viewable document to Markdown
- 15 automated tests passing (`npm test`), plus a manual click-through as all three seeded roles on the live deployment

## What's incomplete / explicitly cut

See `README.md` → "What's intentionally not here" and "What I'd build next." In short: no real-time collaboration (debounced autosave + last-writer-wins instead, by design), no version history, no live presence indicators, and imported files aren't retained in their original format (only the parsed HTML is kept).

## How to verify this submission quickly

1. Open the live URL, click "Alice" to sign in instantly.
2. Open a document, apply a few formats, watch the save indicator.
3. Share it with Bob as Viewer from the Share button; open a private/incognito window, sign in as Bob, confirm read-only.
4. Back as Alice, upgrade Bob to Editor; refresh Bob's window; confirm he can now edit.
5. Import a `.md` or `.docx` file from the dashboard; confirm structure survives.
6. `git clone`, follow `README.md`'s setup, run `npm test` — 15 passing.
