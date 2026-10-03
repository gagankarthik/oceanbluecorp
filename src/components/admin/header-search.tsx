"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { IconJob, IconApplication, IconUserStar, IconContact, IconSearch } from "./icons";
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
 * Regular top-bar search, a plain input with an inline results dropdown
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
  const listId = React.useId();
  const optId = (i: number) => `${listId}-opt-${i}`;

  // Debounced; aborts the superseded request so a slow reply can't overwrite a newer one.
  React.useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const ctrl = new AbortController();
    const h = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (res.ok) setHits(data.results || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setHits([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(h); ctrl.abort(); };
  }, [q]);

  React.useEffect(() => setActive(0), [hits]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (open) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (h: Hit) => { setOpen(false); setQ(""); setHits([]); router.push(h.link); };

  const showDropdown = open && q.trim().length > 0;
  const listOpen = showDropdown && hits.length > 0;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Home" && listOpen) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && listOpen) { e.preventDefault(); setActive(hits.length - 1); }
    else if (e.key === "Enter") { if (listOpen && hits[active]) { e.preventDefault(); go(hits[active]); } }
    else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); } else if (q) setQ("");
    }
  };

  return (
    <div ref={ref} className="relative hidden w-[min(22rem,34vw)] md:block lg:w-[26rem] xl:w-[32rem]">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
      <input
        type="text"
        role="combobox"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={listOpen && hits[active] ? optId(active) : undefined}
        autoComplete="off"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search jobs, candidates…"
        aria-label="Search jobs, candidates and contacts"
        className="h-9 w-full rounded-[var(--adm-radius-input)] border border-[var(--adm-line-input)] bg-[var(--adm-surface-sunken)] pl-9 pr-8 text-[13.5px] text-[var(--adm-ink)] transition-colors placeholder:text-[var(--adm-ink-subtle)] hover:border-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:bg-[var(--adm-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(""); setHits([]); }}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[var(--adm-radius-xs)] text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink-mute)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-[100] mt-2 overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]">
          <div
            id={listId}
            role="listbox"
            aria-label="Search results"
            className={cn("max-h-[60vh] overflow-y-auto", hits.length > 0 && "py-1.5")}
          >
            {hits.map((h, i) => {
              const Icon = h.type === "job" ? IconJob : h.type === "candidate" ? IconUserStar : h.type === "contact" ? IconContact : IconApplication;
              const isPerson = h.type === "application" || h.type === "candidate";
              return (
                <div
                  key={`${h.type}-${h.id}`}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(h)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors",
                    i === active ? "bg-[var(--adm-accent-tint)]" : "hover:bg-[var(--adm-row-hover)]",
                  )}
                >
                  {isPerson ? (
                    <Avatar name={h.title} size="sm" />
                  ) : (
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[var(--adm-radius-control)] bg-[var(--adm-surface-2)]">
                      <Icon className="h-4 w-4 text-[var(--adm-ink-mute)]" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--adm-ink)]">{h.title}</p>
                    <p className="truncate text-xs text-[var(--adm-ink-subtle)]">{h.subtitle}</p>
                  </div>
                  {h.status && <StatusBadge status={h.status} />}
                </div>
              );
            })}
          </div>
          {hits.length === 0 && (
            <div role="status" className="px-4 py-6 text-center">
              {loading ? (
                <p className="text-xs text-[var(--adm-ink-subtle)]">Searching…</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--adm-ink-mute)]">No matches</p>
                  <p className="mt-0.5 text-xs text-[var(--adm-ink-subtle)]">Try another term</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
