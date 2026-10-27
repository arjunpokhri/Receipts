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
        return "border-[#20251F]/15 bg-[#E7EEE8] text-[#20251F]";
      case "proposed":
        return "border-[#C58A36]/40 bg-[#FAF3E8] text-[#9A6518]";
      case "unclear":
        return "border-[#C58A36]/40 bg-[#FAF3E8] text-[#9A6518]";
      default:
        return "border-[#20251F]/15 bg-[#E7EEE8] text-[#20251F]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-[#20251F]/10 bg-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[#20251F]/15 bg-[#F6F5F0] text-[#244D3A]">
              <SparklesIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[#20251F]">
                  Source Analysis & Extraction Hub
                </h2>
                <span className="inline-flex items-center border border-[#244D3A]/20 bg-[#E7EEE8] px-2 py-0.5 text-[10px] font-sans font-medium text-[#244D3A]">
                  Nebius Token Factory
                </span>
              </div>
              <p className="text-xs text-[#576356] leading-relaxed mt-1">
                Extract commitments using Nebius-hosted NVIDIA Nemotron and verify verbatim evidence against the original client communication.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3.5 border border-[#20251F]/10 bg-[#E7EEE8]/40 p-3 text-xs flex items-start gap-2 text-[#576356]">
          <InfoIcon className="h-4 w-4 shrink-0 text-[#244D3A] mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Human Agency Safeguard:</strong> The model suggests only preliminary statuses (<code>baseline</code>, <code>proposed</code>, <code>unclear</code>). Terminal confirmation and ledger updates require explicit human action.
          </div>
        </div>
      </div>

      {/* Primary Input: Raw Source Communication */}
      <div className="border border-[#20251F]/10 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-xs font-semibold font-sans text-[#20251F]">
              Raw Source Communication
            </label>
            <span className="block text-[11px] text-[#576356]">
              Paste email threads, chat transcripts, or client scope notes below.
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#889386]">
            {sourceText.length} chars • {sourceText.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Preset Aura Health demo scenarios */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-sans font-medium text-[#576356] mr-1">
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
            className="border border-[#20251F]/15 bg-[#F6F5F0] px-2 py-0.5 text-[11px] font-sans text-[#20251F] hover:border-[#244D3A] hover:bg-[#E7EEE8] transition-colors"
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
            className="border border-[#20251F]/15 bg-[#F6F5F0] px-2 py-0.5 text-[11px] font-sans text-[#20251F] hover:border-[#244D3A] hover:bg-[#E7EEE8] transition-colors"
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
            className="border border-[#20251F]/15 bg-[#F6F5F0] px-2 py-0.5 text-[11px] font-sans text-[#20251F] hover:border-[#244D3A] hover:bg-[#E7EEE8] transition-colors"
          >
            Weekend Maintenance Slack
          </button>
        </div>

        <textarea
          rows={8}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="w-full border border-[#20251F]/15 bg-white p-3 font-mono text-xs text-[#20251F] focus:border-[#244D3A] focus:outline-hidden"
          placeholder="Paste raw email, Slack transcript, or contract text..."
        />

        {/* Action Bar for Live Extraction */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#20251F]/8">
          <div className="text-[11px] text-[#576356]">
            Server route: <code>POST /api/extract</code> • Model: <code>nvidia/Nemotron-3_5-Lightning</code>
          </div>

          <button
            type="button"
            onClick={handleRunLiveExtraction}
            disabled={isExtracting || sourceText.trim().length === 0}
            className="inline-flex items-center gap-2 border border-[#20251F] bg-[#244D3A] px-4 py-2 text-xs font-semibold text-white shadow-[1px_1px_0px_#20251F] transition-all hover:bg-[#1E3F30] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="border border-[#20251F]/10 bg-white p-6 shadow-xs text-center space-y-3">
          <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto text-[#244D3A]" />
          <h3 className="font-serif text-sm font-bold text-[#20251F]">
            Extracting Scope Commitments via Nebius Token Factory
          </h3>
          <p className="text-xs text-[#576356] max-w-md mx-auto">
            Sending prompt to <code>nvidia/Nemotron-3_5-Lightning</code> in JSON mode. Each candidate quotation will be mechanically verified against the source text upon receipt.
          </p>
        </div>
      )}

      {extractionError && (
        <div className="border border-[#C95C4B]/30 bg-[#FDF2F0] p-4 text-xs shadow-xs">
          <div className="flex items-start gap-2.5 text-[#A83827]">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold font-sans">Extraction Service Error</span>
              <p className="text-[#576356] leading-relaxed">{extractionError}</p>
            </div>
          </div>
        </div>
      )}

      {extractionResult && !isExtracting && (
        <div className="border border-[#20251F]/10 bg-white p-5 shadow-xs space-y-4">
          {/* Divergence Notice when textarea changes after extraction */}
          {isDiverged && (
            <div className="border border-[#C58A36]/40 bg-[#FAF3E8] p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-[#9A6518]">
              <div className="flex items-start gap-2 max-w-xl">
                <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5 text-[#C58A36]" />
                <div>
                  <span className="font-semibold font-sans">Source Text Modified:</span>{" "}
                  The textarea content has changed since this extraction was generated. The results below remain bound to the analyzed snapshot and will not reflect your edits until you rerun extraction.
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunLiveExtraction}
                disabled={isExtracting || sourceText.trim().length === 0}
                className="inline-flex items-center gap-1.5 border border-[#9A6518]/30 bg-white px-2.5 py-1 text-xs font-sans font-medium text-[#9A6518] hover:bg-[#FAF3E8] active:translate-x-0.5 active:translate-y-0.5"
              >
                <RefreshCwIcon className="h-3 w-3" />
                <span>Rerun Extraction</span>
              </button>
            </div>
          )}

          {/* Summary Bar */}
          {lastAddedItem && (
            <div className="border border-[#2E7D5B]/30 bg-[#F0F6F2] p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs transition-all">
              <div className="flex items-center gap-2 text-[#244D3A]">
                <CheckIcon className="h-4 w-4 shrink-0 text-[#2E7D5B]" />
                <span>
                  <strong>Added to Agreement Ledger:</strong> &ldquo;{lastAddedItem.claim}&rdquo;
                </span>
              </div>
              {onNavigateToLedger && (
                <button
                  type="button"
                  onClick={() => onNavigateToLedger(lastAddedItem.id)}
                  className="inline-flex items-center gap-1 border border-[#244D3A] bg-[#244D3A] px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#1E3F30] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <span>View in Ledger</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#20251F]/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#20251F]">
                  Extraction Results
                </h3>
                <span className="inline-flex items-center border border-[#2E7D5B]/30 bg-[#F0F6F2] px-2 py-0.5 text-[10px] font-sans font-semibold text-[#244D3A]">
                  {extractionResult.verifiedQuoteCount} / {extractionResult.rawCandidateCount} Quotes Verified
                </span>
              </div>
              <p className="text-xs text-[#576356] mt-0.5">
                Model: <code>{extractionResult.model}</code> • Response in {extractionResult.durationMs}ms
              </p>
            </div>

            {extractionResult.rejectedQuoteCount > 0 && (
              <span className="inline-flex items-center gap-1 border border-[#C95C4B]/30 bg-[#FDF2F0] px-2 py-0.5 text-[11px] font-sans font-medium text-[#A83827]">
                <XCircleIcon className="h-3.5 w-3.5" />
                {extractionResult.rejectedQuoteCount} quote(s) failed verification
              </span>
            )}
          </div>

          {/* Empty State */}
          {extractionResult.candidates.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#576356]">
              <InfoIcon className="h-5 w-5 mx-auto text-[#889386] mb-1.5" />
              <p className="font-semibold text-[#20251F]">No commitments detected</p>
              <p className="text-[11px] text-[#889386] mt-0.5">
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
                    className="border border-[#20251F]/10 bg-[#FAF9F5] p-4 transition-all hover:border-[#20251F]/25"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-[#889386]">#{idx + 1}</span>
                        <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wide ${getStatusBadge(cand.suggestedStatus)}`}>
                          Suggested: {cand.suggestedStatus}
                        </span>
                        <span className="inline-flex items-center gap-1 border border-[#20251F]/10 bg-white px-1.5 py-0.5 text-[10px] font-sans text-[#576356]">
                          <TypeIcon className="h-3 w-3 text-[#244D3A]" />
                          <span>{cand.commitmentType.replace("_", " ")}</span>
                        </span>
                        <span className="inline-flex items-center border border-[#20251F]/10 bg-white px-1.5 py-0.5 text-[10px] font-sans text-[#576356]">
                          Act: {cand.speechAct}
                        </span>
                      </div>

                      {/* Explicit Human Ledger Addition Action */}
                      {onAddCandidateToLedger && (
                        <div className="flex flex-col items-end gap-1">
                          {isAdded ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 border border-[#2E7D5B]/30 bg-[#F0F6F2] px-2.5 py-1 text-xs font-sans font-medium text-[#244D3A]">
                                <CheckIcon className="h-3.5 w-3.5 text-[#2E7D5B]" />
                                <span>Added to Ledger</span>
                              </span>
                              {onNavigateToLedger && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToLedger(cand.id)}
                                  className="inline-flex items-center gap-1 border border-[#20251F]/20 bg-white px-2 py-1 text-xs font-sans font-semibold text-[#20251F] hover:border-[#244D3A] hover:bg-[#E7EEE8] transition-colors"
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
                              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-sans font-medium transition-all ${
                                cand.quoteVerified !== true
                                  ? "border-[#C95C4B]/30 bg-[#FDF2F0] text-[#A83827] cursor-not-allowed opacity-75"
                                  : "border-[#20251F]/20 bg-white text-[#20251F] hover:border-[#244D3A] hover:bg-[#E7EEE8]"
                              }`}
                            >
                              {cand.quoteVerified !== true ? (
                                <>
                                  <XCircleIcon className="h-3.5 w-3.5 text-[#C95C4B]" />
                                  <span>Verification Failed (Cannot Add)</span>
                                </>
                              ) : cand.suggestedStatus === "baseline" ? (
                                <>
                                  <span>Add to Active Ledger as</span>
                                  <strong>Proposed</strong>
                                  <span className="text-[10px] text-[#889386] font-normal">(downgraded)</span>
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
                            <span className="text-[10px] text-[#889386]">
                              * Model suggested baseline; original agreement must be designated separately.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Claim */}
                    <div className="font-sans text-xs font-semibold text-[#20251F] mb-2 leading-snug">
                      {cand.claim}
                    </div>

                    {/* Verbatim Evidence Quote Box */}
                    <div className="border border-[#20251F]/10 bg-white p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-sans font-semibold uppercase text-[#889386]">
                          Cited Evidence Quotation
                        </span>
                        {cand.quoteVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#2E7D5B]">
                            <ShieldCheckIcon className="h-3 w-3" />
                            <span>Mechanically Verified</span>
                            {cand.verificationDetails.verified && (
                              <span className="font-mono text-[9px] text-[#889386]">
                                [{cand.verificationDetails.startIndex}:{cand.verificationDetails.endIndex}]
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-[#A83827]">
                            <XCircleIcon className="h-3 w-3" />
                            <span>
                              Verification Failed ({cand.verificationDetails.verified ? "" : cand.verificationDetails.reason})
                            </span>
                          </span>
                        )}
                      </div>

                      <blockquote className="font-serif italic text-xs text-[#20251F] leading-relaxed border-l-2 border-[#244D3A]/40 pl-2.5 py-0.5">
                        &ldquo;{cand.evidenceQuote}&rdquo;
                      </blockquote>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#889386] pt-1 border-t border-[#20251F]/5">
                        <span>Speaker: {cand.speaker}</span>
                        <span>Date/Ref: {cand.timestamp}</span>
                      </div>
                    </div>

                    {/* Model Rationale */}
                    <div className="mt-2 text-[11px] text-[#576356] leading-relaxed">
                      <strong className="text-[#20251F]">Rationale:</strong> {cand.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[10px] text-[#889386] leading-relaxed border-t border-[#20251F]/8 pt-2">
            {MECHANICAL_VERIFICATION_DISCLAIMER}
          </div>
        </div>
      )}

      {/* Secondary Standalone Tool: Manual Quote String Verifier */}
      <div className="border border-[#20251F]/10 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-[#20251F]">
              Direct Quote Substring Verifier
            </h3>
            <p className="text-xs text-[#576356]">
              Test any quotation directly against the source text above without making API requests.
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[#576356] cursor-pointer">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="rounded-none border-[#20251F]/30 text-[#244D3A] focus:ring-0"
            />
            <span>Strict Exact Mode</span>
          </label>
        </div>

        <textarea
          rows={3}
          value={testQuote}
          onChange={(e) => setTestQuote(e.target.value)}
          className="w-full border border-[#20251F]/15 bg-white p-2.5 font-sans text-xs text-[#20251F] focus:border-[#244D3A] focus:outline-hidden"
          placeholder="Enter quote excerpt to test..."
        />

        {manualResult.verified ? (
          <div className="border border-[#2E7D5B]/30 bg-[#F0F6F2] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#244D3A]">
              <ShieldCheckIcon className="h-4 w-4 text-[#2E7D5B]" />
              <span>
                Verified: {manualResult.exactMatch ? "Exact Substring Match" : "Normalized Whitespace / Quote Match"}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-[#244D3A]">
              Span indices: [{manualResult.startIndex} ... {manualResult.endIndex}]
            </div>
          </div>
        ) : (
          <div className="border border-[#C95C4B]/30 bg-[#FDF2F0] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#A83827]">
              <XCircleIcon className="h-4 w-4 text-[#C95C4B]" />
              <span>Verification Rejected: {manualResult.reason}</span>
            </div>
            <p className="mt-1 text-xs text-[#576356]">
              {manualResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
