import { NextResponse } from "next/server";
import TurndownService from "turndown";
import { requireApiSession, jsonError } from "@/lib/api-helpers";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

const turndown = new TurndownService();

export async function GET(request: Request, { params }: Params) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "md";
  if (format !== "md") return jsonError("Unsupported export format.", 400);

  const result = await getDocumentWithAccess(id, auth.session.userId);
  if (!result) return jsonError("Document not found.", 404);
  if (!canView(result.level)) {
    return jsonError("You don't have access to this document.", 403);
  }

  const markdown = turndown.turndown(result.document.content || "<p></p>");
  const safeName = result.document.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "document";

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.md"`,
    },
  });
}
