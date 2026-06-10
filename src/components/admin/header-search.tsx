"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Briefcase, Users, UserStar, MessageSquareText } from "lucide-react";
import { Avatar } from "./avatar";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

interface Hit {
  type: "job" | "application" | "contact" | "candidate";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  status?: string;
}

/**
 * Regular top-bar search — a plain input with an inline results dropdown
 * (NOT a command-palette overlay). Type and matching jobs/candidates/contacts
 * appear right below; click or Enter to open. The ⌘K command palette still
 * exists for keyboard power users (registered in admin-provider), this just
 * gives the visible header a familiar, conventional search field.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  // Debounced search against the shared admin search endpoint.
  React.useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const h = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok) setHits(data.results || []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(h);
  }, [q]);

  React.useEffect(() => setActive(0), [hits]);

  // Close on outside click.
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (h: Hit) => { setOpen(false); setQ(""); setHits([]); router.push(h.link); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { if (hits[active]) go(hits[active]); }
    else if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
  };

  const showDropdown = open && q.trim().length > 0;

  return (
    <div ref={ref} className="relative hidden w-56 md:block lg:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search jobs, candidates…"
        aria-label="Search"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[var(--hz-cobalt)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(""); setHits([]); }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full z-[100] mt-1.5 w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
          {loading && hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">Searching…</div>
          ) : hits.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto py-1.5">
              {hits.map((h, i) => {
                const Icon = h.type === "job" ? Briefcase : h.type === "candidate" ? UserStar : h.type === "contact" ? MessageSquareText : Users;
                const isPerson = h.type === "application" || h.type === "candidate";
                return (
                  <button
                    key={`${h.type}-${h.id}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                      i === active ? "bg-[var(--hz-cobalt-100)]" : "hover:bg-slate-50",
                    )}
                  >
                    {isPerson ? (
                      <Avatar name={h.title} size="sm" />
                    ) : (
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-slate-100">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{h.title}</p>
                      <p className="truncate text-xs text-slate-500">{h.subtitle}</p>
                    </div>
                    {h.status && <StatusBadge status={h.status} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">No matches</p>
              <p className="mt-0.5 text-xs text-slate-400">Try another term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
