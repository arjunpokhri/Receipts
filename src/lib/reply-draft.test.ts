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

  describe("Task 2: Remove Sample-Specific Values from Live Reply Drafts", () => {
    it("draft for arbitrary deliverable does NOT contain hardcoded sample values ($3,500 or October 17th)", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex Rivera",
        contractorName: "Studio Team",
        title: "Fintech Dashboard",
      });

      // Must NOT contain sample Aura Health specifics
      assert.equal(draft.includes("$3,500"), false, "Must not contain hardcoded $3,500");
      assert.equal(draft.includes("October 17"), false, "Must not contain hardcoded October 17th");
      assert.equal(draft.includes("Phase 2 immediately following launch"), false);

      // Must include actual item details
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

      // Must NOT contain sample Aura Health rates or weekend terms
      assert.equal(draft.includes("$150/hr"), false, "Must not contain hardcoded $150/hr");
      assert.equal(draft.includes("$100/hr"), false, "Must not contain hardcoded $100/hr");
      assert.equal(draft.includes("weekend maintenance"), false);
      assert.equal(draft.includes("weekend deployment window"), false);

      // Must include the actual cited rate from evidence
      assert.match(draft, /\$750/);
      assert.match(draft, /We agree on \$750 for the additional payment gateway integration\./);
    });

    it("draft for arbitrary deadline item uses evidence quote and claim without inventing dates", () => {
      const draft = generateReplyDraft(liveDeadlineItem, {
        clientName: "Taylor",
        contractorName: "Studio Team",
      });

      assert.equal(draft.includes("October 17"), false);
      assert.match(draft, /December 1st/);
      assert.match(draft, /Staging deployment by December 1st/);
    });

    it("draft for arbitrary revision limit item uses evidence quote and claim without inventing limits", () => {
      const draft = generateReplyDraft(liveRevisionItem, {
        clientName: "Taylor",
        contractorName: "Studio Team",
      });

      assert.match(draft, /Up to 2 rounds of review feedback/);
      assert.match(draft, /We would like up to 2 rounds of review feedback on the design\./);
    });

    it("handles missing project and client metadata with neutral phrasing and placeholders", () => {
      // Missing project entirely
      const draftNoProject = generateReplyDraft(liveDeliverableItem, null);
      assert.match(draftNoProject, /^Hello,/);
      assert.match(draftNoProject, /Best regards,$/);
      assert.equal(draftNoProject.includes("undefined"), false);
      assert.equal(draftNoProject.includes("null"), false);

      // Missing item entirely (general status check)
      const draftNoItem = generateReplyDraft(null, {
        clientName: "Jordan",
        contractorName: "Dev Studio",
        title: "Portal Redesign",
      });
      assert.match(draftNoItem, /^Hi Jordan,/);
      assert.match(draftNoItem, /Portal Redesign/);
      assert.match(draftNoItem, /Dev Studio$/);

      // Missing both item and project
      const draftEmpty = generateReplyDraft(null, null);
      assert.match(draftEmpty, /^Hello,/);
      assert.match(draftEmpty, /on schedule with our baseline commitments/);
      assert.match(draftEmpty, /Best regards,$/);
      assert.equal(draftEmpty.includes("undefined"), false);
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
      assert.match(draft, /this scope item/);
      assert.match(draft, /\[cited evidence\]/);
    });

    it("preserves sample-project functionality for existing sample items", () => {
      const sampleItem = SAMPLE_PROJECT.initialItems.find((i) => i.id === "item-05");
      assert.ok(sampleItem);

      const draft = generateReplyDraft(sampleItem, SAMPLE_PROJECT);
      assert.match(draft, /Hi Elena Vance,/);
      assert.match(draft, /Marcus Miller/);
      assert.match(draft, /3D product viewer module/);
      // Even for sample items, it should not invent irrelevant dates
      assert.equal(draft.includes("undefined"), false);
    });
  });
});
