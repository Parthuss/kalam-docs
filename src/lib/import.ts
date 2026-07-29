import mammoth from "mammoth";
import { marked } from "marked";

const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // "PK\x03\x04" — docx is a zip

export const SUPPORTED_IMPORT_EXTENSIONS = ["txt", "md", "docx"] as const;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textToHtml(text: string): string {
  return text
    .split(/\r?\n\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`)
    .join("");
}

export async function parseImportFile(buffer: Buffer, ext: string): Promise<string> {
  if (ext === "txt") {
    return textToHtml(buffer.toString("utf-8"));
  }
  if (ext === "md") {
    return marked.parse(buffer.toString("utf-8"), { async: false }) as string;
  }
  if (ext === "docx") {
    // Validate on magic bytes, not just the extension — a renamed non-docx
    // file would otherwise throw an unhandled error deep inside mammoth.
    if (!buffer.subarray(0, 4).equals(DOCX_MAGIC)) {
      throw new Error("That file doesn't look like a valid .docx document.");
    }
    // { buffer }, never { path } — there is no filesystem in the Lambda.
    const result = await mammoth.convertToHtml({ buffer });
    return result.value;
  }
  throw new Error("Unsupported file type.");
}
