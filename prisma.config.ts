import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate/seed) needs the direct connection — Prisma Migrate uses
// named prepared statements and a session-scoped advisory lock that PgBouncer
// in transaction mode breaks. Runtime queries use the pooled DATABASE_URL
// instead (see src/lib/prisma.ts). Prisma 7 has no `directUrl` schema field,
// so this split has to happen here.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
