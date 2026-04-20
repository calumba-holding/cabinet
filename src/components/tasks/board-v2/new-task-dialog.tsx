"use client";

import { useMemo, useState } from "react";
import { ComposerInput } from "@/components/composer/composer-input";
import {
  TaskRuntimePicker,
  type TaskRuntimeSelection,
} from "@/components/composer/task-runtime-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useComposer, type MentionableItem } from "@/hooks/use-composer";
import { useTreeStore } from "@/stores/tree-store";
import { flattenTree } from "@/lib/tree-utils";
import { createConversation } from "@/lib/agents/conversation-client";
import type { CabinetAgentSummary } from "@/types/cabinets";

const PLACEHOLDERS = [
  "Write a blog post about our Q2 results...",
  "Analyze user churn and suggest three concrete improvements...",
  "Review last week's metrics and flag anything unusual...",
  "Draft a partnership proposal for the Acme integration...",
  "Summarize key insights from customer discovery interviews...",
  "Prepare a competitive landscape update for the board...",
  "Create a rollout plan for the new onboarding flow...",
  "Audit our pricing page and suggest A/B test ideas...",
];

/**
 * Inline "+ New Task" dialog for the v2 board. Replaces the legacy
 * CreateDraftDialog. Ships without the HumanInboxDraft save-for-later path —
 * one button: Start now. The first @-mentioned agent becomes the owner (or
 * the first active agent if none mentioned).
 */
export function NewTaskDialog({
  open,
  onOpenChange,
  cabinetPath,
  agents,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabinetPath: string;
  agents: CabinetAgentSummary[];
  onStarted?: (conversationId: string, conversationCabinetPath?: string) => void;
}) {
  const treeNodes = useTreeStore((s) => s.nodes);
  const [taskRuntime, setTaskRuntime] = useState<TaskRuntimeSelection>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  const defaultAgent = useMemo(() => {
    const active = agents.find((a) => a.active) ?? agents[0];
    return active ?? null;
  }, [agents]);

  const mentionItems: MentionableItem[] = useMemo(
    () => [
      ...agents.map((a) => ({
        type: "agent" as const,
        id: a.slug,
        label: a.displayName ?? a.name,
        sublabel: a.role ?? "",
        icon: a.emoji,
      })),
      ...flattenTree(treeNodes).map((p) => ({
        type: "page" as const,
        id: p.path,
        label: p.title,
        sublabel: p.path,
      })),
    ],
    [agents, treeNodes]
  );

  const composer = useComposer({
    items: mentionItems,
    initialMentionedAgents: defaultAgent ? [defaultAgent.slug] : [],
    onSubmit: async ({ message, mentionedPaths, mentionedAgents }) => {
      const firstMentionedSlug = mentionedAgents[0];
      const resolvedAgent = firstMentionedSlug
        ? agents.find((a) => a.slug === firstMentionedSlug) ?? defaultAgent
        : defaultAgent;
      if (!resolvedAgent) {
        setError("No agent available to run this task.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const result = await createConversation({
          agentSlug: resolvedAgent.slug,
          userMessage: message,
          mentionedPaths,
          cabinetPath: resolvedAgent.cabinetPath || cabinetPath,
          ...taskRuntime,
        });
        onOpenChange(false);
        onStarted?.(result.conversation.id, result.conversation.cabinetPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start task");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-visible p-0 sm:max-w-xl">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="text-xl font-semibold">What needs to get done?</DialogTitle>
        </DialogHeader>
        <ComposerInput
          composer={composer}
          placeholder={placeholder}
          submitLabel="Start now"
          variant="inline"
          items={mentionItems}
          autoFocus
          minHeight="100px"
          maxHeight="260px"
          showKeyHint={false}
          actionsStart={
            <TaskRuntimePicker value={taskRuntime} onChange={setTaskRuntime} />
          }
          footer={
            <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-muted-foreground/60">
              <span className="truncate">
                {error ? (
                  <span className="text-destructive">{error}</span>
                ) : submitting ? (
                  "Starting…"
                ) : defaultAgent ? (
                  `Default agent: ${defaultAgent.displayName ?? defaultAgent.name}. @-mention another to reassign.`
                ) : (
                  "No agents available in this cabinet."
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">
                  ↵
                </kbd>
                Start
              </span>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
