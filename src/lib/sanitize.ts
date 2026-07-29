import sanitizeHtml from "sanitize-html";

// Allowlist matches the Tiptap StarterKit schema — imported HTML and
// autosaved editor output both pass through this on the way into the DB.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "code", "pre",
];

export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
