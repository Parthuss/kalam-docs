import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// max: 3 caps per-instance connections against Neon's small connection limit.
// Not max: 1 — Vercel Fluid Compute serves concurrent requests from one
// instance, so max: 1 would serialize them. Runtime always uses the pooled
// DATABASE_URL (hostname contains "-pooler"); migrations use the direct URL
// instead, via prisma.config.ts.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
