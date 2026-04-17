"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript as SuperIcon,
  Subscript as SubIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ColorPalette } from "./color-palette";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "./extensions/color-highlight";
import { cn } from "@/lib/utils";

interface Props {
  editor: Editor | null;
}

type OpenPopover = null | "color" | "highlight" | "align";

export function EditorBubbleMenu({ editor }: Props) {
  const [open, setOpen] = useState<OpenPopover>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      "h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/80 transition-colors",
      active && "bg-accent text-foreground"
    );

  const currentColor = editor.getAttributes("textStyle")?.color ?? null;
  const currentHighlight = editor.getAttributes("highlight")?.color ?? null;

  const setLink = () => {
    const existing = editor.getAttributes("link")?.href ?? "";
    const url = window.prompt("URL:", existing);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setAlign = (align: "left" | "center" | "right" | "justify") => {
    editor.chain().focus().setTextAlign(align).run();
    setOpen(null);
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      className="flex items-center gap-0.5 px-1 py-1 bg-popover border border-border rounded-md shadow-lg"
    >
      <button
        type="button"
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <button
        type="button"
        className={btn(editor.isActive("superscript"))}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label="Superscript"
      >
        <SuperIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("subscript"))}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Subscript"
      >
        <SubIcon className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <div className="relative">
        <button
          type="button"
          className={btn(currentColor != null)}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => (o === "color" ? null : "color"));
          }}
          aria-label="Text color"
          style={currentColor ? { color: currentColor } : undefined}
        >
          <Baseline className="w-3.5 h-3.5" />
        </button>
        {open === "color" && (
          <div
            ref={popRef}
            className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg"
          >
            <ColorPalette
              title="Text color"
              palette={TEXT_COLORS}
              current={currentColor}
              swatchType="text"
              onSelect={(v) => {
                if (v == null) editor.chain().focus().unsetColor().run();
                else editor.chain().focus().setColor(v).run();
                setOpen(null);
              }}
            />
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          className={btn(currentHighlight != null || editor.isActive("highlight"))}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => (o === "highlight" ? null : "highlight"));
          }}
          aria-label="Highlight"
          style={currentHighlight ? { backgroundColor: currentHighlight } : undefined}
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
        {open === "highlight" && (
          <div
            ref={popRef}
            className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg"
          >
            <ColorPalette
              title="Background"
              palette={HIGHLIGHT_COLORS}
              current={currentHighlight}
              swatchType="background"
              onSelect={(v) => {
                if (v == null) editor.chain().focus().unsetHighlight().run();
                else editor.chain().focus().setHighlight({ color: v }).run();
                setOpen(null);
              }}
            />
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-border mx-1" />
      <button
        type="button"
        className={btn(editor.isActive("link"))}
        onClick={setLink}
        aria-label="Link"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <div className="relative">
        <button
          type="button"
          className={btn(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => (o === "align" ? null : "align"));
          }}
          aria-label="Align"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        {open === "align" && (
          <div
            ref={popRef}
            className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg p-1 flex gap-0.5"
          >
            <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => setAlign("left")} aria-label="Align left"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => setAlign("center")} aria-label="Align center"><AlignCenter className="w-3.5 h-3.5" /></button>
            <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => setAlign("right")} aria-label="Align right"><AlignRight className="w-3.5 h-3.5" /></button>
            <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => setAlign("justify")} aria-label="Justify"><AlignJustify className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
