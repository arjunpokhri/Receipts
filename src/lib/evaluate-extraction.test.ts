import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateExtraction,
  evaluateScenario,
  evaluateScenarioSuite,
  createMetricScore,
  MECHANICAL_VERIFICATION_DISCLAIMER,
} from "./evaluate-extraction.ts";
import { EVALUATION_SCENARIOS } from "./evaluation-cases.ts";
import type { ExtractedCandidate } from "./schema.ts";

describe("Offline Extraction Evaluation Engine", () => {
  const case1 = EVALUATION_SCENARIOS[0]; // Case 1: 2 expected candidates (deliverables, prices)
  const case2 = EVALUATION_SCENARIOS[1]; // Case 2: 1 expected candidate (deliverables, proposed)

  describe("MetricScore & Denominator Rigor", () => {
    it("formats denominators explicitly and handles zero total gracefully", () => {
      const scoreZero = createMetricScore(0, 0);
      assert.equal(scoreZero.passed, 0);
      assert.equal(scoreZero.total, 0);
      assert.equal(scoreZero.percentage, 100);
      assert.equal(scoreZero.formatted, "0/0 (100.0%)");

      const scorePartial = createMetricScore(1, 3);
      assert.equal(scorePartial.passed, 1);
      assert.equal(scorePartial.total, 3);
      assert.equal(scorePartial.percentage, 33.3);
      assert.equal(scorePartial.formatted, "1/3 (33.3%)");
    });
  });

  describe("Correct Results (Benchmark Ground Truth Match)", () => {
    it("scores 100% across all metrics when simulated extraction matches expected benchmark", () => {
      // Simulate perfect candidate extraction matching Case 1 ground truth
      const simulatedInput = {
        candidates: case1.expectedCandidates,
      };

      const report = evaluateScenario(case1, simulatedInput);

      assert.equal(report.summary.passed, true);
      assert.equal(report.summary.failureReasons.length, 0);
      assert.equal(report.summary.candidatesExpected, 2);
      assert.equal(report.summary.candidatesExtracted, 2);
      assert.equal(report.summary.candidatesMatched, 2);
      assert.equal(report.summary.candidatesMissing, 0);
      assert.equal(report.summary.candidatesExtraneous, 0);

      // Mechanical checks
      assert.equal(report.mechanicalChecks.schemaValidity.passed, 2);
      assert.equal(report.mechanicalChecks.schemaValidity.total, 2);
      assert.equal(report.mechanicalChecks.schemaValidity.percentage, 100);
      assert.equal(report.mechanicalChecks.quoteExistence.passed, 2);
      assert.equal(report.mechanicalChecks.quoteExistence.total, 2);
      assert.equal(report.mechanicalChecks.quoteExistence.percentage, 100);

      // Ground-truth alignment checks
      assert.equal(report.groundTruthAlignment.claimSupport.passed, 2);
      assert.equal(report.groundTruthAlignment.claimSupport.total, 2);
      assert.equal(report.groundTruthAlignment.speechActClassification.passed, 2);
      assert.equal(report.groundTruthAlignment.speechActClassification.total, 2);
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.passed, 2);
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.total, 2);
      assert.equal(report.groundTruthAlignment.commitmentTypeClassification.passed, 2);
      assert.equal(report.groundTruthAlignment.commitmentTypeClassification.total, 2);
    });

    it("evaluates custom extraction parameters directly via evaluateExtraction", () => {
      const report = evaluateExtraction({
        sourceText: case2.sourceText,
        expectedCandidates: case2.expectedCandidates,
        candidateInput: { candidates: case2.expectedCandidates },
        scenarioId: case2.id,
      });

      assert.equal(report.summary.passed, true);
      assert.equal(report.scenarioId, case2.id);
      assert.equal(report.groundTruthAlignment.claimSupport.passed, 1);
    });
  });

  describe("Fabricated Quotes & Verifier Failures", () => {
    it("flags candidate when evidence quote is fabricated and fails mechanical verification", () => {
      const simulatedCandidateWithFakeQuote: ExtractedCandidate = {
        claim: "Deliverables include 3 custom landing page wireframes and mood board",
        evidenceQuote: "We promise to deliver 3 wireframes plus a bonus 3D animation for free.",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026, 09:30 AM",
        commitmentType: "deliverables",
        speechAct: "commitment",
        suggestedStatus: "baseline",
        confidence: "high",
        explanation: "Scope agreement",
      };

      const report = evaluateScenario(case1, {
        candidates: [simulatedCandidateWithFakeQuote, case1.expectedCandidates[1]],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.mechanicalChecks.quoteExistence.passed, 1);
      assert.equal(report.mechanicalChecks.quoteExistence.total, 2);
      assert.equal(report.mechanicalChecks.quoteExistence.percentage, 50.0);
      assert.equal(report.mechanicalChecks.quoteExistence.formatted, "1/2 (50.0%)");

      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Quotation verification failed"))
      );
      assert.equal(report.candidateDiagnostics[0].quoteExistsInSource, false);
      assert.equal(report.candidateDiagnostics[0].claimSupported, false);
    });
  });

  describe("Classification Mismatches", () => {
    it("penalizes wrong speech-act classification while preserving other metrics", () => {
      const candidateWithWrongSpeechAct: ExtractedCandidate = {
        ...case2.expectedCandidates[0],
        speechAct: "question", // Expected: 'request'
      };

      const report = evaluateScenario(case2, {
        candidates: [candidateWithWrongSpeechAct],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.groundTruthAlignment.speechActClassification.passed, 0);
      assert.equal(report.groundTruthAlignment.speechActClassification.total, 1);
      assert.equal(report.groundTruthAlignment.speechActClassification.percentage, 0);
      assert.equal(report.groundTruthAlignment.speechActClassification.formatted, "0/1 (0.0%)");

      // Suggested status was still correct
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.passed, 1);
      assert.equal(report.candidateDiagnostics[0].speechActMatch, false);
      assert.equal(report.candidateDiagnostics[0].suggestedStatusMatch, true);
    });

    it("penalizes wrong suggested-status classification", () => {
      const candidateWithWrongStatus: ExtractedCandidate = {
        ...case2.expectedCandidates[0],
        suggestedStatus: "unclear", // Expected: 'proposed'
      };

      const report = evaluateScenario(case2, {
        candidates: [candidateWithWrongStatus],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.passed, 0);
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.total, 1);
      assert.equal(
        report.groundTruthAlignment.suggestedStatusClassification.formatted,
        "0/1 (0.0%)"
      );
      assert.equal(report.candidateDiagnostics[0].suggestedStatusMatch, false);
    });
  });

  describe("Malformed Output Handling", () => {
    it("handles non-object input and missing candidates array with explicit failures", () => {
      const report = evaluateScenario(case1, "completely invalid string output");

      assert.equal(report.summary.passed, false);
      assert.equal(report.mechanicalChecks.schemaValidity.passed, 0);
      assert.equal(report.mechanicalChecks.schemaValidity.total, 2);
      assert.equal(report.mechanicalChecks.schemaValidity.formatted, "0/2 (0.0%)");
      assert.equal(report.groundTruthAlignment.claimSupport.passed, 0);
      assert.equal(report.groundTruthAlignment.claimSupport.total, 2);
      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Malformed output"))
      );
    });

    it("penalizes candidates violating Zod schema constraints (e.g. forbidden terminal status)", () => {
      const invalidCandidate = {
        claim: "Valid claim",
        evidenceQuote: "flat fixed fee of $3,500",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026",
        commitmentType: "prices",
        speechAct: "commitment",
        suggestedStatus: "confirmed", // FORBIDDEN in suggestedStatus schema!
        confidence: "high",
        explanation: "Rationale",
      };

      const report = evaluateScenario(case1, {
        candidates: [invalidCandidate],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.mechanicalChecks.schemaValidity.passed, 0);
      assert.equal(report.mechanicalChecks.schemaValidity.total, 2);
      assert.equal(report.candidateDiagnostics[0].schemaValid, false);
      assert.ok(
        report.candidateDiagnostics[0].notes.some((n) => n.includes("Schema validation failed"))
      );
    });
  });

  describe("Missing and Extraneous Candidates", () => {
    it("penalizes omitted expected candidates as explicit failures rather than skipping", () => {
      // Case 1 expects 2 candidates; we only provide 1
      const report = evaluateScenario(case1, {
        candidates: [case1.expectedCandidates[0]],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.summary.candidatesExpected, 2);
      assert.equal(report.summary.candidatesExtracted, 1);
      assert.equal(report.summary.candidatesMatched, 1);
      assert.equal(report.summary.candidatesMissing, 1);
      assert.equal(report.groundTruthAlignment.claimSupport.passed, 1);
      assert.equal(report.groundTruthAlignment.claimSupport.total, 2);
      assert.equal(report.groundTruthAlignment.claimSupport.formatted, "1/2 (50.0%)");
      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Missing expected candidate"))
      );
    });

    it("detects and reports extraneous unmatched candidates", () => {
      const extraneousCandidate: ExtractedCandidate = {
        claim: "Unrelated extraneous scope item",
        evidenceQuote: "We look forward to getting started.",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026",
        commitmentType: "deliverables",
        speechAct: "information",
        suggestedStatus: "unclear",
        confidence: "low",
        explanation: "Extra",
      };

      const report = evaluateScenario(case2, {
        candidates: [case2.expectedCandidates[0], extraneousCandidate],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.summary.candidatesExtraneous, 1);
      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Extraneous candidates"))
      );
    });
  });

  describe("Envelope Validity vs Candidate-Level Validity Semantics", () => {
    const case13 = EVALUATION_SCENARIOS.find((s) => s.id === "case-13-conditional-budget-proposal")!;

    it("evaluates valid empty JSON output: valid envelope, N/A candidate schema/quote, penalized recall", () => {
      // Model returned valid empty candidates envelope: {"candidates":[]}
      const report = evaluateScenario(case13, { candidates: [] });

      // Envelope must be strictly valid
      assert.ok(report.mechanicalChecks.envelopeValidity);
      assert.equal(report.mechanicalChecks.envelopeValidity.passed, 1);
      assert.equal(report.mechanicalChecks.envelopeValidity.total, 1);
      assert.equal(report.mechanicalChecks.envelopeValidity.formatted, "1/1 (100.0%)");

      // Candidate-level schema and quote checks must be explicitly N/A (0/0) with null percentage
      assert.ok(report.mechanicalChecks.candidateSchemaValidity);
      assert.equal(report.mechanicalChecks.candidateSchemaValidity.passed, 0);
      assert.equal(report.mechanicalChecks.candidateSchemaValidity.total, 0);
      assert.equal(report.mechanicalChecks.candidateSchemaValidity.percentage, null);
      assert.equal(report.mechanicalChecks.candidateSchemaValidity.formatted, "0/0 (N/A)");

      assert.equal(report.mechanicalChecks.quoteExistence.passed, 0);
      assert.equal(report.mechanicalChecks.quoteExistence.total, 0);
      assert.equal(report.mechanicalChecks.quoteExistence.percentage, null);
      assert.equal(report.mechanicalChecks.quoteExistence.formatted, "0/0 (N/A)");

      // Candidate coverage failure must fail the scenario
      assert.equal(report.summary.passed, false);
      assert.equal(report.summary.candidatesExpected, 1);
      assert.equal(report.summary.candidatesExtracted, 0);
      assert.equal(report.summary.candidatesMatched, 0);
      assert.equal(report.summary.candidatesMissing, 1);
      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Missing expected candidate"))
      );

      // Classification metrics must record the missing candidate as 0/1 (0.0%)
      assert.equal(report.groundTruthAlignment.claimSupport.formatted, "0/1 (0.0%)");
      assert.equal(report.groundTruthAlignment.speechActClassification.formatted, "0/1 (0.0%)");
      assert.equal(report.groundTruthAlignment.suggestedStatusClassification.formatted, "0/1 (0.0%)");
      assert.equal(report.groundTruthAlignment.commitmentTypeClassification.formatted, "0/1 (0.0%)");
    });

    it("evaluates non-object / malformed envelope as invalid envelope", () => {
      const report = evaluateScenario(case13, "malformed response");

      assert.ok(report.mechanicalChecks.envelopeValidity);
      assert.equal(report.mechanicalChecks.envelopeValidity.passed, 0);
      assert.equal(report.mechanicalChecks.envelopeValidity.total, 1);
      assert.equal(report.mechanicalChecks.envelopeValidity.formatted, "0/1 (0.0%)");
      assert.equal(report.summary.passed, false);
      assert.ok(
        report.summary.failureReasons.some((r) => r.includes("Malformed output"))
      );
    });

    it("supports naOnZero flag in createMetricScore", () => {
      const naScore = createMetricScore(0, 0, true);
      assert.equal(naScore.passed, 0);
      assert.equal(naScore.total, 0);
      assert.equal(naScore.percentage, null);
      assert.equal(naScore.formatted, "0/0 (N/A)");
    });
  });

  describe("Mechanical Verification vs. Claim Truth Separation", () => {
    it("does not consider a verified quotation as proof of claim support if the claim is false", () => {
      // In this test, the quote exists verbatim in sourceText ("We look forward to getting started."),
      // but the claim is completely made up and does NOT align with any expected scope commitment.
      const ungroundedCandidate: ExtractedCandidate = {
        claim: "Client agreed to pay an extra $50,000 buyout fee upon completion",
        evidenceQuote: "We look forward to getting started.",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026",
        commitmentType: "prices",
        speechAct: "commitment",
        suggestedStatus: "baseline",
        confidence: "high",
        explanation: "Misleading attribution",
      };

      const report = evaluateScenario(case1, {
        candidates: [ungroundedCandidate],
      });

      assert.equal(report.summary.passed, false);
      // Mechanical quote verification succeeded because the substring exists!
      assert.equal(report.candidateDiagnostics[0].quoteExistsInSource, true);
      // But ground-truth claim support failed because quote does NOT support the claim
      assert.equal(report.candidateDiagnostics[0].claimSupported, false);
      assert.equal(report.groundTruthAlignment.claimSupport.passed, 0);

      // Verify presence of methodological disclaimer
      assert.equal(
        report.mechanicalChecks.disclaimer,
        MECHANICAL_VERIFICATION_DISCLAIMER
      );
    });
  });

  describe("Suite Evaluation Aggregation", () => {
    it("aggregates scores across multiple evaluation scenarios with explicit totals", () => {
      const suiteInput = {
        [case1.id]: { candidates: case1.expectedCandidates },
        [case2.id]: { candidates: case2.expectedCandidates },
      };

      const suiteReport = evaluateScenarioSuite([case1, case2], suiteInput);

      assert.equal(suiteReport.totalScenarios, 2);
      assert.equal(suiteReport.passedScenarios, 2);
      assert.equal(suiteReport.failedScenarios, 0);
      assert.equal(suiteReport.scenarioPassRate.formatted, "2/2 (100.0%)");
      assert.equal(suiteReport.groundTruthAlignment.claimSupport.formatted, "3/3 (100.0%)");
      assert.equal(suiteReport.groundTruthAlignment.speechActClassification.formatted, "3/3 (100.0%)");
      assert.equal(
        suiteReport.groundTruthAlignment.suggestedStatusClassification.formatted,
        "3/3 (100.0%)"
      );
    });
  });
});
