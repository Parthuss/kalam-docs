# Kalam (कलम)

A lightweight collaborative document editor — Google-Docs-lite. Built for the Ajaia AI-Native Full Stack Product Engineer assessment.

**Live:** https://kalam-docs.vercel.app
**Repo:** https://github.com/Parthuss/kalam-docs

## Seeded accounts

Every account uses the password `password123`. The login screen also has one-click buttons for these three so you never have to type them.

| Name | Email | Notes |
|---|---|---|
| Alice Chen | `alice@kalam.dev` | Owns 2 documents, has shared one with Bob as Editor |
| Bob Martinez | `bob@kalam.dev` | Owns 1 document, has shared it with Carol as Viewer |
| Carol Singh | `carol@kalam.dev` | Owns nothing; receives one shared document as Viewer |

This seeding is deliberate: log in as any of the three and you immediately see both an owned document and a shared one, with both roles represented, without clicking anything first.

## What it does

- **Create, rename, and edit documents** in a rich-text editor (bold, italic, underline, H1/H2, bullet/numbered lists, undo/redo), with debounced autosave and a visible save-status indicator.
- **Share documents** with other users as Viewer or Editor, change or revoke access at any time. Enforcement is server-side on every route — the UI hides actions a role can't perform, but the API independently rejects them regardless of what the client sends.
- **Import** `.txt`, `.md`, or `.docx` files (max 2 MB) as new documents, with heading/list/bold structure preserved.
- **Export** any document you can view to Markdown.

## What's intentionally not here

- **Real-time collaborative editing.** This is debounced autosave with last-writer-wins, not a live multiplayer cursor experience. Building that properly means a CRDT (Yjs) plus a persistent WebSocket server — out of reach for a serverless free-tier deploy in this timebox, and pretending otherwise would be the actual mistake. See `docs/ARCHITECTURE.md` for what that would take.
- **Uploaded file retention.** Imported files are parsed into HTML on the way in and only the HTML is kept — the original `.docx`/`.md`/`.txt` isn't stored. This removes a whole storage dependency (and its credentials, its failure modes) at the cost of not being able to hand back the original file.
- **Version history and live presence indicators.** Both are natural next steps, deliberately not attempted here — see "What I'd build next" below.

## What I'd build next with 2–4 more hours

1. **Version history** — snapshot `content` on each meaningful edit (not every keystroke), list past versions, restore. The schema change is small; the UI is the real work.
2. **Presence indicators** — even a polling-based "Alice is viewing this doc" avatar would meaningfully improve the collaboration story without needing a WebSocket server.
3. **Real-time collaboration** — the actual multiplayer experience, via Yjs + a small persistent server (this genuinely doesn't fit on Vercel's serverless model and would need a different deploy target).
4. **Richer import** — tables and images from `.docx` are currently dropped by mammoth's default conversion; a custom style map would recover more structure.

## Local setup

Requires Node 20.9+ and a Neon Postgres account (free tier, no credit card).

```bash
git clone https://github.com/Parthuss/kalam-docs.git
cd kalam-docs
npm install
cp .env.example .env
```

Fill in `.env` with three Neon connection strings — a pooled main-branch URL for `DATABASE_URL`, a direct main-branch URL for `DIRECT_DATABASE_URL`, and a direct URL to a separate branch for `TEST_DATABASE_URL` (see `.env.example` for the exact shape) — plus any random string for `SESSION_SECRET`.

```bash
npm run db:deploy   # applies migrations to your database
npm run db:seed     # creates Alice, Bob, Carol and their sample documents
npm run dev          # http://localhost:3412
```

To run the test suite (needs `TEST_DATABASE_URL` in `.env`, pointed at a separate Neon branch so tests never touch your main data):

```bash
npm test
```

All 15 tests pass as of the last commit — output is in `docs/AI_WORKFLOW.md`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 + Neon Postgres · Tiptap v3 · hand-rolled `jose` sessions · Vitest. See `docs/ARCHITECTURE.md` for the reasoning behind each choice.
