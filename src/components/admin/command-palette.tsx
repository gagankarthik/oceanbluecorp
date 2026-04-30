"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ArrowRight, Plus, Briefcase, Users, UserStar, Building, MessageSquareText,
  Boxes, LayoutDashboard, Settings, UserCog, Shield, FileText, CornerDownLeft, CommandIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { StatusBadge } from "./status-badge";
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
  { name: "Dashboard",     href: "/admin",                icon: LayoutDashboard },
  { name: "Job Postings",  href: "/admin/jobs",           icon: Briefcase,       keywords: "jobs positions roles" },
  { name: "Applications",  href: "/admin/applications",   icon: Users,           keywords: "applicants candidates talent" },
  { name: "Talent Bench",  href: "/admin/bench",          icon: Boxes,           keywords: "bench future" },
  { name: "Contacts",      href: "/admin/contacts",       icon: MessageSquareText, roles: ["admin", "hr"] },
  { name: "Clients",       href: "/admin/clients",        icon: Building,        roles: ["admin", "hr"] },
  { name: "Vendors",       href: "/admin/vendors",        icon: Building,        roles: ["admin", "hr"] },
  { name: "Users",         href: "/admin/users",          icon: UserCog,         keywords: "team members", roles: ["admin"] },
  { name: "Roles",         href: "/admin/roles",          icon: Shield,          roles: ["admin"] },
  { name: "Content",       href: "/admin/content",        icon: FileText,        roles: ["admin"] },
  { name: "Settings",      href: "/admin/settings",       icon: Settings,        roles: ["admin"] },
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
    { id: "new-job",       label: "Post new job",       icon: Briefcase, hint: "Create job posting",    roles: ["admin", "hr", "sales"] as string[], onSelect: () => { onOpenChange(false); router.push("/admin/jobs/new"); } },
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-200"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search jobs, applications, candidates, or jump to a page…"
            className="flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {loading && <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
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
                    icon={<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><a.icon className="w-4 h-4 text-blue-600" /></div>}
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
                    icon={<div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><n.icon className="w-4 h-4 text-slate-600" /></div>}
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
                const Icon = h.type === "job" ? Briefcase : h.type === "application" ? Users : h.type === "candidate" ? UserStar : MessageSquareText;
                return (
                  <Item
                    key={`${h.type}-${h.id}`}
                    active={flatIdx === activeIndex}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    onClick={() => select(flatItems[flatIdx])}
                    icon={
                      h.type === "application" || h.type === "candidate"
                        ? <Avatar name={h.title} size="md" />
                        : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-600" /></div>
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
            <div className="py-12 text-center">
              <Search className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No matches</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1"><Kbd><CornerDownLeft className="w-2.5 h-2.5" /></Kbd> select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CommandIcon className="w-3 h-3" /> Command palette
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-1">
      <p className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
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
        "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors",
        active ? "bg-blue-50" : "hover:bg-slate-50",
      )}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-900 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      {badge}
      {active && <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      {children}
    </kbd>
  );
}
