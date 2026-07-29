import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionCookie } from "@/lib/session";
import { jsonError } from "@/lib/api-helpers";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Enter a valid email and password.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return jsonError("Invalid email or password.", 401);
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return jsonError("Invalid email or password.", 401);
  }

  await createSessionCookie({
    userId: user.id,
    name: user.name,
    email: user.email,
  });
  return NextResponse.json({ ok: true });
}
