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
      <div className="border border-[#E8CA97] bg-[#FAF3E8]/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#C58A36]/40 bg-white text-[#9A6518]">
              <AlertTriangleIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#20251F]">
                Scope Drift & Request Review
              </h2>
              <p className="text-xs text-[#576356] leading-relaxed mt-0.5">
                Receipts identified {pendingItems.length} unconfirmed scope change(s) in client communication. Compare against agreed baseline terms before confirming or quoting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDraftForPending}
            className="brutal-btn-primary shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <MessageSquareIcon className="h-3.5 w-3.5" />
            <span>Draft Clarification Email</span>
          </button>
        </div>
      </div>

      {/* Delta Comparison Cards */}
      {pendingItems.length === 0 ? (
        <div className="border border-[#20251F]/10 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[#2E7D5B]/20 bg-[#EBF5F0] text-[#2E7D5B]">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-serif text-base font-bold text-[#20251F]">
            All Scope Requests Aligned
          </h3>
          <p className="mt-1 text-xs text-[#576356] max-w-sm mx-auto leading-relaxed">
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
                className="border border-[#20251F]/10 bg-white shadow-xs"
              >
                {/* Request Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#20251F]/10 bg-[#F6F5F0]/70 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center border border-[#20251F]/15 bg-white text-[#244D3A]">
                      <TypeIcon className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-sans font-medium text-[#576356] capitalize">
                      {item.commitmentType.replace("_", " ")} Delta
                    </span>
                    <span className="border border-[#E8CA97] bg-[#FAF3E8] px-2 py-0.5 text-xs font-sans font-medium text-[#9A6518] capitalize">
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#576356]">
                    Requested by <strong className="text-[#20251F] font-medium">{item.speaker}</strong> ({item.timestamp})
                  </div>
                </div>

                {/* Side-by-side Delta Analysis */}
                <div className="grid grid-cols-1 divide-y divide-[#20251F]/10 lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
                  {/* Left: Original Baseline */}
                  <div className="p-4 sm:p-5 bg-[#F6F5F0]/25">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[#576356] mb-2">
                      <span>Agreed Baseline Scope</span>
                      <span className="text-[#2E7D5B] font-medium">Contract Record</span>
                    </div>

                    {matchingBaselines.length > 0 ? (
                      <div className="space-y-2.5">
                        {matchingBaselines.map((baseline) => (
                          <div
                            key={baseline.id}
                            className="border border-[#2E7D5B]/25 bg-white p-3"
                          >
                            <p className="text-xs font-semibold text-[#20251F] leading-snug">
                              {baseline.claim}
                            </p>
                            <p className="mt-1 font-serif italic text-xs text-[#576356] leading-relaxed">
                              “{baseline.evidenceQuote}”
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-[#889386] py-3">
                        No previous baseline commitment documented for this category.
                      </p>
                    )}
                  </div>

                  {/* Right: New Proposed Scope */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs font-sans font-medium text-[#9A6518] mb-2">
                      <span>New Client Request / Alteration</span>
                      <span className="font-medium">Requires Alignment</span>
                    </div>

                    <div className="border border-[#E8CA97] bg-[#FAF3E8]/50 p-3">
                      <p className="text-xs font-semibold text-[#20251F] leading-snug">
                        {item.claim}
                      </p>
                      <blockquote className="mt-1.5 border-l-2 border-[#C58A36] pl-2.5 font-serif italic text-xs text-[#576356] leading-relaxed">
                        “{item.evidenceQuote}”
                      </blockquote>
                      <p className="mt-2 text-xs text-[#576356] border-t border-[#20251F]/8 pt-1.5">
                        <strong className="text-[#20251F] font-medium">Assessment:</strong> {item.explanation}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#20251F]/8">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className="text-xs font-medium text-[#244D3A] hover:underline flex items-center gap-1"
                      >
                        <span>View in Evidence Inspector</span>
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onConfirmItem(item.id)}
                          className="inline-flex items-center gap-1 border border-[#2E7D5B]/40 bg-[#EBF5F0] px-2.5 py-1 text-xs font-medium text-[#2E7D5B] hover:bg-[#2E7D5B] hover:text-white transition-colors"
                          title="Confirm into agreement ledger"
                        >
                          <CheckIcon className="h-3 w-3" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissItem(item.id)}
                          className="inline-flex items-center gap-1 border border-[#C95C4B]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#C95C4B] hover:bg-[#FAEEEC] transition-colors"
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
