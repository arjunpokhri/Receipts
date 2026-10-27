"use client";

import React, { useState } from "react";
import {
  ShieldCheckIcon,
  XCircleIcon,
  SparklesIcon,
  InfoIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CheckIcon,
  LayersIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  ArrowRightIcon,
} from "./icons";
import { verifyEvidence } from "@/lib/verifier";
import { MECHANICAL_VERIFICATION_DISCLAIMER } from "@/lib/evaluate-extraction";
import type { VerifiedExtractedCandidate } from "@/lib/nebius-extraction";
import type { CommitmentType, SuggestedStatus } from "@/lib/schema";
import {
  createSnapshotSession,
  isSnapshotDiverged,
  type SourceSnapshotSession,
} from "@/lib/source-snapshot";

interface ExtractionApiResponse {
  success: boolean;
  candidates: VerifiedExtractedCandidate[];
  rawCandidateCount: number;
  verifiedQuoteCount: number;
  rejectedQuoteCount: number;
  model: string;
  durationMs: number;
}

interface CustomTextVerifierProps {
  onAddCandidateToLedger?: (
    candidate: VerifiedExtractedCandidate,
    sourceText: string
  ) => { success: boolean; error?: string } | void;
  onNavigateToLedger?: (itemId?: string) => void;
}

const AURA_PRESET_1_TEXT = `From: Elena Vance <elena@client.co>
Date: Oct 12, 2026, 11:15 AM
To: Marcus Miller <marcus@studio.co>
Subject: Aura Health — Mobile navigation & tablet breakpoints

Hi Marcus,

We love the desktop wireframes for the Aura Health portal. For the mobile navigation, we agree to proceed with the slide-out menu drawer at the quoted $650 addition.

Could we also include tablet breakpoint optimizations by October 24th? Let me check with our product lead before we make that official.

Best,
Elena`;

const AURA_PRESET_1_QUOTE =
  "we agree to proceed with the slide-out menu drawer at the quoted $650 addition";

const AURA_PRESET_2_TEXT = `From: Greg Thorne <greg@client.co>
Date: Oct 5, 2026, 02:15 PM
To: Marcus Miller <marcus@studio.co>
Subject: Interactive 3D Viewer Request

Hi Marcus,

The homepage layout looks solid. Could we also add an interactive 3D product viewer module right below the hero section? Our marketing team thinks it would boost conversions.

We would need this ready alongside the main delivery on October 17th if possible.

Thanks,
Greg`;

const AURA_PRESET_2_QUOTE =
  "Could we also add an interactive 3D product viewer module right below the hero section?";

const AURA_PRESET_3_TEXT = `Thread Transcript #general-ops:
[10:14 AM] Alex (Studio Mono): 'The surcharge for weekend maintenance and off-hours staging will be $150/hr as discussed.'
[10:32 AM] Sam (Client Operations): 'Understood, we are okay with the $100/hr weekend surcharge as long as logs are provided.'
[10:45 AM] Alex (Studio Mono): 'Wait Sam, our standard SLA rate for weekends is strictly $150/hr.'`;

const AURA_PRESET_3_QUOTE =
  "we are okay with the $100/hr weekend surcharge as long as logs are provided.";

export function CustomTextVerifier({
  onAddCandidateToLedger,
  onNavigateToLedger,
}: CustomTextVerifierProps) {
  const [sourceText, setSourceText] = useState(AURA_PRESET_1_TEXT);
  const [testQuote, setTestQuote] = useState(AURA_PRESET_1_QUOTE);

  const [strictMode, setStrictMode] = useState(false);

  // Live Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [snapshotSession, setSnapshotSession] = useState<SourceSnapshotSession<ExtractionApiResponse> | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [addedCandidateIds, setAddedCandidateIds] = useState<Set<string>>(new Set());
  const [lastAddedItem, setLastAddedItem] = useState<{ id: string; claim: string } | null>(null);

  const extractionResult = snapshotSession?.result ?? null;
  const isDiverged = isSnapshotDiverged(snapshotSession, sourceText);

  // Manual mechanical verifier computation
  const manualResult = verifyEvidence(sourceText, testQuote, {
    normalizeQuotesAndWhitespace: !strictMode,
  });

  const handleRunLiveExtraction = async () => {
    const analyzedSourceText = sourceText.trim();
    if (!analyzedSourceText) {
      setExtractionError("Please provide source text before running extraction.");
      return;
    }

    // Invalidate stale extraction results immediately upon starting a new extraction
    setSnapshotSession(null);
    setAddedCandidateIds(new Set());
    setLastAddedItem(null);
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: analyzedSourceText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server extraction failed with status ${response.status}`);
      }

      setSnapshotSession(createSnapshotSession(analyzedSourceText, data));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to extract commitments.";
      setExtractionError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddToLedger = (candidate: VerifiedExtractedCandidate) => {
    if (!onAddCandidateToLedger) return;

    if (!snapshotSession) {
      setExtractionError("Cannot add candidate: no active extraction snapshot session found.");
      return;
    }

    if (candidate.quoteVerified !== true) {
      setExtractionError("Cannot add candidate: evidence quotation failed mechanical verification.");
      return;
    }

    // Pass the immutable analyzed source snapshot, NEVER the mutable live textarea text
    const res = onAddCandidateToLedger(candidate, snapshotSession.analyzedSourceText);
    if (res && res.success === false) {
      setExtractionError(res.error || "Failed to add candidate to ledger.");
      return;
    }

    setAddedCandidateIds((prev) => new Set(prev).add(candidate.id));
    setLastAddedItem({ id: candidate.id, claim: candidate.claim });
  };

  const typeIcons: Record<CommitmentType, React.ComponentType<{ className?: string }>> = {
    deliverables: LayersIcon,
    revision_limits: FileTextIcon,
    deadlines: ClockIcon,
    prices: DollarSignIcon,
  };

  const getStatusBadge = (status: SuggestedStatus) => {
    switch (status) {
      case "baseline":
        return "border-[var(--forest)]/30 bg-[var(--forest-light)] text-[var(--forest)]";
      case "proposed":
        return "border-[var(--amber-border)] bg-[var(--amber-bg)] text-[var(--amber-state)]";
      case "unclear":
        return "border-[var(--amber-border)] bg-[var(--amber-bg)] text-[var(--amber-state)]";
      default:
        return "border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[var(--ink)]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-5 shadow-xs transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[var(--forest)]">
              <SparklesIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                  Source Analysis & Extraction Hub
                </h2>
                <span className="inline-flex items-center border border-[var(--forest)]/25 bg-[var(--forest-light)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--forest)]">
                  Nebius Token Factory
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-1">
                Extract commitments using Nebius-hosted NVIDIA Nemotron and verify verbatim evidence against the original client communication.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-3 text-xs flex items-start gap-2 text-[var(--ink-muted)]">
          <InfoIcon className="h-4 w-4 shrink-0 text-[var(--forest)] mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Human Agency Safeguard:</strong> The model suggests only preliminary statuses (<code>baseline</code>, <code>proposed</code>, <code>unclear</code>). Terminal confirmation and ledger updates require explicit human action.
          </div>
        </div>
      </div>

      {/* Primary Input: Raw Source Communication */}
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-xs font-semibold font-sans text-[var(--ink)]">
              Raw Source Communication
            </label>
            <span className="block text-[11px] text-[var(--ink-muted)]">
              Paste email threads, chat transcripts, or client scope notes below.
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--ink-subtle)]">
            {sourceText.length} chars • {sourceText.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Preset Aura Health demo scenarios */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-sans font-medium text-[var(--ink-muted)] mr-1">
            Aura Health Demo Presets:
          </span>
          <button
            type="button"
            onClick={() => {
              setSourceText(AURA_PRESET_1_TEXT);
              setTestQuote(AURA_PRESET_1_QUOTE);
              setSnapshotSession(null);
              setExtractionError(null);
              setLastAddedItem(null);
            }}
            className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-sans text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] transition-colors cursor-pointer"
          >
            Mobile Nav Drawer ($650)
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceText(AURA_PRESET_2_TEXT);
              setTestQuote(AURA_PRESET_2_QUOTE);
              setSnapshotSession(null);
              setExtractionError(null);
              setLastAddedItem(null);
            }}
            className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-sans text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] transition-colors cursor-pointer"
          >
            Interactive 3D Viewer Request
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceText(AURA_PRESET_3_TEXT);
              setTestQuote(AURA_PRESET_3_QUOTE);
              setSnapshotSession(null);
              setExtractionError(null);
              setLastAddedItem(null);
            }}
            className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[11px] font-sans text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] transition-colors cursor-pointer"
          >
            Weekend Maintenance Slack
          </button>
        </div>

        <textarea
          rows={8}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="w-full border border-[var(--surface-border)] bg-[var(--paper-card)] p-3 font-mono text-xs text-[var(--ink)] focus:border-[var(--forest)] focus:outline-hidden"
          placeholder="Paste raw email, Slack transcript, or contract text..."
        />

        {/* Action Bar for Live Extraction */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--surface-border)]">
          <div className="text-[11px] text-[var(--ink-muted)]">
            Server route: <code>POST /api/extract</code> • Model: <code>nvidia/Nemotron-3_5-Lightning</code>
          </div>

          <button
            type="button"
            onClick={handleRunLiveExtraction}
            disabled={isExtracting || sourceText.trim().length === 0}
            className="inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--forest)] px-4 py-2 text-xs font-semibold text-white shadow-[1px_1px_0px_var(--ink)] transition-all hover:bg-[var(--forest-hover)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                <span>Extracting via Nebius...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
                <span>Extract Commitments with Nebius</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Model Extraction Results Panel */}
      {isExtracting && (
        <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-6 sm:p-8 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--surface-border)] pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--forest)] opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--forest)]"></span>
              </span>
              <h3 className="font-serif text-base font-bold text-[var(--ink)]">
                Extracting Scope Commitments via Nebius Token Factory
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--forest)] font-semibold">
              nvidia/Nemotron-3_5-Lightning
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-1.5 w-full bg-[var(--surface-subtle)] overflow-hidden">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-[var(--forest)]/20 via-[var(--forest)] to-[var(--forest)]/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-3 flex items-start gap-2">
              <CheckIcon className="h-4 w-4 text-[var(--emerald-state)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--ink)]">1. Prompt Sandboxing</span>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Source wrapped in untrusted tags</p>
              </div>
            </div>
            <div className="border border-[var(--forest)]/40 bg-[var(--forest-light)] p-3 flex items-start gap-2">
              <RefreshCwIcon className="h-4 w-4 text-[var(--forest)] animate-spin shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--forest)]">2. Inference & Parse</span>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Strict JSON mode extraction</p>
              </div>
            </div>
            <div className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-3 flex items-start gap-2 opacity-75">
              <ClockIcon className="h-4 w-4 text-[var(--ink-subtle)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--ink-muted)]">3. Grounding Verification</span>
                <p className="text-[11px] text-[var(--ink-subtle)] mt-0.5">Exact character span check</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {extractionError && (
        <div className="border border-[var(--coral-border)] bg-[var(--coral-bg)] p-4 text-xs shadow-xs">
          <div className="flex items-start gap-2.5 text-[var(--coral-state)]">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold font-sans">Extraction Service Error</span>
              <p className="text-[var(--ink-muted)] leading-relaxed">{extractionError}</p>
            </div>
          </div>
        </div>
      )}

      {extractionResult && !isExtracting && (
        <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-5 shadow-xs space-y-4">
          {/* Divergence Notice when textarea changes after extraction */}
          {isDiverged && (
            <div className="border border-[var(--amber-border)] bg-[var(--amber-bg)] p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-[var(--amber-state)]">
              <div className="flex items-start gap-2 max-w-xl">
                <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5 text-[var(--amber-state)]" />
                <div>
                  <span className="font-semibold font-sans">Source Text Modified:</span>{" "}
                  The textarea content has changed since this extraction was generated. The results below remain bound to the analyzed snapshot and will not reflect your edits until you rerun extraction.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunLiveExtraction}
                disabled={isExtracting || sourceText.trim().length === 0}
                className="inline-flex items-center gap-1.5 border border-[var(--amber-border)] bg-[var(--paper-card)] px-2.5 py-1 text-xs font-sans font-medium text-[var(--amber-state)] hover:bg-[var(--amber-bg)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <RefreshCwIcon className="h-3 w-3" />
                <span>Rerun Extraction</span>
              </button>
            </div>
          )}

          {/* Summary Bar */}
          {lastAddedItem && (
            <div className="border border-[var(--emerald-border)] bg-[var(--emerald-bg)] p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs transition-all">
              <div className="flex items-center gap-2 text-[var(--forest)]">
                <CheckIcon className="h-4 w-4 shrink-0 text-[var(--emerald-state)]" />
                <span>
                  <strong>Added to Agreement Ledger:</strong> &ldquo;{lastAddedItem.claim}&rdquo;
                </span>
              </div>
              {onNavigateToLedger && (
                <button
                  type="button"
                  onClick={() => onNavigateToLedger(lastAddedItem.id)}
                  className="inline-flex items-center gap-1 border border-[var(--forest)] bg-[var(--forest)] px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[var(--forest-hover)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <span>View in Ledger</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[var(--ink)]">
                  Extraction Results
                </h3>
                <span className="inline-flex items-center border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2 py-0.5 text-[10px] font-sans font-semibold text-[var(--forest)]">
                  {extractionResult.verifiedQuoteCount} / {extractionResult.rawCandidateCount} Quotes Verified
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Model: <code>{extractionResult.model}</code> • Response in {extractionResult.durationMs}ms
              </p>
            </div>

            {extractionResult.rejectedQuoteCount > 0 && (
              <span className="inline-flex items-center gap-1 border border-[var(--coral-border)] bg-[var(--coral-bg)] px-2 py-0.5 text-[11px] font-sans font-medium text-[var(--coral-state)]">
                <XCircleIcon className="h-3.5 w-3.5" />
                {extractionResult.rejectedQuoteCount} quote(s) failed verification
              </span>
            )}
          </div>

          {/* Empty State */}
          {extractionResult.candidates.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--ink-muted)]">
              <InfoIcon className="h-5 w-5 mx-auto text-[var(--ink-subtle)] mb-1.5" />
              <p className="font-semibold text-[var(--ink)]">No commitments detected</p>
              <p className="text-[11px] text-[var(--ink-subtle)] mt-0.5">
                The model found no actionable deliverables, revision limits, deadlines, or pricing terms.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {extractionResult.candidates.map((cand, idx) => {
                const TypeIcon = typeIcons[cand.commitmentType] || LayersIcon;
                const isAdded = addedCandidateIds.has(cand.id);

                return (
                  <div
                    key={cand.id}
                    className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-4 transition-all hover:border-[var(--forest)]/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--ink-subtle)]">#{idx + 1}</span>
                        <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wide ${getStatusBadge(cand.suggestedStatus)}`}>
                          Suggested: {cand.suggestedStatus}
                        </span>
                        <span className="inline-flex items-center gap-1 border border-[var(--surface-border)] bg-[var(--paper-card)] px-1.5 py-0.5 text-[10px] font-sans text-[var(--ink-muted)]">
                          <TypeIcon className="h-3 w-3 text-[var(--forest)]" />
                          <span>{cand.commitmentType.replace("_", " ")}</span>
                        </span>
                        <span className="inline-flex items-center border border-[var(--surface-border)] bg-[var(--paper-card)] px-1.5 py-0.5 text-[10px] font-sans text-[var(--ink-muted)]">
                          Act: {cand.speechAct}
                        </span>
                      </div>

                      {/* Explicit Human Ledger Addition Action */}
                      {onAddCandidateToLedger && (
                        <div className="flex flex-col items-end gap-1">
                          {isAdded ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2.5 py-1 text-xs font-sans font-medium text-[var(--forest)]">
                                <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)]" />
                                <span>Added to Ledger</span>
                              </span>
                              {onNavigateToLedger && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToLedger(cand.id)}
                                  className="inline-flex items-center gap-1 border border-[var(--surface-border)] bg-[var(--paper-card)] px-2 py-1 text-xs font-sans font-semibold text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] transition-colors cursor-pointer"
                                  title="Jump to this item in Agreement Ledger"
                                >
                                  <span>View in Ledger</span>
                                  <ArrowRightIcon className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToLedger(cand)}
                              disabled={cand.quoteVerified !== true}
                              title={
                                cand.quoteVerified !== true
                                  ? "Evidence verification failed against source text"
                                  : cand.suggestedStatus === "baseline"
                                  ? "Model suggested baseline, but ordinary correspondence cannot establish baseline. It will be added as proposed."
                                  : undefined
                              }
                              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-sans font-medium transition-all cursor-pointer ${
                                cand.quoteVerified !== true
                                  ? "border-[var(--coral-border)] bg-[var(--coral-bg)] text-[var(--coral-state)] cursor-not-allowed opacity-75"
                                  : "border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)]"
                              }`}
                            >
                              {cand.quoteVerified !== true ? (
                                <>
                                  <XCircleIcon className="h-3.5 w-3.5 text-[var(--coral-state)]" />
                                  <span>Verification Failed (Cannot Add)</span>
                                </>
                              ) : cand.suggestedStatus === "baseline" ? (
                                <>
                                  <span>Add to Active Ledger as</span>
                                  <strong>Proposed</strong>
                                  <span className="text-[10px] text-[var(--ink-subtle)] font-normal">(downgraded)</span>
                                </>
                              ) : (
                                <>
                                  <span>Add to Active Ledger as</span>
                                  <strong className="capitalize">{cand.suggestedStatus}</strong>
                                </>
                              )}
                            </button>
                          )}
                          {cand.suggestedStatus === "baseline" && !isAdded && (
                            <span className="text-[10px] text-[var(--ink-subtle)]">
                              * Model suggested baseline; original agreement must be designated separately.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Claim */}
                    <div className="font-sans text-xs font-semibold text-[var(--ink)] mb-2 leading-snug">
                      {cand.claim}
                    </div>

                    {/* Verbatim Evidence Quote Box */}
                    <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-sans font-semibold uppercase text-[var(--ink-subtle)]">
                          Cited Evidence Quotation
                        </span>
                        {cand.quoteVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[var(--emerald-state)]">
                            <ShieldCheckIcon className="h-3 w-3" />
                            <span>Mechanically Verified</span>
                            {cand.verificationDetails.verified && (
                              <span className="font-mono text-[9px] text-[var(--ink-subtle)]">
                                [{cand.verificationDetails.startIndex}:{cand.verificationDetails.endIndex}]
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[var(--coral-state)]">
                            <XCircleIcon className="h-3 w-3" />
                            <span>
                              Verification Failed ({cand.verificationDetails.verified ? "" : cand.verificationDetails.reason})
                            </span>
                          </span>
                        )}
                      </div>

                      <blockquote className="font-serif italic text-xs text-[var(--ink)] leading-relaxed border-l-2 border-[var(--forest)]/40 pl-2.5 py-0.5">
                        &ldquo;{cand.evidenceQuote}&rdquo;
                      </blockquote>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-subtle)] pt-1 border-t border-[var(--surface-border)]">
                        <span>Speaker: {cand.speaker}</span>
                        <span>Date/Ref: {cand.timestamp}</span>
                      </div>
                    </div>

                    {/* Model Rationale */}
                    <div className="mt-2 text-[11px] text-[var(--ink-muted)] leading-relaxed">
                      <strong className="text-[var(--ink)]">Rationale:</strong> {cand.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[10px] text-[var(--ink-subtle)] leading-relaxed border-t border-[var(--surface-border)] pt-2">
            {MECHANICAL_VERIFICATION_DISCLAIMER}
          </div>
        </div>
      )}

      {/* Secondary Standalone Tool: Manual Quote String Verifier */}
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
              Direct Quote Substring Verifier
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Test any quotation directly against the source text above without making API requests.
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="rounded-none border-[var(--surface-border)] text-[var(--forest)] focus:ring-0"
            />
            <span>Strict Exact Mode</span>
          </label>
        </div>

        <textarea
          rows={3}
          value={testQuote}
          onChange={(e) => setTestQuote(e.target.value)}
          className="w-full border border-[var(--surface-border)] bg-[var(--paper-card)] p-2.5 font-sans text-xs text-[var(--ink)] focus:border-[var(--forest)] focus:outline-hidden"
          placeholder="Enter quote excerpt to test..."
        />

        {manualResult.verified ? (
          <div className="border border-[var(--emerald-border)] bg-[var(--emerald-bg)] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--forest)]">
              <ShieldCheckIcon className="h-4 w-4 text-[var(--emerald-state)]" />
              <span>
                Verified: {manualResult.exactMatch ? "Exact Substring Match" : "Normalized Whitespace / Quote Match"}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-[var(--forest)]">
              Span indices: [{manualResult.startIndex} ... {manualResult.endIndex}]
            </div>
          </div>
        ) : (
          <div className="border border-[var(--coral-border)] bg-[var(--coral-bg)] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--coral-state)]">
              <XCircleIcon className="h-4 w-4 text-[var(--coral-state)]" />
              <span>Verification Rejected: {manualResult.reason}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {manualResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
