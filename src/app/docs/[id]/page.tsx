import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView } from "@/lib/permissions";
import DocumentHeader from "./document-header";

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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <DocumentHeader id={id} title={result.document.title} access={result.level} />
      <div
        className="prose prose-slate mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: result.document.content }}
      />
      <p className="mt-8 text-xs text-slate-400">
        Rich-text editor arrives in Phase 3.
      </p>
    </div>
  );
}
