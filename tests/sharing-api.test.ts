import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSessionCookie } from "@/lib/session";
import { resetDb, createTestUser } from "./db";
import { GET as getDocument, PATCH as patchDocument } from "@/app/api/documents/[id]/route";
import { POST as postShare } from "@/app/api/documents/[id]/shares/route";
import { PATCH as patchShare } from "@/app/api/documents/[id]/shares/[shareId]/route";

describe("sharing API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("owner grants VIEWER → viewer GETs 200 but PATCHes 403 → upgrade to EDITOR → viewer PATCHes 200", async () => {
    const owner = await createTestUser("owner@kalam.test", "Owner");
    const viewer = await createTestUser("viewer@kalam.test", "Viewer");

    const doc = await prisma.document.create({
      data: { ownerId: owner.id, title: "Doc", content: "<p>hi</p>" },
    });

    await createSessionCookie({ userId: owner.id, name: owner.name, email: owner.email });
    const shareRes = await postShare(
      new Request(`http://test/api/documents/${doc.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: viewer.email, role: "VIEWER" }),
      }),
      { params: Promise.resolve({ id: doc.id }) },
    );
    expect(shareRes.status).toBe(201);
    const share: { id: string } = await shareRes.json();

    await createSessionCookie({ userId: viewer.id, name: viewer.name, email: viewer.email });

    const getRes = await getDocument(new Request(`http://test/api/documents/${doc.id}`), {
      params: Promise.resolve({ id: doc.id }),
    });
    expect(getRes.status).toBe(200);

    const forbiddenPatch = await patchDocument(
      new Request(`http://test/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Hacked by viewer" }),
      }),
      { params: Promise.resolve({ id: doc.id }) },
    );
    expect(forbiddenPatch.status).toBe(403);

    await createSessionCookie({ userId: owner.id, name: owner.name, email: owner.email });
    const upgradeRes = await patchShare(
      new Request(`http://test/api/documents/${doc.id}/shares/${share.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "EDITOR" }),
      }),
      { params: Promise.resolve({ id: doc.id, shareId: share.id }) },
    );
    expect(upgradeRes.status).toBe(200);

    await createSessionCookie({ userId: viewer.id, name: viewer.name, email: viewer.email });
    const allowedPatch = await patchDocument(
      new Request(`http://test/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Edited by upgraded editor" }),
      }),
      { params: Promise.resolve({ id: doc.id }) },
    );
    expect(allowedPatch.status).toBe(200);
  });
});
