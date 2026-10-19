"use client";

import { createContext, useContext } from "react";
import { navItems, type NavItem } from "@/lib/portal/roles";

/** What console pages tell the shell: open search, and the sidebar item to light. */
export type PortalChrome = {
  /** Focus the top-bar record search (Ctrl/⌘ K). */
  openSearch: () => void;
  /** Sidebar href to highlight when the URL can't say (job pages serve both role lists). */
  setNavSection: (href: string | null) => void;
  /** The section name the shell header shows; a page header with the same title hides its own. */
  sectionTitle?: string;
};

const ChromeContext = createContext<PortalChrome | null>(null);
export const ChromeProvider = ChromeContext.Provider;

/** Null outside the portal shell. */
export function usePortalChrome() {
  return useContext(ChromeContext);
}

// Screens with no sidebar entry, filed under the item they belong to.
const ALIASES: Record<string, string> = {
  "/portal/candidates": "/portal/applications",
  "/portal/applications/new": "/portal/applications",
  "/portal/lead-sourcing": "/portal/talent-bench",
  "/portal/roles": "/portal/users",
  "/portal/api-keys": "/portal/developer",
  "/portal/docs": "/portal/developer",
};

const TITLES: Record<string, string> = {
  "/portal/candidates": "Candidate",
  "/portal/applications/new": "Add applicant",
  "/portal/jobs": "Job posting",
  "/portal/jobs/new": "New job posting",
  "/portal/lead-sourcing": "Lead sourcing",
  "/portal/roles": "Roles",
  "/portal/api-keys": "API keys",
  "/portal/docs": "Developer docs",
  "/portal/settings": "Settings",
  "/portal/notifications": "Notifications",
  "/portal/help": "Help",
};

const longest = (path: string, keys: string[]) =>
  keys.filter((p) => path === p || path.startsWith(p + "/")).sort((a, b) => b.length - a.length)[0];

/** The sidebar item a path sits under. */
export function navItemFor(path: string): NavItem | undefined {
  const alias = longest(path, Object.keys(ALIASES));
  const target = alias ? ALIASES[alias] : path;
  const href = longest(target, navItems.map((i) => i.href).filter((h) => h !== "/portal"));
  return navItems.find((i) => i.href === (href ?? (target === "/portal" ? "/portal" : undefined)));
}

/** Tab title for a path. */
export function titleFor(path: string): string {
  const key = longest(path, Object.keys(TITLES));
  return key ? TITLES[key] : navItemFor(path)?.label ?? "Portal";
}
