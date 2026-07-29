"use client";

import { useEffect, useState } from "react";

type Role = "VIEWER" | "EDITOR";
type Share = {
  id: string;
  role: Role;
  user: { id: string; name: string; email: string };
};

export default function ShareModal({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [confirmingRevokeId, setConfirmingRevokeId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/shares`)
      .then((r) => r.json())
      .then((data) => setShares(data.shares ?? []))
      .catch(() => setShares([]));
  }, [documentId]);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/documents/${documentId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    const share: Share = await res.json();
    setShares((prev) => [...(prev ?? []), share]);
    setEmail("");
  }

  async function changeRole(shareId: string, newRole: Role) {
    setError(null);
    setRowBusyId(shareId);
    const res = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setRowBusyId(null);
    if (res.ok) {
      setShares(
        (prev) => prev?.map((s) => (s.id === shareId ? { ...s, role: newRole } : s)) ?? null,
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't change that person's role.");
    }
  }

  async function revoke(shareId: string) {
    if (confirmingRevokeId !== shareId) {
      setConfirmingRevokeId(shareId);
      return;
    }
    setError(null);
    setRowBusyId(shareId);
    const res = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
      method: "DELETE",
    });
    setRowBusyId(null);
    setConfirmingRevokeId(null);
    if (res.ok) {
      setShares((prev) => prev?.filter((s) => s.id !== shareId) ?? null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't revoke that person's access.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Share document</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Close
          </button>
        </div>

        <form onSubmit={grant} className="mt-4 flex gap-2">
          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-accent-600 focus:outline-none"
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            Share
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          <p className="text-xs font-medium tracking-wide text-slate-400">Who has access</p>
          {shares === null ? (
            <p className="mt-3 text-sm text-slate-400">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Only you have access.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {shares.map((s) => {
                const rowBusy = rowBusyId === s.id;
                const confirming = confirmingRevokeId === s.id;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-800">{s.user.name}</p>
                      <p className="truncate text-xs text-slate-400">{s.user.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={s.role}
                        disabled={rowBusy}
                        onChange={(e) => changeRole(s.id, e.target.value as Role)}
                        className="rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-600 disabled:opacity-50"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                      {confirming && (
                        <button
                          type="button"
                          onClick={() => setConfirmingRevokeId(null)}
                          disabled={rowBusy}
                          className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => revoke(s.id)}
                        disabled={rowBusy}
                        className={
                          confirming
                            ? "rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            : "rounded px-2 py-1 text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
                        }
                      >
                        {rowBusy ? "Working…" : confirming ? "Confirm revoke" : "Revoke"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
