"use client";

import React, { useState } from "react";
import {
  MessageSquareIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  HelpCircleIcon,
} from "./icons";
import type { AgreementItem, ProjectData } from "@/lib/sample-data";
import { generateReplyDraft, getStatusLabel } from "@/lib/reply-draft";

interface ReplyDraftPanelProps {
  project: ProjectData;
  items: AgreementItem[];
  selectedItem: AgreementItem | null;
}

export function ReplyDraftPanel({
  project,
  items,
  selectedItem,
}: ReplyDraftPanelProps) {
  const pendingItems = items.filter(
    (i) => i.status === "proposed" || i.status === "unclear"
  );

  const [activeItemIdOverride, setActiveItemIdOverride] = useState<string | null>(null);
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(selectedItem?.id ?? null);
  const [userEdits, setUserEdits] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // If selectedItem changed externally, reset override to synchronize
  if (selectedItem?.id !== prevSelectedId) {
    setPrevSelectedId(selectedItem?.id ?? null);
    setActiveItemIdOverride(null);
  }

  const fallbackItem = pendingItems[0] ?? items[0] ?? null;

  const resolvedActiveId =
    activeItemIdOverride ??
    (selectedItem ? selectedItem.id : (fallbackItem ? fallbackItem.id : null));

  const currentItem = resolvedActiveId
    ? items.find((i) => i.id === resolvedActiveId) ?? fallbackItem
    : fallbackItem;

  const itemKey = currentItem?.id ?? "__none";
  const isDismissed = currentItem?.status === "dismissed";

  const defaultDraft = currentItem ? generateReplyDraft(currentItem, project) : "";
  const draftContent = isDismissed ? "" : (userEdits[itemKey] ?? defaultDraft);

  const handleCopy = () => {
    if (!draftContent.trim()) return;
    navigator.clipboard.writeText(draftContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetDraft = () => {
    if (!currentItem || isDismissed) return;
    setUserEdits((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  const handleChangeText = (value: string) => {
    if (isDismissed) return;
    setUserEdits((prev) => ({
      ...prev,
      [itemKey]: value,
    }));
  };

  return (
    <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-md shadow-black/[0.02] overflow-hidden transition-all">
      {/* Header */}
      <div className="border-b border-black/[0.04] dark:border-white/[0.06] bg-[var(--surface-subtle)]/70 p-5 sm:p-6 transition-colors">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121614] text-[var(--forest)] shadow-xs">
              <MessageSquareIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
                Clarification Reply Draft
              </h2>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Non-confrontational, evidence-grounded copy ready to paste into Slack or email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDraft}
              disabled={!currentItem || isDismissed}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#141815] px-3.5 py-2 text-xs font-semibold text-[var(--ink-muted)] shadow-xs transition-all ${
                !currentItem || isDismissed ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--surface-subtle)] hover:-translate-y-0.5"
              }`}
              title="Reset to default template"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              <span>Reset Template</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!draftContent.trim() || isDismissed}
              className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#153224] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[var(--forest)]/15 transition-all ${
                !draftContent.trim() || isDismissed ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-3.5 w-3.5" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pending Scope Selector Tabs */}
        {pendingItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-xs font-sans font-medium text-[var(--ink-subtle)]">
              Quick Select Pending:
            </span>
            {pendingItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItemIdOverride(item.id)}
                className={`truncate max-w-xs rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                  (currentItem?.id === item.id)
                    ? "bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white border border-[var(--forest)]/30 dark:border-transparent font-semibold shadow-2xs"
                    : "border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#141815] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                {item.claim}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Advice banner for first-time user */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 text-xs text-[var(--ink-muted)] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <HelpCircleIcon className="h-4 w-4 text-[var(--forest)] shrink-0" />
            <span>
              <strong>Professional Scope Protection:</strong> Send this non-confrontational reply to cite the client&apos;s exact words and align price/timeline before starting out-of-scope work.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="rounded-full bg-[var(--forest-light)] text-[var(--forest)] px-2.5 py-0.5 border border-[var(--forest)]/20 font-semibold">
              Evidence-Grounded
            </span>
            <span className="rounded-full bg-white dark:bg-[#141815] border border-black/[0.06] dark:border-white/[0.08] text-[var(--ink)] px-2.5 py-0.5">
              Client-Ready
            </span>
          </div>
        </div>

        {currentItem ? (
          <>
            <div className="rounded-2xl border border-[var(--amber-border)]/70 bg-[var(--amber-bg)]/40 p-4 text-xs shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-sans text-[var(--amber-state)]">
                <span className="font-semibold">
                  Referencing Evidence ({getStatusLabel(currentItem.status)}):
                </span>
                <span className="rounded-full bg-white/70 dark:bg-[#141815]/70 px-2 py-0.5 text-[10px]">
                  Speaker: <strong className="text-[var(--ink)] font-semibold">{currentItem.speaker || "Not specified"}</strong>
                </span>
              </div>
              <p className="font-serif italic text-xs text-[var(--ink)] leading-relaxed">
                &ldquo;{currentItem.evidenceQuote || "[No quotation available]"}&rdquo;
              </p>
            </div>

            {isDismissed && (
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--amber-bg)]/40 p-4 text-xs text-[var(--ink-muted)] shadow-2xs">
                <span className="font-semibold text-[var(--ink)]">Dismissed item:</span> Dismissed items have no draft and must be restored first.
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-[var(--surface-subtle)]/40 p-8 text-center space-y-1.5">
            <p className="text-sm font-semibold text-[var(--ink)]">No Agreement Item Selected</p>
            <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
              Select an agreement item from the ledger or choose a pending item above to generate a clarification reply draft.
            </p>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={11}
            value={draftContent}
            onChange={(e) => handleChangeText(e.target.value)}
            disabled={!currentItem || isDismissed}
            className={`w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)]/80 p-4 font-sans text-xs text-[var(--ink)] leading-relaxed focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/20 focus:outline-hidden shadow-inner ${
              !currentItem || isDismissed ? "bg-[var(--surface-subtle)]/40 text-[var(--ink-subtle)] cursor-not-allowed" : ""
            }`}
            placeholder={
              isDismissed
                ? "Dismissed items have no draft and must be restored first."
                : currentItem
                ? "Type or edit clarification message..."
                : "No item selected. Select an agreement item to generate a clarification message."
            }
          />
        </div>

        {/* Editor Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--ink-subtle)] pt-1">
          <span>{draftContent.length} characters • {draftContent.split(/\s+/).filter(Boolean).length} words</span>
          <span>Editable text buffer. Never sent automatically to client.</span>
        </div>
      </div>
    </div>
  );
}
