"use client";

import React, { useState, useRef } from "react";
import {
  ShieldCheckIcon,
  XCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CheckIcon,
  LayersIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  ArrowRightIcon,
  UploadIcon,
  XIcon,
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

  // Document Upload & Parsing State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    wordCount: number;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploadError(null);
    setIsUploadingFile(true);

    try {
      const fileName = file.name || "document";
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));

      let extracted = "";
      let wordCount = 0;

      // Handle simple text and markdown files directly client-side
      if (ext === ".txt" || ext === ".md" || ext === ".markdown" || file.type.startsWith("text/")) {
        extracted = await file.text();
        extracted = extracted.replace(/\r\n/g, "\n").trim();
        wordCount = extracted.split(/\s+/).filter(Boolean).length;
      } else {
        // Send PDF, DOCX, DOC to /api/parse-document
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to parse ${fileName} (Status ${res.status})`);
        }

        extracted = data.text;
        wordCount = data.wordCount || extracted.split(/\s+/).filter(Boolean).length;
      }

      if (!extracted || extracted.trim().length === 0) {
        throw new Error(`No readable text could be extracted from "${fileName}".`);
      }

      setSourceText(extracted);
      // Pick a sample quote for the manual tester
      const candidateLine = extracted
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length >= 25 && l.length <= 150);
      if (candidateLine) {
        setTestQuote(candidateLine);
      }

      setUploadedFile({
        name: fileName,
        size: file.size,
        wordCount,
      });
      setSnapshotSession(null);
      setExtractionError(null);
      setLastAddedItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error parsing document.";
      setUploadError(msg);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

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
                setUploadedFile(null);
                setUploadError(null);
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
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#181E1A]/80 backdrop-blur-md p-6 sm:p-7 shadow-md transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--forest)]/20 bg-[var(--forest-light)] text-[var(--forest)] shadow-2xs">
              <FileTextIcon className="h-5 w-5 text-[var(--forest)]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
                  Source Analysis & Extraction Hub
                </h2>
                <span className="inline-flex items-center rounded-full border border-[var(--forest)]/20 bg-[var(--forest-light)]/80 px-2.5 py-0.5 text-[10px] font-sans font-medium text-[var(--forest)] shadow-2xs">
                  Nebius Token Factory
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-1 max-w-2xl">
                Extract commitments using Nebius-hosted NVIDIA Nemotron and verify verbatim evidence against the original client communication.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 text-xs flex items-start gap-2.5 text-[var(--ink-muted)]">
          <InfoIcon className="h-4 w-4 shrink-0 text-[var(--forest)] mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Human Agency Safeguard:</strong> The model suggests only preliminary statuses (<code>baseline</code>, <code>proposed</code>, <code>unclear</code>). Terminal confirmation and ledger updates require explicit human action.
          </div>
        </div>
      </div>

      {/* Primary Input: Raw Source Communication */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-6 sm:p-8 shadow-lg space-y-4 transition-colors">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-xs font-semibold font-sans text-[var(--ink)]">
              Raw Source Communication
            </label>
            <span className="block text-[11px] text-[var(--ink-muted)]">
              Paste email threads, chat transcripts, or client scope notes below.
            </span>
          </div>
          <div className="text-[11px] font-mono text-[var(--ink-subtle)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-full">
            {sourceText.length} chars • {sourceText.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.md,.markdown,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Document Ingestion Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all p-4.5 sm:p-5 text-center cursor-pointer ${
            isDragging
              ? "border-[var(--forest)] bg-[var(--forest-light)]/70 ring-2 ring-[var(--forest)]/20"
              : "border-black/[0.1] dark:border-white/[0.12] bg-[var(--surface-subtle)]/50 hover:border-[var(--forest)]/50 hover:bg-[var(--forest-light)]/20"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white shadow-2xs">
                {isUploadingFile ? (
                  <RefreshCwIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <UploadIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="font-semibold text-xs text-[var(--ink)] flex items-center gap-2">
                  <span>{isUploadingFile ? "Extracting Document Text..." : "Import Contract or Scope Document"}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white dark:bg-[#121614] border border-black/[0.08] dark:border-white/[0.1] text-[var(--ink-muted)] font-medium">
                    PDF • DOCX • MD • TXT
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  {isUploadingFile
                    ? "Parsing and converting to verified source text..."
                    : "Drag and drop your file here, or click to browse. Text is parsed cleanly for commitment extraction."}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isUploadingFile}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#181E1A] border border-black/[0.08] dark:border-white/[0.12] text-[var(--ink)] shadow-2xs hover:border-[var(--forest)] hover:text-[var(--forest)] transition-all shrink-0 cursor-pointer"
            >
              <UploadIcon className="h-3.5 w-3.5" />
              <span>Choose File</span>
            </button>
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="rounded-2xl border border-[var(--coral-state)]/30 bg-[var(--coral-bg)] p-3 text-xs flex items-center justify-between gap-2 text-[var(--coral-state)]">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-[11px] underline hover:opacity-80 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Uploaded Document Info Bar */}
        {uploadedFile && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--forest-light)]/80 border border-[var(--forest)]/30 text-xs shadow-2xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--forest)] text-white">
                <FileTextIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-[var(--ink)] flex items-center gap-2">
                  <span>{uploadedFile.name}</span>
                  <span className="font-mono text-[10px] text-[var(--forest)] bg-white dark:bg-[#121614] px-2 py-0.5 rounded-full border border-[var(--forest)]/20 font-bold">
                    {uploadedFile.wordCount.toLocaleString()} words • {(uploadedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="text-[11px] text-[var(--forest)] font-medium">
                  Active source document loaded into editor below.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadedFile(null);
                setSourceText(AURA_PRESET_1_TEXT);
                setTestQuote(AURA_PRESET_1_QUOTE);
                setSnapshotSession(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-muted)] hover:text-[var(--coral-state)] px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <XIcon className="h-3.5 w-3.5" />
              <span>Clear File</span>
            </button>
          </div>
        )}

        {/* Scenario Selection Grid */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
            <span className="font-semibold text-[var(--ink)]">
              Choose a Real-World Client Scenario (or paste custom text below):
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              Click to load realistic client correspondence
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Scenario 1 */}
            <button
              type="button"
              onClick={() => {
                setSourceText(AURA_PRESET_1_TEXT);
                setTestQuote(AURA_PRESET_1_QUOTE);
                setSnapshotSession(null);
                setExtractionError(null);
                setLastAddedItem(null);
                setUploadedFile(null);
                setUploadError(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                sourceText === AURA_PRESET_1_TEXT
                  ? "border-[var(--forest)] bg-[var(--forest-light)]/60 shadow-sm ring-1 ring-[var(--forest)]"
                  : "border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 hover:border-[var(--forest)]/40 hover:bg-white dark:hover:bg-[#121614]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-[var(--forest)] uppercase tracking-wider">
                  <span>Scope Addition</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-[var(--forest)] bg-[var(--forest-light)] px-1.5 py-0.5 rounded-full">+$650</span>
              </div>
              <div className="font-sans text-xs font-bold text-[var(--ink)]">
                Mobile Nav Drawer
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                Elena agrees to $650 addition for slide-out mobile menu.
              </p>
            </button>

            {/* Scenario 2 */}
            <button
              type="button"
              onClick={() => {
                setSourceText(AURA_PRESET_2_TEXT);
                setTestQuote(AURA_PRESET_2_QUOTE);
                setSnapshotSession(null);
                setExtractionError(null);
                setLastAddedItem(null);
                setUploadedFile(null);
                setUploadError(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                sourceText === AURA_PRESET_2_TEXT
                  ? "border-[var(--amber-state)] bg-[var(--amber-bg)] shadow-sm ring-1 ring-[var(--amber-state)]"
                  : "border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 hover:border-[var(--amber-state)]/50 hover:bg-white dark:hover:bg-[#121614]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-[var(--amber-state)] uppercase tracking-wider">
                  <span>Scope Drift</span>
                </span>
                <span className="font-mono text-[10px] font-semibold text-[var(--amber-state)] bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">Unapproved</span>
              </div>
              <div className="font-sans text-xs font-bold text-[var(--ink)]">
                3D Product Viewer
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                Greg requests a major 3D module right before launch without pricing.
              </p>
            </button>

            {/* Scenario 3 */}
            <button
              type="button"
              onClick={() => {
                setSourceText(AURA_PRESET_3_TEXT);
                setTestQuote(AURA_PRESET_3_QUOTE);
                setSnapshotSession(null);
                setExtractionError(null);
                setLastAddedItem(null);
                setUploadedFile(null);
                setUploadError(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                sourceText === AURA_PRESET_3_TEXT
                  ? "border-[var(--coral-state)] bg-[var(--coral-bg)] shadow-sm ring-1 ring-[var(--coral-state)]"
                  : "border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 hover:border-[var(--coral-state)]/50 hover:bg-white dark:hover:bg-[#121614]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-[var(--coral-state)] uppercase tracking-wider">
                  <span>Rate Conflict</span>
                </span>
                <span className="font-mono text-[10px] font-semibold text-[var(--coral-state)] bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 rounded-full">$100 vs $150</span>
              </div>
              <div className="font-sans text-xs font-bold text-[var(--ink)]">
                Weekend SLA Maintenance
              </div>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                Client counters $100/hr in Slack against $150 standard rate.
              </p>
            </button>
          </div>
        </div>

        <textarea
          rows={8}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)]/90 p-4 font-mono text-xs text-[var(--ink)] focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/20 focus:outline-hidden transition-all shadow-inner"
          placeholder="Paste raw email, Slack transcript, or contract text..."
        />

        {/* Action Bar for Live Extraction */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald-state)] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--emerald-state)]"></span>
            </span>
            <span className="font-semibold text-[var(--ink)]">
              Backend Ready:
            </span>
            <span className="font-mono text-[11px] text-[var(--forest)] bg-[var(--forest-light)] px-2.5 py-0.5 rounded-full border border-[var(--forest)]/20">
              nvidia/Nemotron-3_5-Lightning
            </span>
          </div>

          <button
            type="button"
            onClick={handleRunLiveExtraction}
            disabled={isExtracting || sourceText.trim().length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#1B3F2E] px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-[var(--forest)]/20 transition-all hover:shadow-lg hover:shadow-[var(--forest)]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExtracting ? (
              <>
                <RefreshCwIcon className="h-4 w-4 animate-spin" />
                <span>Extracting via Nebius Token Factory...</span>
              </>
            ) : (
              <>
                <span>Extract Commitments with Nebius</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Model Extraction Results Panel */}
      {isExtracting && (
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-6 sm:p-8 shadow-xl space-y-5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--forest)] opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--forest)]"></span>
              </span>
              <h3 className="font-serif text-base font-bold text-[var(--ink)]">
                Extracting Scope Commitments via Nebius Token Factory
              </h3>
            </div>
            <span className="font-mono text-xs text-[var(--forest)] font-semibold bg-[var(--forest-light)] px-3 py-1 rounded-full">
              nvidia/Nemotron-3_5-Lightning
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full bg-[var(--surface-subtle)] rounded-full overflow-hidden">
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-[var(--forest)]/20 via-[var(--forest)] to-[var(--forest)]/20 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 flex items-start gap-2.5">
              <CheckIcon className="h-4 w-4 text-[var(--emerald-state)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--ink)]">1. Prompt Sandboxing</span>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Source wrapped in untrusted tags</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--forest)]/30 bg-[var(--forest-light)]/80 p-3.5 flex items-start gap-2.5">
              <RefreshCwIcon className="h-4 w-4 text-[var(--forest)] animate-spin shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--forest)]">2. Inference & Parse</span>
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Strict JSON mode extraction</p>
              </div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 flex items-start gap-2.5 opacity-75">
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
        <div className="rounded-2xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-xs shadow-xs">
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
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-6 sm:p-8 shadow-xl space-y-5">
          {/* Divergence Notice when textarea changes after extraction */}
          {isDiverged && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs flex flex-wrap items-center justify-between gap-3 text-[var(--amber-state)] shadow-xs">
              <div className="flex items-start gap-2.5 max-w-xl">
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#121614] px-3 py-1.5 text-xs font-sans font-medium text-[var(--amber-state)] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCwIcon className="h-3 w-3" />
                <span>Rerun Extraction</span>
              </button>
            </div>
          )}

          {/* Summary Bar */}
          {lastAddedItem && (
            <div className="rounded-2xl border border-[var(--emerald-border)] bg-[var(--emerald-bg)] p-3.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs transition-all">
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
                  className="inline-flex items-center gap-1 rounded-xl bg-[var(--forest)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--forest-hover)] transition-all cursor-pointer"
                >
                  <span>View in Ledger</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[var(--ink)]">
                  Extraction Results
                </h3>
                <span className="inline-flex items-center rounded-full border border-[var(--emerald-border)]/60 bg-[var(--emerald-bg)] px-2.5 py-0.5 text-[10px] font-sans font-semibold text-[var(--forest)] shadow-2xs">
                  {extractionResult.verifiedQuoteCount} / {extractionResult.rawCandidateCount} Quotes Verified
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Model: <code>{extractionResult.model}</code> • Response in {extractionResult.durationMs}ms
              </p>
            </div>

            {extractionResult.rejectedQuoteCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--coral-border)] bg-[var(--coral-bg)] px-3 py-1 text-[11px] font-sans font-medium text-[var(--coral-state)]">
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
            <div className="space-y-4">
              {extractionResult.candidates.map((cand, idx) => {
                const TypeIcon = typeIcons[cand.commitmentType] || LayersIcon;
                const isAdded = addedCandidateIds.has(cand.id);

                return (
                  <div
                    key={cand.id}
                    className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/40 p-5 shadow-xs transition-all hover:border-[var(--forest)]/40 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-[var(--ink-subtle)]">#{idx + 1}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wide ${getStatusBadge(cand.suggestedStatus)}`}>
                          Suggested: {cand.suggestedStatus}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121614] px-2.5 py-0.5 text-[10px] font-sans text-[var(--ink-muted)] shadow-2xs">
                          <TypeIcon className="h-3 w-3 text-[var(--forest)]" />
                          <span>{cand.commitmentType.replace("_", " ")}</span>
                        </span>
                        <span className="inline-flex items-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121614] px-2.5 py-0.5 text-[10px] font-sans text-[var(--ink-muted)] shadow-2xs">
                          Act: {cand.speechAct}
                        </span>
                      </div>

                      {/* Explicit Human Ledger Addition Action */}
                      {onAddCandidateToLedger && (
                        <div className="flex flex-col items-end gap-1">
                          {isAdded ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-3 py-1 text-xs font-sans font-medium text-[var(--forest)] shadow-2xs">
                                <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)]" />
                                <span>Added to Ledger</span>
                              </span>
                              {onNavigateToLedger && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToLedger(cand.id)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#121614] px-2.5 py-1 text-xs font-sans font-semibold text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] transition-colors cursor-pointer shadow-2xs"
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
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-sans font-medium transition-all cursor-pointer shadow-2xs ${
                                cand.quoteVerified !== true
                                  ? "border-[var(--coral-border)] bg-[var(--coral-bg)] text-[var(--coral-state)] cursor-not-allowed opacity-75"
                                  : "border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#121614] text-[var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] hover:-translate-y-0.5"
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
                    <div className="font-sans text-xs font-semibold text-[var(--ink)] mb-2.5 leading-snug">
                      {cand.claim}
                    </div>

                    {/* Verbatim Evidence Quote Box */}
                    <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121614] p-3.5 space-y-2 text-xs shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-sans font-semibold uppercase text-[var(--ink-subtle)]">
                          Cited Evidence Quotation
                        </span>
                        {cand.quoteVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--emerald-bg)] border border-[var(--emerald-border)]/60 px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--emerald-state)]">
                            <ShieldCheckIcon className="h-3 w-3" />
                            <span>Mechanically Verified</span>
                            {cand.verificationDetails.verified && (
                              <span className="font-mono text-[9px] text-[var(--ink-subtle)]">
                                [{cand.verificationDetails.startIndex}:{cand.verificationDetails.endIndex}]
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--coral-bg)] border border-[var(--coral-border)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--coral-state)]">
                            <XCircleIcon className="h-3 w-3" />
                            <span>
                              Verification Failed ({cand.verificationDetails.verified ? "" : cand.verificationDetails.reason})
                            </span>
                          </span>
                        )}
                      </div>

                      <blockquote className="font-serif italic text-xs text-[var(--ink)] leading-relaxed border-l-2 border-[var(--forest)]/50 pl-3 py-0.5">
                        &ldquo;{cand.evidenceQuote}&rdquo;
                      </blockquote>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-subtle)] pt-1.5 border-t border-black/[0.04] dark:border-white/[0.06]">
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

          <div className="text-[10px] text-[var(--ink-subtle)] leading-relaxed border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
            {MECHANICAL_VERIFICATION_DISCLAIMER}
          </div>
        </div>
      )}

      {/* Secondary Standalone Tool: Manual Quote String Verifier */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-6 sm:p-7 shadow-lg space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[var(--ink)]">
              Direct Quote Substring Verifier
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Test any quotation directly against the source text above without making API requests.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="rounded-md border-black/[0.15] dark:border-white/[0.2] text-[var(--forest)] focus:ring-[var(--forest)]/20"
            />
            <span>Strict Exact Mode</span>
          </label>
        </div>

        <textarea
          rows={3}
          value={testQuote}
          onChange={(e) => setTestQuote(e.target.value)}
          className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)]/90 p-3.5 font-sans text-xs text-[var(--ink)] focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/20 focus:outline-hidden transition-all shadow-inner"
          placeholder="Enter quote excerpt to test..."
        />

        {manualResult.verified ? (
          <div className="rounded-2xl border border-[var(--emerald-border)] bg-[var(--emerald-bg)] p-4 text-xs shadow-xs">
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
          <div className="rounded-2xl border border-[var(--coral-border)] bg-[var(--coral-bg)] p-4 text-xs shadow-xs">
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
