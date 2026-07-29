"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function DocumentRow({
  id,
  title,
  updatedAt,
  canRename,
  canDelete,
  badge,
  sharedBy,
}: {
  id: string;
  title: string;
  updatedAt: string;
  canRename: boolean;
  canDelete: boolean;
  badge?: string;
  sharedBy?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function saveRename() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setValue(title);
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else setConfirmingDelete(false);
  }

  return (
    <li className="flex items-center justify-between rounded-lg px-2 py-3 -mx-2 hover:bg-stone-50">
      <div className="min-w-0 flex-1">
        {editing ? (
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
            className="w-full rounded border border-accent-300 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-200"
          />
        ) : (
          <Link
            href={`/docs/${id}`}
            className="block truncate text-sm font-medium text-slate-800 hover:text-accent-700"
          >
            {title}
          </Link>
        )}
        <p className="mt-0.5 text-xs text-slate-400">
          Updated {formatRelative(updatedAt)}
          {sharedBy && ` · shared by ${sharedBy}`}
        </p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        {badge && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {badge}
          </span>
        )}
        {canRename && !editing && (
          <button
            onClick={() => setEditing(true)}
            disabled={busy}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Rename
          </button>
        )}
        {canDelete && (
          <>
            {confirmingDelete && (
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={busy}
              className={
                confirmingDelete
                  ? "rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  : "text-xs text-slate-400 hover:text-red-600"
              }
            >
              {confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
