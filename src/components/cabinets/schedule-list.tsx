"use client";

import { useMemo } from "react";
import { Clock3, HeartPulse, MessageSquare } from "lucide-react";
import { cronToHuman } from "@/lib/agents/cron-utils";
import { cn } from "@/lib/utils";
import { getAgentColor } from "@/lib/agents/cron-compute";
import type { CabinetAgentSummary, CabinetJobSummary } from "@/types/cabinets";
import type { ConversationMeta } from "@/types/conversations";

interface ScheduleListProps {
  agents: CabinetAgentSummary[];
  jobs: CabinetJobSummary[];
  /** Past manual conversations to interleave alongside scheduled items. */
  manualConversations?: ConversationMeta[];
  onJobClick?: (job: CabinetJobSummary, agent: CabinetAgentSummary) => void;
  onHeartbeatClick?: (agent: CabinetAgentSummary) => void;
  onManualClick?: (conversation: ConversationMeta) => void;
}

interface ListItem {
  type: "job" | "heartbeat" | "manual";
  id: string;
  name: string;
  /** Cron expression, or the formatted start time for manual runs. */
  schedule: string;
  enabled: boolean;
  agentEmoji: string;
  agentName: string;
  agentSlug: string;
  jobRef?: CabinetJobSummary;
  agentRef?: CabinetAgentSummary;
  conversationRef?: ConversationMeta;
  /** Secondary timestamp (startedAt) for manual items, sort key. */
  sortKey?: number;
}

export function ScheduleList({
  agents,
  jobs,
  manualConversations,
  onJobClick,
  onHeartbeatClick,
  onManualClick,
}: ScheduleListProps) {
  const agentMap = useMemo(() => {
    const map = new Map<string, CabinetAgentSummary>();
    for (const a of agents) {
      map.set(a.scopedId, a);
      map.set(a.slug, a);
    }
    return map;
  }, [agents]);

  const items: ListItem[] = useMemo(() => {
    const result: ListItem[] = [];

    for (const job of jobs) {
      const owner = job.ownerScopedId
        ? agentMap.get(job.ownerScopedId)
        : job.ownerAgent
        ? agentMap.get(job.ownerAgent)
        : undefined;
      result.push({
        type: "job",
        id: job.scopedId,
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
        agentEmoji: owner?.emoji || "🤖",
        agentName: owner?.name || job.ownerAgent || "Unknown",
        agentSlug: owner?.slug || "",
        jobRef: job,
        agentRef: owner,
      });
    }

    for (const agent of agents) {
      if (!agent.heartbeat) continue;
      result.push({
        type: "heartbeat",
        id: `hb-${agent.scopedId}`,
        name: `${agent.name} heartbeat`,
        schedule: agent.heartbeat,
        enabled: agent.active,
        agentEmoji: agent.emoji || "🤖",
        agentName: agent.name,
        agentSlug: agent.slug,
        agentRef: agent,
      });
    }

    // Past manual conversations — sorted most-recent-first at the end of the
    // list since they're historical, not scheduled.
    if (manualConversations && manualConversations.length > 0) {
      const manualItems: ListItem[] = [];
      for (const convo of manualConversations) {
        if (convo.trigger !== "manual") continue;
        const startedAt = convo.startedAt ? new Date(convo.startedAt) : null;
        const owner = agentMap.get(convo.agentSlug);
        const label = convo.title || convo.summary || "Manual run";
        manualItems.push({
          type: "manual",
          id: `manual-${convo.id}`,
          name: label,
          schedule:
            startedAt && !Number.isNaN(startedAt.getTime())
              ? `ran ${startedAt.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "manual run",
          enabled: convo.status !== "cancelled" && convo.status !== "failed",
          agentEmoji: owner?.emoji || "💬",
          agentName: owner?.name || convo.agentSlug || "Manual",
          agentSlug: owner?.slug || convo.agentSlug || "general",
          agentRef: owner,
          conversationRef: convo,
          sortKey: startedAt ? startedAt.getTime() : 0,
        });
      }
      manualItems.sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0));
      result.push(...manualItems);
    }

    return result;
  }, [agents, jobs, manualConversations, agentMap]);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing scheduled or recorded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const color = getAgentColor(item.agentSlug);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.type === "job" && item.jobRef && onJobClick) {
                const agent = item.agentRef ?? ({
                  slug: item.agentSlug,
                  name: item.agentName,
                  emoji: item.agentEmoji,
                } as CabinetAgentSummary);
                onJobClick(item.jobRef, agent);
              } else if (item.type === "heartbeat" && item.agentRef && onHeartbeatClick) {
                onHeartbeatClick(item.agentRef);
              } else if (item.type === "manual" && item.conversationRef && onManualClick) {
                onManualClick(item.conversationRef);
              }
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-left transition-all",
              "hover:shadow-sm hover:bg-muted/30",
              !item.enabled && "opacity-50"
            )}
            style={{ borderColor: color.bg }}
          >
            <span className="text-lg leading-none shrink-0">{item.agentEmoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {item.type === "job" ? (
                  <Clock3 className="h-3 w-3 shrink-0 text-emerald-500/70" />
                ) : item.type === "heartbeat" ? (
                  <HeartPulse className="h-3 w-3 shrink-0 text-pink-500/70" />
                ) : (
                  <MessageSquare className="h-3 w-3 shrink-0 text-sky-500/70" />
                )}
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.agentName} ·{" "}
                {item.type === "manual" ? item.schedule : cronToHuman(item.schedule)}
              </p>
            </div>
            {item.type === "manual" ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  item.conversationRef?.status === "failed"
                    ? "bg-destructive/15 text-destructive"
                    : item.conversationRef?.status === "running"
                      ? "bg-sky-500/12 text-sky-500"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {item.conversationRef?.status ?? "ran"}
              </span>
            ) : (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  item.enabled
                    ? "bg-emerald-500/12 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.enabled ? "On" : "Off"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
