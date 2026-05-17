"use client";

import { useState } from "react";

import { SearchBar } from "./components/search-bar";
import { Sidebar } from "./components/sidebar";

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2.5 4.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 9h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface Workspace {
  id: string;
  name: string;
}

export function AppShell({
  headerLeft,
  headerRight,
  children,
  hasWorkspace,
  workspaces,
  activeWorkspaceId,
  userEmail,
}: {
  headerLeft: React.ReactNode;
  headerRight: React.ReactNode;
  children: React.ReactNode;
  hasWorkspace: boolean;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  userEmail: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setDesktopCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        desktopCollapsed={desktopCollapsed}
        hasWorkspace={hasWorkspace}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        userEmail={userEmail}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-4 md:px-6 py-3 shrink-0 border-b border-(--color-outline-variant)/30 bg-(--color-surface)/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-(--color-surface-container-low) ghost-border text-(--color-on-surface-variant) hover:text-(--color-on-surface) hover:bg-(--color-surface-container-high) transition-colors shrink-0"
            >
              <HamburgerIcon />
            </button>
            <div className="shrink-0 hidden sm:flex">{headerLeft}</div>

            <div className="flex-1 flex justify-center px-2">
              <SearchBar />
            </div>

            <div className="shrink-0">{headerRight}</div>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
