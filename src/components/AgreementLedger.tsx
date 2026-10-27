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
  SparklesIcon,
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
  onOpenExtractor?: () => void;
}

export function AgreementLedger({
  items,
  selectedItemId,
  onSelectItem,
  onConfirmItem,
  onDismissItem,
  onRestoreItem,
  onOpenExtractor,
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
          <span className="inline-flex items-center gap-1.5 border border-[var(--forest)]/30 bg-[var(--forest-light)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--forest)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
            Baseline
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--emerald-state)]">
            <CheckIcon className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "proposed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Proposed
          </span>
        );
      case "unclear":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Unclear
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1.5 border border-[var(--coral-border)] bg-[var(--coral-bg)] px-2 py-0.5 text-xs font-sans font-medium text-[var(--coral-state)]">
            <XIcon className="h-3 w-3" />
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] shadow-xs transition-colors">
      {/* Table Header & Controls */}
      <div className="border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] p-4 sm:p-5 transition-colors">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
              Agreement Ledger
            </h2>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Canonical commitments of record, scope revisions, and pending terms verified against raw client logs.
            </p>
          </div>

          {/* Actions & Search Box */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenExtractor && (
              <button
                type="button"
                onClick={onOpenExtractor}
                className="inline-flex items-center gap-1.5 border border-[var(--ink)] bg-[var(--paper-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-[1px_1px_0px_var(--ink)] hover:border-[var(--forest)] hover:bg-[var(--forest-light)] active:translate-x-0.5 active:translate-y-0.5 shrink-0 cursor-pointer transition-colors"
                title="Extract commitments from new client communication"
              >
                <SparklesIcon className="h-3.5 w-3.5 text-[var(--forest)]" />
                <span>Analyze Conversation</span>
              </button>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-56 shrink-0">
              <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-subtle)]" />
              <input
                type="text"
                placeholder="Search claims or quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[var(--surface-border)] bg-[var(--paper-card)] py-1.5 pl-8 pr-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--forest)] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2.5 border-t border-[var(--surface-border)]">
          <div className="flex items-center gap-1 text-xs font-medium text-[var(--ink-muted)] mr-1">
            <FilterIcon className="h-3 w-3 text-[var(--ink-subtle)]" />
            <span>Status:</span>
          </div>
          {(["all", "baseline", "confirmed", "proposed", "unclear", "dismissed"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? "border border-[var(--ink)] bg-[var(--ink)] font-medium text-[var(--paper)] shadow-xs"
                    : "border border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                {status}
              </button>
            )
          )}

          <div className="mx-2 hidden h-4 w-px bg-[var(--surface-border)] sm:block" />

          <div className="flex items-center gap-1 text-xs font-medium text-[var(--ink-muted)] mr-1">
            <span>Type:</span>
          </div>
          {(["all", "deliverables", "prices", "deadlines", "revision_limits"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs capitalize transition-all cursor-pointer ${
                typeFilter === type
                  ? "border border-[var(--forest)] bg-[var(--forest)] font-medium text-white shadow-xs"
                  : "border border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)]"
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
            <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] text-xs font-semibold font-sans text-[var(--ink-muted)]">
              <th className="py-3 pl-4 pr-3 min-w-[210px]">Commitment & Scope</th>
              <th className="px-3 py-3 w-24 min-w-[85px] whitespace-nowrap">Type</th>
              <th className="px-3 py-3 w-24 min-w-[85px] whitespace-nowrap">Status</th>
              <th className="px-3 py-3 min-w-[190px]">Verbatim Quotation & Source</th>
              <th className="sticky right-0 z-20 bg-[var(--surface-subtle)] py-3 pl-2.5 pr-4 text-right min-w-[148px] whitespace-nowrap border-l border-[var(--surface-border)] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                Review Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-border)]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink-muted)]">
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
                        ? "bg-[var(--forest-light)] border-l-2 border-[var(--forest)]"
                        : "hover:bg-[var(--surface-subtle)]"
                    }`}
                  >
                    {/* Commitment Claim & Explanation */}
                    <td className="py-3.5 pl-4 pr-3 align-top min-w-[210px]">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-xs ${
                            item.status === "baseline" || item.status === "confirmed"
                              ? "bg-[var(--emerald-state)]"
                              : item.status === "proposed" || item.status === "unclear"
                              ? "bg-[var(--amber-state)]"
                              : "bg-[var(--coral-state)]"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--ink)] leading-snug">
                            {item.claim}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--ink-muted)] leading-normal line-clamp-2">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Commitment Type */}
                    <td className="px-3 py-3.5 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans text-[var(--ink-muted)]">
                        <TypeIcon className="h-3.5 w-3.5 text-[var(--forest)] shrink-0" />
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
                        <blockquote className="font-serif italic text-xs text-[var(--ink)] leading-relaxed line-clamp-2">
                          “{item.evidenceQuote}”
                        </blockquote>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--ink-subtle)] font-mono">
                          <span className="font-medium text-[var(--ink-muted)]">{item.speaker}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sticky Review Action Column - Always Visible and Usable */}
                    <td
                      className={`sticky right-0 z-10 py-3.5 pl-2.5 pr-4 align-top text-right min-w-[148px] whitespace-nowrap border-l border-[var(--surface-border)] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                        isSelected ? "bg-[var(--forest-light)]" : "bg-[var(--paper-card)] group-hover/row:bg-[var(--surface-subtle)]"
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConfirmItem(item.id);
                              }}
                              className="inline-flex items-center gap-1 border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2 py-1 text-xs font-medium text-[var(--emerald-state)] hover:bg-[var(--emerald-state)] hover:text-white transition-colors cursor-pointer"
                              title="Human confirmation: Promote to confirmed agreement"
                            >
                              <CheckIcon className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismissItem(item.id);
                              }}
                              className="inline-flex items-center gap-1 border border-[var(--coral-border)] bg-[var(--paper-card)] px-2 py-1 text-xs font-medium text-[var(--coral-state)] hover:bg-[var(--coral-bg)] transition-colors cursor-pointer"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreItem(item.id);
                            }}
                            className="inline-flex items-center gap-1 border border-[var(--surface-border)] bg-[var(--paper-card)] px-2 py-0.5 text-xs text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                          >
                            <span>Restore</span>
                          </button>
                        )}

                        {!isPending && item.status !== "dismissed" && (
                          <span className="text-[11px] text-[var(--ink-subtle)] font-sans mr-1">
                            {item.status === "confirmed" ? "Confirmed" : "Baseline"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(item);
                          }}
                          className="inline-flex items-center justify-center h-7 w-7 border border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--ink-muted)] shadow-[1px_1px_0px_var(--surface-border)] hover:border-[var(--forest)] hover:bg-[var(--forest)] hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                          title="Inspect verbatim evidence in source conversation"
                          aria-label={`Inspect evidence for ${item.claim}`}
                        >
                          <ChevronRightIcon className="h-4 w-4 transition-transform group-hover/row:translate-x-0.5" />
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
      <div className="flex flex-wrap items-center justify-between border-t border-[var(--surface-border)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--ink-muted)] transition-colors">
        <div className="flex items-center gap-3">
          <span>Showing {filteredItems.length} of {items.length} records</span>
          <span className="hidden sm:inline text-[var(--ink-subtle)]">•</span>
          <span className="hidden sm:inline text-[var(--ink-subtle)]">Click any row to open the Evidence Inspector</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-[var(--forest)]" />
          <span>Human-confirmed updates only</span>
        </div>
      </div>
    </div>
  );
}
