import { describe, it, expect, beforeEach } from "vitest";
import { createSessionCookie } from "@/lib/session";
import { resetDb, createTestUser } from "./db";
import { POST as postImport } from "@/app/api/documents/import/route";

describe("import API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("imports a markdown file into a new document with structure and provenance intact", async () => {
    const user = await createTestUser("importer@kalam.test", "Importer");
    await createSessionCookie({ userId: user.id, name: user.name, email: user.email });

    const markdown = "# Hello\n\n- one\n- two\n";
    const form = new FormData();
    form.append("file", new File([markdown], "notes.md", { type: "text/markdown" }));

    const res = await postImport(
      new Request("http://test/api/documents/import", { method: "POST", body: form }),
    );
    expect(res.status).toBe(201);

    const doc = await res.json();
    expect(doc.sourceFilename).toBe("notes.md");
    expect(doc.content).toContain("<h1>Hello</h1>");
    expect(doc.content).toContain("<li>one</li>");
    expect(doc.content).toContain("<li>two</li>");
  });

  it("rejects an unsupported file type", async () => {
    const user = await createTestUser("importer2@kalam.test", "Importer2");
    await createSessionCookie({ userId: user.id, name: user.name, email: user.email });

    const form = new FormData();
    form.append("file", new File(["hi"], "notes.pdf", { type: "application/pdf" }));

    const res = await postImport(
      new Request("http://test/api/documents/import", { method: "POST", body: form }),
    );
    expect(res.status).toBe(400);
  });
});
