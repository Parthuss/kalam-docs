import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession, jsonError } from "@/lib/api-helpers";
import { sanitizeDocumentHtml } from "@/lib/sanitize";
import {
  parseImportFile,
  SUPPORTED_IMPORT_EXTENSIONS,
  MAX_IMPORT_BYTES,
} from "@/lib/import";

export const runtime = "nodejs";

type SupportedExt = (typeof SUPPORTED_IMPORT_EXTENSIONS)[number];

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError("No file uploaded.", 400);
  }

  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!SUPPORTED_IMPORT_EXTENSIONS.includes(ext as SupportedExt)) {
    return jsonError("Unsupported file type. Use .txt, .md, or .docx.", 400);
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return jsonError("File too large (max 2 MB).", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let html: string;
  try {
    html = await parseImportFile(buffer, ext);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Could not read that file.",
      422,
    );
  }

  const title = file.name.replace(/\.[^.]+$/, "").trim() || "Imported document";

  const doc = await prisma.document.create({
    data: {
      ownerId: auth.session.userId,
      title,
      content: sanitizeDocumentHtml(html),
      sourceFilename: file.name,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
