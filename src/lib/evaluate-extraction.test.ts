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
      assert.ok(
        report.summary.failureReasons.some(
          (r) => r.includes("Speech act mismatch for candidate 0") && r.includes("expected 'request'") && r.includes("got 'question'")
        )
      );

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
      assert.ok(
        report.summary.failureReasons.some(
          (r) => r.includes("Suggested status mismatch for candidate 0") && r.includes("expected 'proposed'") && r.includes("got 'unclear'")
        )
      );
    });

    it("penalizes wrong commitment-type classification with explicit failure reason", () => {
      const candidateWithWrongType: ExtractedCandidate = {
        ...case2.expectedCandidates[0],
        commitmentType: "prices", // Expected: 'deliverables'
      };

      const report = evaluateScenario(case2, {
        candidates: [candidateWithWrongType],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.groundTruthAlignment.commitmentTypeClassification.passed, 0);
      assert.equal(report.groundTruthAlignment.commitmentTypeClassification.total, 1);
      assert.equal(report.candidateDiagnostics[0].commitmentTypeMatch, false);
      assert.ok(
        report.summary.failureReasons.some(
          (r) => r.includes("Commitment type mismatch for candidate 0") && r.includes("expected 'deliverables'") && r.includes("got 'prices'")
        )
      );
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
      assert.ok(
        report.summary.failureReasons.some((r) =>
          r.startsWith("Candidate schema validation failed for candidate 0:")
        )
      );
    });

    it("reports candidate-specific schema failure reasons for multiple invalid candidates without deduplicating across candidates", () => {
      const invalidCandidate0 = {
        claim: "First invalid candidate",
        evidenceQuote: "flat fixed fee of $3,500",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026",
        commitmentType: "prices",
        speechAct: "commitment",
        suggestedStatus: "confirmed", // Forbidden terminal status
        confidence: "high",
        explanation: "Rationale",
      };

      const invalidCandidate1 = {
        claim: "Second invalid candidate",
        evidenceQuote: "3 custom landing page wireframes",
        speaker: "Elena Vance",
        timestamp: "Oct 2, 2026",
        commitmentType: "invalid_type", // Forbidden commitment type
        speechAct: "commitment",
        suggestedStatus: "proposed",
        confidence: "high",
        explanation: "Rationale",
      };

      const report = evaluateScenario(case1, {
        candidates: [invalidCandidate0, invalidCandidate1],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.candidateDiagnostics.length, 2);
      assert.equal(report.candidateDiagnostics[0].schemaValid, false);
      assert.equal(report.candidateDiagnostics[1].schemaValid, false);

      // Verify that candidate 0's schema failure is reported
      assert.ok(
        report.summary.failureReasons.some(
          (r) => r.startsWith("Candidate schema validation failed for candidate 0:") && r.includes("suggestedStatus")
        ),
        "Expected candidate 0 schema failure in failureReasons"
      );

      // Verify that candidate 1's schema failure is ALSO reported (not suppressed by candidate 0)
      assert.ok(
        report.summary.failureReasons.some(
          (r) => r.startsWith("Candidate schema validation failed for candidate 1:") && r.includes("commitmentType")
        ),
        "Expected candidate 1 schema failure in failureReasons"
      );

      // Verify no duplicate identical failure reasons exist
      const uniqueReasons = new Set(report.summary.failureReasons);
      assert.equal(
        uniqueReasons.size,
        report.summary.failureReasons.length,
        "Expected no duplicate identical messages in failureReasons"
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

    it("records explicit claim-alignment failureReason when quote is in source but claim diverges from expected", () => {
      // Pair with case2 (expected quote: "Could we also add an interactive 3D product viewer module right below the hero section?")
      // Candidate uses a shorter valid substring from source: "interactive 3D product viewer module"
      // But claim is completely unrelated to 3D product viewer module
      const divergentClaimCandidate: ExtractedCandidate = {
        ...case2.expectedCandidates[0],
        claim: "Completely unrelated payment schedule and database provisioning",
        evidenceQuote: "interactive 3D product viewer module",
      };

      const report = evaluateScenario(case2, {
        candidates: [divergentClaimCandidate],
      });

      assert.equal(report.summary.passed, false);
      assert.equal(report.candidateDiagnostics[0].quoteExistsInSource, true);
      assert.equal(report.candidateDiagnostics[0].claimSupported, false);
      assert.ok(
        report.summary.failureReasons.some((r) =>
          r.includes("Claim alignment failed for candidate 0") &&
          r.includes("extracted claim does not adequately match expected claim")
        )
      );
    });
  });

  describe("Pass/Fail & Failure Reasons Invariant Consistency", () => {
    it("guarantees that passed === true implies failureReasons is completely empty", () => {
      const report1 = evaluateScenario(case1, { candidates: case1.expectedCandidates });
      assert.equal(report1.summary.passed, true);
      assert.equal(report1.summary.failureReasons.length, 0);

      const report2 = evaluateScenario(case2, { candidates: case2.expectedCandidates });
      assert.equal(report2.summary.passed, true);
      assert.equal(report2.summary.failureReasons.length, 0);
    });

    it("guarantees that passed === false implies failureReasons.length > 0 across diverse failure modes", () => {
      const failureModes: Array<{ name: string; input: unknown }> = [
        {
          name: "Malformed string output",
          input: "raw model gibberish",
        },
        {
          name: "Missing candidates envelope",
          input: { notCandidates: [] },
        },
        {
          name: "Candidate schema violation (forbidden status)",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                suggestedStatus: "confirmed", // Forbidden by schema
              },
            ],
          },
        },
        {
          name: "Missing expected candidates",
          input: { candidates: [] },
        },
        {
          name: "Extraneous candidate",
          input: {
            candidates: [
              case2.expectedCandidates[0],
              {
                claim: "Extra deliverable",
                evidenceQuote: "Thanks, Greg",
                speaker: "Greg",
                timestamp: "Oct 24",
                commitmentType: "deliverables" as const,
                speechAct: "information" as const,
                suggestedStatus: "proposed" as const,
                confidence: "low" as const,
                explanation: "Extra",
              },
            ],
          },
        },
        {
          name: "Quotation verification failure (fabricated quote)",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                evidenceQuote: "Nonexistent quote that cannot be found anywhere in the source document",
              },
            ],
          },
        },
        {
          name: "Speech act mismatch",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                speechAct: "question" as const,
              },
            ],
          },
        },
        {
          name: "Suggested status mismatch",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                suggestedStatus: "unclear" as const,
              },
            ],
          },
        },
        {
          name: "Commitment type mismatch",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                commitmentType: "prices" as const,
              },
            ],
          },
        },
        {
          name: "Claim alignment failure",
          input: {
            candidates: [
              {
                ...case2.expectedCandidates[0],
                claim: "Completely unrelated payment schedule and database provisioning",
                evidenceQuote: "interactive 3D product viewer module",
              },
            ],
          },
        },
      ];

      for (const mode of failureModes) {
        const report = evaluateScenario(case2, mode.input);
        assert.equal(
          report.summary.passed,
          false,
          `Expected report.summary.passed === false for mode '${mode.name}'`
        );
        assert.ok(
          report.summary.failureReasons.length > 0,
          `Expected non-empty failureReasons for mode '${mode.name}', got 0`
        );
        for (const reason of report.summary.failureReasons) {
          assert.equal(typeof reason, "string");
          assert.ok(reason.length > 0, `Empty string reason in mode '${mode.name}'`);
        }
      }
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
