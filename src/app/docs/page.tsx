import { verifySession } from "@/lib/dal";
import LogoutButton from "./logout-button";

// Placeholder shell for Phase 1 — proves login + session + proxy protection
// work end to end. Phase 2 replaces this with the real documents dashboard.
export default async function DocsHome() {
  const session = await verifySession();
  return (
    <div className="flex flex-1 flex-col px-8 py-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-semibold text-slate-900">Kalam</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{session.name}</span>
          <LogoutButton />
        </div>
      </div>
      <p className="mt-8 text-slate-500">Documents dashboard coming in Phase 2.</p>
    </div>
  );
}
