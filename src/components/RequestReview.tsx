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
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="border border-[var(--amber-border)] bg-[var(--amber-bg)]/80 p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--amber-border)] bg-[var(--paper-card)] text-[var(--amber-state)]">
              <AlertTriangleIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
                Scope Drift & Request Review
              </h2>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-0.5">
                Receipts identified {pendingItems.length} unconfirmed scope change(s) in client communication. Compare against agreed baseline terms before confirming or quoting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDraftForPending}
            className="brutal-btn-primary shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer"
          >
            <MessageSquareIcon className="h-3.5 w-3.5" />
            <span>Draft Clarification Email</span>
          </button>
        </div>
      </div>

      {/* Delta Comparison Cards */}
      {pendingItems.length === 0 ? (
        <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-10 text-center shadow-xs transition-colors">
          <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[var(--emerald-border)] bg-[var(--emerald-bg)] text-[var(--emerald-state)]">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-serif text-base font-bold text-[var(--ink)]">
            All Scope Requests Aligned
          </h3>
          <p className="mt-1 text-xs text-[var(--ink-muted)] max-w-sm mx-auto leading-relaxed">
            There are no pending proposed changes or ambiguous terms. All active commitments match confirmed baseline agreements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.map((item) => {
            const TypeIcon = typeIcons[item.commitmentType];
            const matchingBaselines = getBaselineForType(item.commitmentType);

            return (
              <div
                key={item.id}
                className="border border-[var(--surface-border)] bg-[var(--paper-card)] shadow-xs transition-colors"
              >
                {/* Request Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center border border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--forest)]">
                      <TypeIcon className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-sans font-medium text-[var(--ink-muted)] capitalize">
                      {item.commitmentType.replace("_", " ")} Delta
                    </span>
                    <span className="border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--amber-state)] capitalize">
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--ink-muted)]">
                    Requested by <strong className="text-[var(--ink)] font-medium">{item.speaker}</strong> ({item.timestamp})
                  </div>
                </div>

                {/* Side-by-side Delta Analysis */}
                <div className="grid grid-cols-1 divide-y divide-[var(--surface-border)] lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
                  {/* Left: Original Baseline */}
                  <div className="p-4 sm:p-5 bg-[var(--surface-subtle)]/40">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[var(--ink-muted)] mb-2">
                      <span>Agreed Baseline Scope</span>
                      <span className="text-[var(--emerald-state)] font-medium">Contract Record</span>
                    </div>

                    {matchingBaselines.length > 0 ? (
                      <div className="space-y-2.5">
                        {matchingBaselines.map((baseline) => (
                          <div
                            key={baseline.id}
                            className="border border-[var(--emerald-border)]/50 bg-[var(--paper-card)] p-3"
                          >
                            <p className="text-xs font-semibold text-[var(--ink)] leading-snug">
                              {baseline.claim}
                            </p>
                            <p className="mt-1 font-serif italic text-xs text-[var(--ink-muted)] leading-relaxed">
                              “{baseline.evidenceQuote}”
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[var(--ink-subtle)] py-3">
                        No previous baseline commitment documented for this category.
                      </p>
                    )}
                  </div>

                  {/* Right: New Proposed Scope */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[var(--amber-state)] mb-2">
                      <span>New Client Request / Alteration</span>
                      <span className="font-medium">Requires Alignment</span>
                    </div>

                    <div className="border border-[var(--amber-border)] bg-[var(--amber-bg)]/50 p-3">
                      <p className="text-xs font-semibold text-[var(--ink)] leading-snug">
                        {item.claim}
                      </p>
                      <blockquote className="mt-1.5 border-l-2 border-[var(--amber-state)] pl-2.5 font-serif italic text-xs text-[var(--ink-muted)] leading-relaxed">
                        “{item.evidenceQuote}”
                      </blockquote>
                      <p className="mt-2 text-xs text-[var(--ink-muted)] border-t border-[var(--surface-border)] pt-1.5">
                        <strong className="text-[var(--ink)] font-medium">Assessment:</strong> {item.explanation}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--surface-border)]">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="text-xs font-semibold text-[var(--forest)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View in Evidence Inspector</span>
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onConfirmItem(item.id)}
                          className="inline-flex items-center gap-1 border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--emerald-state)] hover:bg-[var(--emerald-state)] hover:text-white transition-all cursor-pointer shadow-xs active:translate-x-0.5 active:translate-y-0.5"
                          title="Confirm into agreement ledger"
                        >
                          <CheckIcon className="h-3 w-3" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissItem(item.id)}
                          className="inline-flex items-center gap-1 border border-[var(--coral-border)] bg-[var(--paper-card)] px-2.5 py-1 text-xs font-semibold text-[var(--coral-state)] hover:bg-[var(--coral-bg)] transition-all cursor-pointer shadow-xs active:translate-x-0.5 active:translate-y-0.5"
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
