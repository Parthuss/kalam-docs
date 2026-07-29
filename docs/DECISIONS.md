# Decision log

Append-only. Written in the moment, not reconstructed afterward — see docs/AI_WORKFLOW.md.

## [T+0:00] Two-model workflow
Used Claude Opus 5 for architecture planning and an adversarial stress-test of the proposed stack before writing any code; switched to Claude Sonnet 5 for directed implementation against that plan. Reasoning: planning benefits from deeper reasoning and is done once; implementation is high-volume and benefits from speed against a spec that has already absorbed the hard thinking.

## [T+0:00] Neon Postgres instead of SQLite-in-/tmp
A prior project of mine used SQLite written to Vercel's /tmp, which resets on every cold start. For a doc editor whose core demo is "share a doc, log in as the other user," that would visibly lose data mid-review. Neon Postgres free tier has no credit card requirement and survives cold starts. Chosen over Prisma Postgres for no specific reason other than familiarity with Neon's branch model, which also solves test isolation (see next entry).

## [T+0:00] Rejected: @prisma/adapter-neon
Neon's own docs recommend `@prisma/adapter-neon` (WebSocket transport) for "serverless compatibility." That guidance targets Edge/Workers runtimes with no raw TCP. This app's Route Handlers and proxy.ts are both Node runtime with TCP available, and `pg` — required by `@prisma/adapter-pg` — is on Next.js's auto-`serverExternalPackages` list, so it's never bundled by Turbopack. Chose `adapter-pg` deliberately against the vendor's default recommendation.

## [T+0:00] Rejected: `directUrl` in schema.prisma
Every pre-Prisma-7 tutorial adds `directUrl = env("DIRECT_URL")` to the schema's datasource block for pooled/direct connection splitting. Prisma 7's `Datasource` config type has no `directUrl` field — it would be a schema parse error. The split is instead done by prisma.config.ts (CLI-only, resolves DIRECT_DATABASE_URL) vs. the runtime adapter in src/lib/prisma.ts (resolves the pooled DATABASE_URL).

## [T+0:00] Rejected: `?schema=test` for test database isolation
Considered reusing one Neon database with a `?schema=test` query param for test isolation instead of provisioning a second branch. `@prisma/adapter-pg` ignores the `?schema=` parameter and always queries `public`, while `prisma migrate deploy` honors it — an open Prisma regression from v6. That combination would make tests silently create tables in one schema and query another. Used a separate Neon branch instead: zero code complexity, same free tier.

## [T+0:00] Migrations run from the laptop, not the Vercel build
`prisma migrate deploy` inside the Vercel build script is common advice, but a migration that fails partway writes a poisoned row into `_prisma_migrations`; every subsequent deploy then fails with P3018 until manually resolved — unrecoverable mid-timebox. Running `npm run db:deploy` before each push costs ten seconds and means the build can never fail for a database reason.

## [T+0:00] Content stored as sanitized HTML, not ProseMirror JSON
Tiptap accepts and emits HTML directly, and both the import path (mammoth/marked → HTML) and export path (HTML → Markdown via turndown) become close to free. Trade-off: a real XSS surface on every write, paid down with a strict server-side sanitize-html allowlist matching the Tiptap schema. Would choose ProseMirism JSON instead if versioning or CRDT collaboration were on the roadmap — they explicitly are not (see cut list below).

## [T+0:00] Explicit scope cuts
- Real-time collaborative editing (Yjs/CRDT + persistent WebSocket server): out of reach for a serverless free-tier deploy in this timebox. Shipping debounced autosave + last-writer-wins + a visible save-state indicator instead, documented plainly as not real-time collab.
- Blob storage for uploads: parsing files in the Route Handler and persisting only the resulting HTML removes a whole storage dependency and its failure modes, at the cost of not retaining the original file.
- Version history and live presence indicators: named as explicit "what I'd build next" items, not attempted.
