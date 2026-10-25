import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STATUS_RANK,
  getStatusRank,
  createStrictMetricRate,
  analyzeCandidateDiscrepancy,
  computeStatusDiscrepancies,
  computeClassificationRates,
  computeFailureSummary,
  calculatePercentile,
  computeLatencyDistribution,
  computeTokenAccounting,
  computeRunToRunInstability,
} from "./eval-metrics.ts";
import type { CandidateDiagnostic, CaseEvaluationReport } from "./evaluate-extraction.ts";
import { createMetricScore } from "./evaluate-extraction.ts";
import { parseCliArgs, runLiveEvaluation } from "../../scripts/run-live-eval.ts";

describe("Measured Reliability v1 Pure Evaluation Metrics", () => {
  describe("Status Hierarchy & Rank", () => {
    it("assigns strictly ordered ranks: unclear=0, proposed=1, baseline=2", () => {
      assert.equal(STATUS_RANK.unclear, 0);
      assert.equal(STATUS_RANK.proposed, 1);
      assert.equal(STATUS_RANK.baseline, 2);

      assert.equal(getStatusRank("unclear"), 0);
      assert.equal(getStatusRank("proposed"), 1);
      assert.equal(getStatusRank("baseline"), 2);
      assert.equal(getStatusRank("unknown"), -1);
      assert.equal(getStatusRank(null), -1);
      assert.equal(getStatusRank(undefined), -1);
    });
  });

  describe("Zero Denominator Rigor", () => {
    it("returns null percentage and N/A formatted string for zero denominators", () => {
      const emptyRate = createStrictMetricRate(0, 0);
      assert.equal(emptyRate.passed, 0);
      assert.equal(emptyRate.total, 0);
      assert.equal(emptyRate.percentage, null);
      assert.equal(emptyRate.formatted, "0/0 (N/A)");

      const negativeRate = createStrictMetricRate(0, -5);
      assert.equal(negativeRate.percentage, null);
      assert.equal(negativeRate.formatted, "0/0 (N/A)");
    });

    it("calculates accurate percentages and fractions when denominator is non-zero", () => {
      const rate = createStrictMetricRate(2, 3);
      assert.equal(rate.passed, 2);
      assert.equal(rate.total, 3);
      assert.equal(rate.percentage, 66.7);
      assert.equal(rate.formatted, "2/3 (66.7%)");
    });
  });

  describe("Overstatements, Confidently Wrong, and Understatements", () => {
    const baseDiagnostic: CandidateDiagnostic = {
      candidateIndex: 0,
      rawCandidate: {},
      schemaValid: true,
      quoteExistsInSource: true,
      quoteVerification: {
        verified: true,
        exactMatch: true,
        matchedText: "sample quote",
        startIndex: 0,
        endIndex: 12,
      },
      claimSupported: true,
      speechActMatch: true,
      suggestedStatusMatch: false,
      commitmentTypeMatch: true,
      notes: [],
    };

    it("flags an overstatement when extracted status exceeds expected status", () => {
      // Extracted baseline (2) vs expected proposed (1)
      const overstatementDiag: CandidateDiagnostic = {
        ...baseDiagnostic,
        parsedCandidate: {
          claim: "Some claim",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "commitment",
          suggestedStatus: "baseline",
          confidence: "high",
          explanation: "Overstated baseline",
        },
        matchedExpected: {
          claim: "Some claim",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "commitment",
          suggestedStatus: "proposed",
          confidence: "high",
          explanation: "Expected proposed",
        },
      };

      const result = analyzeCandidateDiscrepancy(overstatementDiag);
      assert.equal(result.isOverstatement, true);
      assert.equal(result.isConfidentlyWrong, true);
      assert.equal(result.isUnderstatement, false);
    });

    it("flags an overstatement when an unmatched candidate is labelled baseline", () => {
      const unmatchedBaselineDiag: CandidateDiagnostic = {
        ...baseDiagnostic,
        parsedCandidate: {
          claim: "Extraneous deliverable",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "commitment",
          suggestedStatus: "baseline",
          confidence: "medium",
          explanation: "Unmatched baseline",
        },
        matchedExpected: undefined, // Extraneous/unmatched!
      };

      const result = analyzeCandidateDiscrepancy(unmatchedBaselineDiag);
      assert.equal(result.isOverstatement, true);
      assert.equal(result.isConfidentlyWrong, false); // confidence is medium
      assert.equal(result.isUnderstatement, false);
    });

    it("does not flag overstatement for unmatched candidates labelled proposed or unclear", () => {
      const unmatchedProposedDiag: CandidateDiagnostic = {
        ...baseDiagnostic,
        parsedCandidate: {
          claim: "Extraneous proposal",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "proposal",
          suggestedStatus: "proposed",
          confidence: "high",
          explanation: "Unmatched proposed",
        },
        matchedExpected: undefined,
      };

      const result = analyzeCandidateDiscrepancy(unmatchedProposedDiag);
      assert.equal(result.isOverstatement, false);
      assert.equal(result.isConfidentlyWrong, false);
      assert.equal(result.isUnderstatement, false);
    });

    it("flags an understatement when extracted status is below expected status", () => {
      // Extracted unclear (0) vs expected proposed (1)
      const understatementDiag: CandidateDiagnostic = {
        ...baseDiagnostic,
        parsedCandidate: {
          claim: "Some claim",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "proposal",
          suggestedStatus: "unclear",
          confidence: "high",
          explanation: "Understated",
        },
        matchedExpected: {
          claim: "Some claim",
          evidenceQuote: "sample quote",
          speaker: "Elena",
          timestamp: "Oct 2",
          commitmentType: "deliverables",
          speechAct: "proposal",
          suggestedStatus: "proposed",
          confidence: "high",
          explanation: "Expected proposed",
        },
      };

      const result = analyzeCandidateDiscrepancy(understatementDiag);
      assert.equal(result.isOverstatement, false);
      assert.equal(result.isConfidentlyWrong, false);
      assert.equal(result.isUnderstatement, true);
    });

    it("aggregates status discrepancies across multiple case reports", () => {
      const mockReport: CaseEvaluationReport = {
        scenarioId: "test-scenario",
        timestamp: "2026-10-25T12:00:00Z",
        mechanicalChecks: {
          disclaimer: "test",
          schemaValidity: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          quoteExistence: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
        },
        groundTruthAlignment: {
          claimSupport: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          speechActClassification: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          suggestedStatusClassification: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
          commitmentTypeClassification: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
        },
        summary: {
          passed: false,
          failureReasons: ["Status mismatch"],
          candidatesExpected: 2,
          candidatesExtracted: 2,
          candidatesMatched: 2,
          candidatesMissing: 0,
          candidatesExtraneous: 0,
        },
        candidateDiagnostics: [
          {
            ...baseDiagnostic,
            parsedCandidate: {
              claim: "Claim 1",
              evidenceQuote: "quote 1",
              speaker: "A",
              timestamp: "T1",
              commitmentType: "deliverables",
              speechAct: "commitment",
              suggestedStatus: "baseline",
              confidence: "high",
              explanation: "exp",
            },
            matchedExpected: {
              claim: "Claim 1",
              evidenceQuote: "quote 1",
              speaker: "A",
              timestamp: "T1",
              commitmentType: "deliverables",
              speechAct: "commitment",
              suggestedStatus: "proposed",
              confidence: "high",
              explanation: "exp",
            },
          },
          {
            ...baseDiagnostic,
            candidateIndex: 1,
            parsedCandidate: {
              claim: "Claim 2",
              evidenceQuote: "quote 2",
              speaker: "A",
              timestamp: "T1",
              commitmentType: "deliverables",
              speechAct: "commitment",
              suggestedStatus: "proposed",
              confidence: "high",
              explanation: "exp",
            },
            matchedExpected: {
              claim: "Claim 2",
              evidenceQuote: "quote 2",
              speaker: "A",
              timestamp: "T1",
              commitmentType: "deliverables",
              speechAct: "commitment",
              suggestedStatus: "proposed",
              confidence: "high",
              explanation: "exp",
            },
          },
        ],
      };

      const summary = computeStatusDiscrepancies([mockReport]);
      assert.equal(summary.overstatements, 1);
      assert.equal(summary.confidentlyWrong, 1);
      assert.equal(summary.understatements, 0);
      assert.equal(summary.totalCandidatesEvaluated, 2);
    });
  });

  describe("Classification Rates & Aggregation", () => {
    it("aggregates schema validity, quote existence, and classification accuracies correctly", () => {
      const report1: CaseEvaluationReport = {
        timestamp: "2026-10-25T12:00:00Z",
        mechanicalChecks: {
          disclaimer: "test",
          schemaValidity: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          quoteExistence: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
        },
        groundTruthAlignment: {
          claimSupport: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          speechActClassification: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          suggestedStatusClassification: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
          commitmentTypeClassification: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
        },
        summary: {
          passed: false,
          failureReasons: [],
          candidatesExpected: 2,
          candidatesExtracted: 2,
          candidatesMatched: 2,
          candidatesMissing: 0,
          candidatesExtraneous: 0,
        },
        candidateDiagnostics: [],
      };

      const report2: CaseEvaluationReport = {
        timestamp: "2026-10-25T12:00:00Z",
        mechanicalChecks: {
          disclaimer: "test",
          schemaValidity: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
          quoteExistence: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
        },
        groundTruthAlignment: {
          claimSupport: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
          speechActClassification: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
          suggestedStatusClassification: { passed: 2, total: 2, percentage: 100, formatted: "2/2 (100.0%)" },
          commitmentTypeClassification: { passed: 1, total: 2, percentage: 50, formatted: "1/2 (50.0%)" },
        },
        summary: {
          passed: false,
          failureReasons: [],
          candidatesExpected: 2,
          candidatesExtracted: 2,
          candidatesMatched: 1,
          candidatesMissing: 1,
          candidatesExtraneous: 1,
        },
        candidateDiagnostics: [],
      };

      const rates = computeClassificationRates([report1, report2]);

      assert.equal(rates.schemaValidity.passed, 3);
      assert.equal(rates.schemaValidity.total, 4);
      assert.equal(rates.schemaValidity.percentage, 75.0);

      assert.equal(rates.quoteExistence.passed, 3);
      assert.equal(rates.quoteExistence.total, 4);

      assert.equal(rates.speechActAccuracy.passed, 3);
      assert.equal(rates.speechActAccuracy.total, 4);

      assert.equal(rates.statusAccuracy.passed, 3);
      assert.equal(rates.statusAccuracy.total, 4);

      assert.equal(rates.commitmentTypeAccuracy.passed, 3);
      assert.equal(rates.commitmentTypeAccuracy.total, 4);
    });
  });

  describe("Failure Stage Breakdown", () => {
    it("categorizes whole-response failures by stage and tracks product-would-fail", () => {
      const summary = computeFailureSummary([
        { stage: "network", productWouldHaveFailed: true, errorMessage: "ETIMEDOUT", scenarioId: "c1", runIndex: 1 },
        { stage: "truncation", productWouldHaveFailed: true, errorMessage: "Length limit", scenarioId: "c2", runIndex: 1 },
        { stage: "parse", productWouldHaveFailed: true, errorMessage: "Invalid JSON", scenarioId: "c3", runIndex: 1 },
        { stage: "schema_violation", productWouldHaveFailed: true, errorMessage: "Bad status", scenarioId: "c4", runIndex: 1 },
      ]);

      assert.equal(summary.totalWholeResponseFailures, 4);
      assert.equal(summary.productWouldHaveFailedCount, 4);
      assert.equal(summary.stageBreakdown.network, 1);
      assert.equal(summary.stageBreakdown.truncation, 1);
      assert.equal(summary.stageBreakdown.empty_response, 0);
      assert.equal(summary.stageBreakdown.parse, 1);
      assert.equal(summary.stageBreakdown.schema_violation, 1);
    });
  });

  describe("Latency Distribution & Percentiles", () => {
    it("calculates p50 and p95 across numeric arrays", () => {
      const latencies = [1000, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
      const dist = computeLatencyDistribution(latencies);

      assert.equal(dist.count, 10);
      assert.equal(dist.min, 1000);
      assert.equal(dist.max, 5000);
      assert.ok(dist.p50 !== null);
      assert.ok(dist.p95 !== null);
      assert.equal(dist.avg, 2820);
    });

    it("handles empty and single-element latency arrays gracefully", () => {
      const empty = computeLatencyDistribution([]);
      assert.equal(empty.p50, null);
      assert.equal(empty.p95, null);
      assert.equal(empty.count, 0);

      const single = computeLatencyDistribution([1500]);
      assert.equal(single.p50, 1500);
      assert.equal(single.p95, 1500);
      assert.equal(single.min, 1500);
      assert.equal(single.max, 1500);
      assert.equal(single.avg, 1500);
      assert.equal(single.count, 1);
    });

    it("percentile function handles boundaries", () => {
      assert.equal(calculatePercentile([], 50), null);
      assert.equal(calculatePercentile([10, 20, 30], 0), 10);
      assert.equal(calculatePercentile([10, 20, 30], 100), 30);
    });
  });

  describe("Token Accounting", () => {
    it("aggregates tokens across runs and handles missing token records", () => {
      const summary = computeTokenAccounting(
        [
          { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          { promptTokens: 120, completionTokens: 60, totalTokens: 180 },
          undefined, // Run without token data
        ],
        3
      );

      assert.equal(summary.totalRuns, 3);
      assert.equal(summary.runsWithTokenData, 2);
      assert.equal(summary.promptTokensTotal, 220);
      assert.equal(summary.completionTokensTotal, 110);
      assert.equal(summary.totalTokensTotal, 330);
      assert.equal(summary.avgTotalTokens, 165);
    });

    it("handles zero token records gracefully without defaulting to zero sums", () => {
      const summary = computeTokenAccounting([], 0);
      assert.equal(summary.promptTokensTotal, null);
      assert.equal(summary.totalTokensTotal, null);
      assert.equal(summary.runsWithTokenData, 0);
    });
  });

  describe("Run-to-Run Status Instability", () => {
    it("reports 0 instability when multi-run candidate statuses are identical across runs", () => {
      const reportRun1: CaseEvaluationReport = {
        scenarioId: "scenario-1",
        timestamp: "2026-10-25T12:00:00Z",
        mechanicalChecks: { disclaimer: "", schemaValidity: createMetricScore(1, 1), quoteExistence: createMetricScore(1, 1) },
        groundTruthAlignment: { claimSupport: createMetricScore(1, 1), speechActClassification: createMetricScore(1, 1), suggestedStatusClassification: createMetricScore(1, 1), commitmentTypeClassification: createMetricScore(1, 1) },
        summary: { passed: true, failureReasons: [], candidatesExpected: 1, candidatesExtracted: 1, candidatesMatched: 1, candidatesMissing: 0, candidatesExtraneous: 0 },
        candidateDiagnostics: [
          {
            candidateIndex: 0,
            rawCandidate: {},
            schemaValid: true,
            quoteExistsInSource: true,
            quoteVerification: { verified: true, exactMatch: true, matchedText: "q", startIndex: 0, endIndex: 1 },
            claimSupported: true,
            speechActMatch: true,
            suggestedStatusMatch: true,
            commitmentTypeMatch: true,
            notes: [],
            parsedCandidate: { claim: "Claim A", evidenceQuote: "q", speaker: "S", timestamp: "T", commitmentType: "deliverables", speechAct: "proposal", suggestedStatus: "proposed", confidence: "high", explanation: "" },
            matchedExpected: { claim: "Claim A", evidenceQuote: "q", speaker: "S", timestamp: "T", commitmentType: "deliverables", speechAct: "proposal", suggestedStatus: "proposed", confidence: "high", explanation: "" },
          },
        ],
      };

      const reportRun2 = JSON.parse(JSON.stringify(reportRun1));

      const instability = computeRunToRunInstability([
        { scenarioId: "scenario-1", runIndex: 1, report: reportRun1 },
        { scenarioId: "scenario-1", runIndex: 2, report: reportRun2 },
      ]);

      assert.equal(instability.multiRunScenarioCount, 1);
      assert.equal(instability.unstableScenarioCount, 0);
      assert.equal(instability.scenarioInstabilityRate.percentage, 0);
      assert.equal(instability.unstableCandidateObservations, 0);
      assert.equal(instability.scenarioDetails[0].isStable, true);
    });

    it("detects and quantifies status instability when statuses diverge across runs", () => {
      const reportRun1: CaseEvaluationReport = {
        scenarioId: "scenario-1",
        timestamp: "2026-10-25T12:00:00Z",
        mechanicalChecks: { disclaimer: "", schemaValidity: createMetricScore(1, 1), quoteExistence: createMetricScore(1, 1) },
        groundTruthAlignment: { claimSupport: createMetricScore(1, 1), speechActClassification: createMetricScore(1, 1), suggestedStatusClassification: createMetricScore(1, 1), commitmentTypeClassification: createMetricScore(1, 1) },
        summary: { passed: true, failureReasons: [], candidatesExpected: 1, candidatesExtracted: 1, candidatesMatched: 1, candidatesMissing: 0, candidatesExtraneous: 0 },
        candidateDiagnostics: [
          {
            candidateIndex: 0,
            rawCandidate: {},
            schemaValid: true,
            quoteExistsInSource: true,
            quoteVerification: { verified: true, exactMatch: true, matchedText: "q", startIndex: 0, endIndex: 1 },
            claimSupported: true,
            speechActMatch: true,
            suggestedStatusMatch: true,
            commitmentTypeMatch: true,
            notes: [],
            parsedCandidate: { claim: "Claim A", evidenceQuote: "q", speaker: "S", timestamp: "T", commitmentType: "deliverables", speechAct: "proposal", suggestedStatus: "proposed", confidence: "high", explanation: "" },
            matchedExpected: { claim: "Claim A", evidenceQuote: "q", speaker: "S", timestamp: "T", commitmentType: "deliverables", speechAct: "proposal", suggestedStatus: "proposed", confidence: "high", explanation: "" },
          },
        ],
      };

      // In run 2, the model outputs 'unclear' instead of 'proposed'
      const reportRun2: CaseEvaluationReport = JSON.parse(JSON.stringify(reportRun1));
      reportRun2.candidateDiagnostics[0].parsedCandidate!.suggestedStatus = "unclear";

      const instability = computeRunToRunInstability([
        { scenarioId: "scenario-1", runIndex: 1, report: reportRun1 },
        { scenarioId: "scenario-1", runIndex: 2, report: reportRun2 },
      ]);

      assert.equal(instability.multiRunScenarioCount, 1);
      assert.equal(instability.unstableScenarioCount, 1);
      assert.equal(instability.scenarioInstabilityRate.percentage, 100);
      assert.equal(instability.unstableCandidateObservations, 1);
      assert.equal(instability.candidateInstabilityRate.percentage, 100);
      assert.equal(instability.scenarioDetails[0].isStable, false);
      assert.deepEqual(instability.scenarioDetails[0].candidateInstabilities[0].statusesObserved, ["proposed", "unclear"]);
    });
  });

  describe("Live Evaluation CLI Safety Guard & Argument Parser", () => {
    it("parses valid CLI options accurately", () => {
      const defaultOpts = parseCliArgs([]);
      assert.equal(defaultOpts.runs, 3);
      assert.equal(defaultOpts.yes, false);
      assert.equal(defaultOpts.help, false);
      assert.equal(defaultOpts.onlyScenarioId, undefined);

      const customOpts = parseCliArgs(["--runs", "5", "--only", "case-02-additional-feature-request", "--yes"]);
      assert.equal(customOpts.runs, 5);
      assert.equal(customOpts.onlyScenarioId, "case-02-additional-feature-request");
      assert.equal(customOpts.yes, true);

      const helpOpts = parseCliArgs(["--help"]);
      assert.equal(helpOpts.help, true);
    });

    it("rejects invalid CLI arguments and values with descriptive errors", () => {
      assert.throws(() => parseCliArgs(["--runs", "0"]), {
        message: /Must be a positive integer/,
      });
      assert.throws(() => parseCliArgs(["--runs", "-3"]), {
        message: /Must be a positive integer/,
      });
      assert.throws(() => parseCliArgs(["--runs", "abc"]), {
        message: /Must be a positive integer/,
      });
      assert.throws(() => parseCliArgs(["--unrecognized"]), {
        message: /Unrecognized CLI argument/,
      });
      assert.throws(() => parseCliArgs(["--only"]), {
        message: /Missing scenario ID/,
      });
    });

    it("preview mode: without --yes, exits cleanly without making network calls or requiring API key", async () => {
      // Temporarily remove API key from environment to guarantee safety
      const originalKey = process.env.NEBIUS_API_KEY;
      delete process.env.NEBIUS_API_KEY;

      try {
        const preview = await runLiveEvaluation({
          runs: 3,
          model: "nvidia/Nemotron-3_5-Lightning",
          yes: false, // NO-NETWORK PREVIEW
          help: false,
        });

        assert.equal(preview.totalRunsPlanned, 17 * 3);
        assert.equal(preview.totalRunsCompleted, 0);
        assert.equal(preview.scenarioCount, 17);
      } finally {
        if (originalKey !== undefined) {
          process.env.NEBIUS_API_KEY = originalKey;
        }
      }
    });

    it("safety guard: rejects live execution when --yes is passed but API key is missing", async () => {
      const originalKey = process.env.NEBIUS_API_KEY;
      delete process.env.NEBIUS_API_KEY;

      try {
        await assert.rejects(
          async () => {
            await runLiveEvaluation({
              runs: 1,
              model: "nvidia/Nemotron-3_5-Lightning",
              yes: true, // Live requested without key!
              help: false,
            });
          },
          {
            message: /NEBIUS_API_KEY environment variable is required/,
          }
        );
      } finally {
        if (originalKey !== undefined) {
          process.env.NEBIUS_API_KEY = originalKey;
        }
      }
    });

    it("rejects non-existent scenario ID passed to --only", async () => {
      await assert.rejects(
        async () => {
          await runLiveEvaluation({
            runs: 1,
            onlyScenarioId: "case-999-non-existent",
            model: "nvidia/Nemotron-3_5-Lightning",
            yes: false,
            help: false,
          });
        },
        {
          message: /Scenario 'case-999-non-existent' not found/,
        }
      );
    });
  });
});
