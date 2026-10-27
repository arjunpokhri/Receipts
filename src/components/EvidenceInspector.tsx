"use client";

import React, { useMemo } from "react";
import {
  ShieldCheckIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
  LayersIcon,
  FileTextIcon,
  ClockIcon,
  DollarSignIcon,
  ChevronRightIcon,
} from "./icons";
import type { AgreementItem, ConversationThread } from "@/lib/sample-data";
import type { CommitmentType, ApplicationStatus } from "@/lib/schema";
import { verifyEvidence } from "@/lib/verifier";
import { resolveItemSource, type ResolvedItemSource } from "@/lib/source-resolver";
import { MECHANICAL_VERIFICATION_DISCLAIMER } from "@/lib/evaluate-extraction";

interface EvidenceInspectorProps {
  item: AgreementItem | null;
  allItems?: AgreementItem[];
  onSelectItem?: (item: AgreementItem) => void;
  threads: ConversationThread[];
  onClose: () => void;
  onConfirmItem: (id: string) => void;
  onDismissItem: (id: string) => void;
}

export function EvidenceInspector({
  item,
  allItems = [],
  onSelectItem,
  threads,
  onClose,
  onConfirmItem,
  onDismissItem,
}: EvidenceInspectorProps) {
  const source: ResolvedItemSource | null = useMemo(() => {
    if (!item) return null;
    return resolveItemSource(item, threads) || null;
  }, [item, threads]);

  const verification = useMemo(() => {
    if (!item || !source) return null;
    return verifyEvidence(source.sourceText, item.evidenceQuote);
  }, [item, source]);

  const typeIcons: Record<CommitmentType, React.ComponentType<{ className?: string }>> = {
    deliverables: LayersIcon,
    revision_limits: FileTextIcon,
    deadlines: ClockIcon,
    prices: DollarSignIcon,
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "baseline":
        return (
          <span className="inline-flex items-center gap-1 border border-[var(--forest)]/25 bg-[var(--forest-light)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--forest)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
            Baseline
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--emerald-state)]">
            <CheckIcon className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "proposed":
        return (
          <span className="inline-flex items-center gap-1 border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Proposed
          </span>
        );
      case "unclear":
        return (
          <span className="inline-flex items-center gap-1 border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Unclear
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 border border-[var(--coral-border)] bg-[var(--coral-bg)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--coral-state)]">
            <XIcon className="h-3 w-3" />
            Dismissed
          </span>
        );
    }
  };

  if (!item || !source) {
    return (
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-6 shadow-xs space-y-4 transition-colors">
        <div className="text-center py-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-serif text-lg font-bold text-[var(--ink)]">
            Evidence Inspector
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
            Select any agreement or scope commitment below to inspect its verbatim quotation and exact character-span verification against the source communication logs.
          </p>
        </div>

        {allItems.length > 0 && onSelectItem && (
          <div className="border border-[var(--surface-border)] divide-y divide-[var(--surface-border)]">
            <div className="bg-[var(--surface-subtle)] px-4 py-2 text-xs font-semibold text-[var(--ink)]">
              Available Project Commitments ({allItems.length})
            </div>
            {allItems.map((ledgerItem) => {
              const TypeIcon = typeIcons[ledgerItem.commitmentType] || LayersIcon;
              return (
                <button
                  key={ledgerItem.id}
                  type="button"
                  onClick={() => onSelectItem(ledgerItem)}
                  className="w-full p-3.5 text-left hover:bg-[var(--surface-subtle)] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(ledgerItem.status)}
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                        <TypeIcon className="h-3 w-3 text-[var(--forest)]" />
                        <span>{ledgerItem.commitmentType.replace("_", " ")}</span>
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors truncate">
                      {ledgerItem.claim}
                    </div>
                    <div className="text-[11px] font-serif italic text-[var(--ink-muted)] truncate">
                      &ldquo;{ledgerItem.evidenceQuote}&rdquo;
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-[var(--ink-subtle)] group-hover:text-[var(--ink)] shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render raw conversation text with highlighted quotation
  const renderHighlightedConversation = () => {
    const raw = source.sourceText;
    if (!verification || !verification.verified) {
      return <pre className="font-mono text-xs text-[var(--ink)] whitespace-pre-wrap">{raw}</pre>;
    }

    const { startIndex, endIndex } = verification;
    const before = raw.slice(0, startIndex);
    const match = raw.slice(startIndex, endIndex);
    const after = raw.slice(endIndex);

    return (
      <pre className="font-mono text-xs text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
        <span>{before}</span>
        <mark className="border-b border-[var(--forest)] bg-[#D2E7DC] dark:bg-[#1C3E2D] px-1 py-0.5 font-medium text-[#193629] dark:text-[#A3E5C3]">
          {match}
        </mark>
        <span>{after}</span>
      </pre>
    );
  };

  const isPending = item.status === "proposed" || item.status === "unclear";

  return (
    <div className="relative flex flex-col border border-[var(--surface-border)] bg-[var(--paper-card)] p-5 shadow-xs transition-colors">
      {/* Inspector Topbar */}
      <div className="flex items-start justify-between border-b border-[var(--surface-border)] pb-3 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold font-sans text-[var(--ink-muted)]">
              Evidence Inspector
            </span>
            <span className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-1.5 py-0.2 text-[10px] font-mono text-[var(--ink-subtle)]">
              {item.id}
            </span>
            {getStatusBadge(item.status)}
          </div>
          <h2 className="mt-1 font-serif text-base sm:text-lg font-bold text-[var(--ink)] leading-snug">
            {item.claim}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-1.5 text-[var(--ink-muted)] hover:bg-[var(--paper-card)] hover:text-[var(--ink)] transition-colors shrink-0 cursor-pointer"
          title="Close inspector"
          aria-label="Close inspector"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Switch Item Selector if multiple items available */}
      {allItems.length > 1 && onSelectItem && (
        <div className="mt-3 flex items-center justify-between gap-2 border-b border-[var(--surface-border)] pb-2 text-xs">
          <span className="text-[11px] text-[var(--ink-muted)]">Switch inspected item:</span>
          <select
            value={item.id}
            onChange={(e) => {
              const next = allItems.find((i) => i.id === e.target.value);
              if (next) onSelectItem(next);
            }}
            className="border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-2 py-1 text-xs text-[var(--ink)] focus:border-[var(--forest)] focus:outline-hidden max-w-xs truncate cursor-pointer"
          >
            {allItems.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.status.toUpperCase()}] {i.claim.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Verification Diagnostic Status Box */}
      <div className="mt-3">
        {verification?.verified ? (
          <div className="border border-[var(--emerald-border)] bg-[var(--emerald-bg)] p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--emerald-state)]">
                <ShieldCheckIcon className="h-4 w-4 text-[var(--emerald-state)]" />
                <span>
                  Mechanically Verified ({verification.exactMatch ? "Exact Substring Match" : "Normalized Whitespace Match"})
                </span>
              </div>
              <span className="font-mono text-[10px] text-[var(--emerald-state)]">
                Span: [{verification.startIndex} : {verification.endIndex}]
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              Quotation confirmed verbatim in source transcript. Matched length: {verification.matchedText.length} characters.
            </p>
          </div>
        ) : (
          <div className="border border-[var(--coral-border)] bg-[var(--coral-bg)] p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--coral-state)]">
              <XCircleIcon className="h-4 w-4 text-[var(--coral-state)]" />
              <span>Verification Failed: {verification?.reason}</span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
              {verification?.message}
            </p>
          </div>
        )}
      </div>

      {/* Quotation Excerpt Card */}
      <div className="mt-3 border border-[var(--surface-border)] border-l-3 border-l-[var(--forest)] bg-[var(--surface-subtle)] p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-sans text-[var(--ink-subtle)]">
          <span className="font-semibold text-[var(--ink-muted)] uppercase text-[10px] tracking-wider">
            Cited Evidence Quotation
          </span>
          <span>Source: {source.channel}</span>
        </div>
        <blockquote className="font-serif italic text-xs sm:text-sm text-[var(--ink)] leading-relaxed">
          &ldquo;{item.evidenceQuote}&rdquo;
        </blockquote>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)] border-t border-[var(--surface-border)] pt-2">
          <span>Speaker: <strong className="text-[var(--ink)] font-semibold">{item.speaker}</strong></span>
          <span className="font-mono text-[10px] text-[var(--ink-subtle)]">{item.timestamp}</span>
        </div>
      </div>

      {/* Source Conversation Context Viewer */}
      <div className="mt-3 flex-1">
        <div className="flex items-center justify-between text-xs font-sans text-[var(--ink-muted)] mb-1.5">
          <span className="font-medium text-[var(--ink)]">Source Document: {source.title}</span>
          <span className="text-[10px] text-[var(--ink-subtle)] font-mono">raw correspondence log</span>
        </div>
        <div className="max-h-60 overflow-y-auto border border-[var(--surface-border)] bg-[var(--paper-card)] p-3.5">
          {renderHighlightedConversation()}
        </div>
      </div>

      {/* Methodological Non-Equivalence Notice */}
      <div className="mt-3 border-t border-[var(--surface-border)] pt-2.5">
        <p className="text-[10px] leading-relaxed text-[var(--ink-subtle)]">
          <strong className="text-[var(--ink-muted)] font-medium">Verification Grounding Notice:</strong> {MECHANICAL_VERIFICATION_DISCLAIMER}
        </p>
      </div>

      {/* Human Action Controls */}
      {isPending && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--surface-border)] pt-3">
          <span className="text-xs text-[var(--ink-muted)] mr-auto">
            Human review required for scope addition:
          </span>
          <button
            type="button"
            onClick={() => onDismissItem(item.id)}
            className="brutal-btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--coral-state)] cursor-pointer"
          >
            <XIcon className="h-3.5 w-3.5" />
            <span>Dismiss Request</span>
          </button>
          <button
            type="button"
            onClick={() => onConfirmItem(item.id)}
            className="brutal-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs cursor-pointer"
          >
            <CheckIcon className="h-3.5 w-3.5 text-white" />
            <span>Confirm into Ledger</span>
          </button>
        </div>
      )}
    </div>
  );
}
