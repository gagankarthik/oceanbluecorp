"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "./icons";
import { StatusBadge } from "./ui";
import { StageBadge } from "./recruiting/bits";
import { jobStatusLabel } from "./recruiting/model";
import { ContactStatusBadge, type ContactStatus } from "./relationships/contact";

type Hit = { type: "job" | "application" | "contact" | "candidate"; id: string; title: string; subtitle: string; link: string; status?: string };

const TYPE: Record<Hit["type"], { icon: IconName; label: string }> = {
  job: { icon: "briefcase", label: "Role" },
  application: { icon: "inbox", label: "Applicant" },
  candidate: { icon: "userCheck", label: "Candidate" },
  contact: { icon: "contact", label: "Contact" },
};

export type PortalSearchHandle = { focus: () => void };

/**
 * Top-bar search over roles, applicants and contacts (/api/admin/search). Ctrl/⌘ K focuses it.
 * Below md it is an icon that opens a field over the top bar (the header is its positioned parent).
 */
export default function PortalSearch({ ref }: { ref?: React.Ref<PortalSearchHandle> }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const focus = () => {
    setExpanded(true);
    setOpen(true);
    // The field mounts visible on the next frame when it was folded on a phone.
    requestAnimationFrame(() => input.current?.focus());
  };
  useImperativeHandle(ref, () => ({ focus }), []);

  const fold = () => {
    setOpen(false);
    setExpanded(false);
    input.current?.blur();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Not while a dialog holds focus: the field sits behind its scrim.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !document.querySelector('[aria-modal="true"]')) {
        e.preventDefault();
        focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false);
        if (!input.current?.value) setExpanded(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Debounced; a superseded request is aborted so a slow reply can't overwrite a newer one.
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        const data = await res.json().catch(() => ({}));
        setHits(res.ok ? data.results ?? [] : []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setHits([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => setActive(0), [hits]);

  const go = (h: Hit) => {
    setQ("");
    fold();
    router.push(h.link);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    } else if (e.key === "Escape") {
      fold();
    }
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <>
      {/* Icon first at every width; the field opens on demand */}
      {!expanded && (
        <button
          type="button"
          onClick={focus}
          aria-label="Search roles, applicants and contacts (Ctrl K)"
          title="Search (Ctrl K)"
          className="grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-mist-100"
        >
          <Icon name="search" />
        </button>
      )}
      <div
        ref={wrap}
        className={
          expanded
            ? "absolute inset-0 z-30 flex items-center bg-mist-0 px-4 sm:px-6 md:relative md:inset-auto md:z-auto md:w-80 md:bg-transparent md:px-0 lg:w-96"
            : "hidden"
        }
      >
        <label className="relative block flex-1">
          <span className="sr-only">Search roles, applicants and contacts</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-activedescendant={showPanel && hits[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search roles, applicants, contacts"
            className="h-10 w-full rounded-lg bg-mist-50 pl-10 pr-11 text-adm-base [&::-webkit-search-cancel-button]:hidden ring-1 ring-inset ring-mist-200 placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600"
          />
          {/* Close sits inside the field, at its end */}
          <button
            type="button"
            onClick={fold}
            aria-label="Close search"
            title="Close (Esc)"
            className="adm-hit absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-mist-600 hover:bg-mist-200 hover:text-navy-900"
          >
            <Icon name="x" className="size-4" />
          </button>
        </label>

        {showPanel && (
          <div className="absolute inset-x-4 top-full z-30 mt-1 overflow-hidden rounded-xl bg-mist-0 shadow-xl ring-1 ring-mist-200 sm:inset-x-6 md:left-auto md:right-0 md:top-12 md:mt-0 md:w-[28rem]">
            {hits.length === 0 ? (
              <p role="status" className="px-4 py-5 text-center text-adm-base text-mist-600">
                {loading ? "Searching…" : `No matches for "${q.trim()}"`}
              </p>
            ) : (
              <ul id={listId} role="listbox" className="max-h-96 overflow-y-auto py-1">
                {hits.map((h, i) => (
                  <li
                    key={`${h.type}-${h.id}`}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(h);
                    }}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? "bg-ocean-50" : ""}`}
                  >
                    <Icon name={TYPE[h.type].icon} className="size-4 shrink-0 text-mist-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-adm-base font-medium text-navy-900">{h.title}</span>
                      <span className="block truncate text-adm-xs text-mist-600">{h.subtitle}</span>
                    </span>
                    {h.status ? (
                      <span className="hidden shrink-0 sm:inline-flex">
                        <HitStatus type={h.type} status={h.status} />
                      </span>
                    ) : (
                      <span className="shrink-0 text-adm-xs text-mist-600">{TYPE[h.type].label}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** Each record type keeps the colours its own list uses. */
function HitStatus({ type, status }: { type: Hit["type"]; status: string }) {
  if (type === "application" || type === "candidate") return <StageBadge stage={status} />;
  if (type === "contact") return <ContactStatusBadge status={status as ContactStatus} />;
  return <StatusBadge status={type === "job" ? jobStatusLabel(status) : status} />;
}
