"use client";

import React, { useState } from "react";
import {
  MessageSquareIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
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

  const resolvedActiveId =
    activeItemIdOverride ??
    (selectedItem ? selectedItem.id : null);

  const currentItem = resolvedActiveId
    ? items.find((i) => i.id === resolvedActiveId) ?? null
    : null;

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
    <div className="border border-[#20251F]/10 bg-white shadow-xs">
      {/* Header */}
      <div className="border-b border-[#20251F]/10 bg-[#F6F5F0]/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[#20251F]/15 bg-white text-[#244D3A]">
              <MessageSquareIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#20251F]">
                Clarification Reply Draft
              </h2>
              <p className="text-xs text-[#576356] mt-0.5">
                Non-confrontational, evidence-grounded copy ready to paste into Slack or email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDraft}
              disabled={!currentItem || isDismissed}
              className={`brutal-btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#576356] ${
                !currentItem || isDismissed ? "opacity-50 cursor-not-allowed" : ""
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
              className={`brutal-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs ${
                !draftContent.trim() || isDismissed ? "opacity-50 cursor-not-allowed" : ""
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
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-[#20251F]/8">
            <span className="text-xs font-sans font-medium text-[#889386]">
              Quick Select Pending:
            </span>
            {pendingItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItemIdOverride(item.id)}
                className={`truncate max-w-xs px-2.5 py-1 text-xs transition-all ${
                  (currentItem?.id === item.id)
                    ? "border border-[#244D3A] bg-[#244D3A] font-medium text-white shadow-xs"
                    : "border border-[#20251F]/15 bg-white text-[#576356] hover:border-[#20251F]/30"
                }`}
              >
                {item.claim}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="p-4 sm:p-5">
        {currentItem ? (
          <>
            <div className="mb-3.5 border border-[#E8CA97] bg-[#FAF3E8]/60 p-3 text-xs">
              <div className="flex items-center justify-between text-xs font-sans text-[#9A6518]">
                <span className="font-medium">
                  Referencing Evidence ({getStatusLabel(currentItem.status)}):
                </span>
                <span>
                  Speaker: <strong className="text-[#20251F] font-medium">{currentItem.speaker || "Not specified"}</strong>
                </span>
              </div>
              <p className="mt-1 font-serif italic text-xs text-[#20251F] leading-relaxed">
                “{currentItem.evidenceQuote || "[No quotation available]"}”
              </p>
            </div>

            {isDismissed && (
              <div className="mb-3.5 border border-[#20251F]/15 bg-[#FAF3E8]/40 p-3.5 text-xs text-[#576356]">
                <span className="font-semibold text-[#20251F]">Dismissed item:</span> Dismissed items have no draft and must be restored first.
              </div>
            )}
          </>
        ) : (
          <div className="mb-3.5 border border-dashed border-[#20251F]/20 bg-[#F6F5F0]/60 p-6 text-center">
            <p className="text-sm font-medium text-[#20251F]">No Agreement Item Selected</p>
            <p className="mt-1 text-xs text-[#576356]">
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
            className={`w-full border border-[#20251F]/15 bg-white p-3.5 font-sans text-xs text-[#20251F] leading-relaxed focus:border-[#244D3A] focus:outline-hidden ${
              !currentItem || isDismissed ? "bg-[#F6F5F0]/30 text-[#889386] cursor-not-allowed" : ""
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
        <div className="mt-2.5 flex flex-wrap items-center justify-between text-xs text-[#889386]">
          <span>{draftContent.length} characters • {draftContent.split(/\s+/).filter(Boolean).length} words</span>
          <span>Editable text buffer. Never sent automatically to client.</span>
        </div>
      </div>
    </div>
  );
}
