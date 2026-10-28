"use client";

import React from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  LayersIcon,
  DollarSignIcon,
  ClockIcon,
  FileTextIcon,
  MessageSquareIcon,
} from "./icons";
import type { AgreementItem } from "@/lib/sample-data";
import type { CommitmentType } from "@/lib/schema";

interface RequestReviewProps {
  items: AgreementItem[];
  onSelectItem: (item: AgreementItem) => void;
  onConfirmItem: (id: string) => void;
  onDismissItem: (id: string) => void;
  onDraftForPending: () => void;
}

export function RequestReview({
  items,
  onSelectItem,
  onConfirmItem,
  onDismissItem,
  onDraftForPending,
}: RequestReviewProps) {
  const pendingItems = items.filter(
    (i) => i.status === "proposed" || i.status === "unclear"
  );
  const baselineItems = items.filter((i) => i.status === "baseline" || i.status === "confirmed");

  const typeIcons: Record<CommitmentType, React.ComponentType<{ className?: string }>> = {
    deliverables: LayersIcon,
    revision_limits: FileTextIcon,
    deadlines: ClockIcon,
    prices: DollarSignIcon,
  };

  const getBaselineForType = (type: CommitmentType): AgreementItem[] => {
    return baselineItems.filter((i) => i.commitmentType === type);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-transparent dark:from-amber-950/30 dark:via-amber-950/15 dark:to-transparent p-6 sm:p-7 shadow-md shadow-amber-900/[0.02] transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-white dark:bg-[#1C2018] text-[var(--amber-state)] shadow-xs">
              <AlertTriangleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
                Scope Drift & Request Review
              </h2>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-1 max-w-2xl">
                Receipts identified {pendingItems.length} unconfirmed scope change(s) in client communication. Compare against agreed baseline terms before confirming or quoting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDraftForPending}
            className="shrink-0 self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#153224] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[var(--forest)]/15 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <MessageSquareIcon className="h-3.5 w-3.5" />
            <span>Draft Clarification Email</span>
          </button>
        </div>
      </div>

      {/* Delta Comparison Cards */}
      {pendingItems.length === 0 ? (
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-10 text-center shadow-lg shadow-black/[0.02] transition-all">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--emerald-border)] bg-[var(--emerald-bg)] text-[var(--emerald-state)] shadow-xs">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3.5 font-serif text-base font-bold text-[var(--ink)]">
            All Scope Requests Aligned
          </h3>
          <p className="mt-1.5 text-xs text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
            There are no pending proposed changes or ambiguous terms. All active commitments match confirmed baseline agreements.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {pendingItems.map((item) => {
            const TypeIcon = typeIcons[item.commitmentType];
            const matchingBaselines = getBaselineForType(item.commitmentType);

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-md shadow-black/[0.02] overflow-hidden transition-all"
              >
                {/* Request Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] bg-[var(--surface-subtle)]/70 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121614] text-[var(--forest)] shadow-2xs">
                      <TypeIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-sans font-medium text-[var(--ink-muted)] capitalize">
                      {item.commitmentType.replace("_", " ")} Delta
                    </span>
                    <span className="rounded-full border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2.5 py-0.5 text-[10px] font-sans font-medium text-[var(--amber-state)] capitalize shadow-2xs">
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--ink-muted)]">
                    Requested by <strong className="text-[var(--ink)] font-medium">{item.speaker}</strong> ({item.timestamp})
                  </div>
                </div>

                {/* Side-by-side Delta Analysis */}
                <div className="grid grid-cols-1 divide-y divide-black/[0.04] dark:divide-white/[0.06] lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
                  {/* Left: Original Baseline */}
                  <div className="p-5 sm:p-6 bg-[var(--surface-subtle)]/40">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[var(--ink-muted)] mb-3">
                      <span>Agreed Baseline Scope</span>
                      <span className="rounded-full bg-[var(--emerald-bg)] px-2 py-0.5 text-[10px] text-[var(--emerald-state)] font-semibold border border-[var(--emerald-border)]/50">Contract Record</span>
                    </div>

                    {matchingBaselines.length > 0 ? (
                      <div className="space-y-3">
                        {matchingBaselines.map((baseline) => (
                          <div
                            key={baseline.id}
                            className="rounded-2xl border border-[var(--emerald-border)]/40 bg-white dark:bg-[#141815] p-3.5 shadow-2xs"
                          >
                            <p className="text-xs font-semibold text-[var(--ink)] leading-snug">
                              {baseline.claim}
                            </p>
                            <p className="mt-1.5 font-serif italic text-xs text-[var(--ink-muted)] leading-relaxed">
                              &ldquo;{baseline.evidenceQuote}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[var(--ink-subtle)] py-4">
                        No previous baseline commitment documented for this category.
                      </p>
                    )}
                  </div>

                  {/* Right: New Proposed Scope */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[var(--amber-state)] mb-3">
                      <span>New Client Request / Alteration</span>
                      <span className="rounded-full bg-[var(--amber-bg)] px-2 py-0.5 text-[10px] font-semibold border border-[var(--amber-border)]/50">Requires Alignment</span>
                    </div>

                    <div className="rounded-2xl border border-[var(--amber-border)]/70 bg-[var(--amber-bg)]/40 p-4 shadow-2xs space-y-2.5">
                      <p className="text-xs font-semibold text-[var(--ink)] leading-snug">
                        {item.claim}
                      </p>
                      <blockquote className="rounded-xl border-l-3 border-[var(--amber-state)] bg-white/70 dark:bg-[#141815]/80 p-2.5 font-serif italic text-xs text-[var(--ink-muted)] leading-relaxed shadow-2xs">
                        &ldquo;{item.evidenceQuote}&rdquo;
                      </blockquote>
                      <p className="text-xs text-[var(--ink-muted)] border-t border-black/[0.04] dark:border-white/[0.06] pt-2">
                        <strong className="text-[var(--ink)] font-medium">Assessment:</strong> {item.explanation}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--forest)] hover:bg-[var(--surface-subtle)] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>View in Evidence Inspector</span>
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onConfirmItem(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--emerald-state)] hover:bg-[var(--emerald-state)] hover:text-white transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
                          title="Confirm into agreement ledger"
                        >
                          <CheckIcon className="h-3 w-3" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissItem(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--coral-border)] bg-white dark:bg-[#141815] px-3 py-1.5 text-xs font-semibold text-[var(--coral-state)] hover:bg-[var(--coral-bg)] transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
                          title="Dismiss scope addition"
                        >
                          <XIcon className="h-3 w-3" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
