"use client";

import React from "react";
import {
  ReceiptIcon,
  LayersIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  FileTextIcon,
  SparklesIcon,
  XIcon,
} from "./icons";

export type ActiveTab =
  | "ledger"
  | "review"
  | "evidence"
  | "draft"
  | "trace"
  | "custom";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount: number;
  totalCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  totalCount,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const navItems = [
    {
      id: "ledger" as ActiveTab,
      label: "Agreement Ledger",
      description: "Canonical commitments of record",
      icon: ReceiptIcon,
      badge: `${totalCount}`,
    },
    {
      id: "review" as ActiveTab,
      label: "Scope & Request Review",
      description: "Delta analysis & change proposals",
      icon: LayersIcon,
      badge: pendingCount > 0 ? `${pendingCount} pending` : undefined,
      badgeColor: "amber",
    },
    {
      id: "evidence" as ActiveTab,
      label: "Evidence Inspector",
      description: "Verbatim quote substring verification",
      icon: ShieldCheckIcon,
    },
    {
      id: "draft" as ActiveTab,
      label: "Clarification Reply Draft",
      description: "Client-facing alignment copy",
      icon: MessageSquareIcon,
    },
    {
      id: "trace" as ActiveTab,
      label: "Execution Audit Trace",
      description: "Deterministic checks & schema audit",
      icon: FileTextIcon,
    },
    {
      id: "custom" as ActiveTab,
      label: "Live Extractor & Verifier",
      description: "Nebius AI extraction & quote check",
      icon: SparklesIcon,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[#20251F]/10 bg-[#F6F5F0] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-[#20251F]/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#20251F] bg-[#244D3A] text-white shadow-[1px_1px_0px_#20251F]">
              <ReceiptIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#20251F]">
                Receipts
              </span>
              <span className="block text-[11px] font-sans text-[#576356]">
                Agreement & Scope Tracker
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1 text-[#576356] hover:text-[#20251F] lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Project Selector Indicator */}
        <div className="border-b border-[#20251F]/10 bg-[#E7EEE8]/40 px-5 py-3">
          <div className="text-[11px] font-sans font-medium text-[#576356]">
            Active Workspace
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="truncate text-xs font-semibold text-[#20251F]">
              Aura Health Inc.
            </span>
            <span className="inline-flex items-center border border-[#20251F]/15 bg-white px-1.5 py-0.5 text-[10px] font-sans text-[#576356]">
              Sample
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-4">
          <div className="px-2 pb-1.5 text-[11px] font-sans font-medium text-[#889386]">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`group relative flex w-full items-start gap-3 border px-3 py-2 text-left transition-all ${
                  isActive
                    ? "border-[#244D3A] bg-white text-[#20251F] shadow-[1px_1px_0px_#244D3A]"
                    : "border-transparent text-[#576356] hover:border-[#20251F]/15 hover:bg-[#E7EEE8]/50 hover:text-[#20251F]"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-[#244D3A]" : "text-[#576356] group-hover:text-[#20251F]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-xs ${
                        isActive ? "font-semibold text-[#20251F]" : "font-medium text-[#3D473C]"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-sans font-medium ${
                          item.badgeColor === "amber"
                            ? "border border-[#C58A36]/50 bg-[#FAF3E8] text-[#9A6518]"
                            : "border border-[#20251F]/15 bg-[#E7EEE8] text-[#20251F]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-[#889386]">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div className="border-t border-[#20251F]/10 p-3.5">
          <div className="border border-[#20251F]/10 bg-white/70 p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E7D5B] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2E7D5B]"></span>
              </span>
              <span className="text-[11px] font-semibold text-[#20251F]">
                Nebius & Verifier Ready
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#576356]">
              Deterministic verifier active. Nemotron-3.5-Lightning extraction endpoint connected.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
