"use client";

import { useMemo } from "react";
import { Clock3, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScheduleEvents, type ScheduleEvent } from "@/lib/agents/cron-compute";
import type { CabinetAgentSummary, CabinetJobSummary } from "@/types/cabinets";

const LIMIT = 8;
const HORIZON_MS = 7 * 24 * 60 * 60 * 1000;

export function NextUpRuns({
  agents,
  jobs,
  now,
  onEventClick,
}: {
  agents: CabinetAgentSummary[];
  jobs: CabinetJobSummary[];
  now: Date;
  onEventClick: (event: ScheduleEvent) => void;
}) {
  const events = useMemo(() => {
    const end = new Date(now.getTime() + HORIZON_MS);
    return getScheduleEvents(agents, jobs, now, end).slice(0, LIMIT);
  }, [agents, jobs, now]);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            Next-up runs
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {events.length === 0
              ? "Nothing scheduled in the next 7 days"
              : `${events.length} upcoming · 7 days`}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-[12px] text-muted-foreground">
          Set a heartbeat or job on an agent to see runs here.
        </p>
      ) : (
        <ul className="space-y-1">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onEventClick(event)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  "hover:bg-muted/30",
                  !event.enabled && "opacity-60"
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/40">
                  {event.sourceType === "heartbeat" ? (
                    <HeartPulse className="size-3.5 text-pink-400" />
                  ) : (
                    <Clock3 className="size-3.5 text-emerald-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium leading-snug text-foreground">
                    {event.label}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {event.agentName}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
                  {formatWhen(event.time, now)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatWhen(when: Date, now: Date): string {
  const delta = when.getTime() - now.getTime();
  if (delta < 0) return "now";
  const minutes = Math.round(delta / 60000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `in ${days}d`;
  return when.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
