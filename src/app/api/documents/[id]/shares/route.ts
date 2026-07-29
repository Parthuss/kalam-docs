import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession, jsonError } from "@/lib/api-helpers";
import { getDocumentWithAccess } from "@/lib/documents";
import { canShare } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canShare(result.level)) {
    return jsonError("Only the owner can view sharing settings.", 403);
  }

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ shares });
}

const ShareSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["VIEWER", "EDITOR"]),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canShare(result.level)) {
    return jsonError("Only the owner can share this document.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = ShareSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a valid email and role.", 400);

  if (parsed.data.email === auth.session.email.toLowerCase()) {
    return jsonError("You can't share a document with yourself.", 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!targetUser) return jsonError("No user with that email.", 404);

  const existing = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
  });
  if (existing) return jsonError("Already shared with this person.", 409);

  const share = await prisma.documentShare.create({
    data: {
      documentId: id,
      userId: targetUser.id,
      role: parsed.data.role,
      grantedById: auth.session.userId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(share, { status: 201 });
}
