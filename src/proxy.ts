import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/session";

// Optimistic, cookie-only check for fast redirects. This is NOT the real
// authorization boundary — every Server Component and Route Handler under
// /docs and /api independently calls verifySession()/permissions checks via
// src/lib/dal.ts and src/lib/permissions.ts. See docs/ARCHITECTURE.md.
//
// Matcher is intentionally narrow (excludes /api/*): Next 16's proxy buffers
// the whole request body in memory to make it re-readable in the handler,
// and silently truncates bodies over proxyClientMaxBodySize instead of
// rejecting them. Keeping /api/* out of the matcher means uploads are never
// double-buffered or silently truncated by the proxy layer.
const PROTECTED_PREFIXES = ["/docs"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/docs/:path*"],
};
