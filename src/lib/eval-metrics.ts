/**
 * Pure evaluation metrics and statistical analysis for Receipts extraction models.
 *
 * Implements Measured Reliability v1 metrics:
 * - Status ranking and overstatement / understatement tracking
 * - Confidently wrong classifications (high confidence overstatements)
 * - Exact-match classification accuracy (speech act, status, commitment type)
 * - Mechanical validation rates (schema validity, quote existence)
 * - Whole-response failure tracking with failure-stage attribution
 * - Latency distributions (p50, p95) and token accounting
 * - Run-to-run status instability across multiple evaluation runs
 * - Strict zero-denominator handling (missing data is never silently treated as 100%)
 */

import type { CaseEvaluationReport, CandidateDiagnostic } from "./evaluate-extraction.ts";

/**
 * Status hierarchy ranks representing commercial commitment strength.
 * unclear (0) < proposed (1) < baseline (2)
 */
export const STATUS_RANK: Record<string, number> = {
  unclear: 0,
  proposed: 1,
  baseline: 2,
};

/**
 * Returns numeric rank for a suggested status, or -1 if unknown/missing.
 */
export function getStatusRank(status: string | undefined | null): number {
  if (status && status in STATUS_RANK) {
    return STATUS_RANK[status];
  }
  return -1;
}

/**
 * Strict metric rate that handles zero denominators explicitly without defaulting to 100%.
 */
export interface StrictMetricRate {
  passed: number;
  total: number;
  /** Null when total === 0; never silently 100% */
  percentage: number | null;
  /** Explicit formatted string with percentage, e.g. '3/4 (75.0%)' or '0/0 (N/A)' */
  formatted: string;
}

/**
 * Builds a StrictMetricRate. When total is 0, percentage is null and formatted is '0/0 (N/A)'.
 */
export function createStrictMetricRate(passed: number, total: number): StrictMetricRate {
  if (total <= 0) {
    return {
      passed: 0,
      total: 0,
      percentage: null,
      formatted: "0/0 (N/A)",
    };
  }
  const percentage = Math.round((passed / total) * 1000) / 10;
  return {
    passed,
    total,
    percentage,
    formatted: `${passed}/${total} (${percentage.toFixed(1)}%)`,
  };
}

export interface CandidateDiscrepancy {
  candidateIndex: number;
  isOverstatement: boolean;
  isConfidentlyWrong: boolean;
  isUnderstatement: boolean;
  actualStatus?: string;
  expectedStatus?: string;
  confidence?: string;
  matched: boolean;
}

/**
 * Analyzes an individual candidate diagnostic for status overstatements and understatements:
 * - Overstatement: matched candidate whose status exceeds expected status,
 *   OR an unmatched candidate labelled 'baseline'.
 * - Confidently wrong: an overstatement where confidence === 'high'.
 * - Understatement: matched candidate whose status is less than expected status.
 */
export function analyzeCandidateDiscrepancy(diag: CandidateDiagnostic): CandidateDiscrepancy {
  const actualStatus = diag.parsedCandidate?.suggestedStatus;
  const expectedStatus = diag.matchedExpected?.suggestedStatus;
  const confidence = diag.parsedCandidate?.confidence;
  const matched = Boolean(diag.matchedExpected);

  let isOverstatement = false;
  let isUnderstatement = false;

  if (matched && actualStatus && expectedStatus) {
    const actualRank = getStatusRank(actualStatus);
    const expectedRank = getStatusRank(expectedStatus);

    if (actualRank !== -1 && expectedRank !== -1) {
      if (actualRank > expectedRank) {
        isOverstatement = true;
      } else if (actualRank < expectedRank) {
        isUnderstatement = true;
      }
    }
  } else if (!matched && actualStatus === "baseline") {
    // An extraneous/unmatched candidate asserting baseline is an overstatement
    isOverstatement = true;
  }

  const isConfidentlyWrong = isOverstatement && confidence === "high";

  return {
    candidateIndex: diag.candidateIndex,
    isOverstatement,
    isConfidentlyWrong,
    isUnderstatement,
    actualStatus,
    expectedStatus,
    confidence,
    matched,
  };
}

export interface StatusDiscrepancySummary {
  overstatements: number;
  confidentlyWrong: number;
  understatements: number;
  totalCandidatesEvaluated: number;
  discrepancies: CandidateDiscrepancy[];
}

/**
 * Aggregates status discrepancies across one or multiple CaseEvaluationReports.
 */
export function computeStatusDiscrepancies(
  reports: CaseEvaluationReport[]
): StatusDiscrepancySummary {
  let overstatements = 0;
  let confidentlyWrong = 0;
  let understatements = 0;
  let totalCandidatesEvaluated = 0;
  const discrepancies: CandidateDiscrepancy[] = [];

  for (const report of reports) {
    for (const diag of report.candidateDiagnostics) {
      totalCandidatesEvaluated++;
      const disc = analyzeCandidateDiscrepancy(diag);
      if (disc.isOverstatement) overstatements++;
      if (disc.isConfidentlyWrong) confidentlyWrong++;
      if (disc.isUnderstatement) understatements++;
      if (disc.isOverstatement || disc.isUnderstatement) {
        discrepancies.push(disc);
      }
    }
  }

  return {
    overstatements,
    confidentlyWrong,
    understatements,
    totalCandidatesEvaluated,
    discrepancies,
  };
}

export interface ClassificationRatesSummary {
  schemaValidity: StrictMetricRate;
  quoteExistence: StrictMetricRate;
  speechActAccuracy: StrictMetricRate;
  statusAccuracy: StrictMetricRate;
  commitmentTypeAccuracy: StrictMetricRate;
}

/**
 * Computes rates for schema validity, quote existence, and classification accuracies
 * across a collection of CaseEvaluationReports.
 */
export function computeClassificationRates(
  reports: CaseEvaluationReport[]
): ClassificationRatesSummary {
  let schemaPassed = 0;
  let schemaTotal = 0;
  let quotePassed = 0;
  let quoteTotal = 0;
  let speechActPassed = 0;
  let speechActTotal = 0;
  let statusPassed = 0;
  let statusTotal = 0;
  let commitmentTypePassed = 0;
  let commitmentTypeTotal = 0;

  for (const report of reports) {
    schemaPassed += report.mechanicalChecks.schemaValidity.passed;
    schemaTotal += report.mechanicalChecks.schemaValidity.total;

    quotePassed += report.mechanicalChecks.quoteExistence.passed;
    quoteTotal += report.mechanicalChecks.quoteExistence.total;

    speechActPassed += report.groundTruthAlignment.speechActClassification.passed;
    speechActTotal += report.groundTruthAlignment.speechActClassification.total;

    statusPassed += report.groundTruthAlignment.suggestedStatusClassification.passed;
    statusTotal += report.groundTruthAlignment.suggestedStatusClassification.total;

    commitmentTypePassed += report.groundTruthAlignment.commitmentTypeClassification.passed;
    commitmentTypeTotal += report.groundTruthAlignment.commitmentTypeClassification.total;
  }

  return {
    schemaValidity: createStrictMetricRate(schemaPassed, schemaTotal),
    quoteExistence: createStrictMetricRate(quotePassed, quoteTotal),
    speechActAccuracy: createStrictMetricRate(speechActPassed, speechActTotal),
    statusAccuracy: createStrictMetricRate(statusPassed, statusTotal),
    commitmentTypeAccuracy: createStrictMetricRate(commitmentTypePassed, commitmentTypeTotal),
  };
}

/**
 * Stages where extraction or evaluation can fail.
 */
export type FailureStage =
  | "network"
  | "truncation"
  | "empty_response"
  | "parse"
  | "schema_violation";

export interface RunFailureRecord {
  scenarioId?: string;
  runIndex?: number;
  stage: FailureStage;
  productWouldHaveFailed: boolean;
  errorMessage: string;
}

export interface FailureBreakdownSummary {
  totalWholeResponseFailures: number;
  productWouldHaveFailedCount: number;
  stageBreakdown: Record<FailureStage, number>;
  records: RunFailureRecord[];
}

/**
 * Aggregates failure counts and stage breakdowns.
 */
export function computeFailureSummary(failures: RunFailureRecord[]): FailureBreakdownSummary {
  const stageBreakdown: Record<FailureStage, number> = {
    network: 0,
    truncation: 0,
    empty_response: 0,
    parse: 0,
    schema_violation: 0,
  };

  let productWouldHaveFailedCount = 0;

  for (const failure of failures) {
    if (failure.stage in stageBreakdown) {
      stageBreakdown[failure.stage]++;
    }
    if (failure.productWouldHaveFailed) {
      productWouldHaveFailedCount++;
    }
  }

  return {
    totalWholeResponseFailures: failures.length,
    productWouldHaveFailedCount,
    stageBreakdown,
    records: failures,
  };
}

/**
 * Calculates a specific percentile from a list of numbers using linear interpolation.
 * Returns null if the array is empty.
 */
export function calculatePercentile(values: number[], percentile: number): number | null {
  if (!values || values.length === 0) {
    return null;
  }
  if (percentile <= 0) return Math.min(...values);
  if (percentile >= 100) return Math.max(...values);

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;
  return Math.round((sorted[lower] * (1 - weight) + sorted[upper] * weight) * 10) / 10;
}

export interface LatencyDistribution {
  p50: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  count: number;
}

/**
 * Calculates latency p50, p95, min, max, and avg.
 */
export function computeLatencyDistribution(latencies: number[]): LatencyDistribution {
  if (!latencies || latencies.length === 0) {
    return { p50: null, p95: null, min: null, max: null, avg: null, count: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round((sum / sorted.length) * 10) / 10,
    count: sorted.length,
  };
}

export interface TokenUsageRecord {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface TokenAccountingSummary {
  promptTokensTotal: number | null;
  completionTokensTotal: number | null;
  totalTokensTotal: number | null;
  avgTotalTokens: number | null;
  runsWithTokenData: number;
  totalRuns: number;
}

/**
 * Aggregates token usage across runs, handling missing records gracefully without silently defaulting to zero.
 */
export function computeTokenAccounting(
  records: Array<TokenUsageRecord | undefined | null>,
  totalRuns: number
): TokenAccountingSummary {
  const valid = records.filter(
    (r): r is TokenUsageRecord =>
      Boolean(r && (r.totalTokens !== undefined || r.promptTokens !== undefined || r.completionTokens !== undefined))
  );

  if (valid.length === 0) {
    return {
      promptTokensTotal: null,
      completionTokensTotal: null,
      totalTokensTotal: null,
      avgTotalTokens: null,
      runsWithTokenData: 0,
      totalRuns,
    };
  }

  let promptSum = 0;
  let completionSum = 0;
  let totalSum = 0;

  for (const r of valid) {
    const prompt = r.promptTokens ?? 0;
    const completion = r.completionTokens ?? 0;
    promptSum += prompt;
    completionSum += completion;
    totalSum += r.totalTokens ?? prompt + completion;
  }

  return {
    promptTokensTotal: promptSum,
    completionTokensTotal: completionSum,
    totalTokensTotal: totalSum,
    avgTotalTokens: Math.round((totalSum / valid.length) * 10) / 10,
    runsWithTokenData: valid.length,
    totalRuns,
  };
}

export interface ScenarioRunInput {
  scenarioId: string;
  runIndex: number;
  report?: CaseEvaluationReport;
}

export interface CandidateStatusInstability {
  expectedClaim: string;
  expectedStatus: string;
  statusesObserved: string[];
  isStable: boolean;
}

export interface ScenarioInstabilityDetail {
  scenarioId: string;
  runCount: number;
  candidateCountVariance: boolean;
  extractedCountsObserved: number[];
  candidateInstabilities: CandidateStatusInstability[];
  isStable: boolean;
}

export interface StatusInstabilitySummary {
  multiRunScenarioCount: number;
  unstableScenarioCount: number;
  scenarioInstabilityRate: StrictMetricRate;
  totalCandidateObservations: number;
  unstableCandidateObservations: number;
  candidateInstabilityRate: StrictMetricRate;
  scenarioDetails: ScenarioInstabilityDetail[];
}

/**
 * Computes run-to-run status instability for scenarios executed 2 or more times.
 * Tracks both scenario-level stability and candidate-level status variation across runs.
 */
export function computeRunToRunInstability(
  runs: ScenarioRunInput[]
): StatusInstabilitySummary {
  const runsByScenario = new Map<string, ScenarioRunInput[]>();

  for (const run of runs) {
    const list = runsByScenario.get(run.scenarioId) || [];
    list.push(run);
    runsByScenario.set(run.scenarioId, list);
  }

  const scenarioDetails: ScenarioInstabilityDetail[] = [];
  let multiRunScenarioCount = 0;
  let unstableScenarioCount = 0;
  let totalCandidateObservations = 0;
  let unstableCandidateObservations = 0;

  for (const [scenarioId, scenarioRuns] of runsByScenario.entries()) {
    if (scenarioRuns.length < 2) {
      continue;
    }

    multiRunScenarioCount++;
    const extractedCountsObserved = scenarioRuns.map(
      (r) => r.report?.summary.candidatesExtracted ?? 0
    );
    const candidateCountVariance = new Set(extractedCountsObserved).size > 1;

    // Track statuses observed for each matched expected candidate across runs
    const candidateStatuses = new Map<string, { expectedStatus: string; statuses: string[] }>();

    for (const run of scenarioRuns) {
      if (!run.report) continue;
      for (const diag of run.report.candidateDiagnostics) {
        if (diag.matchedExpected && diag.parsedCandidate) {
          const claim = diag.matchedExpected.claim;
          const current = candidateStatuses.get(claim) || {
            expectedStatus: diag.matchedExpected.suggestedStatus,
            statuses: [],
          };
          current.statuses.push(diag.parsedCandidate.suggestedStatus);
          candidateStatuses.set(claim, current);
        }
      }
    }

    const candidateInstabilities: CandidateStatusInstability[] = [];
    let scenarioHasCandidateInstability = false;

    for (const [claim, data] of candidateStatuses.entries()) {
      totalCandidateObservations++;
      const distinctStatuses = Array.from(new Set(data.statuses));
      const isStable = distinctStatuses.length <= 1;

      if (!isStable) {
        unstableCandidateObservations++;
        scenarioHasCandidateInstability = true;
      }

      candidateInstabilities.push({
        expectedClaim: claim,
        expectedStatus: data.expectedStatus,
        statusesObserved: distinctStatuses,
        isStable,
      });
    }

    const isStable = !candidateCountVariance && !scenarioHasCandidateInstability;
    if (!isStable) {
      unstableScenarioCount++;
    }

    scenarioDetails.push({
      scenarioId,
      runCount: scenarioRuns.length,
      candidateCountVariance,
      extractedCountsObserved,
      candidateInstabilities,
      isStable,
    });
  }

  return {
    multiRunScenarioCount,
    unstableScenarioCount,
    scenarioInstabilityRate: createStrictMetricRate(unstableScenarioCount, multiRunScenarioCount),
    totalCandidateObservations,
    unstableCandidateObservations,
    candidateInstabilityRate: createStrictMetricRate(
      unstableCandidateObservations,
      totalCandidateObservations
    ),
    scenarioDetails,
  };
}
