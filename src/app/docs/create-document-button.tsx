"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const doc = await res.json();
      router.push(`/docs/${doc.id}`);
      return;
    }
    setBusy(false);
  }

  return (
    <button
      onClick={create}
      disabled={busy}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
    >
      {busy ? "Creating…" : "New document"}
    </button>
  );
}
