"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
// Chrome glyphs (search, close, arrows, the ⌘ mark) stay on lucide, the
// custom set is domain iconography and deliberately has no primitives for
// these. Everything that names a thing in this product uses ours.
import {
  Search, ArrowRight, Plus, CornerDownLeft, CommandIcon,
} from "lucide-react";
import {
  IconOverview, IconJob, IconApplication, IconBench, IconContact,
  IconClient, IconVendor, IconStaff, IconRoles, IconContent, IconSettings,
  IconUserStar,
} from "./icons";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { Kbd } from "./kbd";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "./empty-state";
import type { Application, Job } from "@/lib/aws/dynamodb";

interface SearchHit {
  type: "job" | "application" | "contact" | "candidate";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  status?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCandidate?: () => void;
  userRole?: string;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  roles?: string[]; // undefined = all roles
};

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",     href: "/admin",                icon: IconOverview },
  { name: "Job postings",  href: "/admin/jobs",           icon: IconJob,       keywords: "jobs positions roles" },
  { name: "Applications",  href: "/admin/applications",   icon: IconApplication,           keywords: "applicants candidates talent" },
  { name: "Talent bench",  href: "/admin/bench",          icon: IconBench,           keywords: "bench future" },
  { name: "Contacts",      href: "/admin/contacts",       icon: IconContact, roles: ["admin", "hr"] },
  { name: "Clients",       href: "/admin/clients",        icon: IconClient,        roles: ["admin", "hr"] },
  { name: "Vendors",       href: "/admin/vendors",        icon: IconVendor,        roles: ["admin", "hr"] },
  { name: "Users",         href: "/admin/users",          icon: IconStaff,         keywords: "team members", roles: ["admin"] },
  { name: "Roles",         href: "/admin/roles",          icon: IconRoles,          roles: ["admin"] },
  { name: "Content",       href: "/admin/content",        icon: IconContent,        roles: ["admin"] },
  { name: "Settings",      href: "/admin/settings",       icon: IconSettings,        roles: ["admin"] },
];

export function CommandPalette({ open, onOpenChange, onCreateCandidate, userRole }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter nav by role
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || !userRole || item.roles.includes(userRole),
  );

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setActiveIndex(0);
      // small delay so autofocus works after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search via debounce
  React.useEffect(() => {
    if (!query.trim()) { setHits([]); return; }
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) setHits(data.results || []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  // Build flat list of results for keyboard nav
  const filteredNav = NAV_ITEMS.filter((n) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return n.name.toLowerCase().includes(q) || n.keywords?.toLowerCase().includes(q);
  });

  const canPostJob = !userRole || ["admin", "hr", "sales"].includes(userRole);
  const quickActions = [
    { id: "new-candidate", label: "Add new applicant",  icon: Plus,     hint: "Open applicant editor",  roles: undefined, onSelect: () => onCreateCandidate?.() },
    { id: "new-job",       label: "Post new job",       icon: IconJob, hint: "Create job posting",    roles: ["admin", "hr", "sales"] as string[], onSelect: () => { onOpenChange(false); router.push("/admin/jobs/new"); } },
  ]
    .filter((a) => !a.roles || !userRole || a.roles.includes(userRole))
    .filter((a) => !query || a.label.toLowerCase().includes(query.toLowerCase()));

  const flatItems: { kind: "action" | "nav" | "hit"; payload: unknown; key: string }[] = [
    ...quickActions.map((a) => ({ kind: "action" as const, payload: a, key: a.id })),
    ...filteredNav.map((n) => ({ kind: "nav" as const, payload: n, key: n.href })),
    ...hits.map((h) => ({ kind: "hit" as const, payload: h, key: `${h.type}-${h.id}` })),
  ];

  const select = React.useCallback((item: typeof flatItems[number]) => {
    if (item.kind === "action") {
      (item.payload as { onSelect: () => void }).onSelect();
    } else if (item.kind === "nav") {
      const n = item.payload as typeof NAV_ITEMS[number];
      onOpenChange(false);
      router.push(n.href);
    } else {
      const h = item.payload as SearchHit;
      onOpenChange(false);
      router.push(h.link);
    }
  }, [router, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) select(item);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  React.useEffect(() => { setActiveIndex(0); }, [query]);

  // Close on Escape even when focus has left the search input.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* transparent click-away, keeps the rest of the screen visible */}
      <div className="fixed inset-0 z-[90]" onClick={() => onOpenChange(false)} />
      {/* Anchored under the top bar on the search side, not a centred modal. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="fixed right-3 top-[68px] z-[100] w-[min(620px,calc(100vw-1.5rem))] origin-top overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)] duration-150 animate-in fade-in slide-in-from-top-2 zoom-in-95 lg:right-6"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3">
          <Search className="h-[18px] w-[18px] flex-shrink-0 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
          <input
            ref={inputRef}
            autoComplete="off"
            aria-label="Search jobs, applications, candidates, or jump to a page"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, applications, candidates, or jump to a page…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
          />
          {loading && <div className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-[var(--adm-line)] border-t-[var(--adm-accent)]" aria-hidden="true" />}
          <Kbd className="hidden sm:inline-flex">Esc</Kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-1.5">
          {/* Quick actions */}
          {quickActions.length > 0 && (
            <Group title="Actions">
              {quickActions.map((a, idx) => {
                const flatIdx = flatItems.findIndex((f) => f.key === a.id);
                return (
                  <Item
                    key={a.id}
                    active={flatIdx === activeIndex}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    onClick={() => select(flatItems[flatIdx])}
                    icon={<a.icon className="h-4 w-4 text-[var(--adm-accent)]" />}
                    title={a.label}
                    subtitle={a.hint}
                    badge={idx === 0 ? <Kbd>⌘⇧C</Kbd> : null}
                  />
                );
              })}
            </Group>
          )}

          {/* Navigation */}
          {filteredNav.length > 0 && (
            <Group title="Go to">
              {filteredNav.map((n) => {
                const flatIdx = flatItems.findIndex((f) => f.key === n.href);
                return (
                  <Item
                    key={n.href}
                    active={flatIdx === activeIndex}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    onClick={() => select(flatItems[flatIdx])}
                    icon={<n.icon className="h-4 w-4 text-[var(--adm-ink-subtle)]" />}
                    title={n.name}
                    subtitle={n.href}
                  />
                );
              })}
            </Group>
          )}

          {/* Search hits */}
          {hits.length > 0 && (
            <Group title="Records">
              {hits.map((h) => {
                const flatIdx = flatItems.findIndex((f) => f.key === `${h.type}-${h.id}`);
                const Icon = h.type === "job" ? IconJob : h.type === "application" ? IconApplication : h.type === "candidate" ? IconUserStar : IconContact;
                return (
                  <Item
                    key={`${h.type}-${h.id}`}
                    active={flatIdx === activeIndex}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    onClick={() => select(flatItems[flatIdx])}
                    icon={
                      h.type === "application" || h.type === "candidate"
                        ? <Avatar name={h.title} size="sm" />
                        : <Icon className="h-4 w-4 text-[var(--adm-ink-subtle)]" />
                    }
                    title={h.title}
                    subtitle={h.subtitle}
                    badge={h.status ? <StatusBadge status={h.status} /> : null}
                  />
                );
              })}
            </Group>
          )}

          {!loading && flatItems.length === 0 && (
            <EmptyState
              variant="filtered"
              size="sm"
              icon={Search}
              title="No matches"
              description={`Nothing matches “${query.trim()}”. Try a name, an email or a page.`}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-2">
          <div className="flex items-center gap-3 text-[12px] text-[var(--adm-ink-subtle)]">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd><CornerDownLeft className="h-2.5 w-2.5" /></Kbd> select</span>
          </div>
          <div className="hidden items-center gap-1.5 text-[12px] text-[var(--adm-ink-subtle)] sm:flex">
            <CommandIcon className="h-3 w-3" /> Command palette
          </div>
        </div>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-1.5 py-1">
      <p className="px-2.5 pb-1 pt-1.5 text-[12.5px] font-medium text-[var(--adm-ink-subtle)]">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function Item({
  active, onClick, onMouseEnter, icon, title, subtitle, badge,
}: {
  active?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left transition-colors duration-150",
        active ? "bg-[var(--adm-accent-soft)]" : "hover:bg-[var(--adm-row-hover)]",
      )}
    >
      {/* Fixed slot so icons and avatars share one text edge. */}
      {icon && <span className="grid w-7 flex-none place-items-center">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--adm-ink)]">{title}</p>
        {subtitle && <p className="truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{subtitle}</p>}
      </div>
      {badge && <span className="hidden flex-none sm:inline-flex">{badge}</span>}
      {active && <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-accent)]" />}
    </button>
  );
}

