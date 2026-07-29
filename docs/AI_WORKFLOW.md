# AI workflow

## Tools and the division of labor

Two models, deliberately split by what they're each good at:

- **Claude Opus 5** did the architecture: reading the brief, surveying my existing shipped projects for established conventions to reuse, running an adversarial stress-test of the proposed stack before a single line of code was written, and producing a phased execution plan with explicit fallback gates.
- **Claude Sonnet 5** did the implementation: writing every file in this repo, running the deploy pipeline, clicking through the app as three different seeded users, writing and running tests, and writing this documentation.

The reasoning for the split: planning is a one-time cost where deeper, slower reasoning pays for itself — a stress-test that catches a landmine before code exists is worth far more than the same catch after the fact. Implementation is high-volume and benefits from a fast model executing against a spec that has already absorbed the hard thinking. Doing all of this in one model would have meant either over-thinking every file edit or under-thinking the architecture; splitting it let each phase get the right kind of attention.

Other than the two Claude models, no other AI tools were used — no Copilot, no separate code-review bot. The adversarial stress-test in the planning phase functioned as the review pass, ahead of implementation rather than after it.

## Where AI materially sped things up (with evidence, not just a vibe)

The planning-phase stress-test surfaced three landmines *before any code existed*, each of which would have cost real debugging time to discover the normal way:

1. **The `?schema=` test-isolation trap.** `@prisma/adapter-pg` silently ignores the `?schema=` query parameter and always queries `public`, while `prisma migrate deploy` honors it — an open Prisma regression from v6 that every StackOverflow answer on the topic predates. Following the "obvious" approach (one Neon database, two schemas) would have produced tests that create tables in one schema and query another, with a failure message ("table does not exist") that gives no hint the real problem is schema routing. Caught in planning; avoided by provisioning a second Neon branch instead. Conservatively 30–45 minutes of confused debugging avoided.
2. **Tailwind v4 Preflight silently breaking the rich-text editor.** `@import "tailwindcss"` unconditionally resets `h1..h6` to `font-size: inherit` and `ol/ul` to `list-style: none`. Without the fix (`@tailwindcss/typography` + `prose` classes), clicking "Heading 1" in the editor would visually do nothing and a reviewer would reasonably conclude the editor doesn't work. This is exactly the kind of bug that's invisible until someone actually looks at the rendered output — caught by reading Tailwind's own Preflight source during planning, not by trial and error.
3. **Prisma 7 removed the `directUrl` schema field.** Every pre-v7 tutorial for pooled/direct connection splitting adds `directUrl = env("DIRECT_URL")` to `schema.prisma`. In Prisma 7 this is a schema parse error. Caught by reading `@prisma/config`'s actual TypeScript types rather than following stale tutorial guidance — avoided a confusing first `prisma generate` failure.

## What AI output was changed or rejected

Four concrete cases, not a vague "AI helped a lot":

1. **Rejected `@prisma/adapter-neon`.** Neon's own documentation recommends this adapter for "serverless compatibility." That guidance targets Edge/Workers runtimes with no raw TCP socket access. This app's Route Handlers and `proxy.ts` are both Node runtime with TCP available, and `pg` (required by the alternative, `adapter-pg`) is on Next.js's auto-`serverExternalPackages` list, so it's never bundled by Turbopack. Went with `adapter-pg` against the vendor's own default suggestion, deliberately.
2. **Rejected `next/dynamic` + `ssr: false` for the editor.** The initial plan called for lazy-loading the Tiptap editor this way, following the common pattern for client-only libraries. It doesn't work here: the document page is a Server Component (it awaits `verifySession()`), and Next 16 explicitly fails `ssr: false` inside a Server Component. The actual fix was simpler than the rejected approach — a plain `"use client"` component with `immediatelyRender: false` achieves the same thing with less machinery, which is a better outcome than the one initially proposed.
3. **Rejected `?schema=test` for database test isolation** (see above) in favor of a dedicated Neon branch.
4. **Rejected the initial `pretest` script.** It read `DIRECT_DATABASE_URL=$TEST_DATABASE_URL prisma migrate deploy` — relying on `$TEST_DATABASE_URL` being pre-exported in the shell rather than loaded from `.env`. It happened to work in my own terminal because I'd exported it manually earlier in the session; it would have failed instantly for anyone following the README from a clean clone. Found by literally unsetting the variable and re-running the command — see `docs/DECISIONS.md` for the fix (branching inside `prisma.config.ts` on `NODE_ENV=test` instead of shell substitution).

## How correctness was verified

- **Automated tests**: 15 tests across 4 files (`npm test`), run against a dedicated Neon branch, not mocked. The most load-bearing one, `sharing-api.test.ts`, imports the real Route Handlers and calls them with real `Request` objects to prove the exact behavior the brief asks for: owner grants VIEWER → viewer GETs 200 but PATCHes 403 → owner upgrades to EDITOR → viewer PATCHes 200.
- **Manual multi-account verification on the live deployment** after every phase, not just localhost — logged in as Alice, Bob, and Carol in turn and clicked through create/edit/share/import/export from each role's perspective. This is what caught the one real application bug found during the build: a Viewer clicking into a read-only document triggered a spurious "Save failed" error, because Tiptap's `onUpdate` fires on non-content transactions and the code wasn't gating on `transaction.docChanged`. A passing typecheck and a passing test suite would not have caught this — it only showed up by actually clicking around as the restricted role.
- **Direct API verification via `curl`** for every permission edge case the UI doesn't have a button for: self-share (400), duplicate share (409), unknown email (404), non-owner access to sharing settings (403), oversized/wrong-type/corrupted-file imports (413/400/422).
- **`npx tsc --noEmit` and `npm run lint`** clean before every commit.
- **An accessibility scan** (`a11y-audit`'s scanner) against the source tree — most of its output was noise from analyzing individual component files as if each were an independent page, but it correctly flagged the absence of `<main>` landmarks on real pages, which got fixed. A manual grep for `focus:outline-none` (not something the scanner caught) turned up three inputs that removed the default focus ring without a replacement — fixed with `focus:ring-2` on each.

## An honesty note

Several of the landmines listed above were surfaced by asking Claude to research and cross-check claims against primary sources — Next.js's own docs bundled in `node_modules/next/dist/docs/`, Prisma's GitHub issue tracker, Tailwind's actual Preflight CSS — rather than trusting either training-data recall or my own assumptions. Where a claim couldn't be verified this way, it's marked as reasoning rather than fact in the planning record. That distinction — verified against a source vs. plausible-sounding — is worth more than any amount of enthusiasm about "using AI," and it's the main thing I'd want a reviewer to notice about how this was built.
