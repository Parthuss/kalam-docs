import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/dal";
import type { SessionPayload } from "@/lib/session";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Route Handlers are public-facing endpoints — always re-verify here even
// though the pages that link to them are already behind proxy.ts.
export async function requireApiSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getOptionalSession();
  if (!session) {
    return { response: jsonError("Authentication required.", 401) };
  }
  return { session };
}
