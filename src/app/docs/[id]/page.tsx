import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView, canEdit } from "@/lib/permissions";
import DocumentHeader from "./document-header";
import DocumentEditor from "./editor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const { id } = await params;

  const result = await getDocumentWithAccess(id, session.userId);
  if (!result || !canView(result.level)) notFound();

  return (
    <main id="main-content" className="flex w-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 pt-8">
        <DocumentHeader id={id} title={result.document.title} access={result.level} />
      </div>
      <DocumentEditor
        key={id}
        id={id}
        initialContent={result.document.content}
        editable={canEdit(result.level)}
      />
    </main>
  );
}
