"use client";

import { useState } from "react";
import { Clock3, HeartPulse, Loader2, Save, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SchedulePicker } from "@/components/mission-control/schedule-picker";

export interface JobDialogState {
  agentSlug: string;
  agentName: string;
  cabinetPath: string;
  draft: {
    id: string;
    name: string;
    schedule: string;
    prompt: string;
    enabled: boolean;
  };
}

export interface HeartbeatDialogState {
  agentSlug: string;
  agentName: string;
  cabinetPath: string;
  heartbeat: string;
  active: boolean;
}

/**
 * Inline job-editor dialog. Click a job event in the schedule view → this
 * opens. Edits cron schedule + prompt + enabled, can run now or save.
 * Port of the legacy tasks-board.tsx:1757-1797 dialog.
 */
export function ScheduleJobDialog({
  state,
  onStateChange,
  onClose,
  onRefresh,
}: {
  state: JobDialogState | null;
  onStateChange: (next: JobDialogState | null) => void;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!state) return null;

  async function runNow() {
    if (!state) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/agents/${state.agentSlug}/jobs/${state.draft.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run", cabinetPath: state.cabinetPath }),
        }
      );
      if (res.ok) onClose();
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!state) return;
    setSaving(true);
    try {
      const query = `?cabinetPath=${encodeURIComponent(state.cabinetPath)}`;
      await fetch(`/api/agents/${state.agentSlug}/jobs/${state.draft.id}${query}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.draft),
      });
      onClose();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-10">
            <DialogTitle className="flex items-center gap-2">
              <Clock3 className="size-4 text-emerald-400" />
              {state.draft.name || "Job"}
              <span className="text-[11px] font-normal text-muted-foreground">
                · {state.agentName}
              </span>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => void runNow()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              Run now
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Schedule
            </span>
            <SchedulePicker
              value={state.draft.schedule || "0 9 * * 1-5"}
              onChange={(cron) =>
                onStateChange({ ...state, draft: { ...state.draft, schedule: cron } })
              }
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Prompt
            </span>
            <textarea
              value={state.draft.prompt}
              onChange={(e) =>
                onStateChange({
                  ...state,
                  draft: { ...state.draft, prompt: e.target.value },
                })
              }
              className="h-48 w-full resize-none rounded-lg bg-muted/60 px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:bg-muted"
              placeholder="What should this job do?"
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={state.draft.enabled}
                onChange={(e) =>
                  onStateChange({
                    ...state,
                    draft: { ...state.draft, enabled: e.target.checked },
                  })
                }
              />
              Enabled
            </label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => void save()}
                disabled={saving}
              >
                <Save className="size-3.5" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline heartbeat-editor dialog. Edits the agent persona's heartbeat cron
 * and Active flag. Port of legacy tasks-board.tsx:1800-1838.
 */
export function ScheduleHeartbeatDialog({
  state,
  onStateChange,
  onClose,
  onRefresh,
}: {
  state: HeartbeatDialogState | null;
  onStateChange: (next: HeartbeatDialogState | null) => void;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!state) return null;

  async function runNow() {
    if (!state) return;
    setBusy(true);
    try {
      await fetch(`/api/agents/personas/${state.agentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", cabinetPath: state.cabinetPath }),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!state) return;
    setSaving(true);
    try {
      await fetch(`/api/agents/personas/${state.agentSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heartbeat: state.heartbeat,
          active: state.active,
          cabinetPath: state.cabinetPath,
        }),
      });
      onClose();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-10">
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="size-4 text-pink-400" />
              Heartbeat
              <span className="text-[11px] font-normal text-muted-foreground">
                · {state.agentName}
              </span>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => void runNow()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              Run now
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Schedule
            </span>
            <SchedulePicker
              value={state.heartbeat}
              onChange={(cron) => onStateChange({ ...state, heartbeat: cron })}
            />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={state.active}
                onChange={(e) => onStateChange({ ...state, active: e.target.checked })}
                className="h-3.5 w-3.5 cursor-pointer"
              />
              Active
            </label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => void save()}
                disabled={saving}
              >
                <Save className="size-3.5" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
