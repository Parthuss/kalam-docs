"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import Toolbar from "./toolbar";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function DocumentEditor({
  id,
  initialContent,
  editable,
}: {
  id: string;
  initialContent: string;
  editable: boolean;
}) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHtmlRef = useRef(initialContent);

  async function save(html: string) {
    lastHtmlRef.current = html;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  // immediatelyRender: false avoids the SSR hydration mismatch Tiptap warns
  // about; a plain "use client" component (not next/dynamic) is sufficient
  // for this, and next/dynamic + ssr:false would fail anyway since the
  // parent page is a Server Component.
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: "prose prose-lg prose-slate max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor, transaction }) => {
      if (!editable || !transaction.docChanged) return;
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      setSaveState("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(html), 800);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-stone-100">
      {editable && editor && (
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-2">
            <Toolbar editor={editor} />
            <SaveIndicator state={saveState} onRetry={() => save(lastHtmlRef.current)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 justify-center px-6 py-10">
        <div className="min-h-[60vh] w-full max-w-[47.5rem] rounded-sm border border-stone-200 bg-white px-6 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.08)] focus-within:ring-2 focus-within:ring-accent-100 sm:px-16 sm:py-20">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry: () => void;
}) {
  if (state === "idle") return <span />;
  if (state === "saving") {
    return <span className="shrink-0 text-xs text-slate-400">Saving…</span>;
  }
  if (state === "saved") {
    return <span className="shrink-0 text-xs text-slate-400">All changes saved</span>;
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
    >
      Save failed — retry
    </button>
  );
}
