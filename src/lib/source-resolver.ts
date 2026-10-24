import type { AgreementItem, ConversationThread } from "./sample-data.ts";

export interface ResolvedItemSource {
  sourceText: string;
  sourceType: "live" | "thread";
  title: string;
  channel: string;
  threadId?: string;
}

/**
 * Pure helper to resolve an agreement item's authoritative source communication.
 *
 * TRUST BOUNDARY INVARIANTS:
 * 1. Prefer item's own `sourceText` when present (live correspondence).
 * 2. For sample/bundled items without `sourceText`, resolve strictly against matching `sourceThreadId`.
 * 3. NEVER silently fall back to `threads[0]` or an unrelated thread.
 * 4. Return `undefined` if source cannot be resolved.
 */
export function resolveItemSource(
  item: AgreementItem,
  threads?: ConversationThread[]
): ResolvedItemSource | undefined {
  // 1. Prefer item's own stored source communication (live extraction)
  if (typeof item.sourceText === "string" && item.sourceText.length > 0) {
    return {
      sourceText: item.sourceText,
      sourceType: "live",
      title: "Live Pasted Correspondence",
      channel: "Direct Input",
      threadId: item.sourceThreadId || "live-source",
    };
  }

  // 2. Resolve bundled thread strictly by matching sourceThreadId
  if (
    threads &&
    threads.length > 0 &&
    typeof item.sourceThreadId === "string" &&
    item.sourceThreadId.length > 0
  ) {
    const thread = threads.find((t) => t.id === item.sourceThreadId);
    if (thread) {
      return {
        sourceText: thread.rawText,
        sourceType: "thread",
        title: thread.title,
        channel: thread.channel,
        threadId: thread.id,
      };
    }
  }

  // 3. Unresolved: Never silently fall back to threads[0]
  return undefined;
}

/**
 * Extracts just the raw text string from the resolved source.
 */
export function resolveItemSourceText(
  item: AgreementItem,
  threads?: ConversationThread[]
): string | undefined {
  return resolveItemSource(item, threads)?.sourceText;
}
