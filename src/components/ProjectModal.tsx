"use client";

import React, { useState } from "react";
import {
  XIcon,
  CheckIcon,
  ReceiptIcon,
  SparklesIcon,
  FileTextIcon,
  PlusIcon,
} from "./icons";
import { SAMPLE_PROJECT, type ProjectData, type ConversationThread } from "@/lib/sample-data";
import { loadAllProjects, saveProject } from "@/lib/project-storage";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: ProjectData;
  onSelectProject: (project: ProjectData) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  activeProject,
  onSelectProject,
}: ProjectModalProps) {
  const [projects, setProjects] = useState<ProjectData[]>(() => loadAllProjects());
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [contractText, setContractText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (project: ProjectData) => {
    onSelectProject(project);
    onClose();
  };

  const handleStartCreate = () => {
    setTitle("");
    setClientCompany("");
    setClientName("");
    setContractorName(activeProject.contractorName || "");
    setCurrency("USD");
    setContractText("");
    setFormError(null);
    setIsCreating(true);
  };

  const handleSaveNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Project Title is required.");
      return;
    }
    if (!clientCompany.trim()) {
      setFormError("Client Company is required.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const threads: ConversationThread[] = [];
    if (contractText.trim()) {
      threads.push({
        id: `thread-${Date.now()}`,
        title: "Master Services Agreement & Baseline Statement of Work",
        channel: "Email",
        date: todayStr,
        participants: [
          contractorName.trim() || "Contractor",
          clientName.trim() || clientCompany.trim(),
        ],
        rawText: contractText.trim(),
      });
    }

    const newProject: ProjectData = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      clientCompany: clientCompany.trim(),
      clientName: clientName.trim() || clientCompany.trim(),
      contractorName: contractorName.trim() || "Lead Agency / Contractor",
      startDate: todayStr,
      currency,
      threads,
      initialItems: [],
    };

    const updated = saveProject(newProject);
    setProjects(updated);
    onSelectProject(newProject);
    setIsCreating(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workspace & Project Manager"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-[var(--paper)] text-[var(--ink)] shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--forest)] via-[var(--emerald-state)] to-[var(--forest)] shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white shadow-2xs">
              <ReceiptIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-serif font-bold text-[var(--ink)] tracking-tight">
                {isCreating ? "Create New Product Workspace" : "Select Project Workspace"}
              </h2>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {isCreating
                  ? "Configure your real client contract & baseline agreement"
                  : "Switch between client contracts or start your own workspace"}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isCreating ? (
            <form onSubmit={handleSaveNewProject} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Zenith — Mobile App V2 Redesign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Client Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Technologies Inc."
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Client Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sarah Jenkins (VP Product)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Your Agency / Contractor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Studio Dimri"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Project Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Baseline Contract / Statement of Work (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste your signed SOW, proposal terms, or initial contract email here. Quotes from this text will be mechanically verified as your baseline."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#151A17] p-3 text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)] shadow-2xs leading-relaxed"
                />
                <p className="mt-1 text-[11px] text-[var(--ink-subtle)]">
                  You can also paste and extract live correspondence anytime in the <strong>Analyze Conversation</strong> tab.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#181E1A] px-4 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--forest)] to-[#153224] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="text-[11px] font-semibold text-[var(--ink-subtle)] uppercase tracking-wider font-mono">
                  Available Workspaces:
                </div>

                {projects.map((proj) => {
                  const isCurrent = proj.id === activeProject.id;
                  const isDemo = proj.id === SAMPLE_PROJECT.id;

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleSelect(proj)}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all cursor-pointer ${
                        isCurrent
                          ? "border-[var(--forest)]/50 bg-[var(--forest-light)]/70 dark:bg-[var(--forest)]/20 shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161B18] hover:border-black/[0.12] dark:hover:border-white/[0.15]"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[var(--ink)] truncate">
                            {proj.title}
                          </span>
                          {isDemo && (
                            <span className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.2 text-[10px] font-medium text-amber-700 dark:text-amber-300 font-sans">
                              Demo Showcase
                            </span>
                          )}
                          {isCurrent && (
                            <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.2 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 font-sans">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-x-2">
                          <span className="font-medium">{proj.clientCompany}</span>
                          <span className="text-[var(--ink-subtle)]">•</span>
                          <span>{proj.contractorName}</span>
                          <span className="text-[var(--ink-subtle)]">•</span>
                          <span className="font-mono text-[11px] text-[var(--ink-subtle)]">
                            {proj.threads.length} threads
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--forest)] text-white shadow-xs">
                            <CheckIcon className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(proj);
                            }}
                            className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#181E1A] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer shadow-2xs"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create New Project Callout */}
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--forest)]/40 hover:border-[var(--forest)] bg-[var(--forest-light)]/40 dark:bg-[var(--forest)]/10 hover:bg-[var(--forest-light)]/80 p-3.5 text-xs font-semibold text-[var(--forest)] dark:text-emerald-300 transition-all cursor-pointer shadow-2xs group"
                >
                  <PlusIcon className="h-4 w-4 text-[var(--forest)] dark:text-emerald-300 transition-transform group-hover:scale-110" />
                  <span>+ Add Your Actual Product / Client Project</span>
                </button>
              </div>

              {/* Helpful Explainer */}
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)]/70 p-3.5 text-xs text-[var(--ink-muted)] flex items-start gap-2.5">
                <FileTextIcon className="h-4 w-4 text-[var(--forest)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>How to use Receipts with your actual product:</strong> Create a workspace for your client project, then use <em>Analyze Conversation</em> to paste real client correspondence, or add items directly to your <em>Agreement Ledger</em>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
