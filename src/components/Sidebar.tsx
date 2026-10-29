"use client";

import React from "react";
import {
  HomeIcon,
  ReceiptIcon,
  LayersIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  FileTextIcon,
  XIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  HelpCircleIcon,
} from "./icons";
import type { ProjectData } from "@/lib/sample-data";

export type ActiveTab =
  | "overview"
  | "custom"
  | "ledger"
  | "review"
  | "evidence"
  | "draft"
  | "trace";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount: number;
  totalCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenGuide?: () => void;
  project?: ProjectData;
  onOpenProjectModal?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  totalCount,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed = false,
  onToggleCollapse,
  onOpenGuide,
  project,
  onOpenProjectModal,
}: SidebarProps) {
  const coreWorkflowItems = [
    {
      id: "overview" as ActiveTab,
      label: "Home / Overview",
      description: "Workspace summary & live scope bridge",
      icon: HomeIcon,
    },
    {
      id: "custom" as ActiveTab,
      label: "Analyze Conversation",
      description: "Extract commitments & verify quotes",
      icon: MessageSquareIcon,
      badge: "Live AI",
      badgeColor: "emerald",
    },
    {
      id: "ledger" as ActiveTab,
      label: "Agreement Ledger",
      description: "Canonical commitments of record",
      icon: ReceiptIcon,
      badge: `${totalCount}`,
    },
    {
      id: "review" as ActiveTab,
      label: "Scope Drift Review",
      description: "Delta analysis & change proposals",
      icon: LayersIcon,
      badge: pendingCount > 0 ? `${pendingCount} pending` : undefined,
      badgeColor: "amber",
    },
  ];

  const toolsAndProofItems = [
    {
      id: "evidence" as ActiveTab,
      label: "Evidence Inspector",
      description: "Verbatim quote substring verification",
      icon: ShieldCheckIcon,
    },
    {
      id: "draft" as ActiveTab,
      label: "Clarification Reply",
      description: "Client-facing alignment copy",
      icon: MessageSquareIcon,
    },
    {
      id: "trace" as ActiveTab,
      label: "Execution Audit",
      description: "Deterministic checks & schema audit",
      icon: FileTextIcon,
    },
  ];

  const renderNavSection = (
    title: string,
    items: typeof coreWorkflowItems,
    collapsed: boolean,
    isMobileDrawer: boolean
  ) => {
    return (
      <div className="space-y-1">
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-sans font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
            {title}
          </div>
        )}

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (collapsed) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileDrawer) setIsMobileOpen(false);
                }}
                className={`group relative flex h-10 w-10 mx-auto items-center justify-center rounded-xl transition-colors duration-100 ease-out cursor-pointer ${
                  isActive
                    ? "bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white border border-[var(--forest)]/25 dark:border-transparent shadow-2xs dark:shadow-md dark:shadow-[var(--forest)]/25"
                    : "text-[var(--ink-muted)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[var(--ink)]"
                }`}
                title={`${item.label} — ${item.description}`}
                aria-label={item.label}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-100 ${isActive ? "scale-105" : "group-hover:scale-105"}`} />
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--paper)] ${
                      item.badgeColor === "amber"
                        ? "bg-amber-500"
                        : item.badgeColor === "emerald"
                        ? "bg-emerald-500"
                        : "bg-[var(--forest)]"
                    }`}
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                if (isMobileDrawer) setIsMobileOpen(false);
              }}
              title={item.description}
              className={`group relative flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left transition-colors duration-100 ease-out cursor-pointer ${
                isActive
                  ? "bg-[var(--forest-light)] dark:bg-[var(--forest)] text-[var(--forest)] dark:text-white font-semibold border border-[var(--forest)]/25 dark:border-transparent shadow-2xs dark:shadow-md dark:shadow-[var(--forest)]/20"
                  : "text-[var(--ink-muted)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[var(--ink)]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors duration-100 ${
                    isActive ? "text-[var(--forest)] dark:text-emerald-200" : "text-[var(--ink-subtle)] group-hover:text-[var(--ink)]"
                  }`}
                />
                <span className="truncate text-xs tracking-tight">
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-sans font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--forest)]/10 text-[var(--forest)] font-semibold dark:bg-white/20 dark:text-white"
                      : item.badgeColor === "amber"
                      ? "border border-[var(--amber-border)] bg-[var(--amber-bg)] text-[var(--amber-state)]"
                      : item.badgeColor === "emerald"
                      ? "border border-[var(--emerald-border)] bg-[var(--emerald-bg)] text-[var(--emerald-state)]"
                      : "border border-black/[0.06] dark:border-white/[0.08] bg-[var(--surface-subtle)] text-[var(--ink)]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = (isMobileDrawer = false) => {
    const collapsed = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex h-full flex-col">
        {/* Unified Brand & Workspace Header */}
        <div
          className={`shrink-0 border-b border-black/[0.05] dark:border-white/[0.06] ${
            collapsed ? "py-4 px-2 flex flex-col items-center gap-3" : "p-4"
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-[#181E1A] border border-black/[0.08] dark:border-white/[0.1] shadow-md shadow-[var(--forest)]/10 cursor-pointer transition-transform hover:scale-105 p-1"
                title="Receipts — Home / Overview"
                aria-label="Home Overview"
              >
                <div id="sidebar-brand-logo-collapsed-img" className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center">
                  <img src="/Receipts_Verified.png" alt="Receipts Logo" className="h-full w-full object-contain" />
                </div>
              </button>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="text-[var(--ink-subtle)] hover:text-[var(--ink)] cursor-pointer p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
                  title="Expand sidebar (Ctrl+B)"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpenIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Brand Row */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    if (isMobileDrawer) setIsMobileOpen(false);
                  }}
                  className="flex items-center gap-3 text-left cursor-pointer group"
                >
                  <div
                    id="sidebar-brand-logo-img"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-[var(--forest)]/15 border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#181E1A] p-1 transition-transform group-hover:scale-105 shrink-0"
                  >
                    <img src="/Receipts_Verified.png" alt="Receipts Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span className="font-serif text-xl font-bold tracking-tight text-[var(--ink)] block leading-tight">
                      Receipts
                    </span>
                    <span className="text-[10px] font-sans font-medium text-[var(--ink-subtle)] uppercase tracking-wider block">
                      Scope Ledger
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  {!isMobileDrawer && onToggleCollapse && (
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="p-1.5 text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg cursor-pointer transition-colors"
                      title="Collapse sidebar (Ctrl+B)"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeftCloseIcon className="h-4 w-4" />
                    </button>
                  )}

                  {isMobileDrawer && (
                    <button
                      type="button"
                      className="p-1.5 text-[var(--ink-subtle)] hover:text-[var(--ink)] cursor-pointer rounded-lg hover:bg-black/[0.04]"
                      onClick={() => setIsMobileOpen(false)}
                      aria-label="Close sidebar"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Workspace Pill Selector */}
              {onOpenProjectModal ? (
                <button
                  type="button"
                  onClick={onOpenProjectModal}
                  className="w-full flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#181E1A]/80 hover:border-[var(--forest)]/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] px-2.5 py-1.5 shadow-2xs transition-all cursor-pointer group text-left"
                  title="Switch or create project workspace"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate text-xs font-semibold text-[var(--ink)]">
                      {project?.clientCompany || "Aura Health Inc."}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--forest)] dark:text-emerald-300 group-hover:underline shrink-0">
                    Switch &rarr;
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#181E1A]/80 px-2.5 py-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate text-xs font-semibold text-[var(--ink)]">
                      {project?.clientCompany || "Aura Health Inc."}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--ink-subtle)] shrink-0">
                    Workspace
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav
          className={`flex-1 overflow-y-auto ${
            collapsed ? "px-2 py-3 space-y-4" : "px-3 py-3 space-y-4"
          }`}
        >
          {renderNavSection("Workflow", coreWorkflowItems, collapsed, isMobileDrawer)}
          {renderNavSection("Intelligence & Audit", toolsAndProofItems, collapsed, isMobileDrawer)}
        </nav>

        {/* Streamlined Footer */}
        <div
          className={`shrink-0 border-t border-black/[0.05] dark:border-white/[0.06] bg-[var(--paper)]/50 ${
            collapsed ? "p-3 flex flex-col items-center gap-2.5" : "p-3.5 space-y-2"
          }`}
        >
          {collapsed ? (
            <>
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ink-muted)] hover:text-[var(--forest)] hover:bg-[var(--forest-light)] cursor-pointer transition-colors"
                  title="How Receipts Works — Quick Start Tour"
                  aria-label="Quick Start Tour"
                >
                  <HelpCircleIcon className="h-4.5 w-4.5" />
                </button>
              )}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                title="Nemotron 3.5 & Verifier Active"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </>
          ) : (
            <>
              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--forest)] hover:bg-[var(--forest-light)]/70 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <HelpCircleIcon className="h-4 w-4 text-[var(--forest)]" />
                    <span>How Receipts Works</span>
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ink-subtle)] group-hover:text-[var(--forest)]">
                    Tour &rarr;
                  </span>
                </button>
              )}

              {/* Minimal Live Status Indicator */}
              <div className="flex items-center justify-between rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-[#181E1A]/60 px-3 py-2 text-[11px] shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="font-medium text-[var(--ink-muted)]">
                    Nemotron 3.5
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Active
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Permanent Desktop Sidebar with animated width collapse */}
      <aside
        className={`hidden lg:flex lg:h-full lg:shrink-0 lg:flex-col border-r border-[var(--surface-border)] bg-[var(--paper)]/92 backdrop-blur-sm transition-[width] duration-200 ease-out ${
          isCollapsed ? "lg:w-[72px]" : "lg:w-64"
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Modal Drawer (always expanded for usability) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 h-full flex-col border-r border-[var(--surface-border)] bg-[var(--paper)] shadow-xl">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
