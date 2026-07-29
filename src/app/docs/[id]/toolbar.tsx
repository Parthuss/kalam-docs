"use client";

import type { Editor } from "@tiptap/react";

function Btn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2 py-1 text-sm transition ${
        active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2">
      <Btn
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </Btn>
      <Btn
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </Btn>
      <Btn
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </Btn>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Btn
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Btn>
      <Btn
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Btn>
      <Btn
        label="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </Btn>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Btn
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Btn>
      <Btn
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Btn>
      <div className="mx-1 h-4 w-px bg-slate-200" />
      <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </Btn>
      <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </Btn>
    </div>
  );
}
