import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession, jsonError } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const userId = auth.session.userId;

  const [owned, sharedRows] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.documentShare.findMany({
      where: { userId },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: { select: { id: true, title: true, updatedAt: true } },
        grantedBy: { select: { name: true } },
      },
    }),
  ]);

  const shared = sharedRows.map((s) => ({
    ...s.document,
    role: s.role,
    sharedBy: s.grantedBy.name,
  }));

  return NextResponse.json({ owned, shared });
}

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid title.", 400);

  const doc = await prisma.document.create({
    data: {
      ownerId: auth.session.userId,
      title: parsed.data.title ?? "Untitled document",
      content: "",
    },
  });
  return NextResponse.json(doc, { status: 201 });
}
