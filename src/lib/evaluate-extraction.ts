/**
 * Offline Extraction Evaluation Engine for Receipts.
 *
 * Evaluates candidate extraction outputs against human-annotated evaluation scenarios
 * or expected candidate benchmarks, scoring schema validity, quotation presence,
 * evidence support, speech act categorization, and suggested status.
 *
 * CRITICAL METHODOLOGICAL CONSTRAINTS:
 * 1. MECHANICAL VS. GROUND-TRUTH SEPARATION:
 *    - Mechanical checks (schema validation, string-level quote verification) operate
 *      deterministically without human judgement.
 *    - Ground-truth checks compare model classifications against human-curated benchmark labels.
 * 2. QUOTATION EXISTENCE != CLAIM TRUTH:
 *    - A verified quotation mathematically proves only that a substring exists verbatim
 *      within the source document.
 *    - It DOES NOT prove that the associated claim is factually true, legally binding, or
 *      mutually agreed upon.
 * 3. NO SILENT SKIPS:
 *    - Missing, malformed, or extra candidates are penalized with explicit denominators.
 */

import {
  ExtractionResultSchema,
  ExtractedCandidateSchema,
  type ExtractedCandidate,
} from "./schema.ts";
import {
  verifyEvidence,
  normalizeQuotes,
  collapseWhitespace,
  type VerificationResult,
} from "./verifier.ts";
import type {
  EvaluationScenario,
  EvaluationExpectedCandidate,
} from "./evaluation-cases.ts";

/** Explicit methodological notice attached to all mechanical verification reports */
export const MECHANICAL_VERIFICATION_DISCLAIMER =
  "Mechanical verification proves only that quoted text exists as a verbatim substring in the source document. " +
  "It does NOT mathematically prove that the extracted claim itself is factually true, legally binding, or agreed upon.";

/**
 * Metric score with explicit count, denominator, and percentage.
 * Prevents silent skipping of failures by making total items mandatory.
 */
export interface MetricScore {
  /** Count of items passing criteria */
  passed: number;
  /** Explicit denominator of total items evaluated */
  total: number;
  /** Percentage passing, rounded to one decimal place, or null if total is 0 */
  percentage: number | null;
  /** Explicit formatted fraction with percentage, e.g. '2/2 (100.0%)' or '0/0 (N/A)' */
  formatted: string;
}

/**
 * Builds an explicit MetricScore object ensuring denominators are never implicit.
 * When naOnZero is true and total is 0, percentage is null and formatted is '0/0 (N/A)'.
 */
export function createMetricScore(
  passed: number,
  total: number,
  naOnZero = false
): MetricScore {
  if (total <= 0) {
    if (naOnZero) {
      return {
        passed: 0,
        total: 0,
        percentage: null,
        formatted: "0/0 (N/A)",
      };
    }
    return {
      passed: 0,
      total: 0,
      percentage: 100,
      formatted: "0/0 (100.0%)",
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

/**
 * Granular diagnostic evaluation for an individual candidate.
 */
export interface CandidateDiagnostic {
  candidateIndex: number;
  rawCandidate: unknown;
  parsedCandidate?: ExtractedCandidate;
  schemaValid: boolean;
  schemaErrors?: string[];

  /**
   * Mechanical check: does the evidence quote exist in source text?
   * NOTE: A true value only indicates verbatim presence in the source string.
   */
  quoteExistsInSource: boolean;
  quoteVerification: VerificationResult;

  /** Human-annotated benchmark match */
  matchedExpected?: EvaluationExpectedCandidate;
  claimSupported: boolean;
  speechActMatch: boolean;
  suggestedStatusMatch: boolean;
  commitmentTypeMatch: boolean;

  notes: string[];
}

/**
 * Complete evaluation report for a single scenario / test case.
 */
export interface CaseEvaluationReport {
  scenarioId?: string;
  timestamp: string;

  /**
   * Mechanical syntactic checks (Zero human interpretation)
   */
  mechanicalChecks: {
    disclaimer: string;
    envelopeValidity?: MetricScore;
    candidateSchemaValidity?: MetricScore;
    schemaValidity: MetricScore;
    quoteExistence: MetricScore;
  };

  /**
   * Human ground-truth correctness checks (Against curated baseline)
   */
  groundTruthAlignment: {
    claimSupport: MetricScore;
    speechActClassification: MetricScore;
    suggestedStatusClassification: MetricScore;
    commitmentTypeClassification: MetricScore;
  };

  /** Overall case outcome and high-level totals */
  summary: {
    passed: boolean;
    failureReasons: string[];
    candidatesExpected: number;
    candidatesExtracted: number;
    candidatesMatched: number;
    candidatesMissing: number;
    candidatesExtraneous: number;
  };

  /** Candidate-level diagnostics */
  candidateDiagnostics: CandidateDiagnostic[];
}

/**
 * Aggregated report across multiple evaluation scenarios.
 */
export interface SuiteEvaluationReport {
  timestamp: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  scenarioPassRate: MetricScore;

  mechanicalChecks: {
    disclaimer: string;
    envelopeValidity?: MetricScore;
    candidateSchemaValidity?: MetricScore;
    schemaValidity: MetricScore;
    quoteExistence: MetricScore;
  };

  groundTruthAlignment: {
    claimSupport: MetricScore;
    speechActClassification: MetricScore;
    suggestedStatusClassification: MetricScore;
    commitmentTypeClassification: MetricScore;
  };

  caseReports: CaseEvaluationReport[];
}

/**
 * Parameters for evaluating an extraction run against expected outcomes.
 */
export interface EvaluateExtractionParams {
  sourceText: string;
  expectedCandidates: EvaluationExpectedCandidate[];
  candidateInput: unknown;
  /**
   * If true (default), quote verification is expected to pass (verified: true).
   * If false, quote verification is expected to fail (for negative benchmark tests, e.g. case 12).
   */
  expectedVerificationSuccess?: boolean;
  scenarioId?: string;
}

/**
 * Simple word tokenizer for computing text overlap between claims and quotes.
 */
function tokenizeWords(text: string): Set<string> {
  const normalized = collapseWhitespace(normalizeQuotes(text)).toLowerCase();
  const words = normalized.replace(/[^\w\s$]/g, " ").split(/\s+/);
  return new Set(words.filter((w) => w.length > 2));
}

/**
 * Computes Jaccard similarity between two texts.
 */
function jaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenizeWords(textA);
  const setB = tokenizeWords(textB);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculates similarity score between an extracted candidate and an expected candidate
 * to identify best-fit pairing.
 */
function computePairSimilarity(
  candidate: ExtractedCandidate,
  expected: EvaluationExpectedCandidate
): number {
  let score = 0;

  // 1. Evidence quote comparison (highest weight)
  const normCandQuote = collapseWhitespace(normalizeQuotes(candidate.evidenceQuote)).toLowerCase();
  const normExpQuote = collapseWhitespace(normalizeQuotes(expected.evidenceQuote)).toLowerCase();

  if (normCandQuote === normExpQuote) {
    score += 1.0;
  } else if (normCandQuote.includes(normExpQuote) || normExpQuote.includes(normCandQuote)) {
    score += 0.8;
  } else {
    score += jaccardSimilarity(candidate.evidenceQuote, expected.evidenceQuote) * 0.6;
  }

  // 2. Claim semantic token overlap
  score += jaccardSimilarity(candidate.claim, expected.claim) * 0.5;

  // 3. Commitment type match bonus
  if (candidate.commitmentType === expected.commitmentType) {
    score += 0.4;
  }

  return score;
}

/**
 * Evaluates raw extraction output against a source text and expected benchmark candidates.
 *
 * Implements strict scoring where missing or malformed candidates count as failures.
 */
export function evaluateExtraction(params: EvaluateExtractionParams): CaseEvaluationReport {
  const {
    sourceText,
    expectedCandidates,
    candidateInput,
    expectedVerificationSuccess = true,
    scenarioId,
  } = params;

  const timestamp = new Date().toISOString();
  const failureReasons: string[] = [];

  // 1. Structural and Schema Evaluation
  let rawCandidatesList: unknown[] = [];
  let isEnvelopeValid = false;
  const envelopeParse = ExtractionResultSchema.safeParse(candidateInput);

  if (envelopeParse.success) {
    isEnvelopeValid = true;
    rawCandidatesList = envelopeParse.data.candidates;
  } else if (
    candidateInput !== null &&
    typeof candidateInput === "object" &&
    "candidates" in (candidateInput as Record<string, unknown>) &&
    Array.isArray((candidateInput as Record<string, unknown>).candidates)
  ) {
    // Envelope had candidates array, but items or structure failed schema
    isEnvelopeValid = true;
    rawCandidatesList = (candidateInput as Record<string, unknown>).candidates as unknown[];
    failureReasons.push(
      `Top-level schema issue: ${envelopeParse.error.issues.map((i) => i.message).join(", ")}`
    );
  } else {
    failureReasons.push(
      "Malformed output: input is not a valid JSON object matching ExtractionResultSchema with a candidates array"
    );
  }

  // 2. Candidate-by-candidate mechanical checks
  const candidateDiagnostics: CandidateDiagnostic[] = [];
  const validParsedCandidates: { candidate: ExtractedCandidate; rawIndex: number }[] = [];

  let schemaPassedCount = 0;
  let quotePassedCount = 0;

  for (let i = 0; i < rawCandidatesList.length; i++) {
    const raw = rawCandidatesList[i];
    const candidateParse = ExtractedCandidateSchema.safeParse(raw);

    if (candidateParse.success) {
      schemaPassedCount++;
      const parsed = candidateParse.data;
      validParsedCandidates.push({ candidate: parsed, rawIndex: i });

      // Mechanical quote verification check
      const verificationResult = verifyEvidence(sourceText, parsed.evidenceQuote);
      const quoteExistsInSource = verificationResult.verified;

      if (quoteExistsInSource) {
        quotePassedCount++;
      }

      candidateDiagnostics.push({
        candidateIndex: i,
        rawCandidate: raw,
        parsedCandidate: parsed,
        schemaValid: true,
        quoteExistsInSource,
        quoteVerification: verificationResult,
        claimSupported: false,
        speechActMatch: false,
        suggestedStatusMatch: false,
        commitmentTypeMatch: false,
        notes: verificationResult.verified
          ? ["Quote mechanically verified in source text"]
          : [`Quote verification failed: ${verificationResult.message}`],
      });
    } else {
      // Malformed candidate
      const errors = candidateParse.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      const rawQuote =
        raw !== null && typeof raw === "object" && "evidenceQuote" in (raw as Record<string, unknown>)
          ? String((raw as Record<string, unknown>).evidenceQuote)
          : "";

      const verificationResult = rawQuote ? verifyEvidence(sourceText, rawQuote) : {
        verified: false as const,
        reason: "EMPTY_QUOTE" as const,
        message: "No quote string available for verification",
      };

      if (verificationResult.verified) {
        quotePassedCount++;
      }

      candidateDiagnostics.push({
        candidateIndex: i,
        rawCandidate: raw,
        schemaValid: false,
        schemaErrors: errors,
        quoteExistsInSource: verificationResult.verified,
        quoteVerification: verificationResult,
        claimSupported: false,
        speechActMatch: false,
        suggestedStatusMatch: false,
        commitmentTypeMatch: false,
        notes: [`Schema validation failed: ${errors.join("; ")}`],
      });
    }
  }

  // 3. Ground-truth pairing & classification checks
  // Greedy bipartite matching by highest pair similarity score
  interface ScoredPair {
    candidateIdx: number;
    expectedIdx: number;
    score: number;
  }

  const candidatePairs: ScoredPair[] = [];
  for (let c = 0; c < validParsedCandidates.length; c++) {
    for (let e = 0; e < expectedCandidates.length; e++) {
      const score = computePairSimilarity(
        validParsedCandidates[c].candidate,
        expectedCandidates[e]
      );
      if (score >= 0.35) {
        candidatePairs.push({ candidateIdx: c, expectedIdx: e, score });
      }
    }
  }

  candidatePairs.sort((a, b) => b.score - a.score);

  const assignedCandidates = new Set<number>();
  const assignedExpected = new Set<number>();
  const matchedPairs: { candidateIdx: number; expectedIdx: number }[] = [];

  for (const pair of candidatePairs) {
    if (!assignedCandidates.has(pair.candidateIdx) && !assignedExpected.has(pair.expectedIdx)) {
      assignedCandidates.add(pair.candidateIdx);
      assignedExpected.add(pair.expectedIdx);
      matchedPairs.push(pair);
    }
  }

  // Evaluate ground-truth alignment across expected candidates (explicit denominator = expectedCandidates.length)
  const expectedTotal = expectedCandidates.length;
  let claimSupportPassed = 0;
  let speechActPassed = 0;
  let suggestedStatusPassed = 0;
  let commitmentTypePassed = 0;

  for (const pair of matchedPairs) {
    const { candidate, rawIndex } = validParsedCandidates[pair.candidateIdx];
    const expected = expectedCandidates[pair.expectedIdx];
    const diag = candidateDiagnostics[rawIndex];

    diag.matchedExpected = expected;

    // Check speech act classification
    const speechActMatch = candidate.speechAct === expected.speechAct;
    diag.speechActMatch = speechActMatch;
    if (speechActMatch) {
      speechActPassed++;
    } else {
      diag.notes.push(`Speech act mismatch: expected '${expected.speechAct}', got '${candidate.speechAct}'`);
    }

    // Check suggested status classification
    const suggestedStatusMatch = candidate.suggestedStatus === expected.suggestedStatus;
    diag.suggestedStatusMatch = suggestedStatusMatch;
    if (suggestedStatusMatch) {
      suggestedStatusPassed++;
    } else {
      diag.notes.push(
        `Suggested status mismatch: expected '${expected.suggestedStatus}', got '${candidate.suggestedStatus}'`
      );
    }

    // Check commitment type classification
    const commitmentTypeMatch = candidate.commitmentType === expected.commitmentType;
    diag.commitmentTypeMatch = commitmentTypeMatch;
    if (commitmentTypeMatch) {
      commitmentTypePassed++;
    } else {
      diag.notes.push(
        `Commitment type mismatch: expected '${expected.commitmentType}', got '${candidate.commitmentType}'`
      );
    }

    // Check claim support:
    // Requires that the candidate evidence quote exists in source text (or matches expected negative verification)
    // AND has semantic claim alignment with the expected claim.
    const verificationMatches = expectedVerificationSuccess
      ? diag.quoteExistsInSource
      : !diag.quoteExistsInSource;

    const claimAligns =
      jaccardSimilarity(candidate.claim, expected.claim) >= 0.2 ||
      candidate.evidenceQuote === expected.evidenceQuote;

    const claimSupported = verificationMatches && claimAligns;
    diag.claimSupported = claimSupported;
    if (claimSupported) {
      claimSupportPassed++;
    } else {
      if (!verificationMatches) {
        diag.notes.push("Claim lacks verified source evidence quotation");
      }
      if (!claimAligns) {
        diag.notes.push("Extracted claim does not adequately match the expected scope claim");
      }
    }
  }

  // 4. Record Missing & Extraneous Candidates
  const missingExpectedIndices: number[] = [];
  for (let e = 0; e < expectedCandidates.length; e++) {
    if (!assignedExpected.has(e)) {
      missingExpectedIndices.push(e);
      failureReasons.push(
        `Missing expected candidate: '${expectedCandidates[e].claim}' (${expectedCandidates[e].commitmentType})`
      );
    }
  }

  const extraneousCount = rawCandidatesList.length - matchedPairs.length;
  if (extraneousCount > 0) {
    failureReasons.push(`Extraneous candidates: received ${extraneousCount} unmatched candidate(s)`);
  }

  // Check quote verification against expected verification success
  for (const diag of candidateDiagnostics) {
    if (expectedVerificationSuccess && !diag.quoteVerification.verified) {
      failureReasons.push(
        `Quotation verification failed for candidate ${diag.candidateIndex}: ${diag.quoteVerification.message}`
      );
    } else if (!expectedVerificationSuccess && diag.quoteVerification.verified) {
      failureReasons.push(
        `Negative benchmark failure for candidate ${diag.candidateIndex}: quotation was expected to fail verification but passed`
      );
    }
  }

  // 5. Compute Final Metric Scores with Explicit Denominators
  const envelopeMetric = createMetricScore(isEnvelopeValid ? 1 : 0, 1);

  // Candidate-level schema validity: measures syntax validity of emitted candidates (N/A if 0 emitted)
  const candidateSchemaDenominator = rawCandidatesList.length;
  const candidateSchemaMetric = createMetricScore(
    schemaPassedCount,
    candidateSchemaDenominator,
    true
  );

  // Quote existence: measures quotes among actually emitted candidates (N/A if 0 emitted)
  const quoteDenominator = rawCandidatesList.length;
  const quoteMetric = createMetricScore(quotePassedCount, quoteDenominator, true);

  // Legacy schemaValidity metric for backward-compatibility with tests expecting envelope failure penalties
  const legacySchemaDenominator =
    isEnvelopeValid && rawCandidatesList.length === 0
      ? 0
      : envelopeParse.success
      ? rawCandidatesList.length
      : Math.max(rawCandidatesList.length, expectedCandidates.length, 1);
  const schemaMetric = createMetricScore(
    schemaPassedCount,
    legacySchemaDenominator,
    isEnvelopeValid && rawCandidatesList.length === 0
  );

  const claimSupportMetric = createMetricScore(claimSupportPassed, expectedTotal);
  const speechActMetric = createMetricScore(speechActPassed, expectedTotal);
  const suggestedStatusMetric = createMetricScore(suggestedStatusPassed, expectedTotal);
  const commitmentTypeMetric = createMetricScore(commitmentTypePassed, expectedTotal);

  // 6. Overall Pass/Fail Determination
  const allExpectedMatched = matchedPairs.length === expectedTotal;
  const noExtraneous = extraneousCount === 0;
  const isSchemaPerfect = envelopeParse.success && schemaPassedCount === rawCandidatesList.length;
  const isClassificationAccurate =
    speechActPassed === expectedTotal &&
    suggestedStatusPassed === expectedTotal &&
    commitmentTypePassed === expectedTotal;
  const isClaimSupportAccurate = claimSupportPassed === expectedTotal;

  const passed =
    isSchemaPerfect &&
    allExpectedMatched &&
    noExtraneous &&
    isClassificationAccurate &&
    isClaimSupportAccurate;

  return {
    scenarioId,
    timestamp,
    mechanicalChecks: {
      disclaimer: MECHANICAL_VERIFICATION_DISCLAIMER,
      envelopeValidity: envelopeMetric,
      candidateSchemaValidity: candidateSchemaMetric,
      schemaValidity: schemaMetric,
      quoteExistence: quoteMetric,
    },
    groundTruthAlignment: {
      claimSupport: claimSupportMetric,
      speechActClassification: speechActMetric,
      suggestedStatusClassification: suggestedStatusMetric,
      commitmentTypeClassification: commitmentTypeMetric,
    },
    summary: {
      passed,
      failureReasons,
      candidatesExpected: expectedTotal,
      candidatesExtracted: rawCandidatesList.length,
      candidatesMatched: matchedPairs.length,
      candidatesMissing: missingExpectedIndices.length,
      candidatesExtraneous: extraneousCount,
    },
    candidateDiagnostics,
  };
}

/**
 * Convenience helper to evaluate extraction output against a full EvaluationScenario.
 */
export function evaluateScenario(
  scenario: EvaluationScenario,
  candidateInput: unknown
): CaseEvaluationReport {
  return evaluateExtraction({
    sourceText: scenario.sourceText,
    expectedCandidates: scenario.expectedCandidates,
    candidateInput,
    expectedVerificationSuccess: scenario.expectedVerificationSuccess,
    scenarioId: scenario.id,
  });
}

/**
 * Aggregates evaluations across a suite of scenarios.
 */
export function evaluateScenarioSuite(
  scenarios: EvaluationScenario[],
  candidateInputs: Record<string, unknown>
): SuiteEvaluationReport {
  const timestamp = new Date().toISOString();
  const caseReports: CaseEvaluationReport[] = [];

  let passedScenarios = 0;
  let totalEnvelopePassed = 0;
  let totalEnvelopeTotal = 0;
  let totalCandidateSchemaPassed = 0;
  let totalCandidateSchemaTotal = 0;
  let totalSchemaPassed = 0;
  let totalSchemaTotal = 0;
  let totalQuotePassed = 0;
  let totalQuoteTotal = 0;

  let totalClaimSupportPassed = 0;
  let totalClaimSupportTotal = 0;
  let totalSpeechActPassed = 0;
  let totalSpeechActTotal = 0;
  let totalSuggestedStatusPassed = 0;
  let totalSuggestedStatusTotal = 0;
  let totalCommitmentTypePassed = 0;
  let totalCommitmentTypeTotal = 0;

  for (const scenario of scenarios) {
    const input = candidateInputs[scenario.id];
    const report = evaluateScenario(scenario, input);
    caseReports.push(report);

    if (report.summary.passed) {
      passedScenarios++;
    }

    // Accumulate mechanical metrics
    totalEnvelopePassed += report.mechanicalChecks.envelopeValidity?.passed ?? 1;
    totalEnvelopeTotal += report.mechanicalChecks.envelopeValidity?.total ?? 1;

    totalCandidateSchemaPassed += report.mechanicalChecks.candidateSchemaValidity?.passed ?? report.mechanicalChecks.schemaValidity.passed;
    totalCandidateSchemaTotal += report.mechanicalChecks.candidateSchemaValidity?.total ?? report.mechanicalChecks.schemaValidity.total;

    totalSchemaPassed += report.mechanicalChecks.schemaValidity.passed;
    totalSchemaTotal += report.mechanicalChecks.schemaValidity.total;

    totalQuotePassed += report.mechanicalChecks.quoteExistence.passed;
    totalQuoteTotal += report.mechanicalChecks.quoteExistence.total;

    // Accumulate ground-truth metrics
    totalClaimSupportPassed += report.groundTruthAlignment.claimSupport.passed;
    totalClaimSupportTotal += report.groundTruthAlignment.claimSupport.total;
    totalSpeechActPassed += report.groundTruthAlignment.speechActClassification.passed;
    totalSpeechActTotal += report.groundTruthAlignment.speechActClassification.total;
    totalSuggestedStatusPassed += report.groundTruthAlignment.suggestedStatusClassification.passed;
    totalSuggestedStatusTotal += report.groundTruthAlignment.suggestedStatusClassification.total;
    totalCommitmentTypePassed += report.groundTruthAlignment.commitmentTypeClassification.passed;
    totalCommitmentTypeTotal += report.groundTruthAlignment.commitmentTypeClassification.total;
  }

  const failedScenarios = scenarios.length - passedScenarios;

  return {
    timestamp,
    totalScenarios: scenarios.length,
    passedScenarios,
    failedScenarios,
    scenarioPassRate: createMetricScore(passedScenarios, scenarios.length),
    mechanicalChecks: {
      disclaimer: MECHANICAL_VERIFICATION_DISCLAIMER,
      envelopeValidity: createMetricScore(totalEnvelopePassed, totalEnvelopeTotal),
      candidateSchemaValidity: createMetricScore(
        totalCandidateSchemaPassed,
        totalCandidateSchemaTotal,
        true
      ),
      schemaValidity: createMetricScore(totalSchemaPassed, totalSchemaTotal),
      quoteExistence: createMetricScore(totalQuotePassed, totalQuoteTotal, true),
    },
    groundTruthAlignment: {
      claimSupport: createMetricScore(totalClaimSupportPassed, totalClaimSupportTotal),
      speechActClassification: createMetricScore(totalSpeechActPassed, totalSpeechActTotal),
      suggestedStatusClassification: createMetricScore(
        totalSuggestedStatusPassed,
        totalSuggestedStatusTotal
      ),
      commitmentTypeClassification: createMetricScore(
        totalCommitmentTypePassed,
        totalCommitmentTypeTotal
      ),
    },
    caseReports,
  };
}
