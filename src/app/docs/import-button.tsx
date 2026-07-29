"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — enforced again server-side

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (file.size > MAX_BYTES) {
      setError("File too large (max 2 MB).");
      return;
    }

    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/documents/import", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import failed.");
      return;
    }
    const doc = await res.json();
    router.push(`/docs/${doc.id}`);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? "Importing…" : "Import file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx"
        onChange={handleChange}
        className="hidden"
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
