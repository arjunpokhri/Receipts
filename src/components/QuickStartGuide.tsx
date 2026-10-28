"use client";

import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  XIcon,
  InfoIcon,
} from "./icons";
import type { ActiveTab } from "./Sidebar";

interface QuickStartGuideProps {
  onNavigateToTab: (tab: ActiveTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenTour?: () => void;
}

export function QuickStartGuide({
  onNavigateToTab,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpenTour,
}: QuickStartGuideProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);

  // Check localStorage on mount if not controlled
  useEffect(() => {
    if (controlledIsOpen === undefined) {
      try {
        const dismissed = localStorage.getItem("receipts-quickstart-dismissed");
        if (dismissed === "true") {
          queueMicrotask(() => {
            setInternalIsOpen(false);
          });
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [controlledIsOpen]);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
      try {
        localStorage.setItem("receipts-quickstart-dismissed", "true");
      } catch {
        // ignore
      }
    }
  };

  const handleResetGuide = () => {
    setInternalIsOpen(true);
    if (onOpenTour) {
      onOpenTour();
    }
    try {
      localStorage.removeItem("receipts-quickstart-dismissed");
    } catch {
      // ignore
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181E1A] px-5 py-3 text-xs text-[var(--ink-muted)] shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <InfoIcon className="h-4 w-4 text-[var(--forest)] shrink-0" />
          <span>
            <strong>New to Receipts?</strong> Learn how to stop scope creep and ground client promises in 30 seconds.
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetGuide}
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--forest)] hover:underline cursor-pointer"
        >
          <span>Open Quick Start Tour</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-900/15 dark:border-emerald-500/20 bg-gradient-to-b from-white/95 via-white/80 to-[var(--surface-subtle)]/60 dark:from-[#181E1A] dark:via-[#151A17] dark:to-[#121614] p-6 sm:p-8 shadow-xl shadow-black/[0.02] backdrop-blur-xl transition-all animate-fade-in">
      {/* Decorative top ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--forest)] via-[var(--emerald-state)] to-[var(--forest)]" />

      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--emerald-border)]/60 bg-[var(--emerald-bg)] px-3 py-1 text-[11px] font-sans font-semibold text-[var(--forest)] shadow-2xs">
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>Interactive Quick Start Guide</span>
          </div>
          <h2 className="mt-2.5 font-serif text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight">
            How Receipts Stops Unpaid Scope Creep
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-muted)] max-w-2xl leading-relaxed">
            Freelancers and agencies lose thousands when client changes are scattered across Slack, emails, and meetings.
            Receipts turns chaotic conversation into a verified, audit-ready agreement ledger in <strong>3 simple steps</strong>:
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#141815] p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer shrink-0 shadow-2xs"
          title="Dismiss guide (You can reopen it anytime)"
          aria-label="Dismiss guide"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* 3 Step Interactive Workflow Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4.5 md:grid-cols-3">
        {/* Step 1 */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#161B18]/90 p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/40 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-gradient-to-br dark:from-[var(--forest)] dark:to-[#153224] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                1
              </span>
              <span className="text-[10px] font-mono text-[var(--ink-subtle)] uppercase tracking-wider">
                Ingest & Extract
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Paste Client Conversation
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Drop in raw emails, Slack threads, or call notes. Nebius Token Factory (NVIDIA Nemotron 3.5) extracts promises into 4 structured types: deliverables, deadlines, prices, and revision caps.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => onNavigateToTab("custom")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--surface-subtle)]/70 py-2 px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--forest)] hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-[var(--forest)] group-hover:text-white" />
              <span>Try Live Extractor</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#161B18]/90 p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/40 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-gradient-to-br dark:from-[var(--forest)] dark:to-[#153224] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                2
              </span>
              <span className="text-[10px] font-mono text-[var(--ink-subtle)] uppercase tracking-wider">
                Deterministic Proof
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Mechanical Quote Matching
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Every single extracted quote is verified by an offline character-span locator against verbatim source text. If a quote is paraphrased or fabricated, it is rejected. Zero hallucinations enter your contract record.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => onNavigateToTab("evidence")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--surface-subtle)]/70 py-2 px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--forest)] hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <ShieldCheckIcon className="h-3.5 w-3.5 text-[var(--emerald-state)] group-hover:text-white" />
              <span>Inspect Verbatim Evidence</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#161B18]/90 p-5 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/40 group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-gradient-to-br dark:from-[var(--forest)] dark:to-[#153224] text-xs font-bold text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs">
                3
              </span>
              <span className="text-[10px] font-mono text-[var(--ink-subtle)] uppercase tracking-wider">
                Human-In-The-Loop
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Confirm or Draft Clarification
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              The AI only suggests preliminary statuses (<code className="rounded-md bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[11px]">proposed</code> or <code className="rounded-md bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[11px]">unclear</code>). Only <em>you</em> have the authority to confirm items into active scope or generate a polite, non-confrontational client reply in one click.
            </p>
          </div>

          <div className="mt-5 pt-3.5 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => onNavigateToTab("draft")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--surface-subtle)]/70 py-2 px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--forest)] hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <MessageSquareIcon className="h-3.5 w-3.5 text-[var(--forest)] group-hover:text-white" />
              <span>See One-Click Client Reply</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Helpful bottom callout bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.04] dark:border-white/[0.06] pt-4 text-xs text-[var(--ink-muted)]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[var(--emerald-state)] animate-pulse" />
          <span>
            <strong>Demo Workspace Loaded:</strong> You are exploring <em>Aura Health Portal Redesign</em> (Elena Vance & Marcus Miller).
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigateToTab("ledger")}
            className="text-[var(--forest)] font-semibold hover:underline cursor-pointer"
          >
            Jump to Agreement Ledger &rarr;
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--ink-subtle)] hover:text-[var(--ink)] text-[11px] cursor-pointer"
          >
            Dismiss Tour
          </button>
        </div>
      </div>
    </div>
  );
}
