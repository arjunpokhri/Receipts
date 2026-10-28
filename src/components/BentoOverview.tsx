"use client";

import React, { useState } from "react";
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ReceiptIcon,
  ArrowRightIcon,
  SparklesIcon,
  LayersIcon,
  MessageSquareIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  ArrowUpRightIcon,
} from "./icons";
import type { AgreementItem } from "@/lib/sample-data";
import type { ActiveTab } from "./Sidebar";
import type { ApplicationStatus, CommitmentType } from "@/lib/schema";
import { RevealSection } from "./RevealSection";
import { QuickStartGuide } from "./QuickStartGuide";

interface BentoOverviewProps {
  items: AgreementItem[];
  verifiedCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectItem?: (item: AgreementItem) => void;
  isGuideOpen?: boolean;
  onCloseGuide?: () => void;
  onOpenTour?: () => void;
}

export function BentoOverview({
  items,
  verifiedCount,
  onSelectTab,
  onSelectItem,
  isGuideOpen,
  onCloseGuide,
  onOpenTour,
}: BentoOverviewProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<"nav" | "viewer" | "sla">("nav");

  const baselineCount = items.filter((i) => i.status === "baseline").length;
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;
  const proposedCount = items.filter((i) => i.status === "proposed").length;
  const unclearCount = items.filter((i) => i.status === "unclear").length;
  const dismissedCount = items.filter((i) => i.status === "dismissed").length;

  const totalEstablished = baselineCount + confirmedCount;
  const totalPending = proposedCount + unclearCount;
  const groundingPercentage =
    items.length > 0 ? Math.round((verifiedCount / items.length) * 100) : 100;

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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forest)]/25 bg-[var(--forest-light)] px-2.5 py-0.5 text-[11px] font-sans font-medium text-[var(--forest)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
            Baseline
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--emerald-border)] bg-[var(--emerald-bg)] px-2.5 py-0.5 text-[11px] font-sans font-medium text-[var(--emerald-state)]">
            <CheckIcon className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "proposed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2.5 py-0.5 text-[11px] font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Proposed
          </span>
        );
      case "unclear":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--amber-border)] bg-[var(--amber-bg)] px-2.5 py-0.5 text-[11px] font-sans font-medium text-[var(--amber-state)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber-state)]" />
            Unclear
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--coral-border)] bg-[var(--coral-bg)] px-2.5 py-0.5 text-[11px] font-sans font-medium text-[var(--coral-state)]">
            <XIcon className="h-3 w-3" />
            Dismissed
          </span>
        );
    }
  };

  const pendingItems = items.filter((i) => i.status === "proposed" || i.status === "unclear");
  const baselineItems = items.filter((i) => i.status === "baseline" || i.status === "confirmed");

  // Real data for the interactive hero preview bridge
  const previewData = {
    nav: {
      speaker: "Elena Vance (VP Product)",
      date: "Oct 12, 11:15 AM",
      channel: "Email to Marcus",
      subject: "Aura Health — Mobile navigation & tablet breakpoints",
      rawText: `Hi Marcus, we love the desktop wireframes. For the mobile navigation, `,
      quote: `we agree to proceed with the slide-out menu drawer at the quoted $650 addition.`,
      afterText: ` Could we also include tablet breakpoint optimizations? Let me check with our product lead first.`,
      claim: "Mobile navigation slide-out menu drawer deliverable agreed at $650 addition.",
      type: "deliverables" as CommitmentType,
      status: "confirmed" as ApplicationStatus,
      span: "[142 : 221]",
      price: "+$650",
    },
    viewer: {
      speaker: "Greg Thorne (Marketing Lead)",
      date: "Oct 5, 02:15 PM",
      channel: "Email to Marcus",
      subject: "Interactive 3D Viewer Request",
      rawText: `Hi Marcus, the homepage layout looks solid. `,
      quote: `Could we also add an interactive 3D product viewer module right below the hero section?`,
      afterText: ` We would need this ready alongside the main delivery on October 17th if possible.`,
      claim: "Client requests interactive 3D product viewer below hero section.",
      type: "deliverables" as CommitmentType,
      status: "proposed" as ApplicationStatus,
      span: "[45 : 136]",
      price: "Unpriced Scope Drift",
    },
    sla: {
      speaker: "Sam (Client Operations)",
      date: "Oct 14, 10:32 AM",
      channel: "Slack #general-ops",
      subject: "Weekend Maintenance Discussion",
      rawText: `[10:14 AM] Alex: Surcharge is strictly $150/hr. [10:32 AM] Sam: `,
      quote: `Understood, we are okay with the $100/hr weekend surcharge as long as logs are provided.`,
      afterText: ` [10:45 AM] Alex: Wait Sam, standard SLA rate for weekends is strictly $150/hr.`,
      claim: "Client offers $100/hr weekend maintenance rate, conflicting with $150/hr rate.",
      type: "prices" as CommitmentType,
      status: "unclear" as ApplicationStatus,
      span: "[62 : 149]",
      price: "Rate Conflict ($100 vs $150)",
    },
  };

  const currentPreview = previewData[activePreviewTab];

  return (
    <div className="space-y-6 pb-10">
      {/* 0. INTERACTIVE FIRST-TIME ONBOARDING & QUICK START GUIDE */}
      <QuickStartGuide
        onNavigateToTab={onSelectTab}
        isOpen={isGuideOpen}
        onClose={onCloseGuide}
        onOpenTour={onOpenTour}
      />

      {/* 1. HERO SECTION WITH REAL PRODUCT PREVIEW BRIDGE */}
      <RevealSection delayMs={0}>
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-b from-white/95 via-white/80 to-[var(--surface-subtle)]/50 dark:from-[#181E1A]/95 dark:via-[#141815]/90 dark:to-[#111412]/80 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-black/[0.02] bg-hero-glow bg-grid-subtle transition-all">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Headline and Positioning */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forest)]/20 bg-[var(--forest-light)]/80 backdrop-blur-md px-3.5 py-1 text-xs font-sans font-medium text-[var(--forest)] shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald-state)] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--emerald-state)]"></span>
                </span>
                <span>Evidence-Grounded Scope Governance</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.14]">
                Every client commitment. <br className="hidden sm:inline" />
                <span className="text-[var(--forest)] italic font-normal">Clear, traceable,</span> <br className="hidden sm:inline" />
                and accounted for.
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-[var(--ink-muted)] max-w-xl">
                Receipts turns messy, multi-channel correspondence across Slack, email, and meeting notes into an immutable, audit-ready agreement ledger. Every deliverable, deadline, price, and revision limit is anchored to exact verbatim source quotes—stopping scope creep before it turns into unpaid work.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectTab("custom")}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#1B3F2E] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[var(--forest)]/20 hover:shadow-lg hover:shadow-[var(--forest)]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <SparklesIcon className="h-4 w-4 text-amber-300" />
                  <span>Analyze Conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab("ledger")}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-white/[0.05] backdrop-blur-sm px-4 py-2.5 text-xs font-semibold text-[var(--ink)] shadow-xs hover:border-[var(--forest)]/40 hover:bg-white dark:hover:bg-white/[0.08] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <ReceiptIcon className="h-4 w-4 text-[var(--ink-muted)]" />
                  <span>Agreement Ledger ({items.length})</span>
                </button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-subtle)]">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)]/70 px-2.5 py-1">
                  <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)]" />
                  <span>NVIDIA Nemotron 3.5</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)]/70 px-2.5 py-1">
                  <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)]" />
                  <span>Mechanical Grounding</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-subtle)]/70 px-2.5 py-1">
                  <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)]" />
                  <span>Local Persistence</span>
                </span>
              </div>
            </div>

            {/* Right Column: Real Dual-Card Product Bridge */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Interactive Evidence Bridge
                </span>
                <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-full">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("nav")}
                    className={`rounded-full px-3 py-1 text-[11px] font-sans transition-all cursor-pointer ${
                      activePreviewTab === "nav"
                        ? "bg-white dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white font-semibold shadow-2xs"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    $650 Nav Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("viewer")}
                    className={`rounded-full px-3 py-1 text-[11px] font-sans transition-all cursor-pointer ${
                      activePreviewTab === "viewer"
                        ? "bg-white dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white font-semibold shadow-2xs"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    3D Viewer Scope
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("sla")}
                    className={`rounded-full px-3 py-1 text-[11px] font-sans transition-all cursor-pointer ${
                      activePreviewTab === "sla"
                        ? "bg-white dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white font-semibold shadow-2xs"
                        : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Rate Conflict
                  </button>
                </div>
              </div>

              {/* Top Card: Raw Unstructured Source */}
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#121614]/80 backdrop-blur-md p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
                  <span className="font-semibold text-[var(--ink)]">{currentPreview.speaker}</span>
                  <span className="font-mono text-[10px] text-[var(--ink-subtle)]">{currentPreview.date} • {currentPreview.channel}</span>
                </div>
                <div className="font-mono text-[11px] text-[var(--ink)] leading-relaxed bg-[var(--paper)]/80 dark:bg-black/30 rounded-xl p-3 border border-black/[0.04] dark:border-white/[0.05]">
                  <span>{currentPreview.rawText}</span>
                  <mark className="bg-[#D2E7DC] dark:bg-[#1C3E2D] text-[#193629] dark:text-[#A3E5C3] font-medium px-1.5 py-0.5 rounded-sm">
                    &ldquo;{currentPreview.quote}&rdquo;
                  </mark>
                  <span>{currentPreview.afterText}</span>
                </div>
              </div>

              {/* Connecting Grounding Line */}
              <div className="flex items-center justify-center gap-2 py-0.5 text-[10px] font-mono text-[var(--forest)]">
                <span className="h-px w-10 bg-[var(--forest)]/25"></span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--forest-light)]/90 border border-[var(--forest)]/20 px-3 py-1 rounded-full font-semibold shadow-2xs">
                  <ShieldCheckIcon className="h-3 w-3 text-[var(--emerald-state)]" />
                  <span>Deterministic Verifier Span {currentPreview.span} (100% Match)</span>
                </span>
                <span className="h-px w-10 bg-[var(--forest)]/25"></span>
              </div>

              {/* Bottom Card: Grounded Commitment Record */}
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-4.5 shadow-md space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(currentPreview.status)}
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--ink-subtle)]">
                      {currentPreview.type}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)] bg-[var(--surface-subtle)] px-2.5 py-0.5 rounded-full">
                    {currentPreview.price}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[var(--ink)] leading-snug">
                  {currentPreview.claim}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] border-t border-black/[0.04] dark:border-white/[0.06] pt-2.5">
                  <span>Speaker: <strong className="text-[var(--ink)]">{currentPreview.speaker}</strong></span>
                  <button
                    type="button"
                    onClick={() => onSelectTab("ledger")}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--forest)] hover:underline cursor-pointer"
                  >
                    <span>View in Ledger</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 2. REAL STATE METRICS SUMMARY BAR */}
      <RevealSection delayMs={100}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Agreed Scope */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-5.5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-[var(--ink-muted)]">
                  Agreed Scope
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--emerald-border)]/60 bg-[var(--emerald-bg)] text-[var(--emerald-state)] shadow-2xs">
                  <CheckCircleIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
                  {totalEstablished}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">commitments of record</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-[var(--forest)] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--forest)]" />
                  {baselineCount} baseline
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--emerald-state)] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald-state)]" />
                  {confirmedCount} confirmed
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("ledger")}
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer group"
            >
              <span>Explore Agreement Ledger</span>
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Card 2: Scope Drift Watch */}
          <div
            className={`rounded-2xl p-5.5 flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1 ${
              totalPending > 0
                ? "border-amber-300/70 bg-gradient-to-b from-[var(--amber-bg)]/90 to-[var(--amber-bg)]/40 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-transparent shadow-sm hover:shadow-md"
                : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-[var(--amber-state)]">
                  Scope Drift Watch
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300/80 bg-white/80 dark:bg-black/30 text-[var(--amber-state)] shadow-2xs">
                  <AlertTriangleIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--amber-state)]">
                  {totalPending}
                </span>
                <span className="text-xs text-[var(--amber-state)] font-medium">unconfirmed requests</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--amber-state)]">
                  {proposedCount} proposed
                </span>
                <span className="text-[var(--ink-subtle)]">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--amber-state)]">
                  {unclearCount} unclear
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("review")}
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--amber-state)] hover:underline cursor-pointer group"
            >
              <span>Review Delta Proposals</span>
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Card 3: Evidence Grounding */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-5.5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-[var(--ink-muted)]">
                  Evidence Grounding
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--forest)]/20 bg-[var(--forest-light)] text-[var(--forest)] shadow-2xs">
                  <ShieldCheckIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
                  {groundingPercentage}%
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  ({verifiedCount}/{items.length} verified)
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                Deterministic verifier matches quotes character-for-character against source text.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("trace")}
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer group"
            >
              <span>Inspect Verifier Audit</span>
              <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Card 4: Key Constraints */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] p-5.5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-sans text-[var(--ink-muted)]">
                  Key Constraints
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--surface-subtle)] text-[var(--ink)] shadow-2xs">
                  <ReceiptIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-1.5">
                  <span className="text-[var(--ink-muted)]">Baseline Fixed Fee:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">$3,500</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-1.5">
                  <span className="text-[var(--ink-muted)]">Delivery Deadline:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">Oct 17, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)]">Revision Cap:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">2 rounds ($120/hr)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-1 text-[11px] text-[var(--ink-subtle)]">
              <span>{dismissedCount} dismissed candidate(s)</span>
              <span className="font-mono text-[10px] bg-[var(--surface-subtle)] px-2 py-0.5 rounded-full">USD</span>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 3. THE 4-STEP SCOPE GOVERNANCE WORKFLOW */}
      <RevealSection delayMs={150}>
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#181E1A]/70 backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-lg shadow-black/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
            <div>
              <div className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--forest)]">
                Governed Lifecycle
              </div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--ink)] mt-1">
                The Four Disciplines of Scope Defense
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-muted)] max-w-sm leading-relaxed">
              From raw, ambiguous client communication to confirmed agreements and signed deliverables.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131715] p-5.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--forest-light)] dark:bg-[var(--forest)] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                    1
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-[var(--forest-light)] flex items-center justify-center text-[var(--forest)]">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-3.5 font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
                  Analyze Conversation
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Ingest client emails, Slack transcripts, or meeting minutes. Nebius extracts structured commitments across deliverables, deadlines, and prices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("custom")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer"
              >
                <span>Launch Analyzer</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131715] p-5.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--forest-light)] dark:bg-[var(--forest)] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                    2
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-[var(--forest-light)] flex items-center justify-center text-[var(--forest)]">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-3.5 font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
                  Verify Evidence
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Deterministic substring matcher verifies every quote character-for-character. Hallucinated or altered quotes are mechanically rejected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("evidence")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer"
              >
                <span>Inspect Evidence</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131715] p-5.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--amber-bg)] dark:bg-[var(--amber-state)] text-xs font-bold text-[var(--amber-state)] dark:text-white border border-[var(--amber-border)] dark:border-transparent shadow-2xs">
                    3
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-[var(--amber-bg)] flex items-center justify-center text-[var(--amber-state)]">
                    <LayersIcon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-3.5 font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--amber-state)] transition-colors">
                  Review Scope Drift
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Compare newly proposed requests side-by-side against baseline commitments. Confirm agreed additions or dismiss unapproved creep.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("review")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--amber-state)] hover:underline cursor-pointer"
              >
                <span>Review Proposals</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131715] p-5.5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--forest-light)] dark:bg-[var(--forest)] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                    4
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-[var(--forest-light)] flex items-center justify-center text-[var(--forest)]">
                    <MessageSquareIcon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-3.5 font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
                  Draft Clarification
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                  Generate non-confrontational, professional responses quoting verified source text to confirm new scope or quote appropriate add-on fees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("draft")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer"
              >
                <span>Draft Clarification</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 4. ASYMMETRICAL SPOTLIGHT: UNRESOLVED DRIFT VS CANONICAL BASELINE */}
      <RevealSection delayMs={200}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Columns: Scope Drift & Requests Needing Action */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-md">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-r from-[var(--amber-bg)]/80 to-[var(--amber-bg)]/40 dark:from-amber-950/30 dark:to-transparent px-5 py-3.5">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-[var(--amber-state)]" />
                <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
                  Unresolved Scope Requests ({pendingItems.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("review")}
                className="text-xs font-semibold text-[var(--amber-state)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Review All</span>
                <ArrowUpRightIcon className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {pendingItems.map((item) => {
                const TypeIcon = typeIcons[item.commitmentType] || LayersIcon;
                return (
                  <div key={item.id} className="p-4 hover:bg-[var(--surface-subtle)]/50 transition-colors space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-muted)] font-mono">
                          <TypeIcon className="h-3 w-3 text-[var(--forest)]" />
                          <span>{item.commitmentType.replace("_", " ")}</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--ink-subtle)]">
                        {item.speaker} • {item.timestamp}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--ink)]">
                      {item.claim}
                    </div>
                    <blockquote className="font-serif italic text-xs text-[var(--ink-muted)] border-l-2 border-[var(--amber-state)]/50 pl-2.5">
                      &ldquo;{item.evidenceQuote}&rdquo;
                    </blockquote>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-[var(--ink-subtle)]">
                        Speech act: <strong className="capitalize text-[var(--ink)]">{item.speechAct}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectItem) onSelectItem(item);
                          onSelectTab("evidence");
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer"
                      >
                        <span>Inspect Verbatim Quote</span>
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Columns: Baseline Anchors */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] shadow-md">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-r from-[var(--forest-light)]/70 to-[var(--forest-light)]/30 dark:from-[#1A2F24]/50 dark:to-transparent px-5 py-3.5">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-[var(--emerald-state)]" />
                <h3 className="font-serif text-sm font-bold text-[var(--ink)]">
                  Agreed Baseline Commitments ({baselineItems.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("ledger")}
                className="text-xs font-semibold text-[var(--forest)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Ledger</span>
                <ArrowUpRightIcon className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {baselineItems.slice(0, 4).map((item) => {
                const TypeIcon = typeIcons[item.commitmentType] || LayersIcon;
                return (
                  <div key={item.id} className="p-3.5 hover:bg-[var(--surface-subtle)]/50 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
                        <TypeIcon className="h-3 w-3 text-[var(--forest)]" />
                        <span>{item.commitmentType.replace("_", " ")}</span>
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-xs font-medium text-[var(--ink)] truncate">
                      {item.claim}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--ink-subtle)]">
                      Anchor: {item.speaker}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 5. CLOSING ACTION BANNER */}
      <RevealSection delayMs={250}>
        <div className="rounded-3xl border border-[var(--emerald-border)]/60 dark:border-emerald-900/30 bg-gradient-to-r from-[var(--forest-light)] via-[#E6F0EB] to-[var(--surface-subtle)] dark:from-[#1B3F2E] dark:via-[#244D3A] dark:to-[#163325] p-8 sm:p-10 text-[var(--ink)] dark:text-white shadow-lg shadow-black/[0.02] dark:shadow-xl dark:shadow-[var(--forest)]/15 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--ink)] dark:text-white">
                Ready to audit client communications?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] dark:text-emerald-100/90 leading-relaxed">
                Paste email threads, chat transcripts, or change requests to extract commitments and anchor them with exact quote verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onSelectTab("custom")}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--forest)] dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-[#1B3F2E] hover:bg-[var(--forest-hover)] dark:hover:bg-emerald-50 transition-all cursor-pointer shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <SparklesIcon className="h-4 w-4 text-amber-300 dark:text-amber-600" />
                <span>Launch Live Extractor</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectTab("ledger")}
                className="inline-flex items-center gap-2 rounded-xl border border-black/[0.1] dark:border-white/30 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-sm px-4 py-2.5 text-xs font-semibold text-[var(--ink)] dark:text-white transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-2xs"
              >
                <ReceiptIcon className="h-4 w-4 text-[var(--forest)] dark:text-white" />
                <span>Browse Ledger</span>
              </button>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
