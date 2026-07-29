import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
};

const COOKIE_NAME = "kalam_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a strong random value");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function readSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
