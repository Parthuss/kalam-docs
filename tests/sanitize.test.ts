import { describe, it, expect } from "vitest";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

describe("sanitizeDocumentHtml", () => {
  it("strips script tags", () => {
    const out = sanitizeDocumentHtml("<p>hi</p><script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
  });

  it("strips inline event handler attributes", () => {
    const out = sanitizeDocumentHtml('<p onerror="alert(1)">hi</p>');
    expect(out).not.toContain("onerror");
  });

  it("strips javascript: link targets", () => {
    const out = sanitizeDocumentHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("keeps content matching the Tiptap schema intact", () => {
    const out = sanitizeDocumentHtml("<h1>Title</h1><p><strong>bold</strong> text</p>");
    expect(out).toBe("<h1>Title</h1><p><strong>bold</strong> text</p>");
  });
});
