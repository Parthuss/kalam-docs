import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate/seed) needs the direct connection — Prisma Migrate uses
// named prepared statements and a session-scoped advisory lock that PgBouncer
// in transaction mode breaks. Runtime queries use the pooled DATABASE_URL
// instead (see src/lib/prisma.ts). Prisma 7 has no `directUrl` schema field,
// so this split has to happen here.
//
// `npm test`'s pretest script runs this CLI as its own process, outside
// Vitest's env injection, so NODE_ENV=test (set inline in that script) is
// how it knows to migrate the Neon test branch instead of production —
// shell-level `VAR=$OTHER_VAR` substitution can't see into this .env file.
const isTest = process.env.NODE_ENV === "test";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: isTest
      ? process.env.TEST_DATABASE_URL
      : (process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL),
  },
});
