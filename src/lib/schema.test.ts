import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CommitmentTypeSchema,
  SpeechActSchema,
  SuggestedStatusSchema,
  ApplicationStatusSchema,
  ConfidenceLevelSchema,
  ExtractedCandidateSchema,
  ExtractionResultSchema,
  type ExtractedCandidate,
} from "./schema.ts";
import { EVALUATION_SCENARIOS } from "./evaluation-cases.ts";
import { verifyEvidence } from "./verifier.ts";

describe("Extraction Schema & Candidate Validation", () => {
  const validCandidate: ExtractedCandidate = {
    claim: "Agreed to 3 responsive wireframes for $3,500",
    evidenceQuote: "covers 3 custom landing page responsive wireframes and one brand mood board for a flat fixed fee of $3,500",
    speaker: "Elena Vance",
    timestamp: "Oct 2, 2026, 09:30 AM",
    commitmentType: "deliverables",
    speechAct: "commitment",
    suggestedStatus: "baseline",
    confidence: "high",
    explanation: "Clearly established baseline scope from kickoff.",
  };

  it("successfully validates a well-formed extraction candidate", () => {
    const parsed = ExtractedCandidateSchema.parse(validCandidate);
    assert.deepEqual(parsed, validCandidate);
  });

  it("successfully validates an ExtractionResult envelope", () => {
    const envelope = {
      candidates: [validCandidate],
    };
    const parsed = ExtractionResultSchema.parse(envelope);
    assert.equal(parsed.candidates.length, 1);
  });

  it("strictly rejects terminal status 'confirmed' in suggestedStatus", () => {
    const invalidCandidate = {
      ...validCandidate,
      suggestedStatus: "confirmed",
    };
    const result = ExtractedCandidateSchema.safeParse(invalidCandidate);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(
        result.error.issues[0]?.message || "",
        /Invalid option/
      );
    }
  });

  it("strictly rejects terminal status 'dismissed' in suggestedStatus", () => {
    const invalidCandidate = {
      ...validCandidate,
      suggestedStatus: "dismissed",
    };
    const result = ExtractedCandidateSchema.safeParse(invalidCandidate);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.match(
        result.error.issues[0]?.message || "",
        /Invalid option/
      );
    }
  });

  it("rejects candidate with empty claim or empty evidence quote", () => {
    const emptyClaim = { ...validCandidate, claim: "" };
    assert.equal(ExtractedCandidateSchema.safeParse(emptyClaim).success, false);

    const emptyQuote = { ...validCandidate, evidenceQuote: "" };
    assert.equal(ExtractedCandidateSchema.safeParse(emptyQuote).success, false);
  });

  it("rejects invalid commitmentType, speechAct, or confidence values", () => {
    const badCommitment = { ...validCandidate, commitmentType: "arbitrary_type" };
    assert.equal(ExtractedCandidateSchema.safeParse(badCommitment).success, false);

    const badSpeechAct = { ...validCandidate, speechAct: "shouting" };
    assert.equal(ExtractedCandidateSchema.safeParse(badSpeechAct).success, false);

    const badConfidence = { ...validCandidate, confidence: "ultra" };
    assert.equal(ExtractedCandidateSchema.safeParse(badConfidence).success, false);
  });

  it("verifies enumerated commitment types match spec", () => {
    const expected = ["deliverables", "revision_limits", "deadlines", "prices"];
    assert.deepEqual(CommitmentTypeSchema.options, expected);
  });

  it("verifies enumerated speech acts match spec", () => {
    const expected = [
      "request",
      "proposal",
      "question",
      "acceptance",
      "rejection",
      "commitment",
      "information",
    ];
    assert.deepEqual(SpeechActSchema.options, expected);
  });

  it("verifies suggested statuses are limited to baseline, proposed, and unclear", () => {
    const expected = ["baseline", "proposed", "unclear"];
    assert.deepEqual(SuggestedStatusSchema.options, expected);
  });

  it("verifies confidence levels match low, medium, and high", () => {
    const expected = ["low", "medium", "high"];
    assert.deepEqual(ConfidenceLevelSchema.options, expected);
  });

  it("verifies application statuses include all five canonical statuses", () => {
    const expected = ["baseline", "proposed", "confirmed", "unclear", "dismissed"];
    assert.deepEqual(ApplicationStatusSchema.options, expected);
  });
});

describe("Evaluation Scenarios Suite Verification", () => {
  it("contains exactly 12 comprehensive scenarios", () => {
    assert.equal(EVALUATION_SCENARIOS.length, 12);
  });

  it("verifies that all expected candidates across all 12 scenarios adhere strictly to ExtractedCandidateSchema", () => {
    for (const scenario of EVALUATION_SCENARIOS) {
      assert.ok(scenario.id, `Scenario missing ID`);
      assert.ok(scenario.title, `Scenario ${scenario.id} missing title`);
      assert.ok(scenario.sourceText, `Scenario ${scenario.id} missing sourceText`);
      assert.ok(
        scenario.expectedCandidates.length > 0,
        `Scenario ${scenario.id} has no expected candidates`
      );

      for (const candidate of scenario.expectedCandidates) {
        const validation = ExtractedCandidateSchema.safeParse(candidate);
        assert.ok(
          validation.success,
          `Candidate in ${scenario.id} failed schema validation: ${
            validation.error ? JSON.stringify(validation.error.issues) : ""
          }`
        );
      }
    }
  });

  it("verifies deterministic grounding for positive and negative evaluation cases against sourceText", () => {
    for (const scenario of EVALUATION_SCENARIOS) {
      for (const candidate of scenario.expectedCandidates) {
        const result = verifyEvidence(scenario.sourceText, candidate.evidenceQuote);

        if (scenario.expectedVerificationSuccess) {
          assert.equal(
            result.verified,
            true,
            `Expected positive verification in scenario ${scenario.id} for quote: "${candidate.evidenceQuote}"`
          );
        } else {
          assert.equal(
            result.verified,
            false,
            `Expected negative verification (rejection) in scenario ${scenario.id} for quote: "${candidate.evidenceQuote}"`
          );
        }
      }
    }
  });
});
