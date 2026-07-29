import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";
import CreateDocumentButton from "./create-document-button";
import ImportButton from "./import-button";
import DocumentRow from "./document-row";

export default async function DocsHome() {
  const session = await verifySession();

  const [owned, sharedRows] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: session.userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentShare.findMany({
      where: { userId: session.userId },
      orderBy: { document: { updatedAt: "desc" } },
      include: { document: true, grantedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-semibold text-slate-900">Kalam</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{session.name}</span>
          <LogoutButton />
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-slate-400">
            My documents
          </h2>
          <div className="flex items-center gap-2">
            <ImportButton />
            <CreateDocumentButton />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Import supports .txt, .md, and .docx files up to 2 MB.
        </p>
        {owned.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            No documents yet — create your first one.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {owned.map((doc) => (
              <DocumentRow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                updatedAt={doc.updatedAt.toISOString()}
                canRename
                canDelete
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-wide text-slate-400">
          Shared with me
        </h2>
        {sharedRows.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            Nothing has been shared with you yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sharedRows.map((s) => (
              <DocumentRow
                key={s.document.id}
                id={s.document.id}
                title={s.document.title}
                updatedAt={s.document.updatedAt.toISOString()}
                canRename={s.role === "EDITOR"}
                canDelete={false}
                badge={s.role === "EDITOR" ? "Editor" : "Viewer"}
                sharedBy={s.grantedBy.name}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
