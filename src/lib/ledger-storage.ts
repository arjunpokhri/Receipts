import type { AgreementItem } from "./sample-data.ts";

export const RECEIPTS_LEDGER_STORAGE_KEY = "receipts_agreement_ledger_v1";
export const RECEIPTS_SELECTED_ITEM_KEY = "receipts_selected_item_id_v1";

/**
 * Validates whether an unknown value conforms to the AgreementItem structure.
 */
export function isValidLedgerItem(item: unknown): item is AgreementItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;

  const hasRequiredStrings =
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.claim === "string" &&
    typeof candidate.evidenceQuote === "string" &&
    typeof candidate.speaker === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.commitmentType === "string" &&
    typeof candidate.speechAct === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.explanation === "string" &&
    typeof candidate.sourceThreadId === "string";

  if (!hasRequiredStrings) return false;

  // Optional string and boolean property checks
  if (candidate.sourceText !== undefined && typeof candidate.sourceText !== "string") {
    return false;
  }
  if (
    candidate.originalSuggestedStatus !== undefined &&
    typeof candidate.originalSuggestedStatus !== "string"
  ) {
    return false;
  }
  if (candidate.quoteVerified !== undefined && typeof candidate.quoteVerified !== "boolean") {
    return false;
  }
  if (candidate.confirmedAt !== undefined && typeof candidate.confirmedAt !== "string") {
    return false;
  }
  if (candidate.confirmedBy !== undefined && typeof candidate.confirmedBy !== "string") {
    return false;
  }
  if (candidate.dismissedAt !== undefined && typeof candidate.dismissedAt !== "string") {
    return false;
  }

  return true;
}

/**
 * Safely parses and validates an array of stored AgreementItems from a JSON string.
 * Returns null if the data is corrupted, empty, or not an array.
 */
export function parseStoredLedger(rawJson: string | null): AgreementItem[] | null {
  if (!rawJson || typeof rawJson !== "string" || rawJson.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    const validItems: AgreementItem[] = [];
    for (const item of parsed) {
      if (isValidLedgerItem(item)) {
        validItems.push(item);
      }
    }

    return validItems.length > 0 ? validItems : null;
  } catch {
    return null;
  }
}

export interface StoredLedgerState {
  items: AgreementItem[];
  selectedId: string | null;
}

/**
 * Loads the persisted ledger state from browser localStorage.
 * Returns null if localStorage is unavailable, unreadable, or contains invalid data.
 */
export function loadLedgerFromStorage(
  storageKey: string = RECEIPTS_LEDGER_STORAGE_KEY,
  selectedKey: string = RECEIPTS_SELECTED_ITEM_KEY
): StoredLedgerState | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const rawItems = window.localStorage.getItem(storageKey);
    const items = parseStoredLedger(rawItems);
    if (!items) return null;

    let selectedId: string | null = null;
    try {
      selectedId = window.localStorage.getItem(selectedKey);
    } catch {
      // Non-fatal if reading selectedId fails
    }

    return { items, selectedId };
  } catch {
    return null;
  }
}

/**
 * Saves the current ledger items and optional selected item ID to browser localStorage.
 * Safely catches and handles any storage errors (e.g. quota limits, security restrictions).
 */
export function saveLedgerToStorage(
  items: AgreementItem[],
  selectedId?: string | null,
  storageKey: string = RECEIPTS_LEDGER_STORAGE_KEY,
  selectedKey: string = RECEIPTS_SELECTED_ITEM_KEY
): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
    if (selectedId) {
      window.localStorage.setItem(selectedKey, selectedId);
    } else {
      window.localStorage.removeItem(selectedKey);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears the persisted ledger state from browser localStorage.
 */
export function clearLedgerStorage(
  storageKey: string = RECEIPTS_LEDGER_STORAGE_KEY,
  selectedKey: string = RECEIPTS_SELECTED_ITEM_KEY
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(selectedKey);
  } catch {
    // Ignore error
  }
}
