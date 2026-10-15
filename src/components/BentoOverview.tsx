"use client";

import React from "react";
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ReceiptIcon,
  ArrowRightIcon,
} from "./icons";
import type { AgreementItem } from "@/lib/sample-data";

interface BentoOverviewProps {
  items: AgreementItem[];
  verifiedCount: number;
  onSelectTab: (tab: "ledger" | "review" | "draft" | "trace") => void;
}

export function BentoOverview({
  items,
  verifiedCount,
  onSelectTab,
}: BentoOverviewProps) {
  const baselineCount = items.filter((i) => i.status === "baseline").length;
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;
  const proposedCount = items.filter((i) => i.status === "proposed").length;
  const unclearCount = items.filter((i) => i.status === "unclear").length;
  const dismissedCount = items.filter((i) => i.status === "dismissed").length;

  const totalEstablished = baselineCount + confirmedCount;
  const totalPending = proposedCount + unclearCount;
  const groundingPercentage =
    items.length > 0 ? Math.round((verifiedCount / items.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Established Agreements Bento Card */}
      <div className="relative flex flex-col justify-between border border-[#20251F]/10 bg-white p-4.5 shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold font-sans text-[#576356]">
              Agreed Scope
            </span>
            <div className="flex h-6 w-6 items-center justify-center border border-[#2E7D5B]/20 bg-[#EBF5F0] text-[#2E7D5B]">
              <CheckCircleIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#20251F]">
              {totalEstablished}
            </span>
            <span className="text-xs text-[#576356]">commitments of record</span>
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#244D3A] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#244D3A]" />
              {baselineCount} baseline
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#2E7D5B] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D5B]" />
              {confirmedCount} confirmed
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab("ledger")}
          className="mt-3.5 flex items-center gap-1 text-xs font-medium text-[#244D3A] hover:underline"
        >
          <span>View Agreement Ledger</span>
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      {/* 2. Pending Scope Drift Bento Card */}
      <div
        className={`relative flex flex-col justify-between border p-4.5 transition-colors shadow-xs ${
          totalPending > 0
            ? "border-[#E8CA97] bg-[#FAF3E8]/70"
            : "border-[#20251F]/10 bg-white"
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold font-sans text-[#9A6518]">
              Scope Drift Watch
            </span>
            <div className="flex h-6 w-6 items-center justify-center border border-[#C58A36]/30 bg-white text-[#9A6518]">
              <AlertTriangleIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#9A6518]">
              {totalPending}
            </span>
            <span className="text-xs text-[#9A6518]">unconfirmed items</span>
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#9A6518]">
              {proposedCount} proposed
            </span>
            <span className="text-[#889386]">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#9A6518]">
              {unclearCount} unclear
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab("review")}
          className="mt-3.5 flex items-center gap-1 text-xs font-medium text-[#9A6518] hover:underline"
        >
          <span>Review Delta Requests</span>
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      {/* 3. Evidence Grounding Bento Card */}
      <div className="relative flex flex-col justify-between border border-[#20251F]/10 bg-white p-4.5 shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold font-sans text-[#576356]">
              Evidence Grounding
            </span>
            <div className="flex h-6 w-6 items-center justify-center border border-[#244D3A]/20 bg-[#EBF3EE] text-[#244D3A]">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#20251F]">
              {groundingPercentage}%
            </span>
            <span className="text-xs text-[#576356]">
              ({verifiedCount}/{items.length} verified)
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#576356]">
            Exact substring match checked mechanically against raw conversation logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab("trace")}
          className="mt-3.5 flex items-center gap-1 text-xs font-medium text-[#244D3A] hover:underline"
        >
          <span>Inspect Verifier Audit</span>
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      {/* 4. Financial & Timeline Bounds Bento Card */}
      <div className="relative flex flex-col justify-between border border-[#20251F]/10 bg-white p-4.5 shadow-xs">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold font-sans text-[#576356]">
              Key Constraints
            </span>
            <div className="flex h-6 w-6 items-center justify-center border border-[#20251F]/15 bg-[#F6F5F0] text-[#20251F]">
              <ReceiptIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#20251F]/8 pb-1">
              <span className="text-[#576356]">Fixed Baseline Fee:</span>
              <span className="font-mono font-medium text-[#20251F]">$3,500</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#20251F]/8 pb-1">
              <span className="text-[#576356]">Delivery Deadline:</span>
              <span className="font-mono font-medium text-[#20251F]">Oct 17, 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#576356]">Revision Cap:</span>
              <span className="font-mono font-medium text-[#20251F]">2 rounds ($120/hr over)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-[#889386]">
          <span>{dismissedCount} dismissed candidate(s)</span>
          <span className="font-mono text-[10px]">USD</span>
        </div>
      </div>
    </div>
  );
}
