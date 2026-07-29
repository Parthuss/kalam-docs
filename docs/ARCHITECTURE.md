# Architecture

## What this was optimized for

Three things, deep rather than broad: **document editing** (a real toolbar, correct formatting, autosave that's visibly trustworthy), **sharing** (roles that are actually enforced, not just hidden in the UI), and **import/export** (real file parsing, not a stub). Everything else — real-time collaboration, version history, presence — is named and cut explicitly rather than half-attempted. A shallow version of everything would have been worse than a solid version of three things.

## Request flow

```
Browser → proxy.ts (optimistic redirect) → Server Component (verifySession)
                                          → Route Handler (requireApiSession)
                                                → getDocumentWithAccess()
                                                → permissions.ts predicates
                                                → Prisma → Neon Postgres
```

`proxy.ts` only redirects unauthenticated requests away from `/docs/*` for a snappy UX — it is never the real authorization boundary. Every Server Component and every Route Handler independently calls `verifySession()`/`requireApiSession()` and re-checks permissions, because a Route Handler is a public HTTP endpoint regardless of what page linked to it.

## Permissions: one module, two callers

`src/lib/permissions.ts` is pure — no DB import, no framework import, just functions from `(document, share, userId)` to an `AccessLevel` (`OWNER | EDITOR | VIEWER | NONE`) and predicates (`canView`, `canEdit`, `canRename`, `canShare`, `canDelete`) over that level. Both the API routes and the React components import the *same* module. The UI hides a "Delete" button a Viewer can't use; the API independently rejects the DELETE request if it somehow arrives anyway. These two enforcement points can't drift apart because they're not two implementations of the same rule — they're one implementation called from two places. This is the single decision I'd point to first if asked "what shows real backend judgment here."

## Data model

Three tables: `User`, `Document`, `DocumentShare`. `DocumentShare` is a join table (`documentId`, `userId`, `role`) with a `@@unique([documentId, userId])` constraint, so "share with the same person twice" is a database-level impossibility, not just an application check — the API's 409 on a duplicate share is Postgres telling the truth, not just the app being polite.

## Why HTML, not ProseMirror JSON

Tiptap can serialize to either. HTML was chosen because both edges of the pipeline are cheaper in HTML: `mammoth` and `marked` both emit HTML directly on import, and `turndown` consumes HTML directly on export. Choosing ProseMirror JSON would have meant an HTML→JSON translation layer on import and a JSON→HTML (then →Markdown) layer on export, for a feature (import/export) that's explicitly one of the three things this build goes deep on.

The cost is a real one: HTML persisted from an "import" path is attacker-influenced input, so every write goes through a strict server-side allowlist (`sanitize-html`, in `src/lib/sanitize.ts`) matching exactly the tags Tiptap's StarterKit produces — headings, lists, bold/italic/underline, links with `rel="noopener noreferrer"` forced on. `tests/sanitize.test.ts` asserts `<script>`, inline event handlers, and `javascript:` hrefs all come back clean.

If real-time collaboration or version history were in scope, ProseMirror JSON (or a CRDT-native format) would be the right call instead — HTML has no meaningful notion of "diff" or "merge." That tradeoff is exactly why those two features are on the explicit cut list rather than half-built: the storage format this build made sense of is not the format those features would need.

## Autosave: debounced, last-writer-wins, and honestly labeled

Every edit debounces to a `PATCH /api/documents/[id]` at 800ms, sanitized server-side before it touches the row. There is no operational transform and no conflict resolution — if two people edit the same document within the same debounce window, the later write wins and the earlier one is silently gone. The UI never claims otherwise: the save indicator says "Saving…" / "All changes saved" / "Save failed — retry," not "synced" or anything implying real-time merge. This is the honest boundary of what a REST PATCH endpoint can promise, and the README says so directly rather than letting a reviewer discover it by testing two tabs at once.

## Deployment

Vercel, zero-config, Node runtime throughout (no Edge). Build is `prisma generate && next build` — migrations are deliberately **not** in the build (see `docs/DECISIONS.md` for why: a partially-failed migration poisons `_prisma_migrations` and can lock out every future deploy mid-timebox). `npm run db:deploy` runs from the laptop before each push instead.

Neon Postgres, not SQLite: an editor whose core demo is "share a doc, log in as the other user" needs data that survives a serverless cold start. The pooled/direct connection-string split (`DATABASE_URL` vs `DIRECT_DATABASE_URL`) exists because Prisma Migrate's advisory locks and named prepared statements don't survive PgBouncer's transaction-mode pooling — runtime queries use the pooled connection, migrations use the direct one, and Prisma 7 has no schema-level field for this split, so it lives in `prisma.config.ts` instead.

## Full decision log

`docs/DECISIONS.md` is the append-only, timestamped record this summary was written from — every tradeoff above, plus the landmines hit and fixed along the way (a Vercel deployment-protection default that would have blocked reviewer access entirely, a CSS cascade-layers bug that silently broke the light theme, a test-runner script that only worked by accident). Read that file for the raw, in-the-moment version; this file is the synthesized one.
