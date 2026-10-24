"use client";

import React, { useMemo } from "react";
import {
  ShieldCheckIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
} from "./icons";
import type { AgreementItem, ConversationThread } from "@/lib/sample-data";
import { verifyEvidence } from "@/lib/verifier";
import { resolveItemSource, type ResolvedItemSource } from "@/lib/source-resolver";
import { MECHANICAL_VERIFICATION_DISCLAIMER } from "@/lib/evaluate-extraction";

interface EvidenceInspectorProps {
  item: AgreementItem | null;
  threads: ConversationThread[];
  onClose: () => void;
  onConfirmItem: (id: string) => void;
  onDismissItem: (id: string) => void;
}

export function EvidenceInspector({
  item,
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

  if (!item || !source) {
    return (
      <div className="border border-[#20251F]/10 bg-white p-6 text-center shadow-xs">
        <div className="mx-auto flex h-9 w-9 items-center justify-center border border-[#20251F]/15 bg-[#F6F5F0] text-[#576356]">
          <ShieldCheckIcon className="h-4.5 w-4.5" />
        </div>
        <h3 className="mt-2.5 font-serif text-base font-bold text-[#20251F]">
          Evidence Inspector
        </h3>
        <p className="mt-1 text-xs text-[#576356] max-w-xs mx-auto leading-relaxed">
          Select any agreement or scope request from the ledger to inspect its verbatim quotation and substring verification against source logs.
        </p>
      </div>
    );
  }

  // Render raw conversation text with highlighted quotation
  const renderHighlightedConversation = () => {
    const raw = source.sourceText;
    if (!verification || !verification.verified) {
      return <pre className="font-mono text-xs text-[#20251F] whitespace-pre-wrap">{raw}</pre>;
    }

    const { startIndex, endIndex } = verification;
    const before = raw.slice(0, startIndex);
    const match = raw.slice(startIndex, endIndex);
    const after = raw.slice(endIndex);

    return (
      <pre className="font-mono text-xs text-[#20251F] whitespace-pre-wrap leading-relaxed">
        <span>{before}</span>
        <mark className="border-b border-[#244D3A] bg-[#D2E7DC] px-1 py-0.5 font-medium text-[#193629]">
          {match}
        </mark>
        <span>{after}</span>
      </pre>
    );
  };

  const isPending = item.status === "proposed" || item.status === "unclear";

  return (
    <div className="relative flex flex-col border border-[#20251F]/10 bg-white p-4.5 shadow-xs">
      {/* Inspector Topbar */}
      <div className="flex items-start justify-between border-b border-[#20251F]/10 pb-3">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-sans text-[#576356]">
              Evidence Inspector
            </span>
            <span className="border border-[#20251F]/15 bg-[#F6F5F0] px-1.5 py-0.2 text-[10px] font-mono text-[#889386]">
              {item.id}
            </span>
          </div>
          <h2 className="mt-1 font-serif text-base font-bold text-[#20251F] leading-snug">
            {item.claim}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#20251F]/15 bg-[#F6F5F0] p-1 text-[#576356] hover:bg-white hover:text-[#20251F] transition-colors shrink-0"
          aria-label="Close inspector"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Verification Diagnostic Status Box */}
      <div className="mt-3">
        {verification?.verified ? (
          <div className="border border-[#2E7D5B]/30 bg-[#F0F6F2] p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-[#244D3A]">
                <ShieldCheckIcon className="h-4 w-4 text-[#2E7D5B]" />
                <span>
                  Mechanically Verified ({verification.exactMatch ? "Exact Substring" : "Normalized Match"})
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#2E7D5B]">
                Span: [{verification.startIndex} - {verification.endIndex}]
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#576356]">
              Quotation matched verbatim in source text. Length: {verification.matchedText.length} characters.
            </p>
          </div>
        ) : (
          <div className="border border-[#C95C4B]/30 bg-[#FDF2F0] p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#A83827]">
              <XCircleIcon className="h-4 w-4 text-[#C95C4B]" />
              <span>Verification Failed: {verification?.reason}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#576356]">
              {verification?.message}
            </p>
          </div>
        )}
      </div>

      {/* Quotation Excerpt Card */}
      <div className="mt-3 border border-[#20251F]/10 border-l-2 border-l-[#244D3A] bg-[#FAF9F5] p-3">
        <div className="flex items-center justify-between text-[11px] font-sans text-[#889386]">
          <span className="font-medium text-[#576356]">Extracted Quotation</span>
          <span>Source: {source.channel}</span>
        </div>
        <blockquote className="mt-1.5 font-serif italic text-xs text-[#20251F] leading-relaxed">
          “{item.evidenceQuote}”
        </blockquote>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#576356] border-t border-[#20251F]/8 pt-1.5">
          <span>Speaker: <strong className="text-[#20251F] font-medium">{item.speaker}</strong></span>
          <span className="font-mono text-[10px] text-[#889386]">{item.timestamp}</span>
        </div>
      </div>

      {/* Source Conversation Context Viewer */}
      <div className="mt-3 flex-1">
        <div className="flex items-center justify-between text-xs font-sans text-[#576356] mb-1">
          <span className="font-medium">Source: {source.title}</span>
          <span className="text-[10px] text-[#889386] font-mono">raw log</span>
        </div>
        <div className="max-h-52 overflow-y-auto border border-[#20251F]/10 bg-white p-3">
          {renderHighlightedConversation()}
        </div>
      </div>

      {/* Methodological Non-Equivalence Notice */}
      <div className="mt-3 border-t border-[#20251F]/10 pt-2.5">
        <p className="text-[11px] leading-relaxed text-[#576356]">
          <strong className="text-[#20251F] font-medium">Notice:</strong> {MECHANICAL_VERIFICATION_DISCLAIMER}
        </p>
      </div>

      {/* Human Action Controls */}
      {isPending && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[#20251F]/10 pt-3">
          <span className="text-xs text-[#576356] mr-auto">
            Human sign-off required:
          </span>
          <button
            type="button"
            onClick={() => onDismissItem(item.id)}
            className="brutal-btn-outline inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#B04130]"
          >
            <XIcon className="h-3 w-3" />
            <span>Dismiss</span>
          </button>
          <button
            type="button"
            onClick={() => onConfirmItem(item.id)}
            className="brutal-btn-primary inline-flex items-center gap-1 px-3 py-1 text-xs"
          >
            <CheckIcon className="h-3 w-3 text-white" />
            <span>Confirm into Ledger</span>
          </button>
        </div>
      )}
    </div>
  );
}
