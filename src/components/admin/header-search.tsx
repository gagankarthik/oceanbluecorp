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
 * Top-bar search: an icon that opens into a field with an inline results
 * dropdown. On phones the open field covers the top bar.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const expand = () => setExpanded(true);
  const collapse = () => { setExpanded(false); setOpen(false); setQ(""); setHits([]); };
  const listId = React.useId();
  const optId = (i: number) => `${listId}-opt-${i}`;

  // Debounced; aborts the superseded request so a slow reply can't overwrite a newer one.
  React.useEffect(() => {
    // The server ignores one character; don't spend a round trip on it.
    if (q.trim().length < 2) { setHits([]); setLoading(false); return; }
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
    }, 300);
    return () => { clearTimeout(h); ctrl.abort(); };
  }, [q]);

  React.useEffect(() => setActive(0), [hits]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // An empty field folds back to the icon; a typed query stays put.
        if (!inputRef.current?.value) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    if (open) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (h: Hit) => { collapse(); router.push(h.link); };

  const showDropdown = open && q.trim().length > 1;
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
      e.preventDefault();
      if (open && q) setOpen(false);
      else collapse();
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={expand}
        aria-label="Search jobs, candidates and contacts"
        title="Search"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink)] hover:bg-[var(--adm-surface-2)] [&_svg]:stroke-2",
          className,
        )}
      >
        <IconSearch className="size-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        // Phones: the open field covers the top bar. Wider: it opens leftward from the icon.
        "adm-search-open absolute inset-x-2 top-1/2 z-40 -translate-y-1/2 md:relative md:inset-auto md:top-auto md:w-[min(22rem,40vw)] md:translate-y-0",
        className,
      )}
    >
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-mute)]" aria-hidden="true" />
      <input
        ref={inputRef}
        // Mounts on open, so focus lands before the next keystroke.
        autoFocus
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
        className="h-10 w-full rounded-full border border-[var(--adm-line-control)] bg-[var(--adm-surface)] pl-9 pr-9 text-adm-base text-[var(--adm-ink)] placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-ink-mute)] focus:!outline-none focus-visible:!outline-none"
      />
      <button
        type="button"
        onClick={collapse}
        aria-label={q ? "Clear and close search" : "Close search"}
        className="absolute right-1.5 top-1/2 adm-hit grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--adm-ink-subtle)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-full overflow-hidden md:w-[max(100%,24rem)] rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]">
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
                    <p className="truncate text-adm-xs font-semibold text-[var(--adm-ink)]">{h.title}</p>
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
