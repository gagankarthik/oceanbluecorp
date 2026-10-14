"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Application } from "@/lib/aws/dynamodb";
import { titleFor, usePortalChrome } from "@/components/portal/chrome";

interface OpenEditOptions {
  candidate?: Application | null;
  mode?: "create" | "edit";
  defaultJobId?: string;
}

interface AdminContextValue {
  openCandidateEditor: (opts?: OpenEditOptions) => void;
  /** Focuses the portal top-bar search. */
  openCommandPalette: () => void;
  /** Record label on detail pages (e.g. "APP-2026-0103"); titles the tab. */
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

/** Name the current record in the tab title (cleared on unmount). */
export function usePageCrumb(label: string | null | undefined) {
  const { setPageCrumb } = useAdmin();
  React.useEffect(() => {
    setPageCrumb(label || null);
    return () => setPageCrumb(null);
  }, [label, setPageCrumb]);
}

/**
 * Highlight `href` in the sidebar for this page (cleared on unmount). State and
 * open roles share /portal/jobs/[id]; the record knows which list it belongs to.
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
  const pathname = usePathname() ?? "/portal";
  const chrome = usePortalChrome();
  const [pageCrumb, setCrumb] = React.useState<string | null>(null);
  const [navSection, setSection] = React.useState<string | null>(null);

  // These pages are client components with no metadata of their own, so title the tab here.
  React.useEffect(() => {
    document.title = `${pageCrumb ?? titleFor(pathname)} | Oceanblue Portal`;
  }, [pageCrumb, pathname]);

  // The portal shell owns the sidebar highlight and search.
  const setPageCrumb = React.useCallback((c: string | null) => setCrumb(c), []);
  const setNavSection = React.useCallback((h: string | null) => { setSection(h); chrome?.setNavSection(h); }, [chrome]);
  const openCommandPalette = React.useCallback(() => chrome?.openSearch(), [chrome]);

  const openCandidateEditor = React.useCallback((opts: OpenEditOptions = {}) => {
    const isCreate = !opts.candidate && opts.mode !== "edit";
    if (isCreate) {
      router.push(opts.defaultJobId ? `/portal/applications/new?jobId=${opts.defaultJobId}` : "/portal/applications/new");
      return;
    }
    if (opts.candidate?.id) router.push(`/portal/applications/${opts.candidate.id}/edit`);
  }, [router]);

  const value = React.useMemo<AdminContextValue>(
    () => ({ openCandidateEditor, openCommandPalette, pageCrumb, setPageCrumb, navSection, setNavSection }),
    [openCandidateEditor, openCommandPalette, pageCrumb, setPageCrumb, navSection, setNavSection],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
