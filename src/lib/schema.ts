import { z } from "zod";

/**
 * Commitment types tracked by Receipts:
 * - deliverables: Specific work products, features, assets, or artifacts.
 * - revision_limits: Constraints on review cycles, iteration rounds, rework thresholds.
 * - deadlines: Dates, milestones, delivery timelines, or schedule dependencies.
 * - prices: Fees, hourly rates, milestone billing triggers, deposit terms.
 */
export const CommitmentTypeSchema = z.enum([
  "deliverables",
  "revision_limits",
  "deadlines",
  "prices",
]);
export type CommitmentType = z.infer<typeof CommitmentTypeSchema>;

/**
 * Pragmatic Speech Act categories representing the conversational intent:
 * - request: Asking for a task, deliverable, or adjustment.
 * - proposal: Suggesting a potential term, price, or scope for consideration.
 * - question: Seeking clarification or inquiry without taking a position.
 * - acceptance: Agreeing to a proposed term or scope.
 * - rejection: Declining or ruling out a proposed term or scope.
 * - commitment: Promising or guaranteeing performance or delivery.
 * - information: Sharing context or status updates without changing commitments.
 */
export const SpeechActSchema = z.enum([
  "request",
  "proposal",
  "question",
  "acceptance",
  "rejection",
  "commitment",
  "information",
]);
export type SpeechAct = z.infer<typeof SpeechActSchema>;

/**
 * Statuses that can be SUGGESTED by automated extraction models.
 *
 * CRITICAL RULE: AI models must NEVER output "confirmed" or "dismissed".
 * Those terminal statuses are strictly controlled by the human-in-the-loop workflow.
 * An AI extractor can only suggest:
 * - baseline: An existing, previously established commitment from original scope.
 * - proposed: A change or addition suggested by either party, unconfirmed.
 * - unclear: Ambiguous scope, unstated terms, or undetermined expectations.
 */
export const SuggestedStatusSchema = z.enum([
  "baseline",
  "proposed",
  "unclear",
]);
export type SuggestedStatus = z.infer<typeof SuggestedStatusSchema>;

/**
 * Full application candidate statuses in the agreement ledger:
 * Includes human-confirmed and human-dismissed terminal states.
 */
export const ApplicationStatusSchema = z.enum([
  "baseline",
  "proposed",
  "confirmed",
  "unclear",
  "dismissed",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/**
 * Confidence level of extraction.
 */
export const ConfidenceLevelSchema = z.enum(["low", "medium", "high"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

/**
 * Schema for an individual candidate agreement extracted from raw client communication.
 */
export const ExtractedCandidateSchema = z.object({
  /** Concise summary of the commitment, change, or term. */
  claim: z.string().min(1, "Claim must not be empty"),

  /** Verbatim excerpt from source text providing evidence for the claim. */
  evidenceQuote: z.string().min(1, "Evidence quote must not be empty"),

  /** Name or role of the speaker who made the statement. */
  speaker: z.string().min(1, "Speaker must not be empty"),

  /** Timestamp, date, or conversational sequence identifier if available. */
  timestamp: z.string().min(1, "Timestamp must not be empty"),

  /** Commitment category */
  commitmentType: CommitmentTypeSchema,

  /** Conversational speech act */
  speechAct: SpeechActSchema,

  /** Status suggested by the extractor. Must NEVER be 'confirmed' or 'dismissed'. */
  suggestedStatus: SuggestedStatusSchema,

  /** Confidence label for the extraction */
  confidence: ConfidenceLevelSchema,

  /** Brief rationale explaining why this status and commitment type were selected */
  explanation: z.string().min(1, "Explanation must not be empty"),
});
export type ExtractedCandidate = z.infer<typeof ExtractedCandidateSchema>;

/**
 * Root container schema for model extraction outputs.
 */
export const ExtractionResultSchema = z.object({
  candidates: z.array(ExtractedCandidateSchema),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
