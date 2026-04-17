"use client";

import { type Editor } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
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
  FileCode,
  CheckSquare,
  PilcrowRight,
  PilcrowLeft,
  Underline as UnderlineIcon,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript as SuperIcon,
  Subscript as SubIcon,
  Link as LinkIcon,
  ImageIcon,
  Video as VideoIcon,
  Sparkles,
} from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useState, useRef, useEffect } from "react";
import { ColorPalette } from "./color-palette";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "./extensions/color-highlight";
import { MediaPopover, type MediaKind } from "./media-popover";
import { EmbedPopover } from "./embed-popover";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

type Popover = null | "color" | "highlight";
type MediaPop =
  | null
  | { type: "media"; kind: MediaKind }
  | { type: "embed" };

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const frontmatter = useEditorStore((s) => s.frontmatter);
  const updateFrontmatter = useEditorStore((s) => s.updateFrontmatter);
  const pagePath = useEditorStore((s) => s.currentPath);
  const isRtl = frontmatter?.dir === "rtl";
  const [popover, setPopover] = useState<Popover>(null);
  const [mediaPop, setMediaPop] = useState<MediaPop>(null);
  const [mediaAnchor, setMediaAnchor] = useState<{ top: number; left: number } | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!popover) return;
    const handle = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPopover(null);
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [popover]);

  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle")?.color ?? null;
  const currentHighlight = editor.getAttributes("highlight")?.color ?? null;

  const setLink = () => {
    const existing = editor.getAttributes("link")?.href ?? "";
    const url = window.prompt("URL:", existing);
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const openMediaFromButton = (
    e: React.MouseEvent<HTMLElement>,
    next: NonNullable<MediaPop>
  ) => {
    const btn = e.currentTarget.getBoundingClientRect();
    setMediaAnchor({ top: btn.bottom + 6, left: btn.left });
    setMediaPop(next);
  };

  const insertMedia = (kind: MediaKind, payload: { url: string; alt?: string; mimeType?: string }) => {
    const { url, alt, mimeType } = payload;
    const type = mimeType ?? "";
    const isImage = kind === "image" || type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url);
    const isVideo = kind === "video" || type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
    if (isImage) {
      editor.chain().focus().setImage({ src: url, alt: alt ?? "" }).run();
    } else if (isVideo) {
      editor.chain().focus().insertContent({
        type: "embed",
        attrs: { provider: "video", src: url, originalUrl: url },
      }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}">${alt ?? url}</a>`).run();
    }
    setMediaPop(null);
  };

  const insertEmbed = (url: string) => {
    editor.commands.setEmbed({ url });
    setMediaPop(null);
  };

  type Item =
    | { separator: true }
    | {
        icon: React.ComponentType<{ className?: string }>;
        action: () => void;
        isActive: boolean;
        label: string;
        style?: React.CSSProperties;
      };

  const items: Item[] = [
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive("heading", { level: 1 }), label: "Heading 1" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }), label: "Heading 2" },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive("heading", { level: 3 }), label: "Heading 3" },
    { separator: true },
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), label: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), label: "Italic" },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline"), label: "Underline" },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), label: "Strikethrough" },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive("code"), label: "Inline Code" },
    { icon: LinkIcon, action: setLink, isActive: editor.isActive("link"), label: "Link" },
    { separator: true },
    { icon: SuperIcon, action: () => editor.chain().focus().toggleSuperscript().run(), isActive: editor.isActive("superscript"), label: "Superscript" },
    { icon: SubIcon, action: () => editor.chain().focus().toggleSubscript().run(), isActive: editor.isActive("subscript"), label: "Subscript" },
    { separator: true },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList"), label: "Bullet List" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList"), label: "Ordered List" },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote"), label: "Blockquote" },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), isActive: editor.isActive("taskList"), label: "Checklist" },
    { icon: FileCode, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive("codeBlock"), label: "Code Block" },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), isActive: false, label: "Divider" },
    { separator: true },
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign("left").run(), isActive: editor.isActive({ textAlign: "left" }), label: "Align left" },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign("center").run(), isActive: editor.isActive({ textAlign: "center" }), label: "Align center" },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign("right").run(), isActive: editor.isActive({ textAlign: "right" }), label: "Align right" },
    { icon: AlignJustify, action: () => editor.chain().focus().setTextAlign("justify").run(), isActive: editor.isActive({ textAlign: "justify" }), label: "Justify" },
    { separator: true },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), isActive: false, label: "Undo" },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), isActive: false, label: "Redo" },
    { separator: true },
    { icon: isRtl ? PilcrowLeft : PilcrowRight, action: () => updateFrontmatter({ dir: isRtl ? undefined : "rtl" }), isActive: isRtl, label: isRtl ? "Switch to LTR" : "Switch to RTL" },
  ];

  return (
    <>
    <div className="flex items-center gap-0.5 border-b border-border px-2 py-1 bg-background/50 overflow-x-auto scrollbar-none relative">
      {items.map((item, i) => {
        if ("separator" in item) {
          return <Separator key={i} orientation="vertical" className="mx-1 h-6" />;
        }
        const Icon = item.icon;
        return (
          <Toggle
            key={i}
            size="sm"
            pressed={item.isActive}
            onPressedChange={() => item.action()}
            aria-label={item.label}
            title={item.label}
            className="h-8 w-8 p-0"
            style={item.style}
          >
            <Icon className="h-4 w-4" />
          </Toggle>
        );
      })}
      {/* Color picker button */}
      <div className="relative">
        <Toggle
          size="sm"
          pressed={currentColor != null}
          onPressedChange={() => setPopover((p) => (p === "color" ? null : "color"))}
          aria-label="Text color"
          title="Text color"
          className={cn("h-8 w-8 p-0")}
          style={currentColor ? { color: currentColor } : undefined}
        >
          <Baseline className="h-4 w-4" />
        </Toggle>
        {popover === "color" && (
          <div ref={popRef} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg">
            <ColorPalette
              title="Text color"
              palette={TEXT_COLORS}
              current={currentColor}
              swatchType="text"
              onSelect={(v) => {
                if (v == null) editor.chain().focus().unsetColor().run();
                else editor.chain().focus().setColor(v).run();
                setPopover(null);
              }}
            />
          </div>
        )}
      </div>
      {/* Highlight picker button */}
      <div className="relative">
        <Toggle
          size="sm"
          pressed={currentHighlight != null || editor.isActive("highlight")}
          onPressedChange={() => setPopover((p) => (p === "highlight" ? null : "highlight"))}
          aria-label="Highlight"
          title="Highlight"
          className={cn("h-8 w-8 p-0")}
          style={currentHighlight ? { backgroundColor: currentHighlight } : undefined}
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
        {popover === "highlight" && (
          <div ref={popRef} className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg">
            <ColorPalette
              title="Background"
              palette={HIGHLIGHT_COLORS}
              current={currentHighlight}
              swatchType="background"
              onSelect={(v) => {
                if (v == null) editor.chain().focus().unsetHighlight().run();
                else editor.chain().focus().setHighlight({ color: v }).run();
                setPopover(null);
              }}
            />
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Image / Video / Embed insert buttons */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => {}}
        onClick={(e) => openMediaFromButton(e, { type: "media", kind: "image" })}
        aria-label="Insert image"
        title="Insert image (upload, URL, or paste/drop)"
        className="h-8 w-8 p-0"
      >
        <ImageIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => {}}
        onClick={(e) => openMediaFromButton(e, { type: "media", kind: "video" })}
        aria-label="Insert video"
        title="Insert video (upload or URL)"
        className="h-8 w-8 p-0"
      >
        <VideoIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => {}}
        onClick={(e) => openMediaFromButton(e, { type: "embed" })}
        aria-label="Embed"
        title="Embed — YouTube, X, Vimeo, Loom, TikTok, Spotify…"
        className="h-8 w-8 p-0"
      >
        <Sparkles className="h-4 w-4" />
      </Toggle>
    </div>
    {mediaPop && mediaAnchor && (
      <div style={{ position: "fixed", top: mediaAnchor.top, left: mediaAnchor.left, zIndex: 60 }}>
        {mediaPop.type === "media" && pagePath && (
          <MediaPopover
            kind={mediaPop.kind}
            pagePath={pagePath}
            anchor={{ top: 0, left: 0 }}
            onCancel={() => setMediaPop(null)}
            onInsert={(payload) => insertMedia(mediaPop.kind, payload)}
          />
        )}
        {mediaPop.type === "embed" && (
          <EmbedPopover
            anchor={{ top: 0, left: 0 }}
            onCancel={() => setMediaPop(null)}
            onInsert={insertEmbed}
          />
        )}
      </div>
    )}
    </>
  );
}
