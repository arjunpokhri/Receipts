"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ReceiptIcon,
  LayersIcon,
  SparklesIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
} from "./icons";
import type { ActiveTab } from "./Sidebar";

interface InteractiveTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ActiveTab) => void;
}

interface TourStep {
  id: number;
  tag: string;
  title: string;
  headline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  tabTarget?: ActiveTab;
  tabLabel?: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tag: "Welcome to Receipts",
    title: "Scope Protection",
    headline: "Protect your work from unpaid scope creep",
    description:
      "Freelancers and agencies lose up to 20% of project revenue to subtle scope drift and unwritten promises. Receipts gives you an unshakeable, evidence-backed record of agreed commitments vs. ongoing client requests.",
    icon: ReceiptIcon,
    accentColor: "emerald",
    highlights: [
      "Evidence-backed contract baseline",
      "Human-in-the-loop review",
      "Zero hallucinations allowed",
    ],
  },
  {
    id: 2,
    tag: "Core Workflow",
    title: "Agreement Ledger",
    headline: "Your living source of truth for contract scope",
    description:
      "All project obligations are organized across 4 essential categories: Deliverables, Deadlines, Prices, and Revision Limits. Filter by Baseline vs. Proposed to see unapproved client requests at a glance.",
    icon: LayersIcon,
    accentColor: "forest",
    tabTarget: "ledger",
    tabLabel: "Jump to Agreement Ledger",
    highlights: [
      "Original contract baseline designated",
      "Instant status filtering (Baseline, Proposed, Unclear)",
      "Single-click export to Markdown",
    ],
  },
  {
    id: 3,
    tag: "AI Extraction",
    title: "Analyze Conversation",
    headline: "Extract promises from emails & chat threads",
    description:
      "Paste in client emails, Slack transcripts, or change request notes. Nebius Token Factory (NVIDIA Nemotron 3.5) structures unstructured conversation into crisp, verifiable commercial commitments.",
    icon: SparklesIcon,
    accentColor: "amber",
    tabTarget: "custom",
    tabLabel: "Try Live Conversation Extractor",
    highlights: [
      "Powered by NVIDIA Nemotron 3.5",
      "Categorizes commitments into 4 strict types",
      "Identifies speaker, speech act, and confidence",
    ],
  },
  {
    id: 4,
    tag: "Deterministic Proof",
    title: "Mechanical Quote Matching",
    headline: "Zero hallucinations enter your contract record",
    description:
      "Unlike ordinary LLM tools, every single quote extracted by AI must be verified by an offline character-span locator against exact source text. If a quote is paraphrased or fabricated, it is rejected.",
    icon: ShieldCheckIcon,
    accentColor: "emerald",
    tabTarget: "evidence",
    tabLabel: "Inspect Evidence Verifier",
    highlights: [
      "Character-for-character substring verification",
      "Exact character offset locator [start : end]",
      "Unicode quotes and whitespace variance normalization",
    ],
  },
  {
    id: 5,
    tag: "Commercial Protection",
    title: "Non-Confrontational Replies",
    headline: "Confirm new scope & quote add-ons peacefully",
    description:
      "When a client asks for extra work beyond original scope, Receipts automatically generates polite, professional replies citing verbatim contract text to confirm new scope and bill add-on fees before work begins.",
    icon: MessageSquareIcon,
    accentColor: "forest",
    tabTarget: "draft",
    tabLabel: "Open Reply Generator",
    highlights: [
      "Cites agreed baseline contract terms",
      "Maintains warm, diplomatic client relations",
      "One-click copy to clipboard",
    ],
  },
];

export function InteractiveTourModal({
  isOpen,
  onClose,
  onNavigateToTab,
}: InteractiveTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleClose = useCallback(() => {
    setCurrentStepIndex(0);
    onClose();
  }, [onClose]);

  // Keyboard navigation: Left/Right arrows and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleJumpToTab = (tab: ActiveTab) => {
    handleClose();
    onNavigateToTab(tab);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Product Tour"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      {/* Backdrop click dismiss */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)] text-[var(--ink)] shadow-2xl transition-all">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--forest)] via-[var(--emerald-state)] to-[var(--forest)]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white shadow-2xs">
              <ReceiptIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-semibold text-[var(--ink)] tracking-tight">
                Receipts Product Tour
              </div>
              <div className="text-[10px] text-[var(--ink-subtle)] font-mono">
                Step {currentStep.id} of {TOUR_STEPS.length}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close tour"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Badge & Icon Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forest)]/20 bg-[var(--forest-light)]/80 dark:bg-[var(--forest)]/20 px-3 py-0.5 text-[11px] font-sans font-medium text-[var(--forest)] dark:text-emerald-300">
                <span>{currentStep.tag}</span>
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
                {currentStep.headline}
              </h2>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--forest-light)] to-[var(--surface-subtle)] dark:from-[#1E2621] dark:to-[#141A16] border border-black/[0.06] dark:border-white/[0.08] text-[var(--forest)] dark:text-emerald-300 shadow-sm">
              <StepIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Feature Highlights */}
          <div className="space-y-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#151A17]/80 p-4">
            <div className="text-[11px] font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
              Key Capabilities:
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--ink-muted)]">
              {currentStep.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Direct Jump CTA */}
          {currentStep.tabTarget && (
            <button
              type="button"
              onClick={() => handleJumpToTab(currentStep.tabTarget!)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--forest)]/30 bg-[var(--forest-light)] dark:bg-[var(--forest)]/15 px-3.5 py-2 text-xs font-semibold text-[var(--forest)] dark:text-emerald-300 hover:bg-[var(--forest)] hover:text-white dark:hover:bg-[var(--forest)] transition-all cursor-pointer shadow-2xs group"
            >
              <span>{currentStep.tabLabel}</span>
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#141815]/50">
          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? "w-6 bg-[var(--forest)] dark:bg-emerald-400"
                    : "w-2 bg-black/[0.12] dark:bg-white/[0.15] hover:bg-black/[0.25]"
                }`}
                title={`Go to step ${step.id}: ${step.title}`}
                aria-label={`Step ${step.id}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#181E1A] px-3 py-1.5 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#153224] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <span>{isLast ? "Finish Tour" : "Next"}</span>
              {isLast ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
