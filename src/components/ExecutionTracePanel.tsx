"use client";

import React, { useMemo } from "react";
import {
  FileTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  InfoIcon,
} from "./icons";
import type { AgreementItem, ConversationThread } from "@/lib/sample-data";
import { verifyEvidence } from "@/lib/verifier";
import { ExtractedCandidateSchema } from "@/lib/schema";

interface ExecutionTracePanelProps {
  items: AgreementItem[];
  threads: ConversationThread[];
}

export function ExecutionTracePanel({
  items,
  threads,
}: ExecutionTracePanelProps) {
  const auditEntries = useMemo(() => {
    return items.map((item) => {
      const thread = threads.find((t) => t.id === item.sourceThreadId) || threads[0];
      const verifierRes = verifyEvidence(thread.rawText, item.evidenceQuote);

      // Validate against Zod schema
      const schemaCheck = ExtractedCandidateSchema.safeParse({
        claim: item.claim,
        evidenceQuote: item.evidenceQuote,
        speaker: item.speaker,
        timestamp: item.timestamp,
        commitmentType: item.commitmentType,
        speechAct: item.speechAct,
        suggestedStatus: item.status === "confirmed" || item.status === "dismissed" ? "proposed" : item.status,
        confidence: "high",
        explanation: item.explanation,
      });

      return {
        item,
        thread,
        verifierRes,
        schemaValid: schemaCheck.success,
      };
    });
  }, [items, threads]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border border-[#20251F]/10 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#20251F]/15 bg-[#F6F5F0] text-[#244D3A]">
            <FileTextIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[#20251F]">
              Execution Trace & Verification Audit
            </h2>
            <p className="text-xs text-[#576356] leading-relaxed mt-0.5">
              Transparent, deterministic audit record of checks executed locally by Receipts.
            </p>
          </div>
        </div>

        {/* Honest System Notice */}
        <div className="mt-3.5 border border-[#20251F]/15 bg-[#E7EEE8]/50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#20251F]">
            <InfoIcon className="h-3.5 w-3.5 text-[#244D3A]" />
            <span>Local Verifier Mode Status</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#576356]">
            This instance is operating in <strong>Local Deterministic Mode</strong>. Substring quotation checks and Zod schema validations are executed mathematically against client text. <em>Live Nebius Token Factory / NVIDIA Nemotron API calls, token counts, and live latency are not executed in local offline mode.</em>
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="border border-[#20251F]/10 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-[#20251F]/10 bg-[#F6F5F0]/70 px-4 py-2.5">
          <h3 className="font-serif text-sm font-bold text-[#20251F]">
            Active Substring Verification Log ({auditEntries.length} items)
          </h3>
        </div>

        <div className="divide-y divide-[#20251F]/8">
          {auditEntries.map(({ item, thread, verifierRes, schemaValid }, idx) => (
            <div key={item.id} className="p-3.5 hover:bg-[#F6F5F0]/50 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#20251F]">
                    #{idx + 1} [{item.id}]
                  </span>
                  <span className="border border-[#20251F]/15 bg-white px-2 py-0.5 text-[10px] font-sans text-[#576356] capitalize">
                    {item.commitmentType.replace("_", " ")}
                  </span>
                  <span className="text-xs font-medium text-[#20251F]">
                    {item.claim}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-sans">
                  {schemaValid ? (
                    <span className="inline-flex items-center gap-1 text-[#2E7D5B] font-medium">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Schema: Valid</span>
                    </span>
                  ) : (
                    <span className="text-[#C95C4B] font-medium">Schema: Invalid</span>
                  )}
                  <span className="text-[#889386]">•</span>
                  {verifierRes.verified ? (
                    <span className="inline-flex items-center gap-1 text-[#2E7D5B] font-medium">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      <span>Verifier: {verifierRes.exactMatch ? "Exact" : "Normalized"} <span className="font-mono text-[10px]">[{verifierRes.startIndex} - {verifierRes.endIndex}]</span></span>
                    </span>
                  ) : (
                    <span className="text-[#C95C4B] font-medium">Verifier: {verifierRes.reason}</span>
                  )}
                </div>
              </div>

              <div className="mt-2 border border-[#20251F]/10 bg-[#FAF9F5] p-2 text-xs text-[#576356]">
                <div className="font-sans font-medium text-[#20251F]">Source Document: {thread.title} ({thread.channel})</div>
                <div className="mt-0.5 font-serif italic text-xs text-[#3D473C] leading-relaxed">&ldquo;{item.evidenceQuote}&rdquo;</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
