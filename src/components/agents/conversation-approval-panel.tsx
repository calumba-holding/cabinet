"use client";

import type { DispatchedAction, PendingAction } from "@/types/actions";
import { PendingActionsPanel } from "./pending-actions-panel";

interface ApprovalPanelMeta {
  id: string;
  cabinetPath?: string;
  pendingActions?: PendingAction[];
  dispatchedActions?: DispatchedAction[];
}

/**
 * Shared wrapper around PendingActionsPanel. Kept deliberately thin so both
 * conversation UIs (ConversationResultView / ConversationLiveView in the
 * agents workspace, and TaskConversationPage in the task viewer) mount the
 * same approval UX. When adding features to the dispatch-approval flow,
 * extend this file so both views pick up the change.
 */
export function ConversationApprovalPanel({
  meta,
  onApproved,
}: {
  meta: ApprovalPanelMeta;
  onApproved?: () => Promise<void> | void;
}) {
  if (!meta.pendingActions?.length && !meta.dispatchedActions?.length) {
    return null;
  }
  return (
    <PendingActionsPanel
      conversationId={meta.id}
      cabinetPath={meta.cabinetPath}
      pending={meta.pendingActions || []}
      dispatched={meta.dispatchedActions}
      onRefresh={onApproved ? () => void onApproved() : undefined}
    />
  );
}
