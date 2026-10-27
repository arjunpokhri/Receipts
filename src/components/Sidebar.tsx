"use client";

import React from "react";
import {
  HomeIcon,
  ReceiptIcon,
  LayersIcon,
  ShieldCheckIcon,
  MessageSquareIcon,
  FileTextIcon,
  SparklesIcon,
  XIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  BriefcaseIcon,
} from "./icons";

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
}: SidebarProps) {
  const navItems = [
    {
      id: "overview" as ActiveTab,
      label: "Home / Overview",
      description: "Workspace summary & workflow",
      icon: HomeIcon,
    },
    {
      id: "custom" as ActiveTab,
      label: "Analyze Conversation",
      description: "Extract commitments & verify quotes",
      icon: SparklesIcon,
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
  ];

  const renderContent = (isMobileDrawer = false) => {
    const collapsed = !isMobileDrawer && isCollapsed;

    return (
      <div className="flex h-full flex-col">
        {/* Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[var(--surface-border)] bg-[var(--paper)] ${
            collapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="flex h-9 w-9 items-center justify-center border border-[var(--ink)] bg-[var(--forest)] text-white shadow-[1px_1px_0px_var(--ink)] cursor-pointer transition-transform hover:scale-105"
                title="Receipts — Home / Overview"
                aria-label="Home Overview"
              >
                <ReceiptIcon className="h-4.5 w-4.5 text-white" />
              </button>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="mt-1 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer p-0.5"
                  title="Expand sidebar (Ctrl+B)"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpenIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("overview");
                  if (isMobileDrawer) setIsMobileOpen(false);
                }}
                className="flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center border border-[var(--ink)] bg-[var(--forest)] text-white shadow-[1px_1px_0px_var(--ink)] transition-transform group-hover:scale-105">
                  <ReceiptIcon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <span className="font-serif text-xl font-bold tracking-tight text-[var(--ink)] block leading-none">
                    Receipts
                  </span>
                  <span className="block text-[11px] font-sans text-[var(--ink-muted)] mt-0.5">
                    Agreement & Scope Tracker
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1">
                {!isMobileDrawer && onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--surface-border)] cursor-pointer transition-colors"
                    title="Collapse sidebar (Ctrl+B)"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftCloseIcon className="h-4 w-4" />
                  </button>
                )}

                {isMobileDrawer && (
                  <button
                    type="button"
                    className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Active Project Indicator */}
        <div
          className={`border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] shrink-0 transition-colors ${
            collapsed ? "p-2.5 flex justify-center" : "px-5 py-3"
          }`}
        >
          {collapsed ? (
            <div
              className="flex h-8 w-8 items-center justify-center border border-[var(--surface-border)] bg-[var(--paper-card)] text-[var(--ink-muted)]"
              title="Active Workspace: Aura Health Inc. (Sample Data)"
            >
              <BriefcaseIcon className="h-4 w-4 text-[var(--forest)]" />
            </div>
          ) : (
            <>
              <div className="text-[10px] font-sans font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
                Active Workspace
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="truncate text-xs font-semibold text-[var(--ink)]">
                  Aura Health Inc.
                </span>
                <span className="inline-flex items-center border border-[var(--surface-border)] bg-[var(--paper-card)] px-1.5 py-0.5 text-[10px] font-sans font-medium text-[var(--ink-muted)]">
                  Sample Data
                </span>
              </div>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className={`flex-1 overflow-y-auto ${
            collapsed ? "px-2 py-3 space-y-2" : "space-y-1 px-3.5 py-4"
          }`}
        >
          {!collapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
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
                  className={`relative flex h-10 w-10 mx-auto items-center justify-center border transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "border-[var(--forest)] bg-[var(--forest)] text-white shadow-[1.5px_1.5px_0px_var(--ink)]"
                      : "border-transparent text-[var(--ink-muted)] hover:border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                  }`}
                  title={`${item.label} — ${item.description}`}
                  aria-label={item.label}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.badge && (
                    <span
                      className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-[var(--paper)] ${
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
                className={`group relative flex w-full items-start gap-3 border px-3 py-2 text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "border-[var(--forest)] bg-[var(--paper-card)] text-[var(--ink)] shadow-[1px_1px_0px_var(--forest)]"
                    : "border-transparent text-[var(--ink-muted)] hover:border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 inset-y-1 w-0.5 bg-[var(--forest)]" />
                )}
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150 ${
                    isActive ? "text-[var(--forest)]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-xs ${
                        isActive ? "font-semibold text-[var(--ink)]" : "font-medium text-[var(--ink)]/90"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-sans font-medium ${
                          item.badgeColor === "amber"
                            ? "border border-[var(--amber-border)] bg-[var(--amber-bg)] text-[var(--amber-state)]"
                            : item.badgeColor === "emerald"
                            ? "border border-[var(--emerald-border)] bg-[var(--emerald-bg)] text-[var(--emerald-state)]"
                            : "border border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[var(--ink)]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-[var(--ink-subtle)]">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer / System Status */}
        <div
          className={`border-t border-[var(--surface-border)] shrink-0 bg-[var(--paper)] transition-colors ${
            collapsed ? "p-2.5 flex justify-center" : "p-3.5"
          }`}
        >
          {collapsed ? (
            <div
              className="flex h-8 w-8 items-center justify-center border border-[var(--surface-border)] bg-[var(--paper-card)]"
              title="Nebius & Deterministic Substring Verifier Ready"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald-state)] opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--emerald-state)]"></span>
              </span>
            </div>
          ) : (
            <div className="border border-[var(--surface-border)] bg-[var(--paper-card)] p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald-state)] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--emerald-state)]"></span>
                </span>
                <span className="text-[11px] font-semibold text-[var(--ink)]">
                  Nebius & Verifier Ready
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--ink-muted)]">
                Deterministic substring verifier active. Nebius Token Factory connected.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Permanent Desktop Sidebar with animated width collapse */}
      <aside
        className={`hidden lg:flex lg:h-full lg:shrink-0 lg:flex-col border-r border-[var(--surface-border)] bg-[var(--paper)] transition-all duration-300 ease-in-out ${
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
