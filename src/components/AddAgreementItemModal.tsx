"use client";

import React, { useState } from "react";
import {
  XIcon,
  ReceiptIcon,
  PlusIcon,
} from "./icons";
import type { AgreementItem, ProjectData } from "@/lib/sample-data";
import type { CommitmentType, ApplicationStatus } from "@/lib/schema";

interface AddAgreementItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: AgreementItem) => void;
  project: ProjectData;
}

export function AddAgreementItemModal({
  isOpen,
  onClose,
  onAddItem,
  project,
}: AddAgreementItemModalProps) {
  const [claim, setClaim] = useState("");
  const [evidenceQuote, setEvidenceQuote] = useState("");
  const [commitmentType, setCommitmentType] = useState<CommitmentType>("deliverables");
  const [status, setStatus] = useState<ApplicationStatus>("baseline");
  const [speaker, setSpeaker] = useState(project.clientName || project.clientCompany);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) {
      setError("Please describe the commitment or claim.");
      return;
    }
    if (!evidenceQuote.trim()) {
      setError("Please provide the quote or contract clause text as evidence.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const newItem: AgreementItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      claim: claim.trim(),
      evidenceQuote: evidenceQuote.trim(),
      speaker: speaker.trim() || project.clientName || "Client Agreement",
      timestamp: todayStr,
      commitmentType,
      speechAct: status === "baseline" ? "commitment" : "request",
      status,
      explanation: explanation.trim() || (status === "baseline" ? "Baseline contract obligation" : "Proposed client request"),
      sourceThreadId: project.threads[0]?.id || "manual-entry",
      sourceText: evidenceQuote.trim(),
      quoteVerified: true,
    };

    onAddItem(newItem);
    setClaim("");
    setEvidenceQuote("");
    setExplanation("");
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Agreement Item"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)] text-[var(--ink)] shadow-2xl transition-all">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--forest)] via-[var(--emerald-state)] to-[var(--forest)] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white shadow-2xs">
              <ReceiptIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-serif font-bold text-[var(--ink)] tracking-tight">
                Add Agreement Item to Ledger
              </h2>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Record an agreed contract term or proposed client deliverable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Category
              </label>
              <select
                value={commitmentType}
                onChange={(e) => setCommitmentType(e.target.value as CommitmentType)}
                className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
              >
                <option value="deliverables">Deliverable</option>
                <option value="prices">Price / Fee</option>
                <option value="deadlines">Deadline</option>
                <option value="revision_limits">Revision Cap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Agreement Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
              >
                <option value="baseline">Baseline (Original Contract)</option>
                <option value="confirmed">Confirmed (Approved by both)</option>
                <option value="proposed">Proposed (Client requested)</option>
                <option value="unclear">Unclear (Needs clarification)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Commitment / Claim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Deliver iOS and Android responsive prototypes by Nov 15th"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Verbatim Evidence Quote or Contract Clause <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Section 2.1: Contractor shall deliver responsive Figma prototypes for iOS and Android no later than November 15th."
              value={evidenceQuote}
              onChange={(e) => setEvidenceQuote(e.target.value)}
              className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] p-3 text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Speaker / Signing Party
              </label>
              <input
                type="text"
                placeholder={project.clientName || "Client"}
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Commercial Notes
              </label>
              <input
                type="text"
                placeholder="e.g., Standard milestone deliverable"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#181E1A] px-4 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#153224] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add to Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
