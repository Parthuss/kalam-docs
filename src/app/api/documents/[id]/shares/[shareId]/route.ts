import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession, jsonError } from "@/lib/api-helpers";
import { getDocumentWithAccess } from "@/lib/documents";
import { canShare } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; shareId: string }> };

const PatchSchema = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id, shareId } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canShare(result.level)) {
    return jsonError("Only the owner can change sharing.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid role.", 400);

  const share = await prisma.documentShare.update({
    where: { id: shareId, documentId: id },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(share);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id, shareId } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canShare(result.level)) {
    return jsonError("Only the owner can revoke sharing.", 403);
  }

  await prisma.documentShare.delete({ where: { id: shareId, documentId: id } });
  return NextResponse.json({ ok: true });
}
