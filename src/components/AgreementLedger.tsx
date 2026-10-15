"use client";

import React, { useState, useMemo } from "react";
import {
  SearchIcon,
  FilterIcon,
  ShieldCheckIcon,
  CheckIcon,
  XIcon,
  LayersIcon,
  DollarSignIcon,
  ClockIcon,
  FileTextIcon,
  ChevronRightIcon,
} from "./icons";
import type { AgreementItem } from "@/lib/sample-data";
import type { CommitmentType, ApplicationStatus } from "@/lib/schema";

interface AgreementLedgerProps {
  items: AgreementItem[];
  selectedItemId: string | null;
  onSelectItem: (item: AgreementItem) => void;
  onConfirmItem: (id: string) => void;
  onDismissItem: (id: string) => void;
  onRestoreItem: (id: string) => void;
}

export function AgreementLedger({
  items,
  selectedItemId,
  onSelectItem,
  onConfirmItem,
  onDismissItem,
  onRestoreItem,
}: AgreementLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CommitmentType | "all">("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.evidenceQuote.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.speaker.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesType = typeFilter === "all" || item.commitmentType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, searchQuery, statusFilter, typeFilter]);

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
          <span className="inline-flex items-center gap-1.5 border border-[#244D3A]/25 bg-[#EBF3EE] px-2 py-0.5 text-xs font-sans font-medium text-[#244D3A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#244D3A]" />
            Baseline
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[#2E7D5B]/30 bg-[#EBF5F0] px-2 py-0.5 text-xs font-sans font-medium text-[#2E7D5B]">
            <CheckIcon className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "proposed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[#E8CA97] bg-[#FAF3E8] px-2 py-0.5 text-xs font-sans font-medium text-[#9A6518]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C58A36]" />
            Proposed
          </span>
        );
      case "unclear":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[#E8CA97] bg-[#FAF3E8] px-2 py-0.5 text-xs font-sans font-medium text-[#9A6518]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C58A36]" />
            Unclear
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[#EAB2A9] bg-[#FAEEEC] px-2 py-0.5 text-xs font-sans font-medium text-[#B04130]">
            <XIcon className="h-3 w-3" />
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="border border-[#20251F]/10 bg-white shadow-xs">
      {/* Table Header & Controls */}
      <div className="border-b border-[#20251F]/10 bg-[#F6F5F0]/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#20251F]">
              Agreement Ledger
            </h2>
            <p className="text-xs text-[#576356] mt-0.5">
              Canonical commitments of record, scope revisions, and pending terms verified against raw client logs.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#889386]" />
            <input
              type="text"
              placeholder="Search claims or quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#20251F]/15 bg-white py-1.5 pl-8 pr-3 text-xs text-[#20251F] placeholder:text-[#889386] focus:border-[#244D3A] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filter Row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#20251F]/8">
          <div className="flex items-center gap-1 text-xs font-medium text-[#576356] mr-1">
            <FilterIcon className="h-3 w-3 text-[#889386]" />
            <span>Status:</span>
          </div>
          {(["all", "baseline", "confirmed", "proposed", "unclear", "dismissed"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs capitalize transition-all ${
                  statusFilter === status
                    ? "border border-[#20251F] bg-[#20251F] font-medium text-white shadow-xs"
                    : "border border-[#20251F]/15 bg-white text-[#576356] hover:border-[#20251F]/30 hover:bg-[#F6F5F0]"
                }`}
              >
                {status}
              </button>
            )
          )}

          <div className="mx-2 hidden h-4 w-px bg-[#20251F]/15 sm:block" />

          <div className="flex items-center gap-1 text-xs font-medium text-[#576356] mr-1">
            <span>Type:</span>
          </div>
          {(["all", "deliverables", "prices", "deadlines", "revision_limits"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs capitalize transition-all ${
                typeFilter === type
                  ? "border border-[#244D3A] bg-[#244D3A] font-medium text-white shadow-xs"
                  : "border border-[#20251F]/15 bg-white text-[#576356] hover:border-[#20251F]/30 hover:bg-[#F6F5F0]"
              }`}
            >
              {type === "revision_limits" ? "Revisions" : type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Ledger Table with Sticky Review Controls */}
      <div className="overflow-x-auto relative table-scroll-container">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#20251F]/10 bg-[#E7EEE8]/60 text-xs font-semibold font-sans text-[#576356]">
              <th className="py-3 pl-4 pr-3 min-w-[210px]">Commitment & Scope</th>
              <th className="px-3 py-3 w-24 min-w-[85px] whitespace-nowrap">Type</th>
              <th className="px-3 py-3 w-24 min-w-[85px] whitespace-nowrap">Status</th>
              <th className="px-3 py-3 min-w-[190px]">Verbatim Quotation & Source</th>
              <th className="sticky right-0 z-20 bg-[#E7EEE8] py-3 pl-2.5 pr-4 text-right w-[124px] min-w-[124px] whitespace-nowrap border-l border-[#20251F]/10 shadow-[-4px_0_8px_-2px_rgba(32,37,31,0.06)]">
                Review Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#20251F]/8">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#576356]">
                  No commitments match your current filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                const TypeIcon = typeIcons[item.commitmentType];
                const isPending = item.status === "proposed" || item.status === "unclear";

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`group/row cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#F3F6F3] border-l-2 border-[#244D3A]"
                        : "hover:bg-[#F9F8F5]"
                    }`}
                  >
                    {/* Commitment Claim & Explanation */}
                    <td className="py-3.5 pl-4 pr-3 align-top min-w-[210px]">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-xs ${
                            item.status === "baseline" || item.status === "confirmed"
                              ? "bg-[#2E7D5B]"
                              : item.status === "proposed" || item.status === "unclear"
                              ? "bg-[#C58A36]"
                              : "bg-[#C95C4B]"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#20251F] leading-snug">
                            {item.claim}
                          </p>
                          <p className="mt-1 text-[11px] text-[#576356] leading-normal line-clamp-2">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Commitment Type */}
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-[#576356]">
                        <TypeIcon className="h-3.5 w-3.5 text-[#244D3A] shrink-0" />
                        <span className="capitalize">
                          {item.commitmentType === "revision_limits" ? "Revisions" : item.commitmentType.replace("_", " ")}
                        </span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Evidence Quote & Attribution Combined */}
                    <td className="px-3 py-3.5 align-top min-w-[190px]">
                      <div>
                        <blockquote className="font-serif italic text-xs text-[#3D473C] leading-relaxed line-clamp-2">
                          “{item.evidenceQuote}”
                        </blockquote>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#889386] font-mono">
                          <span className="font-medium text-[#576356]">{item.speaker}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sticky Review Action Column - Always Visible and Usable */}
                    <td
                      className={`sticky right-0 z-10 py-3.5 pl-2.5 pr-4 align-top text-right w-[124px] min-w-[124px] whitespace-nowrap border-l border-[#20251F]/8 shadow-[-4px_0_8px_-2px_rgba(32,37,31,0.06)] transition-colors ${
                        isSelected ? "bg-[#F3F6F3]" : "bg-white group-hover/row:bg-[#F9F8F5]"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => onConfirmItem(item.id)}
                              className="inline-flex items-center gap-1 border border-[#2E7D5B]/50 bg-[#EBF5F0] px-2 py-1 text-xs font-medium text-[#2E7D5B] hover:bg-[#2E7D5B] hover:text-white transition-colors"
                              title="Human confirmation: Promote to confirmed agreement"
                            >
                              <CheckIcon className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDismissItem(item.id)}
                              className="inline-flex items-center gap-1 border border-[#C95C4B]/40 bg-white px-2 py-1 text-xs font-medium text-[#C95C4B] hover:bg-[#FAEEEC] transition-colors"
                              title="Dismiss from active ledger"
                            >
                              <XIcon className="h-3 w-3" />
                              <span>Dismiss</span>
                            </button>
                          </>
                        )}

                        {item.status === "dismissed" && (
                          <button
                            type="button"
                            onClick={() => onRestoreItem(item.id)}
                            className="inline-flex items-center gap-1 border border-[#20251F]/20 bg-white px-2 py-0.5 text-xs text-[#20251F] hover:bg-[#F6F5F0]"
                          >
                            <span>Restore</span>
                          </button>
                        )}

                        {!isPending && item.status !== "dismissed" && (
                          <span className="text-[11px] text-[#889386] font-sans mr-1">
                            {item.status === "confirmed" ? "Confirmed" : "Baseline"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectItem(item)}
                          className="p-1 text-[#889386] hover:text-[#20251F]"
                          title="Inspect verbatim evidence in source conversation"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Legend */}
      <div className="flex flex-wrap items-center justify-between border-t border-[#20251F]/10 bg-[#F6F5F0]/70 px-4 py-2.5 text-xs text-[#576356]">
        <div className="flex items-center gap-3">
          <span>Showing {filteredItems.length} of {items.length} records</span>
          <span className="hidden sm:inline text-[#889386]">•</span>
          <span className="hidden sm:inline text-[#889386]">Click any row to open the Evidence Inspector</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-[#244D3A]" />
          <span>Human-confirmed updates only</span>
        </div>
      </div>
    </div>
  );
}
