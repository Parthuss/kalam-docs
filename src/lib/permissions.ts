// Pure predicates, no DB, no imports. Imported by both API routes and UI
// components so client-side hiding and server-side enforcement can never
// drift apart — see docs/ARCHITECTURE.md.

export type AccessLevel = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

export function accessLevelFor(
  doc: { ownerId: string },
  share: { role: "VIEWER" | "EDITOR" } | null,
  userId: string,
): AccessLevel {
  if (doc.ownerId === userId) return "OWNER";
  if (share) return share.role;
  return "NONE";
}

export function canView(level: AccessLevel): boolean {
  return level !== "NONE";
}

export function canEdit(level: AccessLevel): boolean {
  return level === "OWNER" || level === "EDITOR";
}

export function canRename(level: AccessLevel): boolean {
  return level === "OWNER" || level === "EDITOR";
}

export function canShare(level: AccessLevel): boolean {
  return level === "OWNER";
}

export function canDelete(level: AccessLevel): boolean {
  return level === "OWNER";
}
