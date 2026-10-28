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
import { resolveItemSource } from "@/lib/source-resolver";
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
      const resolvedSource = resolveItemSource(item, threads);
      const verifierRes = resolvedSource
        ? verifyEvidence(resolvedSource.sourceText, item.evidenceQuote)
        : {
            verified: false as const,
            exactMatch: false,
            reason: "SOURCE_NOT_FOUND" as const,
            message: "Authoritative source communication could not be resolved for this item.",
          };

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
        resolvedSource,
        verifierRes,
        schemaValid: schemaCheck.success,
      };
    });
  }, [items, threads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-6 sm:p-7 shadow-md shadow-black/[0.02] transition-colors space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)] text-[var(--forest)] shadow-xs">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
              Execution Trace & Verification Audit
            </h2>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-1">
              Transparent, deterministic audit record of checks executed locally by Receipts.
            </p>
          </div>
        </div>

        {/* Honest System Notice */}
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-4 text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
            <InfoIcon className="h-4 w-4 text-[var(--forest)]" />
            <span>Local Verifier Mode Status</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            This instance is operating in <strong>Local Deterministic Mode</strong>. Substring quotation checks and Zod schema validations are executed mathematically against client text. <em>Live Nebius Token Factory / NVIDIA Nemotron API calls, token counts, and live latency are not executed in local offline mode.</em>
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-md shadow-black/[0.02] overflow-hidden transition-colors">
        <div className="border-b border-black/[0.04] dark:border-white/[0.06] bg-[var(--surface-subtle)]/70 px-5 py-3.5">
          <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
            Active Substring Verification Log ({auditEntries.length} items)
          </h3>
        </div>

        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {auditEntries.map(({ item, resolvedSource, verifierRes, schemaValid }, idx) => (
            <div key={item.id} className="p-4 sm:p-5 hover:bg-[var(--surface-subtle)]/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                    #{idx + 1} [{item.id}]
                  </span>
                  <span className="rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)] px-2.5 py-0.5 text-[10px] font-sans font-medium text-[var(--ink-muted)] capitalize shadow-2xs">
                    {item.commitmentType.replace("_", " ")}
                  </span>
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    {item.claim}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-sans">
                  {schemaValid ? (
                    <span className="inline-flex items-center gap-1 text-[var(--emerald-state)] font-medium">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Schema: Valid</span>
                    </span>
                  ) : (
                    <span className="text-[var(--coral-state)] font-medium">Schema: Invalid</span>
                  )}
                  <span className="text-[var(--ink-subtle)]">•</span>
                  {verifierRes.verified ? (
                    <span className="inline-flex items-center gap-1.5 text-[var(--emerald-state)] font-medium">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      <span>Verifier: {verifierRes.exactMatch ? "Exact" : "Normalized"} <span className="font-mono text-[10px] rounded-full bg-[var(--emerald-bg)] px-1.5 py-0.5 border border-[var(--emerald-border)]/50">[{verifierRes.startIndex} - {verifierRes.endIndex}]</span></span>
                    </span>
                  ) : (
                    <span className="text-[var(--coral-state)] font-medium">Verifier: {verifierRes.reason}</span>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 text-xs text-[var(--ink-muted)] shadow-2xs">
                <div className="font-sans font-semibold text-[var(--ink)]">
                  Source Document: {resolvedSource ? `${resolvedSource.title} (${resolvedSource.channel})` : "Unresolved Source (Missing)"}
                </div>
                <div className="mt-1 font-serif italic text-xs text-[var(--ink)] leading-relaxed">&ldquo;{item.evidenceQuote}&rdquo;</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
