import { describe, it, expect } from "vitest";
import {
  accessLevelFor,
  canView,
  canEdit,
  canRename,
  canShare,
  canDelete,
  type AccessLevel,
} from "@/lib/permissions";

const OWNER_ID = "user-owner";
const OTHER_ID = "user-other";

describe("accessLevelFor", () => {
  it("returns OWNER when the user owns the document", () => {
    expect(accessLevelFor({ ownerId: OWNER_ID }, null, OWNER_ID)).toBe("OWNER");
  });

  it("returns the share role when a share exists", () => {
    expect(
      accessLevelFor({ ownerId: OWNER_ID }, { role: "EDITOR" }, OTHER_ID),
    ).toBe("EDITOR");
    expect(
      accessLevelFor({ ownerId: OWNER_ID }, { role: "VIEWER" }, OTHER_ID),
    ).toBe("VIEWER");
  });

  it("returns NONE when there is no share and the user isn't the owner", () => {
    expect(accessLevelFor({ ownerId: OWNER_ID }, null, OTHER_ID)).toBe("NONE");
  });

  it("owner takes precedence even if a share row somehow exists", () => {
    expect(
      accessLevelFor({ ownerId: OWNER_ID }, { role: "VIEWER" }, OWNER_ID),
    ).toBe("OWNER");
  });
});

describe("predicate matrix", () => {
  const cases: Array<{
    level: AccessLevel;
    view: boolean;
    edit: boolean;
    rename: boolean;
    share: boolean;
    del: boolean;
  }> = [
    { level: "OWNER", view: true, edit: true, rename: true, share: true, del: true },
    { level: "EDITOR", view: true, edit: true, rename: true, share: false, del: false },
    { level: "VIEWER", view: true, edit: false, rename: false, share: false, del: false },
    { level: "NONE", view: false, edit: false, rename: false, share: false, del: false },
  ];

  it.each(cases)(
    "level=$level -> view=$view edit=$edit rename=$rename share=$share delete=$del",
    ({ level, view, edit, rename, share, del }) => {
      expect(canView(level)).toBe(view);
      expect(canEdit(level)).toBe(edit);
      expect(canRename(level)).toBe(rename);
      expect(canShare(level)).toBe(share);
      expect(canDelete(level)).toBe(del);
    },
  );
});
