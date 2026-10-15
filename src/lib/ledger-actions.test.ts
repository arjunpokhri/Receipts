import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveItemSourceText,
  createLiveLedgerItem,
  confirmLedgerItem,
  dismissLedgerItem,
  restoreLedgerItem,
  confirmItemInLedger,
  dismissItemInLedger,
  restoreItemInLedger,
  addCandidateToLedgerItems,
  type LiveCandidateInput,
} from "./ledger-actions.ts";
import { SAMPLE_PROJECT, type AgreementItem } from "./sample-data.ts";

describe("Trust-Boundary Ledger Actions", () => {
  const sampleEmail = `From: Sarah Jenkins <sarah@clientbrand.org>
Date: Oct 12, 2026, 11:15 AM
Subject: Mobile navigation feedback

Hi Marcus,
We love the desktop wireframes. For mobile navigation, we agree to proceed with the slide-out menu drawer at the quoted $650 addition.
Please ensure it is completed by Oct 24th.`;

  const validCandidate: LiveCandidateInput = {
    claim: "Slide-out menu drawer addition for $650",
    evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
    speaker: "Sarah Jenkins",
    timestamp: "Oct 12, 2026, 11:15 AM",
    commitmentType: "prices",
    speechAct: "acceptance",
    suggestedStatus: "proposed",
    quoteVerified: true,
    explanation: "Client accepted the slide-out menu drawer addition.",
  };

  describe("Task 1: Protect Candidate Addition", () => {
    it("refuses to add a candidate when quoteVerified is false", () => {
      const candidate: LiveCandidateInput = {
        ...validCandidate,
        quoteVerified: false,
      };

      const result = createLiveLedgerItem(candidate, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /mechanical verification/i);
    });

    it("refuses to add a candidate when quoteVerified is undefined", () => {
      const candidate: LiveCandidateInput = {
        ...validCandidate,
        quoteVerified: undefined,
      };

      const result = createLiveLedgerItem(candidate, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /mechanical verification/i);
    });

    it("refuses to add candidate if quotation does not exist in provided source text", () => {
      const candidate: LiveCandidateInput = {
        ...validCandidate,
        evidenceQuote: "fabricated quotation that does not exist in email",
        quoteVerified: true, // Malicious or corrupted flag
      };

      const result = createLiveLedgerItem(candidate, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /not present in source text/i);
    });

    it("refuses to add candidate if source text is missing or whitespace only", () => {
      const resultEmpty = createLiveLedgerItem(validCandidate, "");
      assert.equal(resultEmpty.success, false);
      assert.match(resultEmpty.error || "", /source communication text is missing/i);

      const resultWhitespace = createLiveLedgerItem(validCandidate, "   \n\t  ");
      assert.equal(resultWhitespace.success, false);
      assert.match(resultWhitespace.error || "", /source communication text is missing/i);
    });

    it("strictly refuses candidate if model attempts to set confirmed or dismissed", () => {
      const confirmedCandidate: LiveCandidateInput = {
        ...validCandidate,
        suggestedStatus: "confirmed",
      };
      const resultConfirmed = createLiveLedgerItem(confirmedCandidate, sampleEmail);
      assert.equal(resultConfirmed.success, false);
      assert.match(resultConfirmed.error || "", /cannot set terminal status 'confirmed'/i);

      const dismissedCandidate: LiveCandidateInput = {
        ...validCandidate,
        suggestedStatus: "dismissed",
      };
      const resultDismissed = createLiveLedgerItem(dismissedCandidate, sampleEmail);
      assert.equal(resultDismissed.success, false);
      assert.match(resultDismissed.error || "", /cannot set terminal status 'dismissed'/i);
    });

    it("downgrades model-suggested baseline to proposed with an explanation notice", () => {
      const baselineCandidate: LiveCandidateInput = {
        ...validCandidate,
        suggestedStatus: "baseline",
        explanation: "Initial project kickoff scope.",
      };

      const result = createLiveLedgerItem(baselineCandidate, sampleEmail);
      assert.equal(result.success, true);
      assert.ok(result.item);
      assert.equal(result.item.status, "proposed");
      assert.equal(result.item.originalSuggestedStatus, "baseline");
      assert.match(result.item.explanation, /downgraded to proposed/i);
      assert.match(result.item.explanation, /original agreement must be designated separately/i);
    });

    it("stores the exact source text and quoteVerified flag directly on the created ledger item", () => {
      const result = createLiveLedgerItem(validCandidate, sampleEmail);
      assert.equal(result.success, true);
      assert.ok(result.item);
      assert.equal(result.item.sourceText, sampleEmail);
      assert.equal(result.item.quoteVerified, true);
      assert.equal(result.item.originalSuggestedStatus, "proposed");
    });
  });

  describe("Task 2: Source Text Resolution and Evidence Ownership", () => {
    it("resolves source text from item.sourceText for live items", () => {
      const liveItem: AgreementItem = {
        id: "live-item-1",
        claim: "Custom term",
        evidenceQuote: "we agree to proceed",
        speaker: "Sarah",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Explanation",
        sourceThreadId: "live-extraction",
        sourceText: sampleEmail,
      };

      const resolved = resolveItemSourceText(liveItem, SAMPLE_PROJECT.threads);
      assert.equal(resolved, sampleEmail);
    });

    it("resolves source text from matching project thread when sourceText is absent", () => {
      const sampleItem = SAMPLE_PROJECT.initialItems[0];
      const matchingThread = SAMPLE_PROJECT.threads.find((t) => t.id === sampleItem.sourceThreadId);
      assert.ok(matchingThread);

      const resolved = resolveItemSourceText(sampleItem, SAMPLE_PROJECT.threads);
      assert.equal(resolved, matchingThread.rawText);
    });

    it("verifies live item against its own sourceText, NOT bundled sample threads", () => {
      const uniqueSourceText = "Unique client contract text: Delivery is promised by November 30th.";
      const liveItem: AgreementItem = {
        id: "live-item-unique",
        claim: "Delivery by November 30th",
        evidenceQuote: "Delivery is promised by November 30th",
        speaker: "Client",
        timestamp: "Nov 1",
        commitmentType: "deadlines",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Test item",
        sourceThreadId: "custom-source",
        sourceText: uniqueSourceText,
        quoteVerified: true,
      };

      // Confirmation succeeds with the item's own resolved source text
      const resolved = resolveItemSourceText(liveItem, SAMPLE_PROJECT.threads);
      assert.equal(resolved, uniqueSourceText);

      const confirmResult = confirmLedgerItem(liveItem, resolved);
      assert.equal(confirmResult.success, true);
      assert.equal(confirmResult.item?.status, "confirmed");

      // Attempting to confirm with bundled thread text fails because the quote doesn't exist there
      const wrongThread = SAMPLE_PROJECT.threads[0].rawText;
      const failedConfirm = confirmLedgerItem(liveItem, wrongThread);
      assert.equal(failedConfirm.success, false);
      assert.match(failedConfirm.error || "", /evidence quotation failed verification/i);
    });
  });

  describe("Task 3: Ledger Status Transitions and Invariants", () => {
    it("allows confirmation from proposed and sets honest generic reviewer attribution", () => {
      const proposedItem: AgreementItem = {
        id: "prop-1",
        claim: "Slide-out menu drawer",
        evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
        speaker: "Sarah Jenkins",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Scope addition",
        sourceThreadId: "live-source",
        sourceText: sampleEmail,
      };

      const result = confirmLedgerItem(proposedItem, sampleEmail);
      assert.equal(result.success, true);
      assert.ok(result.item);
      assert.equal(result.item.status, "confirmed");
      assert.equal(result.item.confirmedBy, "Human Reviewer");
      assert.ok(result.item.confirmedAt);
    });

    it("allows confirmation from unclear", () => {
      const unclearItem: AgreementItem = {
        id: "unclear-1",
        claim: "Slide-out menu drawer",
        evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
        speaker: "Sarah Jenkins",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "unclear",
        explanation: "Clarified scope addition",
        sourceThreadId: "live-source",
        sourceText: sampleEmail,
      };

      const result = confirmLedgerItem(unclearItem, sampleEmail);
      assert.equal(result.success, true);
      assert.equal(result.item?.status, "confirmed");
    });

    it("strictly refuses confirmation of baseline items", () => {
      const baselineItem = SAMPLE_PROJECT.initialItems.find((i) => i.status === "baseline");
      assert.ok(baselineItem);

      const source = resolveItemSourceText(baselineItem, SAMPLE_PROJECT.threads);
      const result = confirmLedgerItem(baselineItem, source);
      assert.equal(result.success, false);
      assert.match(result.error || "", /cannot confirm baseline item/i);
    });

    it("strictly refuses confirmation of already confirmed items", () => {
      const confirmedItem: AgreementItem = {
        id: "already-conf",
        claim: "Confirmed item",
        evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
        speaker: "Sarah",
        timestamp: "Oct 12",
        commitmentType: "prices",
        speechAct: "acceptance",
        status: "confirmed",
        explanation: "Done",
        sourceThreadId: "live",
        sourceText: sampleEmail,
      };

      const result = confirmLedgerItem(confirmedItem, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /already confirmed/i);
    });

    it("strictly refuses confirmation of dismissed items without prior restoration", () => {
      const dismissedItem: AgreementItem = {
        id: "dismissed-1",
        claim: "Dismissed claim",
        evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
        speaker: "Sarah",
        timestamp: "Oct 12",
        commitmentType: "prices",
        speechAct: "acceptance",
        status: "dismissed",
        explanation: "Dismissed candidate",
        sourceThreadId: "live",
        sourceText: sampleEmail,
      };

      const result = confirmLedgerItem(dismissedItem, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /cannot confirm dismissed item/i);
    });

    it("refuses confirmation if evidence quotation fails verification against source", () => {
      const corruptedItem: AgreementItem = {
        id: "corrupted-1",
        claim: "Tampered evidence claim",
        evidenceQuote: "This quote was changed and is not in the email",
        speaker: "Sarah",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "Corrupted",
        sourceThreadId: "live",
        sourceText: sampleEmail,
      };

      const result = confirmLedgerItem(corruptedItem, sampleEmail);
      assert.equal(result.success, false);
      assert.match(result.error || "", /failed verification against stored source/i);
    });

    it("refuses confirmation if source text is missing", () => {
      const itemNoSource: AgreementItem = {
        id: "no-source",
        claim: "Claim",
        evidenceQuote: "Some quote",
        speaker: "Sarah",
        timestamp: "Oct 12",
        commitmentType: "deliverables",
        speechAct: "commitment",
        status: "proposed",
        explanation: "No source",
        sourceThreadId: "nonexistent",
      };

      const result = confirmLedgerItem(itemNoSource, undefined);
      assert.equal(result.success, false);
      assert.match(result.error || "", /missing source text/i);
    });

    it("enforces dismissal rules: baseline cannot be dismissed; already dismissed cannot be dismissed", () => {
      const baselineItem = SAMPLE_PROJECT.initialItems.find((i) => i.status === "baseline")!;
      const baselineDismiss = dismissLedgerItem(baselineItem);
      assert.equal(baselineDismiss.success, false);
      assert.match(baselineDismiss.error || "", /cannot dismiss baseline item/i);

      const proposedItem: AgreementItem = {
        ...SAMPLE_PROJECT.initialItems[0],
        status: "proposed",
      };
      const proposedDismiss = dismissLedgerItem(proposedItem);
      assert.equal(proposedDismiss.success, true);
      assert.equal(proposedDismiss.item?.status, "dismissed");
      assert.ok(proposedDismiss.item?.dismissedAt);

      const dismissedDismiss = dismissLedgerItem(proposedDismiss.item!);
      assert.equal(dismissedDismiss.success, false);
      assert.match(dismissedDismiss.error || "", /already dismissed/i);
    });

    it("enforces restoration rules: only dismissed can be restored; restores to proposed or original suggested status", () => {
      const proposedItem: AgreementItem = {
        ...SAMPLE_PROJECT.initialItems[0],
        status: "proposed",
      };
      const nonDismissedRestore = restoreLedgerItem(proposedItem);
      assert.equal(nonDismissedRestore.success, false);
      assert.match(nonDismissedRestore.error || "", /only dismissed items can be restored/i);

      // Restore item that was originally proposed
      const dismissedItem: AgreementItem = {
        ...proposedItem,
        status: "dismissed",
        dismissedAt: "Oct 15, 2:00 PM",
        originalSuggestedStatus: "proposed",
      };
      const restoredProposed = restoreLedgerItem(dismissedItem);
      assert.equal(restoredProposed.success, true);
      assert.equal(restoredProposed.item?.status, "proposed");
      assert.equal(restoredProposed.item?.dismissedAt, undefined);

      // Restore item that was originally unclear
      const dismissedUnclearItem: AgreementItem = {
        ...proposedItem,
        status: "dismissed",
        dismissedAt: "Oct 15, 2:00 PM",
        originalSuggestedStatus: "unclear",
      };
      const restoredUnclear = restoreLedgerItem(dismissedUnclearItem);
      assert.equal(restoredUnclear.success, true);
      assert.equal(restoredUnclear.item?.status, "unclear");
      assert.equal(restoredUnclear.item?.dismissedAt, undefined);
    });
  });

  describe("Task 4: Collection-Level Helpers and Sample Project Integrity", () => {
    it("confirms an item in a ledger collection immutably", () => {
      const initialItems = [...SAMPLE_PROJECT.initialItems];
      const proposedItem = initialItems.find((i) => i.status === "proposed");
      assert.ok(proposedItem);

      const result = confirmItemInLedger(initialItems, proposedItem.id, SAMPLE_PROJECT.threads);
      assert.equal(result.success, true);
      assert.notEqual(result.items, initialItems); // Immutable array copy
      const updated = result.items.find((i) => i.id === proposedItem.id);
      assert.equal(updated?.status, "confirmed");
      assert.equal(updated?.confirmedBy, "Human Reviewer");
    });

    it("dismisses and restores an item in a ledger collection immutably", () => {
      const initialItems = [...SAMPLE_PROJECT.initialItems];
      const proposedItem = initialItems.find((i) => i.status === "proposed");
      assert.ok(proposedItem);

      // Dismiss
      const dismissRes = dismissItemInLedger(initialItems, proposedItem.id);
      assert.equal(dismissRes.success, true);
      const dismissed = dismissRes.items.find((i) => i.id === proposedItem.id);
      assert.equal(dismissed?.status, "dismissed");
      assert.ok(dismissed?.dismissedAt);

      // Restore
      const restoreRes = restoreItemInLedger(dismissRes.items, proposedItem.id);
      assert.equal(restoreRes.success, true);
      const restored = restoreRes.items.find((i) => i.id === proposedItem.id);
      assert.equal(restored?.status, "proposed");
      assert.equal(restored?.dismissedAt, undefined);
    });

    it("adds a live candidate to ledger collection immutably", () => {
      const initialItems = [...SAMPLE_PROJECT.initialItems];
      const result = addCandidateToLedgerItems(initialItems, validCandidate, sampleEmail);

      assert.equal(result.success, true);
      assert.equal(result.items.length, initialItems.length + 1);
      assert.equal(result.items[0].claim, validCandidate.claim);
      assert.equal(result.items[0].sourceText, sampleEmail);
      assert.equal(result.items[0].quoteVerified, true);
    });

    it("refuses to add candidate to ledger collection when unverified", () => {
      const initialItems = [...SAMPLE_PROJECT.initialItems];
      const unverified = { ...validCandidate, quoteVerified: false };
      const result = addCandidateToLedgerItems(initialItems, unverified, sampleEmail);

      assert.equal(result.success, false);
      assert.equal(result.items.length, initialItems.length);
      assert.match(result.error || "", /mechanical verification/i);
    });
  });
});
