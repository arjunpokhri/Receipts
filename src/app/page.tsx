"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, type ActiveTab } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { BentoOverview } from "@/components/BentoOverview";
import { AgreementLedger } from "@/components/AgreementLedger";
import { RequestReview } from "@/components/RequestReview";
import { EvidenceInspector } from "@/components/EvidenceInspector";
import { ReplyDraftPanel } from "@/components/ReplyDraftPanel";
import { ExecutionTracePanel } from "@/components/ExecutionTracePanel";
import { CustomTextVerifier } from "@/components/CustomTextVerifier";
import { SAMPLE_PROJECT, type AgreementItem } from "@/lib/sample-data";
import { verifyEvidence } from "@/lib/verifier";
import {
  confirmItemInLedger,
  dismissItemInLedger,
  restoreItemInLedger,
  addCandidateToLedgerItems,
  resolveItemSourceText,
  loadLedgerFromStorage,
  saveLedgerToStorage,
  clearLedgerStorage,
  type LiveCandidateInput,
} from "@/lib/ledger-actions";

export default function Home() {
  const [project] = useState(SAMPLE_PROJECT);
  const [items, setItems] = useState<AgreementItem[]>(SAMPLE_PROJECT.initialItems);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    SAMPLE_PROJECT.initialItems[0]?.id || null
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Restore theme, sidebar, and persisted ledger state on initial client mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("receipts-theme");
      const isDark = savedTheme
        ? savedTheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      queueMicrotask(() => {
        setTheme(isDark ? "dark" : "light");
      });
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }

      const savedSidebar = localStorage.getItem("receipts-sidebar-collapsed");
      if (savedSidebar === "true") {
        queueMicrotask(() => {
          setIsSidebarCollapsed(true);
        });
      }
    } catch {
      // Ignore storage read exceptions in sandboxed or private browser modes
    }
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B for collapsing sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("receipts-sidebar-collapsed", String(next));
          } catch {
            // ignore storage errors
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Restore persisted ledger state on initial client mount
  useEffect(() => {
    try {
      const stored = loadLedgerFromStorage();
      if (stored && stored.items.length > 0) {
        queueMicrotask(() => {
          setItems(stored.items);
          if (stored.selectedId && stored.items.some((i) => i.id === stored.selectedId)) {
            setSelectedItemId(stored.selectedId);
          }
        });
      }
    } catch (e) {
      console.warn("Could not load persisted ledger from storage:", e);
    } finally {
      setIsStorageInitialized(true);
    }
  }, []);

  // Persist ledger changes across user actions and additions
  useEffect(() => {
    if (!isStorageInitialized) return;
    try {
      saveLedgerToStorage(items, selectedItemId);
    } catch (e) {
      console.warn("Could not persist ledger to storage:", e);
    }
  }, [items, selectedItemId, isStorageInitialized]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("receipts-theme", next);
      } catch {
        // ignore
      }
      if (next === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
      return next;
    });
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("receipts-sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0] || null;

  // Calculate verified items count against each item's authoritative source text
  const verifiedCount = items.filter((item) => {
    const sourceText = resolveItemSourceText(item, project.threads);
    if (!sourceText) return false;
    return verifyEvidence(sourceText, item.evidenceQuote).verified;
  }).length;

  const pendingCount = items.filter(
    (i) => i.status === "proposed" || i.status === "unclear"
  ).length;

  // Handlers for human-controlled agreement transitions using pure domain functions
  const handleConfirmItem = (id: string) => {
    const result = confirmItemInLedger(items, id, project.threads);
    if (result.success) {
      setItems(result.items);
    } else {
      console.warn("Confirmation refused:", result.error);
    }
  };

  const handleDismissItem = (id: string) => {
    const result = dismissItemInLedger(items, id);
    if (result.success) {
      setItems(result.items);
    } else {
      console.warn("Dismissal refused:", result.error);
    }
  };

  const handleRestoreItem = (id: string) => {
    const result = restoreItemInLedger(items, id);
    if (result.success) {
      setItems(result.items);
    } else {
      console.warn("Restoration refused:", result.error);
    }
  };

  const handleReset = () => {
    clearLedgerStorage();
    setItems(SAMPLE_PROJECT.initialItems);
    setSelectedItemId(SAMPLE_PROJECT.initialItems[0]?.id || null);
  };

  const handleSelectItem = (item: AgreementItem) => {
    setSelectedItemId(item.id);
    setActiveTab("evidence");
  };

  const handleAddLiveCandidate = (
    candidate: LiveCandidateInput,
    sourceText: string
  ): { success: boolean; error?: string } => {
    const result = addCandidateToLedgerItems(items, candidate, sourceText);
    if (result.success && result.affectedItem) {
      setItems(result.items);
      setSelectedItemId(result.affectedItem.id);
      return { success: true };
    }
    return {
      success: false,
      error: result.error || "Failed to add candidate to ledger.",
    };
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)] font-sans antialiased transition-colors">
      {/* Persistent Left Sidebar (Fixed / Desktop with collapse, Modal / Mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        totalCount={items.length}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Project Header (Persistent at top of main workspace) */}
        <Header
          project={project}
          items={items}
          activeTab={activeTab}
          onNavigateToTab={(tab) => setActiveTab(tab)}
          onReset={handleReset}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Scrollable Main Content (Independently scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-5">
          {/* 1. Home / Overview Dashboard View */}
          {activeTab === "overview" && (
            <div className="animate-fade-in">
              <BentoOverview
                items={items}
                verifiedCount={verifiedCount}
                onSelectTab={(tab) => setActiveTab(tab)}
                onSelectItem={(item) => {
                  setSelectedItemId(item.id);
                  setActiveTab("evidence");
                }}
              />
            </div>
          )}

          {/* 2. Agreement Ledger View */}
          {activeTab === "ledger" && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 animate-fade-in">
              <div className={selectedItem ? "xl:col-span-8" : "xl:col-span-12"}>
                <AgreementLedger
                  items={items}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onConfirmItem={handleConfirmItem}
                  onDismissItem={handleDismissItem}
                  onRestoreItem={handleRestoreItem}
                  onOpenExtractor={() => setActiveTab("custom")}
                />
              </div>
              {selectedItem && (
                <div className="hidden xl:block xl:col-span-4">
                  <EvidenceInspector
                    item={selectedItem}
                    allItems={items}
                    onSelectItem={(it) => setSelectedItemId(it.id)}
                    threads={project.threads}
                    onClose={() => setSelectedItemId(null)}
                    onConfirmItem={handleConfirmItem}
                    onDismissItem={handleDismissItem}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. Scope & Request Review View */}
          {activeTab === "review" && (
            <div className="max-w-5xl mx-auto animate-fade-in">
              <RequestReview
                items={items}
                onSelectItem={handleSelectItem}
                onConfirmItem={handleConfirmItem}
                onDismissItem={handleDismissItem}
                onDraftForPending={() => setActiveTab("draft")}
              />
            </div>
          )}

          {/* 4. Evidence Inspector Dedicated View */}
          {activeTab === "evidence" && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <EvidenceInspector
                item={selectedItem}
                allItems={items}
                onSelectItem={(it) => setSelectedItemId(it.id)}
                threads={project.threads}
                onClose={() => setActiveTab("ledger")}
                onConfirmItem={handleConfirmItem}
                onDismissItem={handleDismissItem}
              />
            </div>
          )}

          {/* 5. Clarification Reply Draft View */}
          {activeTab === "draft" && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <ReplyDraftPanel
                project={project}
                items={items}
                selectedItem={selectedItem}
              />
            </div>
          )}

          {/* 6. Execution Audit Trace View */}
          {activeTab === "trace" && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <ExecutionTracePanel
                items={items}
                threads={project.threads}
              />
            </div>
          )}

          {/* 7. Analyze Conversation Hub View */}
          {activeTab === "custom" && (
            <div className="max-w-5xl mx-auto animate-fade-in">
              <CustomTextVerifier
                onAddCandidateToLedger={handleAddLiveCandidate}
                onNavigateToLedger={(itemId) => {
                  if (itemId) setSelectedItemId(itemId);
                  setActiveTab("ledger");
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
