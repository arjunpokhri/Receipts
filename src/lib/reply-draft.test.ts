import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateReplyDraft } from "./reply-draft.ts";
import { SAMPLE_PROJECT, type AgreementItem } from "./sample-data.ts";

describe("Accurate Reply Draft Generator", () => {
  const liveDeliverableItem: AgreementItem = {
    id: "live-item-deliv",
    claim: "Interactive SVG flowchart component",
    evidenceQuote: "Could we also get an interactive SVG flowchart component included?",
    speaker: "Client Lead",
    timestamp: "Nov 3, 2026",
    commitmentType: "deliverables",
    speechAct: "request",
    status: "proposed",
    explanation: "New deliverable requested in review.",
    sourceThreadId: "live-extraction",
    sourceText: "Could we also get an interactive SVG flowchart component included?",
    quoteVerified: true,
  };

  const livePriceItem: AgreementItem = {
    id: "live-item-price",
    claim: "Extra API integration fee $750",
    evidenceQuote: "We agree on $750 for the additional payment gateway integration.",
    speaker: "Finance Lead",
    timestamp: "Nov 4, 2026",
    commitmentType: "prices",
    speechAct: "acceptance",
    status: "proposed",
    explanation: "Agreed add-on price.",
    sourceThreadId: "live-extraction",
    sourceText: "We agree on $750 for the additional payment gateway integration.",
    quoteVerified: true,
  };

  const liveDeadlineItem: AgreementItem = {
    id: "live-item-deadline",
    claim: "Staging deployment by December 1st",
    evidenceQuote: "Please have the staging deployment ready by December 1st.",
    speaker: "Product Manager",
    timestamp: "Nov 5, 2026",
    commitmentType: "deadlines",
    speechAct: "request",
    status: "proposed",
    explanation: "New milestone target.",
    sourceThreadId: "live-extraction",
    sourceText: "Please have the staging deployment ready by December 1st.",
    quoteVerified: true,
  };

  const liveRevisionItem: AgreementItem = {
    id: "live-item-rev",
    claim: "Up to 2 rounds of review feedback",
    evidenceQuote: "We would like up to 2 rounds of review feedback on the design.",
    speaker: "Design Director",
    timestamp: "Nov 6, 2026",
    commitmentType: "revision_limits",
    speechAct: "proposal",
    status: "proposed",
    explanation: "Revision limit proposal.",
    sourceThreadId: "live-extraction",
    sourceText: "We would like up to 2 rounds of review feedback on the design.",
    quoteVerified: true,
  };

  const baselineItem: AgreementItem = {
    id: "baseline-item-01",
    claim: "Brand identity guidelines document",
    evidenceQuote: "Deliverables include comprehensive brand identity guidelines.",
    speaker: "Marcus Miller",
    timestamp: "Oct 1, 2026",
    commitmentType: "deliverables",
    speechAct: "commitment",
    status: "baseline",
    explanation: "Core agreed baseline deliverable.",
    sourceThreadId: "contract-v1",
    sourceText: "Deliverables include comprehensive brand identity guidelines.",
    quoteVerified: true,
  };

  const unclearItem: AgreementItem = {
    id: "unclear-item-01",
    claim: "Automated daily database backups",
    evidenceQuote: "We might want automated daily database backups configured as well.",
    speaker: "DevOps Engineer",
    timestamp: "Nov 7, 2026",
    commitmentType: "deliverables",
    speechAct: "request",
    status: "unclear",
    explanation: "Ambiguous deliverable mention.",
    sourceThreadId: "live-extraction",
    sourceText: "We might want automated daily database backups configured as well.",
    quoteVerified: true,
  };

  const itemMissingSpeaker: AgreementItem = {
    id: "no-speaker-item",
    claim: "Multi-factor authentication support",
    evidenceQuote: "Multi-factor authentication must be supported on login.",
    speaker: "",
    timestamp: "Nov 8, 2026",
    commitmentType: "deliverables",
    speechAct: "request",
    status: "proposed",
    explanation: "MFA requirement with unknown speaker.",
    sourceThreadId: "live-extraction",
    sourceText: "Multi-factor authentication must be supported on login.",
    quoteVerified: true,
  };

  describe("Requirement 1: Null Selection & Missing Item", () => {
    it("returns empty string when item is null or undefined", () => {
      assert.equal(generateReplyDraft(null, { clientName: "Alex" }), "");
      assert.equal(generateReplyDraft(undefined, { clientName: "Alex" }), "");
      assert.equal(generateReplyDraft(null, null), "");
    });

    it("does NOT generate client-facing message claiming project is on schedule or commitments fulfilled when no item selected", () => {
      const draft = generateReplyDraft(null, {
        clientName: "Jordan",
        contractorName: "Dev Studio",
        title: "Portal Redesign",
      });

      assert.equal(draft, "");
      assert.equal(draft.includes("on schedule"), false);
      assert.equal(draft.includes("baseline commitments"), false);
      assert.equal(draft.includes("fulfilled"), false);
    });
  });

  describe("Requirement 2: Accurate Status Discrimination (Baseline vs Proposed/Unclear)", () => {
    it("describes baseline item as part of the baseline agreement", () => {
      const draft = generateReplyDraft(baselineItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /part of our baseline agreement/i);
      assert.equal(draft.includes("not yet been confirmed"), false);
    });

    it("describes proposed deliverable as discussed but not yet confirmed, never as baseline", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /discussed but has not yet been confirmed as part of our agreed project scope/i);
      assert.equal(draft.includes("part of our baseline agreement"), false);
    });

    it("describes unclear item as discussed but not yet confirmed, never as baseline", () => {
      const draft = generateReplyDraft(unclearItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /discussed but has not yet been confirmed as part of our agreed project scope/i);
      assert.equal(draft.includes("part of our baseline agreement"), false);
    });
  });

  describe("Requirement 3: Distinguish Model Claim from Verbatim Evidence Quote", () => {
    it("never wraps item.claim in quotation marks as though it were client text", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
      });

      // Claim should appear as plain descriptive text, NOT in quotes
      assert.match(draft, /the deliverable regarding Interactive SVG flowchart component/);
      assert.equal(draft.includes('"Interactive SVG flowchart component"'), false);
    });

    it("clearly wraps evidenceQuote in quotation marks as the cited quotation", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
      });

      assert.match(draft, /"Could we also get an interactive SVG flowchart component included\?"/);
    });
  });

  describe("Requirement 4: Speaker Attribution & Neutral Language", () => {
    it("uses speaker name when available without assuming client wrote a note", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
      });

      assert.match(draft, /Client Lead noted:/);
      assert.equal(draft.includes("Thanks for sending over the note"), false);
      assert.equal(draft.includes("your note"), false);
    });

    it("uses neutral language when speaker metadata is missing or blank", () => {
      const draft = generateReplyDraft(itemMissingSpeaker, {
        clientName: "Alex",
      });

      assert.match(draft, /In our recent communication, the following was noted:/);
      assert.equal(draft.includes("Thanks for sending over the note"), false);
      assert.equal(draft.includes("undefined"), false);
    });
  });

  describe("Requirement 5: Remove Unsolicited Commercial Commitments", () => {
    it("does NOT contain promises to accommodate, prepare change orders, or accept additional scope", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.equal(draft.toLowerCase().includes("glad to accommodate"), false);
      assert.equal(draft.toLowerCase().includes("accommodate"), false);
      assert.equal(draft.toLowerCase().includes("change order"), false);
      assert.equal(draft.toLowerCase().includes("add-on"), false);
      assert.equal(draft.toLowerCase().includes("accept additional scope"), false);
    });
  });

  describe("Requirement 6: Request Written Confirmation or Correction", () => {
    it("asks for written confirmation or correction on proposed items", () => {
      const draftDeliverable = generateReplyDraft(liveDeliverableItem, { clientName: "Alex" });
      assert.match(draftDeliverable, /written confirmation or correction/i);

      const draftPrice = generateReplyDraft(livePriceItem, { clientName: "Alex" });
      assert.match(draftPrice, /written confirmation or correction/i);

      const draftDeadline = generateReplyDraft(liveDeadlineItem, { clientName: "Alex" });
      assert.match(draftDeadline, /written confirmation or correction/i);

      const draftRevision = generateReplyDraft(liveRevisionItem, { clientName: "Alex" });
      assert.match(draftRevision, /written confirmation or correction/i);
    });

    it("asks for written confirmation or correction on baseline items", () => {
      const draftBaseline = generateReplyDraft(baselineItem, { clientName: "Alex" });
      assert.match(draftBaseline, /written correction is needed/i);
    });
  });

  describe("Sample Independence & Preservation", () => {
    it("draft for arbitrary deliverable does NOT contain hardcoded sample values ($3,500 or October 17th)", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex Rivera",
        contractorName: "Studio Team",
        title: "Fintech Dashboard",
      });

      assert.equal(draft.includes("$3,500"), false);
      assert.equal(draft.includes("October 17"), false);
      assert.equal(draft.includes("Phase 2 immediately following launch"), false);

      assert.match(draft, /Interactive SVG flowchart component/);
      assert.match(draft, /Could we also get an interactive SVG flowchart component included\?/);
      assert.match(draft, /Hi Alex Rivera,/);
      assert.match(draft, /Studio Team/);
    });

    it("draft for arbitrary price item does NOT contain hardcoded sample rates ($150/hr or $100/hr)", () => {
      const draft = generateReplyDraft(livePriceItem, {
        clientName: "Alex Rivera",
        contractorName: "Studio Team",
      });

      assert.equal(draft.includes("$150/hr"), false);
      assert.equal(draft.includes("$100/hr"), false);
      assert.equal(draft.includes("weekend maintenance"), false);
      assert.equal(draft.includes("weekend deployment window"), false);

      assert.match(draft, /\$750/);
      assert.match(draft, /We agree on \$750 for the additional payment gateway integration\./);
    });

    it("handles missing project metadata gracefully with neutral greetings and sign-offs", () => {
      const draftNoProject = generateReplyDraft(liveDeliverableItem, null);
      assert.match(draftNoProject, /^Hello,/);
      assert.match(draftNoProject, /Best regards,$/);
      assert.equal(draftNoProject.includes("undefined"), false);
      assert.equal(draftNoProject.includes("null"), false);
    });

    it("handles items with missing or blank claim or quote gracefully", () => {
      const sparseItem: AgreementItem = {
        ...liveDeliverableItem,
        claim: "",
        evidenceQuote: "",
      };

      const draft = generateReplyDraft(sparseItem, {
        clientName: "Client",
      });

      assert.equal(draft.includes("undefined"), false);
      assert.match(draft, /this item/);
      assert.match(draft, /\[cited evidence\]/);
    });

    it("preserves sample-project functionality for existing sample items", () => {
      const sampleItem = SAMPLE_PROJECT.initialItems.find((i) => i.id === "item-05");
      assert.ok(sampleItem);

      const draft = generateReplyDraft(sampleItem, SAMPLE_PROJECT);
      assert.match(draft, /Hi Elena Vance,/);
      assert.match(draft, /Marcus Miller/);
      assert.match(draft, /3D product viewer module/);
      assert.equal(draft.includes("undefined"), false);
    });
  });
});
