"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Menubar } from "./Menubar";
import { cn } from "cn";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function TiptapEditor({
  value,
  onChange,
  placeholder = "Start writing your course description...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[200px] p-4 text-foreground leading-relaxed",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.isEmpty ? "" : e.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-input shadow-xs overflow-hidden focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-[color,box-shadow]",
        className,
      )}
    >
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

const emptySubscribe = () => () => {};

export default function RichTextEditor(props: RichTextEditorProps) {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div
        className={cn(
          "rounded-md border border-input shadow-xs min-h-[240px] bg-muted/20 animate-pulse",
          props.className,
        )}
      />
    );
  }

  return <TiptapEditor {...props} />;
}

export { RichTextEditor };
