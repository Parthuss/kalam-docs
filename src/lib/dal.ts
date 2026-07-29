import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionFromCookies, type SessionPayload } from "@/lib/session";

// Centralized auth check. Every Server Component and Route Handler that
// touches document data must call one of these — proxy.ts is only an
// optimistic UX redirect, never the real gate. See docs/ARCHITECTURE.md.
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await readSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  return session;
});

export const getOptionalSession = cache(
  async (): Promise<SessionPayload | null> => {
    return readSessionFromCookies();
  },
);
