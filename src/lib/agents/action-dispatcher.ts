import type {
  AgentAction,
  DispatchedAction,
  LaunchTaskAction,
  ScheduleJobAction,
  ScheduleTaskAction,
} from "@/types/actions";
import type { ConversationMeta } from "@/types/conversations";
import type { JobConfig } from "@/types/jobs";
import { readPersona, type AgentPersona } from "./persona-manager";
import { startConversationRun } from "./conversation-runner";
import { saveAgentJob } from "@/lib/jobs/job-manager";
import { reloadDaemonSchedules } from "./daemon-client";
import { readConversationMeta, writeConversationMeta } from "./conversation-store";
import { normalizeRuntimeOverride } from "./runtime-overrides";

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Resolve the runtime a dispatched sub-task should run with.
 *
 * Precedence (highest → lowest):
 *   1. Action-authored override (agent set model/effort on LAUNCH_TASK etc.).
 *   2. Parent conversation's model/effort — inherited only when the parent
 *      used the same provider as the target. Crossing providers would leak
 *      an incompatible model/effort (e.g. `claude-opus-*` onto Codex), so
 *      `normalizeRuntimeOverride` drops the inherited base when providers
 *      differ.
 *   3. Target persona defaults.
 *
 * Provider + adapterType always come from the target persona — each teammate
 * keeps its own identity; only the reasoning level travels with the task.
 */
function resolveDispatchRuntime(
  parent: ConversationMeta,
  target: AgentPersona,
  action: { model?: string; effort?: string }
): {
  providerId: string;
  adapterType?: string;
  adapterConfig?: Record<string, unknown>;
} {
  const parentConfig = (parent.adapterConfig ?? {}) as Record<string, unknown>;
  const actionModel = pickString(action.model);
  const actionEffort = pickString(action.effort);
  const parentModel = pickString(parentConfig.model);
  const parentEffort = pickString(parentConfig.effort);

  const parentProvider = pickString(parent.providerId);
  const sameProvider = parentProvider === target.provider;

  const requestedModel = actionModel ?? (sameProvider ? parentModel : undefined);
  const requestedEffort = actionEffort ?? (sameProvider ? parentEffort : undefined);

  const normalized = normalizeRuntimeOverride(
    {
      providerId: target.provider,
      adapterType: target.adapterType,
      model: requestedModel,
      effort: requestedEffort,
    },
    {
      providerId: target.provider,
      adapterType: target.adapterType,
      adapterConfig: target.adapterConfig,
    }
  );

  return {
    providerId: normalized.providerId ?? target.provider,
    adapterType: normalized.adapterType,
    adapterConfig: normalized.adapterConfig,
  };
}

async function tagLineage(spawnedId: string, parent: ConversationMeta): Promise<void> {
  try {
    const fresh = await readConversationMeta(spawnedId, parent.cabinetPath);
    if (!fresh) return;
    fresh.parentTaskId = parent.id;
    fresh.triggeringAgent = parent.agentSlug;
    fresh.spawnDepth = (parent.spawnDepth ?? 0) + 1;
    await writeConversationMeta(fresh);
  } catch {
    // lineage is best-effort; never fail a dispatch over metadata.
  }
}

export interface DispatchInput {
  id: string;
  action: AgentAction;
  warningsOverride?: boolean; // allow dispatch even with soft warnings (default true)
}

function makeDispatched(
  base: Omit<DispatchedAction, "dispatchedAt">
): DispatchedAction {
  return { ...base, dispatchedAt: new Date().toISOString() };
}

export async function dispatchApprovedActions(
  meta: ConversationMeta,
  items: DispatchInput[]
): Promise<DispatchedAction[]> {
  const results: DispatchedAction[] = [];
  let scheduledAny = false;

  for (const item of items) {
    try {
      if (item.action.type === "LAUNCH_TASK") {
        results.push(await dispatchLaunchTask(meta, item));
      } else if (item.action.type === "SCHEDULE_JOB") {
        const out = await dispatchScheduleJob(meta, item);
        results.push(out);
        if (out.status === "dispatched") scheduledAny = true;
      } else if (item.action.type === "SCHEDULE_TASK") {
        const out = await dispatchScheduleTask(meta, item);
        results.push(out);
        if (out.status === "dispatched" && out.jobId) scheduledAny = true;
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "dispatch failed";
      results.push(
        makeDispatched({
          id: item.id,
          action: item.action,
          status: "rejected",
          reason,
        })
      );
    }
  }

  if (scheduledAny) {
    await reloadDaemonSchedules().catch(() => {});
  }

  return results;
}

async function dispatchLaunchTask(
  meta: ConversationMeta,
  item: DispatchInput
): Promise<DispatchedAction> {
  const action = item.action as LaunchTaskAction;
  const target = await readPersona(action.agent, meta.cabinetPath);
  if (!target) {
    return makeDispatched({
      id: item.id,
      action,
      status: "rejected",
      reason: "unknown_agent",
    });
  }

  const runtime = resolveDispatchRuntime(meta, target, action);
  const spawned = await startConversationRun({
    agentSlug: target.slug,
    title: action.title.slice(0, 120),
    trigger: "agent",
    prompt: action.prompt,
    providerId: runtime.providerId,
    adapterType: runtime.adapterType,
    adapterConfig: runtime.adapterConfig,
    cabinetPath: target.cabinetPath,
  });

  await tagLineage(spawned.id, meta);

  return makeDispatched({
    id: item.id,
    action,
    status: "dispatched",
    conversationId: spawned.id,
  });
}

async function dispatchScheduleJob(
  meta: ConversationMeta,
  item: DispatchInput
): Promise<DispatchedAction> {
  const action = item.action as ScheduleJobAction;
  const target = await readPersona(action.agent, meta.cabinetPath);
  if (!target) {
    return makeDispatched({
      id: item.id,
      action,
      status: "rejected",
      reason: "unknown_agent",
    });
  }

  const runtime = resolveDispatchRuntime(meta, target, action);
  const job: JobConfig = {
    id: "",
    name: action.name,
    enabled: true,
    schedule: action.schedule,
    provider: runtime.providerId,
    adapterType: runtime.adapterType,
    adapterConfig: runtime.adapterConfig,
    ownerAgent: target.slug,
    agentSlug: target.slug,
    prompt: action.prompt,
    cabinetPath: target.cabinetPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerTaskId: meta.id,
  };

  const saved = await saveAgentJob(target.slug, job, target.cabinetPath);
  return makeDispatched({
    id: item.id,
    action,
    status: "dispatched",
    jobId: saved.id,
  });
}

async function dispatchScheduleTask(
  meta: ConversationMeta,
  item: DispatchInput
): Promise<DispatchedAction> {
  const action = item.action as ScheduleTaskAction;
  const target = await readPersona(action.agent, meta.cabinetPath);
  if (!target) {
    return makeDispatched({
      id: item.id,
      action,
      status: "rejected",
      reason: "unknown_agent",
    });
  }

  const when = new Date(action.when);
  if (Number.isNaN(when.getTime())) {
    return makeDispatched({
      id: item.id,
      action,
      status: "rejected",
      reason: "invalid_when",
    });
  }

  const msFromNow = when.getTime() - Date.now();

  const runtime = resolveDispatchRuntime(meta, target, action);

  // Fire immediately when the scheduled time is past or within 60 s — no point
  // routing through cron for that.
  if (msFromNow <= 60_000) {
    const spawned = await startConversationRun({
      agentSlug: target.slug,
      title: action.title.slice(0, 120),
      trigger: "agent",
      prompt: action.prompt,
      providerId: runtime.providerId,
      adapterType: runtime.adapterType,
      adapterConfig: runtime.adapterConfig,
      cabinetPath: target.cabinetPath,
    });
    await tagLineage(spawned.id, meta);
    return makeDispatched({
      id: item.id,
      action,
      status: "dispatched",
      conversationId: spawned.id,
    });
  }

  const schedule = isoToCronExpression(when);
  const jobName = action.title.slice(0, 80);
  const job: JobConfig = {
    id: "",
    name: jobName,
    enabled: true,
    schedule,
    provider: runtime.providerId,
    adapterType: runtime.adapterType,
    adapterConfig: runtime.adapterConfig,
    ownerAgent: target.slug,
    agentSlug: target.slug,
    prompt: action.prompt,
    cabinetPath: target.cabinetPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    oneShot: true,
    runAfter: when.toISOString(),
    ownerTaskId: meta.id,
  };

  const saved = await saveAgentJob(target.slug, job, target.cabinetPath);
  return makeDispatched({
    id: item.id,
    action,
    status: "dispatched",
    jobId: saved.id,
  });
}

/**
 * Convert a specific point in time into a single-fire cron expression.
 * Format: "minute hour dayOfMonth month *". The daemon's one-shot wrapper
 * disables the job after its first run so year rollover doesn't refire it.
 */
function isoToCronExpression(when: Date): string {
  const minute = when.getMinutes();
  const hour = when.getHours();
  const dom = when.getDate();
  const month = when.getMonth() + 1;
  return `${minute} ${hour} ${dom} ${month} *`;
}
