"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "./icons";

/** Which way the listbox opens; "top" for selects docked at the viewport bottom (batch bar) */
export const SelectSide = createContext<"bottom" | "top">("bottom");

export type SelectOption = {
  value: string;
  label: string;
  /** Optional count shown on the right, e.g. matching rows */
  count?: number;
  icon?: IconName;
  description?: string;
};

/**
 * Custom dropdown for filters and toolbars.
 * Button + floating listbox, check on the current value, optional counts,
 * icons and descriptions, search for long lists, full keyboard support
 * (arrows, Home/End, Enter, Escape, type-to-jump).
 */
export default function Select({
  label,
  value,
  onChange,
  options,
  searchable,
  showLabel = true,
  align = "left",
  className = "",
  width = "w-64",
  variant = "filter",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  /** Adds a search box; on by default for more than 8 options */
  searchable?: boolean;
  /** Prefix the button text with the label ("Stage: New") */
  showLabel?: boolean;
  align?: "left" | "right";
  className?: string;
  /** Tailwind width for the menu */
  width?: string;
  /** "filter" tints when not at its default; "field" is a plain form input */
  variant?: "filter" | "field";
  disabled?: boolean;
}) {
  const id = useId();
  const side = useContext(SelectSide);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const canSearch = searchable ?? options.length > 8;
  const current = options.find((o) => o.value === value) ?? options[0];
  const isDefault = variant === "field" || current?.value === options[0]?.value;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, shown.findIndex((o) => o.value === value)));
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (o: SelectOption) => {
    onChange(o.value);
    setOpen(false);
    setQuery("");
    button.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(shown.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (!canSearch && e.key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = shown.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${current?.label ?? ""}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-10 w-full items-center gap-2 rounded-lg pl-3 pr-2.5 text-left text-adm-base ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 disabled:cursor-not-allowed disabled:opacity-60 ${
          isDefault ? "bg-mist-0 text-navy-900 ring-[var(--color-border-control)] hover:bg-mist-50" : "bg-ocean-50 text-ocean-800 ring-ocean-600 hover:bg-ocean-100"
        }`}
      >
        {current?.icon && <Icon name={current.icon} className="size-4 shrink-0 opacity-80" />}
        <span className="min-w-0 flex-1 truncate">
          {showLabel && variant === "filter" && <span className={isDefault ? "text-mist-600" : "text-ocean-700"}>{label}: </span>}
          <span className={variant === "field" ? "" : "font-medium"}>{isDefault && showLabel && variant === "filter" ? "All" : current?.label}</span>
        </span>
        <Icon name="chevronDown" className={`size-4 shrink-0 text-mist-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute ${side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"} z-40 ${width} max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-mist-0 shadow-xl ring-1 ring-mist-200 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {canSearch && (
            <div className="border-b border-mist-200 p-2">
              <label className="relative block">
                <span className="sr-only">Search {label.toLowerCase()}</span>
                <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder={`Search ${label.toLowerCase()}`}
                  className="h-9 w-full rounded-md bg-mist-50 pl-8 pr-2 text-adm-base ring-1 ring-inset ring-[var(--color-border-control)] placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600"
                />
              </label>
            </div>
          )}
          <p className="px-3 pb-1 pt-2.5 text-adm-xs font-semibold text-mist-600">{label}</p>
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={shown[active] ? `${id}-opt-${active}` : undefined}
            className="scroll-thin max-h-72 overflow-y-auto p-1.5 pt-0"
          >
            {shown.length === 0 && <li className="px-3 py-6 text-center text-adm-base text-mist-600">No matches</li>}
            {shown.map((o, i) => {
              const selected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-adm-base ${i === active ? "bg-mist-100" : ""}`}
                >
                  <span className={`mt-0.5 grid size-4 shrink-0 place-items-center ${selected ? "text-ocean-600" : "text-transparent"}`}>
                    <Icon name="check" className="size-4" />
                  </span>
                  {o.icon && <Icon name={o.icon} className="mt-0.5 size-4 shrink-0 text-mist-600" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${selected ? "font-semibold text-navy-900" : "text-navy-900"}`}>{o.label}</span>
                    {o.description && <span className="mt-0.5 block text-adm-xs leading-snug text-mist-600">{o.description}</span>}
                  </span>
                  {o.count !== undefined && (
                    <span className="mt-0.5 rounded-md bg-mist-100 px-1.5 text-adm-xs tabular-nums text-mist-600">{o.count}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {!isDefault && variant === "filter" && (
            <div className="border-t border-mist-200 p-1.5">
              <button
                type="button"
                onClick={() => choose(options[0])}
                className="w-full rounded-lg px-2.5 py-2 text-left text-adm-base font-medium text-ocean-700 hover:bg-ocean-50"
              >
                Reset to {options[0]?.label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
