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
        class: "prose prose-slate max-w-none focus:outline-none min-h-[50vh]",
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
    <div>
      <div className="flex items-center justify-between">
        {editable && editor ? <Toolbar editor={editor} /> : <div />}
        {editable && (
          <SaveIndicator state={saveState} onRetry={() => save(lastHtmlRef.current)} />
        )}
      </div>
      <EditorContent editor={editor} className="mt-4" />
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
  if (state === "idle") return null;
  if (state === "saving") {
    return <span className="text-xs text-slate-400">Saving…</span>;
  }
  if (state === "saved") {
    return <span className="text-xs text-slate-400">All changes saved</span>;
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="text-xs font-medium text-red-600 hover:text-red-700"
    >
      Save failed — retry
    </button>
  );
}
