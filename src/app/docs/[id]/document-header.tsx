"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AccessLevel } from "@/lib/permissions";

export default function DocumentHeader({
  id,
  title,
  access,
}: {
  id: string;
  title: string;
  access: AccessLevel;
}) {
  const router = useRouter();
  const [value, setValue] = useState(title);
  const [editing, setEditing] = useState(false);
  const canRename = access === "OWNER" || access === "EDITOR";

  async function saveRename() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) router.refresh();
    else setValue(title);
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/docs" className="shrink-0 text-sm text-slate-400 hover:text-slate-600">
          ← Documents
        </Link>
        {canRename && editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setValue(title);
                setEditing(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-indigo-300 px-2 py-1 text-lg font-semibold text-slate-900 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => canRename && setEditing(true)}
            className="min-w-0 truncate text-lg font-semibold text-slate-900 disabled:cursor-text"
            disabled={!canRename}
          >
            {value}
          </button>
        )}
      </div>
      {access === "VIEWER" && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          View only
        </span>
      )}
    </div>
  );
}
