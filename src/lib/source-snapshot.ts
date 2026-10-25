/**
 * Pure helpers for capturing, associating, and validating source snapshots with extraction results.
 *
 * TRUST BOUNDARY & SNAPSHOT INVARIANTS:
 * 1. Extraction candidates must remain strictly bound to the exact source text analyzed by the model.
 * 2. Editing the live input textarea after extraction must NEVER rebind or attach previously extracted
 *    candidates to unanalyzed or modified source text.
 * 3. Starting a new extraction must invalidate or replace stale session snapshots.
 */

export interface SourceSnapshotSession<T> {
  analyzedSourceText: string;
  result: T;
  capturedAt: number;
}

/**
 * Captures an immutable source snapshot by trimming whitespace.
 */
export function captureSourceSnapshot(sourceText: string): string {
  return typeof sourceText === "string" ? sourceText.trim() : "";
}

/**
 * Creates an immutable session linking an analyzed source snapshot to its extraction result.
 */
export function createSnapshotSession<T>(
  analyzedSourceText: string,
  result: T,
  timestamp: number = Date.now()
): SourceSnapshotSession<T> {
  return {
    analyzedSourceText,
    result,
    capturedAt: timestamp,
  };
}

/**
 * Returns the immutable source text belonging to the extraction session,
 * ignoring any subsequently modified textarea text.
 */
export function getSessionSourceText<T>(
  session: SourceSnapshotSession<T> | null | undefined
): string | null {
  if (!session || typeof session.analyzedSourceText !== "string") {
    return null;
  }
  return session.analyzedSourceText;
}

/**
 * Determines whether the current editable text has diverged from the analyzed snapshot.
 */
export function isSnapshotDiverged<T>(
  session: SourceSnapshotSession<T> | null | undefined,
  currentText: string
): boolean {
  if (!session) {
    return false;
  }
  return session.analyzedSourceText !== (typeof currentText === "string" ? currentText.trim() : "");
}
