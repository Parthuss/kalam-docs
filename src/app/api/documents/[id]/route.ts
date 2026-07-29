import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession, jsonError } from "@/lib/api-helpers";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView, canEdit, canDelete } from "@/lib/permissions";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canView(result.level)) {
    return jsonError("You don't have access to this document.", 403);
  }

  return NextResponse.json({ ...result.document, access: result.level });
}

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(500_000).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canEdit(result.level)) {
    return jsonError("You don't have permission to edit this document.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid update.", 400);
  if (parsed.data.title === undefined && parsed.data.content === undefined) {
    return jsonError("Nothing to update.", 400);
  }

  const data: { title?: string; content?: string } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.content !== undefined) {
    data.content = sanitizeDocumentHtml(parsed.data.content);
  }

  const updated = await prisma.document.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canDelete(result.level)) {
    return jsonError("Only the owner can delete this document.", 403);
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
