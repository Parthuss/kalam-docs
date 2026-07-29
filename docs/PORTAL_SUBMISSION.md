# Kalam — AI-Native Full Stack Product Engineer Assessment

**Live product:** https://kalam-docs.vercel.app
**Source (public repo):** https://github.com/Parthuss/kalam-docs
**Full deliverables (Drive folder):** [ADD DRIVE FOLDER LINK]
**Walkthrough video:** [ADD VIDEO LINK]

**Seeded accounts** (password `password123` for all — one-click quick-sign-in buttons also exist on the login screen):

| Name | Email | Notes |
|---|---|---|
| Alice Chen | `alice@kalam.dev` | Owns 2 documents, has shared one with Bob as Editor |
| Bob Martinez | `bob@kalam.dev` | Owns 1 document, has shared it with Carol as Viewer |
| Carol Singh | `carol@kalam.dev` | Owns nothing; receives one shared document as Viewer |

Seeding is deliberate: logging in as any of the three immediately shows both an owned document and a shared one, both roles represented, with nothing to click first.

---

## 1. Document creation and editing

Create, rename, and edit documents in a rich-text editor (Tiptap) — bold, italic, underline, H1/H2/paragraph, bullet/numbered lists, a one-click "Clear formatting" eraser, undo/redo. Debounced autosave (~800ms after typing stops) with a visible Saving… / All changes saved / Save failed → retry indicator. The editor renders as an actual bordered, shadowed page on a gray canvas — added after review caught that the first version had no visible page boundary.

## 2. File upload

Import `.txt`, `.md`, or `.docx` files (stated in the UI, capped at 2 MB, enforced client- and server-side) as new documents, with headings/lists/bold structure preserved. `.docx` parsing goes through `mammoth`; everything is sanitized server-side (`sanitize-html`) before it touches the database, since imported files are untrusted input by definition. Any document you can view can be exported back out to Markdown.

## 3. Sharing

Owner grants access by email, picks Viewer or Editor, can change the role or revoke at any time. Enforcement is server-side on every route — the UI hides actions a role can't perform, but the API independently rejects them regardless of what the client sends (verified directly with `curl`, not just through the UI: self-share 400, duplicate share 409, unknown email 404, non-owner access to sharing settings 403).

## 4. Persistence

Postgres (Neon, free tier) via Prisma, not SQLite-in-`/tmp` — the latter is what I used on a prior project, but it resets on cold start, which would visibly lose data mid-review for an app whose core demo is "share a doc, log in as the other user." Documents remain available after refresh; formatting survives via sanitized HTML round-tripped through Tiptap.

## 5. Product and engineering quality

- **Tests:** 15 automated tests across 4 files (`npm test`), run against a dedicated Neon branch, not mocked. The most load-bearing one imports the real Route Handlers and calls them with real `Request` objects to prove exactly the behavior the brief asks for: owner grants VIEWER → viewer GETs 200 but PATCHes 403 → owner upgrades to EDITOR → viewer PATCHes 200.
- **Setup/run instructions:** in `README.md` — clone, `npm install`, fill `.env` from `.env.example`, `npm run db:deploy && npm run db:seed && npm run dev`.
- **Validation and error handling:** zod validation at every API boundary; oversized/wrong-type/corrupted file imports return 413/400/422 with readable messages, not stack traces.
- **Architecture note:** `docs/ARCHITECTURE.md` — what was prioritized and why, the shared `permissions.ts` module imported by both API routes and UI (so client-side hiding and server-side enforcement can't drift apart), and the HTML-vs-ProseMirror-JSON storage tradeoff.
- **Decision log:** `docs/DECISIONS.md` — append-only, written during the build, not reconstructed after.

## AI-native workflow note

**Two models, split by what they're each good at.** Claude Opus 5 did the architecture — reading the brief, surveying my own previously-shipped projects for conventions worth reusing, running an adversarial stress-test of the proposed stack before any code existed, producing a phased plan with fallback gates. Claude Sonnet 5 did the implementation — every file, the deploy pipeline, clicking through the app as three seeded users, writing and running tests, writing this documentation. Reasoning: planning is a one-time cost where deeper reasoning pays for itself — a stress-test that catches a landmine before code exists is worth far more than the same catch afterward. Implementation is high-volume and benefits from a fast model executing against a spec that already absorbed the hard thinking.

**Where it materially sped things up, with evidence:** the planning-phase stress-test caught three landmines before any code existed — (1) `@prisma/adapter-pg` silently ignores Postgres's `?schema=` query param for test isolation while `prisma migrate deploy` honors it, an open Prisma regression that every existing answer online predates; (2) Tailwind v4's Preflight resets `h1..h6` and list styles, which would have made the rich-text editor's formatting buttons visually do nothing; (3) Prisma 7 removed the `directUrl` schema field that every pre-v7 tutorial tells you to add. Each would have cost real debugging time discovered the normal way.

**What was changed or rejected, not just accepted:**
1. Rejected `@prisma/adapter-neon` despite Neon's own docs recommending it — that guidance targets Edge runtimes with no TCP; this app's routes are Node runtime, so `adapter-pg` was the correct call against the vendor default.
2. Rejected `next/dynamic` + `ssr:false` for the editor — fails inside a Server Component in this Next.js version, and was unnecessary machinery anyway; a plain `"use client"` component was simpler and correct.
3. Rejected `?schema=test` for test isolation (see landmine above) in favor of a dedicated Neon branch.
4. Rejected an initial `pretest` script that relied on a shell variable happening to already be exported rather than read from `.env` — would have failed for anyone following the README from a clean clone. Found by literally unsetting the variable and re-running.

**How correctness was verified:** the automated tests above; direct `curl` calls against every permission edge case the UI doesn't have a button for; manual multi-account click-through on the **live deployment** (not just localhost) after every change, logged in as each of the three roles in turn. That manual pass is what caught the one real application bug in the build — a Viewer clicking into a read-only document triggered a spurious "Save failed" error, because Tiptap's `onUpdate` fires on non-content transactions and the code wasn't gating on `transaction.docChanged`. A passing typecheck and green test suite would not have caught that; it only showed up by clicking around as the restricted role. Post-submission, real user testing also caught two more real gaps a static review missed: the editor had no visible page container (fixed with a proper bordered/shadowed page-on-canvas layout), and the Share modal's Revoke/role-change controls had zero-padding hit targets with no error feedback on failure — both the API and the logic were already correct in that case, confirmed by direct `curl` calls before touching any code, but the UI gave no signal whether a click had registered.

**Honesty note:** several landmines above were surfaced by asking Claude to check claims against primary sources — Next.js's own bundled docs, Prisma's issue tracker, Tailwind's actual Preflight CSS — rather than trusting recall. That distinction, verified-against-a-source vs. plausible-sounding, is the thing worth noticing about how this was built, more than any amount of "used AI a lot."

## What's incomplete / what I'd build next with 2–4 more hours

Real-time collaborative editing is **not** implemented — this is debounced autosave with last-writer-wins, not live multiplayer cursors. Building that properly needs a CRDT (Yjs) plus a persistent WebSocket server, which doesn't fit a serverless free-tier deploy in this timebox; pretending otherwise would be the actual mistake. Also cut, deliberately: version history, live presence indicators, and retaining original uploaded files (only the parsed HTML is kept). With more time, in order: version history (schema change is small, UI is the real work), polling-based presence indicators, then real Yjs collaboration on a different deploy target, then a richer `.docx` import (tables/images are currently dropped by mammoth's default conversion).

## How to verify quickly

1. Open the live URL, click "Alice" to sign in instantly.
2. Open a document, apply formatting, watch the save indicator.
3. Share it with Bob as Viewer; open a private window, sign in as Bob, confirm read-only.
4. Back as Alice, upgrade Bob to Editor; refresh Bob's window; confirm he can now edit.
5. Import a `.md` or `.docx` file; confirm structure survives.
6. `git clone`, follow `README.md`, run `npm test` — 15 passing.
