"use client";

import { Download, FolderOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderActions } from "@/components/layout/header-actions";

interface OfficeChromeProps {
  path: string;
  title: string;
  extLabel: string;
  /** Optional external "open in source" action (e.g. Open in Google). */
  external?: { label: string; href: string };
  /** Hide the "Open in Finder" button (useful for Google embeds that aren't on disk). */
  hideFinder?: boolean;
}

export function OfficeChrome({ path, title, extLabel, external, hideFinder }: OfficeChromeProps) {
  const assetUrl = `/api/assets/${path}`;
  const filename = path.split("/").pop() || path;

  const revealInFinder = async () => {
    try {
      await fetch("/api/system/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="flex items-center justify-between border-b border-border px-4 py-2 bg-background/80 backdrop-blur-sm transition-[padding] duration-200"
      style={{ paddingLeft: `calc(1rem + var(--sidebar-toggle-offset, 0px))` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-medium truncate">{title}</span>
        {extLabel && (
          <span className="text-xs text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded shrink-0">
            {extLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {external && (
          <a
            href={external.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[11px] h-7 px-2.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {external.label}
          </a>
        )}
        {!hideFinder && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[11px] h-7"
            onClick={revealInFinder}
            title="Open in Finder"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Reveal
          </Button>
        )}
        {!hideFinder && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[11px] h-7"
            onClick={() => {
              const a = document.createElement("a");
              a.href = assetUrl;
              a.download = filename;
              a.click();
            }}
            title="Download original"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        )}
        <HeaderActions />
      </div>
    </div>
  );
}
