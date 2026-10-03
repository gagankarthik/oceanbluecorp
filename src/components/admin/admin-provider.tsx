"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { CommandPalette } from "./command-palette";

interface OpenEditOptions {
  candidate?: Application | null;
  mode?: "create" | "edit";
  defaultJobId?: string;
}

interface AdminContextValue {
  openCandidateEditor: (opts?: OpenEditOptions) => void;
  openCommandPalette: () => void;
  /** Trailing breadcrumb shown in the top nav on detail pages (e.g. "APP-2026-0103"). */
  pageCrumb: string | null;
  setPageCrumb: (crumb: string | null) => void;
  /** Sidebar item to highlight when the URL alone cannot say (see useNavSection). */
  navSection: string | null;
  setNavSection: (href: string | null) => void;
}

const AdminContext = React.createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

/**
 * Set the trailing breadcrumb for the current detail page (cleared on unmount).
 * Pass the record's friendly code, e.g. `usePageCrumb(candidate?.applicationId)`.
 */
export function usePageCrumb(label: string | null | undefined) {
  const { setPageCrumb } = useAdmin();
  React.useEffect(() => {
    setPageCrumb(label || null);
    return () => setPageCrumb(null);
  }, [label, setPageCrumb]);
}

/**
 * Highlight `href` in the sidebar for this page (cleared on unmount).
 *
 * State roles and open roles share one detail route, /admin/jobs/[id], so the
 * path always reads as a state role. The record knows which list it came from.
 */
export function useNavSection(href: string | null | undefined) {
  const { setNavSection } = useAdmin();
  React.useEffect(() => {
    setNavSection(href || null);
    return () => setNavSection(null);
  }, [href, setNavSection]);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [pageCrumb, setPageCrumb] = React.useState<string | null>(null);
  const [navSection, setNavSection] = React.useState<string | null>(null);

  const openCandidateEditor = React.useCallback((opts: OpenEditOptions = {}) => {
    const isCreate = !opts.candidate && opts.mode !== "edit";
    if (isCreate) {
      const url = opts.defaultJobId
        ? `/admin/applications/new?jobId=${opts.defaultJobId}`
        : "/admin/applications/new";
      router.push(url);
      return;
    }
    // Edit mode, navigate to full-page edit form
    if (opts.candidate?.id) {
      router.push(`/admin/applications/${opts.candidate.id}/edit`);
    }
  }, [router]);

  const openCommandPalette = React.useCallback(() => setPaletteOpen(true), []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
      // Alt+Shift+N (⌥⇧N): Ctrl/⌘+Shift+C is the browser's inspect-element chord.
      // e.code, because Option on a Mac turns e.key into a dead/accented character.
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyN") {
        e.preventDefault();
        openCandidateEditor();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCandidateEditor]);

  const value = React.useMemo<AdminContextValue>(
    () => ({ openCandidateEditor, openCommandPalette, pageCrumb, setPageCrumb, navSection, setNavSection }),
    [openCandidateEditor, openCommandPalette, pageCrumb, navSection],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        userRole={user?.role ?? undefined}
        onCreateCandidate={() => {
          setPaletteOpen(false);
          openCandidateEditor();
        }}
      />
    </AdminContext.Provider>
  );
}
