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
    <div className="space-y-5">
      {/* Header */}
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[var(--forest)]">
            <FileTextIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
              Execution Trace & Verification Audit
            </h2>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-0.5">
              Transparent, deterministic audit record of checks executed locally by Receipts.
            </p>
          </div>
        </div>

        {/* Honest System Notice */}
        <div className="mt-3.5 border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
            <InfoIcon className="h-3.5 w-3.5 text-[var(--forest)]" />
            <span>Local Verifier Mode Status</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
            This instance is operating in <strong>Local Deterministic Mode</strong>. Substring quotation checks and Zod schema validations are executed mathematically against client text. <em>Live Nebius Token Factory / NVIDIA Nemotron API calls, token counts, and live latency are not executed in local offline mode.</em>
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] shadow-xs overflow-hidden transition-colors">
        <div className="border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] px-4 py-2.5">
          <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
            Active Substring Verification Log ({auditEntries.length} items)
          </h3>
        </div>

        <div className="divide-y divide-[var(--surface-border)]">
          {auditEntries.map(({ item, resolvedSource, verifierRes, schemaValid }, idx) => (
            <div key={item.id} className="p-3.5 hover:bg-[var(--surface-subtle)] transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                    #{idx + 1} [{item.id}]
                  </span>
                  <span className="border border-[var(--surface-border)] bg-[var(--paper-card)] px-2 py-0.5 text-[10px] font-sans text-[var(--ink-muted)] capitalize">
                    {item.commitmentType.replace("_", " ")}
                  </span>
                  <span className="text-xs font-medium text-[var(--ink)]">
                    {item.claim}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-sans">
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
                    <span className="inline-flex items-center gap-1 text-[var(--emerald-state)] font-medium">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      <span>Verifier: {verifierRes.exactMatch ? "Exact" : "Normalized"} <span className="font-mono text-[10px]">[{verifierRes.startIndex} - {verifierRes.endIndex}]</span></span>
                    </span>
                  ) : (
                    <span className="text-[var(--coral-state)] font-medium">Verifier: {verifierRes.reason}</span>
                  )}
                </div>
              </div>

              <div className="mt-2 border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-2 text-xs text-[var(--ink-muted)]">
                <div className="font-sans font-medium text-[var(--ink)]">
                  Source Document: {resolvedSource ? `${resolvedSource.title} (${resolvedSource.channel})` : "Unresolved Source (Missing)"}
                </div>
                <div className="mt-0.5 font-serif italic text-xs text-[var(--ink)] leading-relaxed">&ldquo;{item.evidenceQuote}&rdquo;</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
