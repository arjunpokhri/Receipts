import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveItemSource,
  resolveItemSourceText,
} from "./source-resolver.ts";
import { verifyEvidence } from "./verifier.ts";
import { SAMPLE_PROJECT, type AgreementItem } from "./sample-data.ts";

describe("Authoritative Source Resolution", () => {
  const liveSourceEmail = `From: Sarah Jenkins <sarah@clientbrand.org>
Date: Oct 12, 2026, 11:15 AM
Subject: Mobile navigation feedback

Hi Marcus,
We agree to proceed with the slide-out menu drawer at the quoted $650 addition.`;

  describe("Task 1: Resolve Each Item's Correct Source", () => {
    it("prefers item's own sourceText even when matching thread ID exists in sample project", () => {
      const liveItem: AgreementItem = {
        id: "live-item-1",
        claim: "Slide-out menu drawer for $650",
        evidenceQuote: "We agree to proceed with the slide-out menu drawer at the quoted $650 addition.",
        speaker: "Sarah Jenkins",
        timestamp: "Oct 12, 2026",
        commitmentType: "prices",
        speechAct: "acceptance",
        status: "proposed",
        explanation: "Live item with attached source",
        sourceThreadId: "thread-kickoff", // matches a sample thread ID!
        sourceText: liveSourceEmail,
      };

      const resolved = resolveItemSource(liveItem, SAMPLE_PROJECT.threads);
      assert.ok(resolved);
      assert.equal(resolved.sourceType, "live");
      assert.equal(resolved.sourceText, liveSourceEmail);
      assert.equal(resolved.title, "Live Pasted Correspondence");
      assert.equal(resolved.channel, "Direct Input");

      // Verify text helper extracts the exact same string
      const resolvedText = resolveItemSourceText(liveItem, SAMPLE_PROJECT.threads);
      assert.equal(resolvedText, liveSourceEmail);
      assert.notEqual(resolvedText, SAMPLE_PROJECT.threads[0].rawText);
    });

    it("resolves sample item without sourceText through its matching thread ID", () => {
      // Pick each sample item and verify it resolves to its own specific thread
      for (const item of SAMPLE_PROJECT.initialItems) {
        const resolved = resolveItemSource(item, SAMPLE_PROJECT.threads);
        assert.ok(resolved, `Item ${item.id} should resolve to a source`);
        assert.equal(resolved.sourceType, "thread");
        assert.equal(resolved.threadId, item.sourceThreadId);

        const expectedThread = SAMPLE_PROJECT.threads.find((t) => t.id === item.sourceThreadId);
        assert.ok(expectedThread);
        assert.equal(resolved.sourceText, expectedThread.rawText);
        assert.equal(resolved.title, expectedThread.title);
        assert.equal(resolved.channel, expectedThread.channel);
      }
    });

    it("does NOT silently fall back to threads[0] when sourceThreadId is unknown and sourceText is absent", () => {
      const orphanItem: AgreementItem = {
        id: "orphan-item",
        claim: "Unlinked claim",
        evidenceQuote: "Some unlinked quotation",
        speaker: "Client",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Has invalid source thread ID",
        sourceThreadId: "nonexistent-thread-xyz",
      };

      const resolved = resolveItemSource(orphanItem, SAMPLE_PROJECT.threads);
      assert.equal(resolved, undefined);

      const resolvedText = resolveItemSourceText(orphanItem, SAMPLE_PROJECT.threads);
      assert.equal(resolvedText, undefined);
    });

    it("does NOT fall back to threads[0] when sourceThreadId is empty string", () => {
      const emptyThreadItem: AgreementItem = {
        id: "empty-thread-item",
        claim: "Unlinked claim",
        evidenceQuote: "Quotation",
        speaker: "Client",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Empty thread ID",
        sourceThreadId: "",
      };

      const resolved = resolveItemSource(emptyThreadItem, SAMPLE_PROJECT.threads);
      assert.equal(resolved, undefined);
    });

    it("evidence verification and execution-trace source resolution use the same authoritative source", () => {
      const liveItem: AgreementItem = {
        id: "live-item-trace",
        claim: "Slide-out menu drawer",
        evidenceQuote: "slide-out menu drawer at the quoted $650 addition",
        speaker: "Sarah Jenkins",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Live item",
        sourceThreadId: "live-extraction",
        sourceText: liveSourceEmail,
      };

      // 1. Direct resolver
      const resolved = resolveItemSource(liveItem, SAMPLE_PROJECT.threads);
      assert.ok(resolved);

      // 2. Direct verification on resolved source
      const directVerification = verifyEvidence(resolved.sourceText, liveItem.evidenceQuote);
      assert.equal(directVerification.verified, true);

      // 3. Simulated execution-trace resolution
      const traceSource = resolveItemSource(liveItem, SAMPLE_PROJECT.threads);
      const traceVerification = traceSource
        ? verifyEvidence(traceSource.sourceText, liveItem.evidenceQuote)
        : null;

      assert.ok(traceVerification);
      assert.equal(traceVerification.verified, true);
      assert.equal(traceVerification.exactMatch, directVerification.exactMatch);
      assert.equal(traceVerification.startIndex, directVerification.startIndex);

      // 4. In contrast, verifying against bundled sample threads[0] fails completely
      const wrongVerification = verifyEvidence(SAMPLE_PROJECT.threads[0].rawText, liveItem.evidenceQuote);
      assert.equal(wrongVerification.verified, false);
    });

    it("verifies quote highlights against the exact original source text", () => {
      const customContract = "Scope agreement:\n1. Initial wireframes delivered by Monday.\n2. Final exports in SVG.";
      const item: AgreementItem = {
        id: "item-highlight",
        claim: "Final exports in SVG",
        evidenceQuote: "Final exports in SVG.",
        speaker: "Designer",
        timestamp: "Oct 10",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Highlight check",
        sourceThreadId: "custom",
        sourceText: customContract,
      };

      const resolved = resolveItemSource(item, SAMPLE_PROJECT.threads);
      assert.ok(resolved);

      const verification = verifyEvidence(resolved.sourceText, item.evidenceQuote);
      assert.equal(verification.verified, true);
      if (verification.verified) {
        const sliced = resolved.sourceText.slice(verification.startIndex, verification.endIndex);
        assert.equal(sliced, item.evidenceQuote);
      }
    });

    it("preserves all existing sample ledger items without breaking verification", () => {
      assert.equal(SAMPLE_PROJECT.initialItems.length, 6);

      for (const item of SAMPLE_PROJECT.initialItems) {
        const source = resolveItemSource(item, SAMPLE_PROJECT.threads);
        assert.ok(source, `Sample item ${item.id} must resolve`);

        const res = verifyEvidence(source.sourceText, item.evidenceQuote);
        assert.equal(res.verified, true, `Evidence for ${item.id} must verify against its thread`);
      }
    });
  });
});
