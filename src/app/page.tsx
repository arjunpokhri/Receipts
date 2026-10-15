"use client";

import React, { useState } from "react";
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

export default function Home() {
  const [project] = useState(SAMPLE_PROJECT);
  const [items, setItems] = useState<AgreementItem[]>(SAMPLE_PROJECT.initialItems);
  const [activeTab, setActiveTab] = useState<ActiveTab>("ledger");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // Calculate verified items count against source text
  const verifiedCount = items.filter((item) => {
    const thread = project.threads.find((t) => t.id === item.sourceThreadId) || project.threads[0];
    return verifyEvidence(thread.rawText, item.evidenceQuote).verified;
  }).length;

  const pendingCount = items.filter(
    (i) => i.status === "proposed" || i.status === "unclear"
  ).length;

  // Handlers for human-controlled agreement transitions
  const handleConfirmItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "confirmed",
              confirmedAt: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              confirmedBy: "Human Reviewer (Marcus Miller)",
            }
          : item
      )
    );
  };

  const handleDismissItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "dismissed",
              dismissedAt: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : item
      )
    );
  };

  const handleRestoreItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "proposed",
              dismissedAt: undefined,
            }
          : item
      )
    );
  };

  const handleReset = () => {
    setItems(SAMPLE_PROJECT.initialItems);
    setSelectedItemId(SAMPLE_PROJECT.initialItems[0]?.id || null);
  };

  const handleSelectItem = (item: AgreementItem) => {
    setSelectedItemId(item.id);
  };

  const handleAddLiveCandidate = (candidate: {
    id: string;
    claim: string;
    evidenceQuote: string;
    speaker: string;
    timestamp: string;
    commitmentType: AgreementItem["commitmentType"];
    speechAct: AgreementItem["speechAct"];
    suggestedStatus: "baseline" | "proposed" | "unclear";
    explanation: string;
  }) => {
    const newItem: AgreementItem = {
      id: candidate.id,
      claim: candidate.claim,
      evidenceQuote: candidate.evidenceQuote,
      speaker: candidate.speaker,
      timestamp: candidate.timestamp,
      commitmentType: candidate.commitmentType,
      speechAct: candidate.speechAct,
      status: candidate.suggestedStatus,
      explanation: `[Nebius Extraction] ${candidate.explanation}`,
      sourceThreadId: project.threads[0]?.id || "thread-kickoff",
    };
    setItems((prev) => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F5F0] text-[#20251F] font-sans antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        totalCount={items.length}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Project Header */}
        <Header
          project={project}
          items={items}
          onReset={handleReset}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-5">
          {/* Top Bento Overview */}
          <BentoOverview
            items={items}
            verifiedCount={verifiedCount}
            onSelectTab={(tab) => {
              setActiveTab(tab);
            }}
          />

          {/* Tab Content Display */}
          {activeTab === "ledger" && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className={selectedItem ? "xl:col-span-8" : "xl:col-span-12"}>
                <AgreementLedger
                  items={items}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onConfirmItem={handleConfirmItem}
                  onDismissItem={handleDismissItem}
                  onRestoreItem={handleRestoreItem}
                />
              </div>
              {selectedItem && (
                <div className="xl:col-span-4">
                  <EvidenceInspector
                    item={selectedItem}
                    threads={project.threads}
                    onClose={() => setSelectedItemId(null)}
                    onConfirmItem={handleConfirmItem}
                    onDismissItem={handleDismissItem}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "review" && (
            <RequestReview
              items={items}
              onSelectItem={(item) => {
                handleSelectItem(item);
                setActiveTab("evidence");
              }}
              onConfirmItem={handleConfirmItem}
              onDismissItem={handleDismissItem}
              onDraftForPending={() => setActiveTab("draft")}
            />
          )}

          {activeTab === "evidence" && (
            <div className="max-w-4xl mx-auto">
              <EvidenceInspector
                item={selectedItem}
                threads={project.threads}
                onClose={() => setActiveTab("ledger")}
                onConfirmItem={handleConfirmItem}
                onDismissItem={handleDismissItem}
              />
            </div>
          )}

          {activeTab === "draft" && (
            <div className="max-w-4xl mx-auto">
              <ReplyDraftPanel
                project={project}
                items={items}
                selectedItem={selectedItem}
              />
            </div>
          )}

          {activeTab === "trace" && (
            <div className="max-w-4xl mx-auto">
              <ExecutionTracePanel
                items={items}
                threads={project.threads}
              />
            </div>
          )}

          {activeTab === "custom" && (
            <div className="max-w-5xl mx-auto">
              <CustomTextVerifier onAddCandidateToLedger={handleAddLiveCandidate} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
