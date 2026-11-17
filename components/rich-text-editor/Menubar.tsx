"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  CodeSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface MenubarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            size="sm"
            pressed={isActive}
            onPressedChange={() => onClick()}
            disabled={disabled}
            aria-label={tooltip}
            className={cn(
              isActive && "bg-muted text-foreground font-semibold shadow-2xs"
            )}
          >
            {children}
          </Toggle>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarActionButton({
  onClick,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
            aria-label={tooltip}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function Menubar({ editor }: MenubarProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    editor.on("transaction", forceUpdate);
    editor.on("selectionUpdate", forceUpdate);
    return () => {
      editor.off("transaction", forceUpdate);
      editor.off("selectionUpdate", forceUpdate);
    };
  }, [editor]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-1.5">
        {/* Undo / Redo */}
        <ToolbarActionButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          tooltip="Undo"
        >
          <Undo />
        </ToolbarActionButton>

        <ToolbarActionButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          tooltip="Redo"
        >
          <Redo />
        </ToolbarActionButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          tooltip="Bold"
        >
          <Bold />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          tooltip="Italic"
        >
          <Italic />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          tooltip="Underline"
        >
          <Underline />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          tooltip="Strikethrough"
        >
          <Strikethrough />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          tooltip="Inline Code"
        >
          <Code />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          tooltip="Highlight"
        >
          <Highlighter />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          tooltip="Align Left"
        >
          <AlignLeft />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          tooltip="Align Center"
        >
          <AlignCenter />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          tooltip="Align Right"
        >
          <AlignRight />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          tooltip="Justify"
        >
          <AlignJustify />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="Bullet List"
        >
          <List />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="Numbered List"
        >
          <ListOrdered />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          tooltip="Blockquote"
        >
          <Quote />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          tooltip="Code Block"
        >
          <CodeSquare />
        </ToolbarButton>

        <ToolbarActionButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="Horizontal Rule"
        >
          <Minus />
        </ToolbarActionButton>
      </div>
    </TooltipProvider>
  );
}
