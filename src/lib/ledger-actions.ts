/**
 * Pure ledger transition functions enforcing trust boundaries and evidence verification.
 *
 * TRUST BOUNDARY INVARIANTS:
 * 1. Only sources explicitly designated as the original agreement may establish baseline status.
 *    Ordinary live extraction from correspondence must never create a baseline (downgraded to proposed).
 * 2. Unverified candidates (quoteVerified !== true) are strictly refused from addition.
 * 3. Confirmation requires that:
 *    - Current status is "proposed" or "unclear" (baseline, confirmed, and dismissed are refused).
 *    - Evidence quotation verifies deterministically against its own stored source text.
 * 4. Dismissal and restoration have explicit allowed transitions.
 * 5. Uses an honest generic identity label ("Human Reviewer") instead of inventing identities.
 * 6. The model can NEVER set terminal statuses ("confirmed" or "dismissed").
 */

import { verifyEvidence } from "./verifier.ts";
import type { AgreementItem, ConversationThread } from "./sample-data.ts";
import type { CommitmentType, SpeechAct, ApplicationStatus, SuggestedStatus } from "./schema.ts";
import {
  resolveItemSource,
  resolveItemSourceText,
  type ResolvedItemSource,
} from "./source-resolver.ts";

export { resolveItemSource, resolveItemSourceText, type ResolvedItemSource };

export interface LedgerTransitionResult<T = AgreementItem> {
  success: boolean;
  item?: T;
  error?: string;
}

export interface LedgerCollectionResult {
  success: boolean;
  items: AgreementItem[];
  affectedItem?: AgreementItem;
  error?: string;
}

export interface LiveCandidateInput {
  id?: string;
  claim: string;
  evidenceQuote: string;
  speaker: string;
  timestamp: string;
  commitmentType: CommitmentType;
  speechAct: SpeechAct;
  suggestedStatus: SuggestedStatus | string;
  quoteVerified?: boolean;
  explanation?: string;
}

export interface CreateLiveLedgerItemOptions {
  sourceThreadId?: string;
}

/**
 * Creates a new ledger item from a live extraction candidate while enforcing trust boundaries:
 * - Refuses candidates whose quote was not verified (quoteVerified !== true).
 * - Refuses empty or missing source text.
 * - Confirms quotation exists in source text via verifyEvidence.
 * - Strictly rejects model attempts to output "confirmed" or "dismissed".
 * - Downgrades model-suggested "baseline" to "proposed" with an explicit explanation note.
 * - Stores the exact source text on the item for downstream confirmation verification.
 */
export function createLiveLedgerItem(
  candidate: LiveCandidateInput,
  sourceText: string,
  options: CreateLiveLedgerItemOptions = {}
): LedgerTransitionResult<AgreementItem> {
  // 1. Refuse unverified candidates
  if (candidate.quoteVerified !== true) {
    return {
      success: false,
      error: "Cannot add candidate to ledger: evidence quotation failed mechanical verification.",
    };
  }

  // 2. Validate source text existence
  if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
    return {
      success: false,
      error: "Cannot add candidate to ledger: source communication text is missing or empty.",
    };
  }

  // 3. Independent mechanical verification check against provided source text
  const verification = verifyEvidence(sourceText, candidate.evidenceQuote);
  if (!verification.verified) {
    return {
      success: false,
      error: `Cannot add candidate to ledger: evidence quotation is not present in source text (${verification.reason}).`,
    };
  }

  // 4. Model output must never set terminal statuses
  if (candidate.suggestedStatus === "confirmed" || candidate.suggestedStatus === "dismissed") {
    return {
      success: false,
      error: `Cannot add candidate to ledger: model output cannot set terminal status '${candidate.suggestedStatus}'.`,
    };
  }

  // 5. Enforce baseline policy: ordinary correspondence must never create a baseline
  let targetStatus: ApplicationStatus;
  let finalExplanation = candidate.explanation || "";

  if (candidate.suggestedStatus === "baseline") {
    targetStatus = "proposed";
    const baselineNotice =
      "[Model suggested baseline — downgraded to proposed; original agreement must be designated separately]";
    finalExplanation = finalExplanation
      ? `${baselineNotice} ${finalExplanation}`
      : baselineNotice;
  } else if (candidate.suggestedStatus === "unclear") {
    targetStatus = "unclear";
  } else if (candidate.suggestedStatus === "proposed") {
    targetStatus = "proposed";
  } else {
    return {
      success: false,
      error: `Cannot add candidate to ledger: unrecognized suggested status '${candidate.suggestedStatus}'.`,
    };
  }

  const id = candidate.id || `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newItem: AgreementItem = {
    id,
    claim: candidate.claim,
    evidenceQuote: candidate.evidenceQuote,
    speaker: candidate.speaker,
    timestamp: candidate.timestamp,
    commitmentType: candidate.commitmentType,
    speechAct: candidate.speechAct,
    status: targetStatus,
    explanation: finalExplanation,
    sourceThreadId: options.sourceThreadId || "live-extraction",
    sourceText: sourceText,
    originalSuggestedStatus: candidate.suggestedStatus as SuggestedStatus,
    quoteVerified: true,
  };

  return {
    success: true,
    item: newItem,
  };
}

/**
 * Confirms a ledger item:
 * - Allowed ONLY when status is "proposed" or "unclear".
 * - Refuses confirmation if item is "baseline", "confirmed", or "dismissed".
 * - Refuses confirmation if evidence quotation fails verification against its stored source text.
 * - Sets confirmedAt timestamp and uses an honest generic identity ("Human Reviewer").
 * - Preserves evidence and source text association.
 */
export function confirmLedgerItem(
  item: AgreementItem,
  sourceText: string | undefined,
  options: { confirmedAt?: string; confirmedBy?: string } = {}
): LedgerTransitionResult<AgreementItem> {
  // 1. Status transition constraints
  if (item.status === "baseline") {
    return {
      success: false,
      error: "Cannot confirm baseline item: baseline commitments are already established contractual terms.",
    };
  }
  if (item.status === "confirmed") {
    return {
      success: false,
      error: "Cannot confirm item: item is already confirmed.",
    };
  }
  if (item.status === "dismissed") {
    return {
      success: false,
      error: "Cannot confirm dismissed item: dismissed candidates must first be restored to proposed or unclear.",
    };
  }
  if (item.status !== "proposed" && item.status !== "unclear") {
    return {
      success: false,
      error: `Cannot confirm item: invalid initial status '${item.status}'.`,
    };
  }

  // 2. Source text existence check
  if (!sourceText || typeof sourceText !== "string" || sourceText.trim().length === 0) {
    return {
      success: false,
      error: "Confirmation refused: missing source text for evidence verification.",
    };
  }

  // 3. Evidence quotation verification against stored source text
  const verification = verifyEvidence(sourceText, item.evidenceQuote);
  if (!verification.verified) {
    return {
      success: false,
      error: `Confirmation refused: evidence quotation failed verification against stored source (${verification.reason}).`,
    };
  }

  // 4. Update status with honest generic reviewer attribution
  const confirmedAt =
    options.confirmedAt ||
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const confirmedBy = options.confirmedBy || "Human Reviewer";

  const updatedItem: AgreementItem = {
    ...item,
    status: "confirmed",
    confirmedAt,
    confirmedBy,
  };

  return {
    success: true,
    item: updatedItem,
  };
}

/**
 * Dismisses a ledger item:
 * - Allowed from "proposed", "unclear", and "confirmed".
 * - Refused for "baseline" (baseline contract terms cannot be dismissed) and already "dismissed".
 * - Sets dismissedAt timestamp while preserving all evidence.
 */
export function dismissLedgerItem(
  item: AgreementItem,
  options: { dismissedAt?: string } = {}
): LedgerTransitionResult<AgreementItem> {
  if (item.status === "baseline") {
    return {
      success: false,
      error: "Cannot dismiss baseline item: baseline contractual commitments cannot be dismissed.",
    };
  }
  if (item.status === "dismissed") {
    return {
      success: false,
      error: "Cannot dismiss item: item is already dismissed.",
    };
  }
  if (item.status !== "proposed" && item.status !== "unclear" && item.status !== "confirmed") {
    return {
      success: false,
      error: `Cannot dismiss item with status '${item.status}'.`,
    };
  }

  const dismissedAt =
    options.dismissedAt ||
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return {
    success: true,
    item: {
      ...item,
      status: "dismissed",
      dismissedAt,
    },
  };
}

/**
 * Restores a dismissed item:
 * - Allowed ONLY when status is "dismissed".
 * - Returns status to original suggested status if unclear, otherwise "proposed".
 * - Clears dismissedAt timestamp while preserving all evidence.
 */
export function restoreLedgerItem(item: AgreementItem): LedgerTransitionResult<AgreementItem> {
  if (item.status !== "dismissed") {
    return {
      success: false,
      error: `Cannot restore item with status '${item.status}': only dismissed items can be restored.`,
    };
  }

  const targetStatus: ApplicationStatus =
    item.originalSuggestedStatus === "unclear" ? "unclear" : "proposed";

  return {
    success: true,
    item: {
      ...item,
      status: targetStatus,
      dismissedAt: undefined,
    },
  };
}

/**
 * Pure collection-level helper to confirm an item within a ledger array.
 */
export function confirmItemInLedger(
  items: AgreementItem[],
  itemId: string,
  threads?: ConversationThread[],
  options: { confirmedAt?: string; confirmedBy?: string } = {}
): LedgerCollectionResult {
  const targetIndex = items.findIndex((i) => i.id === itemId);
  if (targetIndex === -1) {
    return { success: false, items, error: `Item with id '${itemId}' was not found in ledger.` };
  }

  const item = items[targetIndex];
  const sourceText = resolveItemSourceText(item, threads);
  const result = confirmLedgerItem(item, sourceText, options);

  if (!result.success || !result.item) {
    return { success: false, items, error: result.error };
  }

  const updatedItems = [...items];
  updatedItems[targetIndex] = result.item;

  return {
    success: true,
    items: updatedItems,
    affectedItem: result.item,
  };
}

/**
 * Pure collection-level helper to dismiss an item within a ledger array.
 */
export function dismissItemInLedger(
  items: AgreementItem[],
  itemId: string,
  options: { dismissedAt?: string } = {}
): LedgerCollectionResult {
  const targetIndex = items.findIndex((i) => i.id === itemId);
  if (targetIndex === -1) {
    return { success: false, items, error: `Item with id '${itemId}' was not found in ledger.` };
  }

  const item = items[targetIndex];
  const result = dismissLedgerItem(item, options);

  if (!result.success || !result.item) {
    return { success: false, items, error: result.error };
  }

  const updatedItems = [...items];
  updatedItems[targetIndex] = result.item;

  return {
    success: true,
    items: updatedItems,
    affectedItem: result.item,
  };
}

/**
 * Pure collection-level helper to restore an item within a ledger array.
 */
export function restoreItemInLedger(
  items: AgreementItem[],
  itemId: string
): LedgerCollectionResult {
  const targetIndex = items.findIndex((i) => i.id === itemId);
  if (targetIndex === -1) {
    return { success: false, items, error: `Item with id '${itemId}' was not found in ledger.` };
  }

  const item = items[targetIndex];
  const result = restoreLedgerItem(item);

  if (!result.success || !result.item) {
    return { success: false, items, error: result.error };
  }

  const updatedItems = [...items];
  updatedItems[targetIndex] = result.item;

  return {
    success: true,
    items: updatedItems,
    affectedItem: result.item,
  };
}

/**
 * Pure collection-level helper to add a live candidate to the ledger.
 */
export function addCandidateToLedgerItems(
  items: AgreementItem[],
  candidate: LiveCandidateInput,
  sourceText: string,
  options: CreateLiveLedgerItemOptions = {}
): LedgerCollectionResult {
  const result = createLiveLedgerItem(candidate, sourceText, options);

  if (!result.success || !result.item) {
    return { success: false, items, error: result.error };
  }

  return {
    success: true,
    items: [result.item, ...items],
    affectedItem: result.item,
  };
}
