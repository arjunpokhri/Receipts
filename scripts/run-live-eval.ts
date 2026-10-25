#!/usr/bin/env node

/**
 * Measured Reliability v1 - Live Extraction Evaluation Harness
 *
 * Runs repeatable evaluations against Nebius Token Factory for Receipts extraction.
 *
 * CRITICAL SAFETY RULES:
 * 1. Opt-in only: requires --yes before any network call is dispatched.
 * 2. No-network preview: without --yes, prints the planned call volume and exits cleanly.
 * 3. Never reads or logs API keys, headers, or secrets.
 * 4. Captures raw model outputs before validation and records application failure
 *    (productWouldHaveFailed) separately from ground-truth evaluation.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  EVALUATION_SCENARIOS,
  type EvaluationScenario,
} from "../src/lib/evaluation-cases.ts";
import {
  evaluateScenario,
  type CaseEvaluationReport,
} from "../src/lib/evaluate-extraction.ts";
import {
  extractCleanJsonString,
  extractCommitmentsWithNebius,
} from "../src/lib/nebius-extraction.ts";
import {
  computeClassificationRates,
  computeStatusDiscrepancies,
  computeFailureSummary,
  computeLatencyDistribution,
  computeTokenAccounting,
  computeRunToRunInstability,
  type FailureStage,
  type RunFailureRecord,
  type TokenUsageRecord,
  type ScenarioRunInput,
} from "../src/lib/eval-metrics.ts";

export interface CliOptions {
  runs: number;
  onlyScenarioId?: string;
  model: string;
  yes: boolean;
  help: boolean;
}

export function parseCliArgs(args: string[]): CliOptions {
  let runs = 3;
  let onlyScenarioId: string | undefined;
  let model = process.env.NEBIUS_MODEL || "nvidia/Nemotron-3_5-Lightning";
  let yes = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--yes" || arg === "-y") {
      yes = true;
    } else if (arg === "--runs") {
      const next = args[++i];
      const parsed = parseInt(next, 10);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid --runs value: '${next}'. Must be a positive integer.`);
      }
      runs = parsed;
    } else if (arg === "--only") {
      onlyScenarioId = args[++i];
      if (!onlyScenarioId) {
        throw new Error("Missing scenario ID following --only.");
      }
    } else if (arg === "--model") {
      model = args[++i];
      if (!model) {
        throw new Error("Missing model identifier following --model.");
      }
    } else {
      throw new Error(`Unrecognized CLI argument: '${arg}'. Use --help for usage.`);
    }
  }

  return { runs, onlyScenarioId, model, yes, help };
}

export function printHelp(): void {
  console.log(`
Measured Reliability v1 - Live Extraction Evaluation Harness

Usage:
  npm run eval:live -- [options]

Options:
  --runs <N>          Number of evaluation runs per scenario (default: 3)
  --only <id>         Run only a specific scenario by scenario ID
  --model <id>        Override model identifier (default: nvidia/Nemotron-3_5-Lightning)
  --yes               Explicitly opt in and authorize live API network calls
  --help              Display this help message and exit

Safety Guard:
  Without --yes, the harness prints a preview of the planned API calls and
  exits cleanly with code 0 without making network requests or requiring an API key.
`);
}

function getGitCommitHash(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

export interface LiveEvaluationRunRecord {
  scenarioId: string;
  scenarioTitle: string;
  runIndex: number;
  timestamp: string;
  model: string;
  latencyMs: number;
  tokenUsage?: TokenUsageRecord;
  rawContent: string | null;
  productWouldHaveFailed: boolean;
  failureStage: FailureStage | null;
  failureError?: string;
  report: CaseEvaluationReport | null;
}

export interface LiveEvaluationSummary {
  model: string;
  timestamp: string;
  commitHash: string;
  scenarioCount: number;
  runsPerScenario: number;
  totalRunsPlanned: number;
  totalRunsCompleted: number;
  classificationRates: ReturnType<typeof computeClassificationRates>;
  statusDiscrepancies: ReturnType<typeof computeStatusDiscrepancies>;
  latency: ReturnType<typeof computeLatencyDistribution>;
  tokens: ReturnType<typeof computeTokenAccounting>;
  failures: ReturnType<typeof computeFailureSummary>;
  instability: ReturnType<typeof computeRunToRunInstability>;
}

export async function runLiveEvaluation(options: CliOptions): Promise<LiveEvaluationSummary> {
  // 1. Select scenarios
  let targetScenarios: EvaluationScenario[] = EVALUATION_SCENARIOS;
  if (options.onlyScenarioId) {
    const found = EVALUATION_SCENARIOS.find((s) => s.id === options.onlyScenarioId);
    if (!found) {
      const available = EVALUATION_SCENARIOS.map((s) => s.id).join(", ");
      throw new Error(
        `Scenario '${options.onlyScenarioId}' not found. Available scenarios:\n  ${available}`
      );
    }
    targetScenarios = [found];
  }

  const totalPlannedCalls = targetScenarios.length * options.runs;

  // 2. Safety Guard: Without --yes, print preview and exit without network
  if (!options.yes) {
    console.log("================================================================");
    console.log(" Measured Reliability v1 - Preview Mode (No API Calls Dispatched)");
    console.log("================================================================");
    console.log(`Scenarios selected:    ${targetScenarios.length} (of ${EVALUATION_SCENARIOS.length} total)`);
    console.log(`Runs per scenario:     ${options.runs}`);
    console.log(`Total API calls:       ${totalPlannedCalls}`);
    console.log(`Target model:          ${options.model}`);
    console.log("\nTo execute this evaluation against Nebius, re-run with --yes:");
    console.log(`  npm run eval:live -- --yes${options.runs !== 3 ? ` --runs ${options.runs}` : ""}${options.onlyScenarioId ? ` --only ${options.onlyScenarioId}` : ""}`);
    console.log("================================================================");
    return {
      model: options.model,
      timestamp: new Date().toISOString(),
      commitHash: getGitCommitHash(),
      scenarioCount: targetScenarios.length,
      runsPerScenario: options.runs,
      totalRunsPlanned: totalPlannedCalls,
      totalRunsCompleted: 0,
      classificationRates: computeClassificationRates([]),
      statusDiscrepancies: computeStatusDiscrepancies([]),
      latency: computeLatencyDistribution([]),
      tokens: computeTokenAccounting([], 0),
      failures: computeFailureSummary([]),
      instability: computeRunToRunInstability([]),
    };
  }

  // 3. Validate API credentials for live execution
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "NEBIUS_API_KEY environment variable is required to execute live evaluation with --yes."
    );
  }

  console.log(`Starting live evaluation: ${targetScenarios.length} scenarios x ${options.runs} runs = ${totalPlannedCalls} API calls.`);
  console.log(`Model: ${options.model}\n`);

  const resultsDir = path.join(process.cwd(), "eval-results");
  const rawDir = path.join(resultsDir, "raw");
  fs.mkdirSync(rawDir, { recursive: true });

  const runRecords: LiveEvaluationRunRecord[] = [];
  const failureRecords: RunFailureRecord[] = [];
  const caseReportsForMetrics: CaseEvaluationReport[] = [];
  const scenarioRunInputs: ScenarioRunInput[] = [];
  const latencies: number[] = [];
  const tokenRecords: Array<TokenUsageRecord | undefined> = [];

  let completedCalls = 0;

  for (let sIdx = 0; sIdx < targetScenarios.length; sIdx++) {
    const scenario = targetScenarios[sIdx];
    console.log(`[${sIdx + 1}/${targetScenarios.length}] Scenario: ${scenario.id} ("${scenario.title}")`);

    for (let r = 1; r <= options.runs; r++) {
      completedCalls++;
      process.stdout.write(`  Run ${r}/${options.runs}... `);

      const startTime = Date.now();
      let rawContent: string | null = null;
      let latencyMs = 0;
      let tokenUsage: TokenUsageRecord | undefined;
      let productWouldHaveFailed = false;
      let failureStage: FailureStage | null = null;
      let failureError: string | undefined;
      let report: CaseEvaluationReport | null = null;

      try {
        const extraction = await extractCommitmentsWithNebius(scenario.sourceText, {
          model: options.model,
          onRawContent: (raw) => {
            rawContent = raw;
          },
        });

        latencyMs = extraction.durationMs;
        tokenUsage = extraction.usage;

        if (rawContent) {
          const cleaned = extractCleanJsonString(rawContent);
          const parsed = JSON.parse(cleaned);
          report = evaluateScenario(scenario, parsed);
        } else {
          report = evaluateScenario(scenario, { candidates: extraction.candidates });
        }
      } catch (err: unknown) {
        latencyMs = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);
        failureError = errMsg;
        productWouldHaveFailed = true;

        if (rawContent) {
          try {
            const cleaned = extractCleanJsonString(rawContent);
            const parsed = JSON.parse(cleaned);
            report = evaluateScenario(scenario, parsed);
            failureStage = "schema_violation";
          } catch {
            failureStage = "parse";
            report = evaluateScenario(scenario, { malformedRaw: rawContent });
          }
        } else {
          if (errMsg.includes("truncated by the token limit")) {
            failureStage = "truncation";
          } else if (errMsg.includes("empty content response")) {
            failureStage = "empty_response";
          } else {
            failureStage = "network";
          }
          report = evaluateScenario(scenario, null);
        }

        failureRecords.push({
          scenarioId: scenario.id,
          runIndex: r,
          stage: failureStage,
          productWouldHaveFailed,
          errorMessage: errMsg,
        });
      }

      latencies.push(latencyMs);
      tokenRecords.push(tokenUsage);

      if (report) {
        caseReportsForMetrics.push(report);
      }

      scenarioRunInputs.push({
        scenarioId: scenario.id,
        runIndex: r,
        report: report || undefined,
      });

      const record: LiveEvaluationRunRecord = {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        runIndex: r,
        timestamp: new Date().toISOString(),
        model: options.model,
        latencyMs,
        tokenUsage,
        rawContent,
        productWouldHaveFailed,
        failureStage,
        failureError,
        report,
      };
      runRecords.push(record);

      // Write raw per-run file
      const safeTs = new Date().toISOString().replace(/[:.]/g, "-");
      const rawFile = path.join(
        rawDir,
        `${safeTs}_${scenario.id}_run${r}.json`
      );
      fs.writeFileSync(rawFile, JSON.stringify(record, null, 2), "utf-8");

      const statusNote = failureStage
        ? `FAILED (${failureStage}) [${latencyMs}ms]`
        : `OK [${latencyMs}ms] (Candidates: ${report?.summary.candidatesExtracted ?? 0})`;
      console.log(statusNote);

      // Short delay between calls to avoid bursting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 4. Compute overall metrics
  const classificationRates = computeClassificationRates(caseReportsForMetrics);
  const statusDiscrepancies = computeStatusDiscrepancies(caseReportsForMetrics);
  const latencySummary = computeLatencyDistribution(latencies);
  const tokenSummary = computeTokenAccounting(tokenRecords, totalPlannedCalls);
  const failureSummary = computeFailureSummary(failureRecords);
  const instabilitySummary = computeRunToRunInstability(scenarioRunInputs);

  const summary: LiveEvaluationSummary = {
    model: options.model,
    timestamp: new Date().toISOString(),
    commitHash: getGitCommitHash(),
    scenarioCount: targetScenarios.length,
    runsPerScenario: options.runs,
    totalRunsPlanned: totalPlannedCalls,
    totalRunsCompleted: completedCalls,
    classificationRates,
    statusDiscrepancies,
    latency: latencySummary,
    tokens: tokenSummary,
    failures: failureSummary,
    instability: instabilitySummary,
  };

  // Write summary.json
  const summaryFile = path.join(resultsDir, "summary.json");
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`\nEvaluation complete. Summary written to ${summaryFile}`);
  console.log(`  Envelope Validity:         ${classificationRates.envelopeValidity.formatted}`);
  console.log(`  Candidate Schema Validity: ${classificationRates.candidateSchemaValidity.formatted}`);
  console.log(`  Quote Existence:           ${classificationRates.quoteExistence.formatted}`);
  console.log(`  Candidate Recall:          ${classificationRates.candidateRecall.formatted}`);

  return summary;
}

export async function main(): Promise<void> {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      process.exit(0);
    }
    await runLiveEvaluation(options);
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Evaluation Harness Error: ${message}`);
    process.exit(1);
  }
}

// Execute main if invoked directly
if (process.argv[1] && process.argv[1].endsWith("run-live-eval.ts")) {
  void main();
}
