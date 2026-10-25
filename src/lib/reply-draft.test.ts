import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateReplyDraft, getStatusLabel, getSpeechActVerb } from "./reply-draft.ts";
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
    quoteVerified: true,
  };

  const confirmedItem: AgreementItem = {
    id: "confirmed-item-01",
    claim: "Mobile responsive checkout layout",
    evidenceQuote: "Confirmed: mobile responsive checkout layout will be included in Phase 1.",
    speaker: "Elena Vance",
    timestamp: "Oct 15, 2026",
    commitmentType: "deliverables",
    speechAct: "acceptance",
    status: "confirmed",
    explanation: "Confirmed scope item.",
    sourceThreadId: "thread-03",
    quoteVerified: true,
  };

  const dismissedItem: AgreementItem = {
    id: "dismissed-item-01",
    claim: "Legacy database export script",
    evidenceQuote: "We decided not to proceed with the legacy database export script.",
    speaker: "DevOps Lead",
    timestamp: "Oct 18, 2026",
    commitmentType: "deliverables",
    speechAct: "rejection",
    status: "dismissed",
    explanation: "Dismissed deliverable.",
    sourceThreadId: "thread-04",
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

  describe("Requirement 1: Status-Aware Wording (Baseline, Proposed, Unclear, Confirmed, Dismissed)", () => {
    it("returns empty string when item is null or undefined", () => {
      assert.equal(generateReplyDraft(null, { clientName: "Alex" }), "");
      assert.equal(generateReplyDraft(undefined, { clientName: "Alex" }), "");
      assert.equal(generateReplyDraft(null, null), "");
    });

    it("does NOT generate client-facing message claiming project is on schedule when no item selected", () => {
      const draft = generateReplyDraft(null, {
        clientName: "Jordan",
        contractorName: "Dev Studio",
        title: "Portal Redesign",
      });

      assert.equal(draft, "");
      assert.equal(draft.includes("on schedule"), false);
      assert.equal(draft.includes("baseline commitments"), false);
    });

    it("describes baseline item as part of the baseline agreement", () => {
      const draft = generateReplyDraft(baselineItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /part of our baseline agreement/i);
      assert.equal(draft.includes("not yet been confirmed"), false);
    });

    it("describes proposed deliverable as discussed but not yet confirmed", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /discussed but has not yet been confirmed as part of our agreed project scope/i);
      assert.equal(draft.includes("part of our baseline agreement"), false);
    });

    it("describes unclear item as discussed but not yet confirmed", () => {
      const draft = generateReplyDraft(unclearItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /discussed but has not yet been confirmed as part of our agreed project scope/i);
      assert.equal(draft.includes("part of our baseline agreement"), false);
    });

    it("confirmed items indicate recorded agreement and invite corrections only, never stating unconfirmed", () => {
      const draft = generateReplyDraft(confirmedItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.match(draft, /recorded as agreed and confirmed in our project scope/i);
      assert.match(draft, /Please let me know if any written corrections are needed/i);
      assert.equal(draft.includes("not yet been confirmed"), false);
      assert.equal(draft.includes("part of our baseline agreement"), false);
    });

    it("dismissed items generate no draft (returns empty string)", () => {
      const draft = generateReplyDraft(dismissedItem, {
        clientName: "Alex",
        contractorName: "Studio Team",
      });

      assert.equal(draft, "");
    });
  });

  describe("Requirement 2: Accurate Panel Label Mapping", () => {
    it("returns status-appropriate labels for all application statuses", () => {
      assert.equal(getStatusLabel("baseline"), "Baseline");
      assert.equal(getStatusLabel("confirmed"), "Confirmed");
      assert.equal(getStatusLabel("dismissed"), "Dismissed");
      assert.equal(getStatusLabel("proposed"), "Discussed/Pending");
      assert.equal(getStatusLabel("unclear"), "Discussed/Pending");
      assert.equal(getStatusLabel(undefined), "Discussed/Pending");
      assert.equal(getStatusLabel("unknown_status"), "Discussed/Pending");
    });
  });

  describe("Requirement 3: No Sample Identity in Live Drafts", () => {
    it("live-extracted item with sourceText strictly uses neutral greeting and signoff, never sample names", () => {
      const draft = generateReplyDraft(liveDeliverableItem, {
        clientName: "Elena Vance",
        contractorName: "Marcus Miller",
        title: "Aura Health Website Redesign",
      });

      // Must NEVER contain sample client or contractor names
      assert.equal(draft.includes("Elena Vance"), false);
      assert.equal(draft.includes("Marcus Miller"), false);
      assert.match(draft, /^Hello,/);
      assert.match(draft, /Best regards,$/);
    });

    it("bundled sample items without sourceText DO use provided project client and contractor identities", () => {
      const draft = generateReplyDraft(baselineItem, {
        clientName: "Elena Vance",
        contractorName: "Marcus Miller",
      });

      assert.match(draft, /^Hi Elena Vance,/);
      assert.match(draft, /Marcus Miller$/);
    });
  });

  describe("Requirement 4: Speech-Act-Aware Attribution", () => {
    it("maps speech acts correctly to descriptive verbs", () => {
      assert.equal(getSpeechActVerb("request"), "requested");
      assert.equal(getSpeechActVerb("question"), "asked");
      assert.equal(getSpeechActVerb("rejection"), "declined");
      assert.equal(getSpeechActVerb("acceptance"), "replied");
      assert.equal(getSpeechActVerb("proposal"), "noted");
      assert.equal(getSpeechActVerb("commitment"), "noted");
      assert.equal(getSpeechActVerb("information"), "noted");
      assert.equal(getSpeechActVerb("unknown_speech_act"), "noted");
      assert.equal(getSpeechActVerb(undefined), "noted");
    });

    it("uses 'requested' when speechAct is request", () => {
      const item: AgreementItem = {
        ...liveDeliverableItem,
        speechAct: "request",
        speaker: "Client Lead",
      };
      const draft = generateReplyDraft(item, null);
      assert.match(draft, /Client Lead requested:/);
    });

    it("uses 'asked' when speechAct is question", () => {
      const item: AgreementItem = {
        ...liveDeliverableItem,
        speechAct: "question",
        speaker: "QA Lead",
      };
      const draft = generateReplyDraft(item, null);
      assert.match(draft, /QA Lead asked:/);
    });

    it("uses 'declined' when speechAct is rejection", () => {
      const item: AgreementItem = {
        ...liveDeliverableItem,
        speechAct: "rejection",
        speaker: "Security Lead",
      };
      const draft = generateReplyDraft(item, null);
      assert.match(draft, /Security Lead declined:/);
    });

    it("uses 'replied' when speechAct is acceptance", () => {
      const item: AgreementItem = {
        ...liveDeliverableItem,
        speechAct: "acceptance",
        speaker: "Stakeholder",
      };
      const draft = generateReplyDraft(item, null);
      assert.match(draft, /Stakeholder replied:/);
    });

    it("falls back to 'noted' when speechAct is unknown or general", () => {
      const item: AgreementItem = {
        ...liveDeliverableItem,
        speechAct: "proposal",
        speaker: "Architect",
      };
      const draft = generateReplyDraft(item, null);
      assert.match(draft, /Architect noted:/);
    });

    it("uses neutral language when speaker is missing, preserving speech-act verb", () => {
      const draftReq = generateReplyDraft({ ...itemMissingSpeaker, speechAct: "request" }, null);
      assert.match(draftReq, /the following was requested:/);

      const draftQ = generateReplyDraft({ ...itemMissingSpeaker, speechAct: "question" }, null);
      assert.match(draftQ, /the following was asked:/);

      const draftRej = generateReplyDraft({ ...itemMissingSpeaker, speechAct: "rejection" }, null);
      assert.match(draftRej, /the following was declined:/);

      const draftAcc = generateReplyDraft({ ...itemMissingSpeaker, speechAct: "acceptance" }, null);
      assert.match(draftAcc, /the following reply was noted:/);

      const draftUnknown = generateReplyDraft({ ...itemMissingSpeaker, speechAct: "information" }, null);
      assert.match(draftUnknown, /the following was noted:/);
    });
  });

  describe("Claim Quoting & Commercial Commitment Safeguards", () => {
    it("never wraps item.claim in quotation marks as though it were client text", () => {
      const draft = generateReplyDraft(liveDeliverableItem, null);
      assert.match(draft, /the deliverable regarding Interactive SVG flowchart component/);
      assert.equal(draft.includes('"Interactive SVG flowchart component"'), false);
    });

    it("clearly wraps evidenceQuote in quotation marks as the cited quotation", () => {
      const draft = generateReplyDraft(liveDeliverableItem, null);
      assert.match(draft, /"Could we also get an interactive SVG flowchart component included\?"/);
    });

    it("does NOT contain promises to accommodate, prepare change orders, or accept additional scope", () => {
      const draft = generateReplyDraft(liveDeliverableItem, null);
      assert.equal(draft.toLowerCase().includes("glad to accommodate"), false);
      assert.equal(draft.toLowerCase().includes("accommodate"), false);
      assert.equal(draft.toLowerCase().includes("change order"), false);
      assert.equal(draft.toLowerCase().includes("add-on"), false);
      assert.equal(draft.toLowerCase().includes("accept additional scope"), false);
    });

    it("asks for written confirmation or correction on proposed items", () => {
      const draftDeliverable = generateReplyDraft(liveDeliverableItem, null);
      assert.match(draftDeliverable, /written confirmation or correction/i);

      const draftPrice = generateReplyDraft(livePriceItem, null);
      assert.match(draftPrice, /written confirmation or correction/i);

      const draftDeadline = generateReplyDraft(liveDeadlineItem, null);
      assert.match(draftDeadline, /written confirmation or correction/i);

      const draftRevision = generateReplyDraft(liveRevisionItem, null);
      assert.match(draftRevision, /written confirmation or correction/i);
    });
  });

  describe("Sample Preservation & Fallbacks", () => {
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
    });

    it("handles items with missing or blank claim or quote gracefully", () => {
      const sparseItem: AgreementItem = {
        ...liveDeliverableItem,
        claim: "",
        evidenceQuote: "",
      };

      const draft = generateReplyDraft(sparseItem, null);
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
