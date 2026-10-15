"use client";

import React, { useState } from "react";
import {
  MessageSquareIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
} from "./icons";
import type { AgreementItem, ProjectData } from "@/lib/sample-data";

interface ReplyDraftPanelProps {
  project: ProjectData;
  items: AgreementItem[];
  selectedItem: AgreementItem | null;
}

function generateDefaultDraft(project: ProjectData, item?: AgreementItem): string {
  if (!item) {
    return `Hi ${project.clientName},\n\nThanks for checking in. We are on schedule with our baseline commitments for ${project.title}. Please let us know if there is anything else you need.\n\nBest,\n${project.contractorName}`;
  }

  if (item.commitmentType === "deliverables") {
    return `Hi ${project.clientName},\n\nThanks for sending over the note regarding the "${item.claim}".\n\nTo ensure our delivery timeline (October 17th) and agreed fixed scope ($3,500 baseline) remain on track, this deliverable falls outside our initial kickoff agreement ("${item.evidenceQuote}").\n\nWe would be glad to build this! We can prepare a quick change order for the additional asset or scope it into Phase 2 immediately following launch.\n\nPlease let me know how you would like to proceed.\n\nBest,\n${project.contractorName}`;
  }

  if (item.commitmentType === "prices") {
    return `Hi ${project.clientName},\n\nI wanted to quickly align on the rate terms mentioned in our conversation ("${item.evidenceQuote}").\n\nOur contractual rate for off-hours and weekend maintenance is $150/hr to ensure dedicated engineering availability, rather than $100/hr. Could you confirm that $150/hr works for your team before we schedule the weekend deployment window?\n\nBest,\n${project.contractorName}`;
  }

  return `Hi ${project.clientName},\n\nRegarding our recent discussion: "${item.evidenceQuote}", I wanted to confirm how we should incorporate this into the project schedule.\n\nCould you confirm if this is approved so we can update the project ledger accordingly?\n\nBest regards,\n${project.contractorName}`;
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
    (selectedItem && (selectedItem.status === "proposed" || selectedItem.status === "unclear")
      ? selectedItem.id
      : pendingItems[0]?.id ?? "");

  const currentItem = pendingItems.find((i) => i.id === resolvedActiveId) ?? pendingItems[0];
  const itemKey = currentItem?.id ?? "__default";

  const defaultDraft = generateDefaultDraft(project, currentItem);
  const draftContent = userEdits[itemKey] ?? defaultDraft;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetDraft = () => {
    setUserEdits((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  const handleChangeText = (value: string) => {
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
              className="brutal-btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#576356]"
              title="Reset to default template"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
              <span>Reset Template</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="brutal-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs"
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
              Scope Item:
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
        {currentItem && (
          <div className="mb-3.5 border border-[#E8CA97] bg-[#FAF3E8]/60 p-3 text-xs">
            <div className="flex items-center justify-between text-xs font-sans text-[#9A6518]">
              <span className="font-medium">Referencing Evidence:</span>
              <span>Speaker: <strong className="text-[#20251F] font-medium">{currentItem.speaker}</strong></span>
            </div>
            <p className="mt-1 font-serif italic text-xs text-[#20251F] leading-relaxed">
              “{currentItem.evidenceQuote}”
            </p>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={11}
            value={draftContent}
            onChange={(e) => handleChangeText(e.target.value)}
            className="w-full border border-[#20251F]/15 bg-white p-3.5 font-sans text-xs text-[#20251F] leading-relaxed focus:border-[#244D3A] focus:outline-hidden"
            placeholder="Type clarification message..."
          />
        </div>

        {/* Editor Footer */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between text-xs text-[#889386]">
          <span>{draftContent.length} characters • {draftContent.split(/\s+/).filter(Boolean).length} words</span>
          <span>Editable text buffer. Does not auto-send to client.</span>
        </div>
      </div>
    </div>
  );
}
