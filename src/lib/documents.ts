import { prisma } from "@/lib/prisma";
import { accessLevelFor, type AccessLevel } from "@/lib/permissions";

export async function getDocumentWithAccess(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      shares: { where: { userId }, select: { role: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!document) return null;

  const share = document.shares[0] ?? null;
  const level: AccessLevel = accessLevelFor(document, share, userId);
  return { document, level };
}
