import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  captureSourceSnapshot,
  createSnapshotSession,
  getSessionSourceText,
  isSnapshotDiverged,
  type SourceSnapshotSession,
} from "./source-snapshot.ts";
import {
  addCandidateToLedgerItems,
  resolveItemSource,
  resolveItemSourceText,
} from "./ledger-actions.ts";
import { verifyEvidence } from "./verifier.ts";
import { SAMPLE_PROJECT, type AgreementItem } from "./sample-data.ts";
import type { VerifiedExtractedCandidate } from "./nebius-extraction.ts";

describe("Source Snapshot Integrity & Divergence Handling", () => {
  const originalEmail = `From: Sarah Jenkins <sarah@clientbrand.org>
Date: Oct 12, 2026, 11:15 AM
Subject: Mobile navigation feedback

Hi Marcus,
We agree to proceed with the slide-out menu drawer at the quoted $650 addition.
Please ensure it is completed by Oct 24th.`;

  const quoteText = "We agree to proceed with the slide-out menu drawer at the quoted $650 addition.";

  const mockCandidate: VerifiedExtractedCandidate = {
    id: "cand-nav-drawer-650",
    claim: "Slide-out menu drawer addition for $650",
    evidenceQuote: quoteText,
    speaker: "Sarah Jenkins",
    timestamp: "Oct 12, 2026, 11:15 AM",
    commitmentType: "prices",
    speechAct: "acceptance",
    suggestedStatus: "baseline",
    confidence: "high",
    explanation: "Explicit acceptance of quoted $650 addition for slide-out menu drawer.",
    quoteVerified: true,
    verificationDetails: {
      verified: true,
      exactMatch: true,
      matchedText: quoteText,
      startIndex: originalEmail.indexOf(quoteText),
      endIndex: originalEmail.indexOf(quoteText) + quoteText.length,
    },
  };

  describe("Requirement 1: Source Snapshot Capture", () => {
    it("trims outer whitespace from source text to produce an immutable snapshot", () => {
      const untrimmed = `   \n\n${originalEmail}\n\t  `;
      const snapshot = captureSourceSnapshot(untrimmed);
      assert.equal(snapshot, originalEmail);
    });

    it("handles empty or whitespace-only strings safely", () => {
      assert.equal(captureSourceSnapshot(""), "");
      assert.equal(captureSourceSnapshot("   \n\t  "), "");
      assert.equal(captureSourceSnapshot(null as unknown as string), "");
    });
  });

  describe("Requirement 2 & 3: Snapshot Session Association", () => {
    it("creates a session associating analyzed snapshot with extraction results", () => {
      const snapshot = captureSourceSnapshot(originalEmail);
      const session = createSnapshotSession(snapshot, { candidates: [mockCandidate] });

      assert.equal(session.analyzedSourceText, originalEmail);
      assert.equal(session.result.candidates.length, 1);
      assert.equal(session.result.candidates[0].id, mockCandidate.id);
      assert.ok(typeof session.capturedAt === "number");
    });

    it("getSessionSourceText returns the session snapshot", () => {
      const snapshot = captureSourceSnapshot(originalEmail);
      const session = createSnapshotSession(snapshot, { candidates: [mockCandidate] });

      assert.equal(getSessionSourceText(session), originalEmail);
      assert.equal(getSessionSourceText(null), null);
      assert.equal(getSessionSourceText(undefined), null);
    });
  });

  describe("Requirement 4 & Divergence: Mutable Textarea vs Immutable Snapshot", () => {
    it("detects divergence when live textarea is modified after extraction", () => {
      const snapshot = captureSourceSnapshot(originalEmail);
      const session = createSnapshotSession(snapshot, { candidates: [mockCandidate] });

      // Unmodified textarea
      assert.equal(isSnapshotDiverged(session, originalEmail), false);
      assert.equal(isSnapshotDiverged(session, `  ${originalEmail}  \n`), false);

      // Modified textarea
      const editedText = "Different client message: We cancel the slide-out menu.";
      assert.equal(isSnapshotDiverged(session, editedText), true);

      // Cleared textarea
      assert.equal(isSnapshotDiverged(session, ""), true);

      // Null session has no divergence
      assert.equal(isSnapshotDiverged(null, editedText), false);
    });

    it("passes the analyzed snapshot (not modified textarea) when adding candidate to ledger", () => {
      // 1. Snapshot captured at extraction
      const snapshot = captureSourceSnapshot(originalEmail);
      const session = createSnapshotSession(snapshot, { candidates: [mockCandidate] });

      // 2. User edits textarea afterwards
      const divergedTextarea = "Hey Marcus,\nForget the slide-out menu drawer. We want a fixed bottom bar instead.";

      // 3. User clicks 'Add to Ledger'. The handler must use session.analyzedSourceText!
      const initialLedger: AgreementItem[] = [...SAMPLE_PROJECT.initialItems];
      const sourceToAttach = session.analyzedSourceText;

      const result = addCandidateToLedgerItems(
        initialLedger,
        mockCandidate,
        sourceToAttach,
        { sourceThreadId: "live-extraction" }
      );

      assert.equal(result.success, true);
      assert.ok(result.affectedItem);

      // 4. Verify candidate is bound to original snapshot, NOT diverged textarea
      assert.equal(result.affectedItem.sourceText, originalEmail);
      assert.notEqual(result.affectedItem.sourceText, divergedTextarea);

      // 5. Verify authoritative resolution resolves to the snapshot
      const resolved = resolveItemSource(result.affectedItem, SAMPLE_PROJECT.threads);
      assert.ok(resolved);
      assert.equal(resolved.sourceType, "live");
      assert.equal(resolved.sourceText, originalEmail);
      assert.equal(resolveItemSourceText(result.affectedItem, SAMPLE_PROJECT.threads), originalEmail);

      // 6. Verify evidence verification succeeds against attached snapshot
      const quoteCheck = verifyEvidence(result.affectedItem.sourceText!, result.affectedItem.evidenceQuote);
      assert.equal(quoteCheck.verified, true);

      // If divergedTextarea had been mistakenly attached, verification would fail:
      const brokenCheck = verifyEvidence(divergedTextarea, mockCandidate.evidenceQuote);
      assert.equal(brokenCheck.verified, false);
    });
  });

  describe("Requirement 5 & 6: Invalidation & Replacement on New Extraction", () => {
    it("invalidating stale session prevents adding candidates until new extraction completes", () => {
      let session: SourceSnapshotSession<{ candidates: VerifiedExtractedCandidate[] }> | null =
        createSnapshotSession(captureSourceSnapshot(originalEmail), { candidates: [mockCandidate] });

      // Starting new extraction: stale session is invalidated immediately
      session = null;
      assert.equal(getSessionSourceText(session), null);

      // New extraction completes with new source and new candidates
      const secondEmail = "From: Sarah\nLet us finalize the timeline for Nov 10th launch.";
      const secondCandidate: VerifiedExtractedCandidate = {
        id: "cand-launch-date",
        claim: "Project launch on Nov 10th",
        evidenceQuote: "finalize the timeline for Nov 10th launch",
        speaker: "Sarah",
        timestamp: "Oct 13, 2026",
        commitmentType: "deadlines",
        speechAct: "acceptance",
        suggestedStatus: "proposed",
        confidence: "high",
        explanation: "Nov 10th launch target",
        quoteVerified: true,
        verificationDetails: {
          verified: true,
          exactMatch: true,
          matchedText: "finalize the timeline for Nov 10th launch",
          startIndex: secondEmail.indexOf("finalize the timeline for Nov 10th launch"),
          endIndex: secondEmail.indexOf("finalize the timeline for Nov 10th launch") + "finalize the timeline for Nov 10th launch".length,
        },
      };

      const newSnapshot = captureSourceSnapshot(secondEmail);
      session = createSnapshotSession(newSnapshot, { candidates: [secondCandidate] });

      assert.equal(session.analyzedSourceText, secondEmail);
      assert.equal(session.result.candidates[0].id, "cand-launch-date");
    });
  });

  describe("Requirement 7: Preservation of Existing Ledger Safeguards", () => {
    it("downgrades suggested baseline status to proposed for live correspondence snapshots", () => {
      const snapshot = captureSourceSnapshot(originalEmail);
      const session = createSnapshotSession(snapshot, { candidates: [mockCandidate] });

      const initialLedger: AgreementItem[] = [...SAMPLE_PROJECT.initialItems];
      const result = addCandidateToLedgerItems(
        initialLedger,
        session.result.candidates[0],
        session.analyzedSourceText
      );

      assert.equal(result.success, true);
      assert.ok(result.affectedItem);
      // Trust Boundary invariant: ordinary correspondence cannot establish baseline
      assert.equal(result.affectedItem.status, "proposed");
    });

    it("rejects candidate addition when quote verification failed", () => {
      const invalidCandidate: VerifiedExtractedCandidate = {
        ...mockCandidate,
        id: "cand-invalid-quote",
        evidenceQuote: "fabricated quote that does not appear in source",
        quoteVerified: false,
        verificationDetails: {
          verified: false,
          reason: "QUOTE_NOT_FOUND",
          message: "Quote substring not found in source text",
        },
      };

      const snapshot = captureSourceSnapshot(originalEmail);
      const initialLedger: AgreementItem[] = [...SAMPLE_PROJECT.initialItems];

      const result = addCandidateToLedgerItems(
        initialLedger,
        invalidCandidate,
        snapshot
      );

      assert.equal(result.success, false);
      assert.match(result.error || "", /evidence quotation failed mechanical verification/i);
    });
  });
});
