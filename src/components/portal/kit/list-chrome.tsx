"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "../icons";
import { navItemFor, usePortalChrome } from "../chrome";

/*
 * List chrome, after Plane's work-item views: a 44px header (breadcrumb, count, view tabs,
 * then layout / Filters / Display / page actions), an applied-filters row of removable chips,
 * and the Filters and Display popovers. DataTable and the Applications grid both use it.
 */

// 32px controls: the secondary one is the default, primary only for the page's main action.
export const BTN = "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-adm-base font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ocean-600";
export const BTN_SECONDARY = `${BTN} border border-mist-200 bg-mist-0 text-navy-900 hover:border-mist-300 hover:bg-mist-50`;
export const BTN_PRIMARY = `${BTN} border border-ocean-600 bg-ocean-600 text-white hover:border-ocean-700 hover:bg-ocean-700`;
export const BTN_ICON = "grid size-8 shrink-0 place-items-center rounded-md text-mist-600 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900";

/** Outside click and Escape close it; Escape hands focus back to the trigger. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, root, trigger };
}

const POP = "kit-pop absolute right-0 top-[calc(100%+6px)] z-40 flex max-h-[min(30rem,calc(100svh-8rem))] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-mist-200 bg-mist-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)]";
const PANEL = `${POP} w-[18.75rem]`;

/** The page's header bar: where you are, how many, which view; controls on the right. */
export type Crumb = { label: string; href?: string; icon?: IconName };

export function ListHeader({
  count,
  total,
  tabs,
  children,
  crumb = true,
  crumbs,
}: {
  /** A record page's trail (State roles › OB-2026-0398); the section crumb otherwise */
  crumbs?: Crumb[];
  count?: number;
  /** The unfiltered total; the chip reads "9 of 15" while filters cut the list */
  total?: number;
  tabs?: React.ReactNode;
  children?: React.ReactNode;
  /** false inside a panel (dashboard tables), where the page already says where you are */
  crumb?: boolean;
}) {
  const pathname = usePathname() ?? "/portal";
  const item = navItemFor(pathname);
  const title = usePortalChrome()?.sectionTitle ?? item?.label ?? "Portal";
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-mist-200 bg-mist-0 px-4 py-1.5 lg:flex-nowrap lg:py-0">
      <div className="flex min-w-0 items-center gap-2">
        {crumbs ? (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1">
                {i > 0 && <Icon name="chevronRight" className="size-3.5 shrink-0 text-mist-400" />}
                {c.href ? (
                  <Link href={c.href} className="flex h-7 min-w-0 items-center gap-2 rounded-md px-1.5 text-adm-base font-medium text-mist-700 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900">
                    {c.icon && <Icon name={c.icon} className="size-4 shrink-0 text-mist-600" />}
                    <span className="truncate">{c.label}</span>
                  </Link>
                ) : (
                  <span aria-current="page" className="flex h-7 min-w-0 items-center gap-2 px-1.5 text-adm-base font-medium text-navy-900">
                    {c.icon && <Icon name={c.icon} className="size-4 shrink-0 text-mist-600" />}
                    <span className="truncate">{c.label}</span>
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : crumb && item && (
          <Link href={item.href} className="flex h-7 min-w-0 items-center gap-2 rounded-md px-1.5 text-adm-base font-medium text-navy-900 hover:bg-mist-100">
            <Icon name={item.icon} className="size-4 shrink-0 text-mist-600" />
            <span className="truncate">{title}</span>
          </Link>
        )}
        {count !== undefined && (
          <span className="whitespace-nowrap rounded-full bg-ocean-50 px-2 py-1 text-adm-xs font-semibold leading-none tabular-nums text-ocean-700">
            {total !== undefined && total !== count ? `${count} of ${total}` : count}
          </span>
        )}
      </div>
      {tabs && (
        <>
          {crumb && <span aria-hidden className="hidden h-5 w-px shrink-0 bg-mist-200 sm:block" />}
          <div className="order-last min-w-0 basis-full self-stretch sm:order-none sm:basis-auto">{tabs}</div>
        </>
      )}
      {/* Wraps under the title on phones rather than running off the edge */}
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 py-1 lg:shrink-0 lg:py-0">{children}</div>
    </div>
  );
}

/** A search icon that opens into a field; stays open while it holds text. */
export function HeaderSearch({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(!!value);
  const input = useRef<HTMLInputElement>(null);
  const shown = open || !!value;
  if (!shown)
    return (
      <button type="button" onClick={() => { setOpen(true); requestAnimationFrame(() => input.current?.focus()); }} aria-label={placeholder} title={placeholder} className={BTN_ICON}>
        <Icon name="search" className="size-4" />
      </button>
    );
  return (
    <label className="relative block w-56 max-w-[60vw]">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
      <input
        ref={input}
        autoFocus={open && !value}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => !value && setOpen(false)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          onChange("");
          setOpen(false);
        }}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-mist-200 bg-mist-0 pl-8 pr-2 text-adm-base text-navy-900 placeholder:text-placeholder focus:border-mist-400 focus:outline-none"
      />
    </label>
  );
}

/** Icon-only layout toggle (Table / Board / Cards), Plane's segmented layout switch. */
export function LayoutSwitch<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon: IconName }[] }) {
  return (
    <div role="radiogroup" aria-label="Layout" className="flex shrink-0 items-center gap-0.5 rounded-md bg-mist-100 p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={`grid h-7 w-8 place-items-center rounded transition-colors duration-150 ${on ? "bg-mist-0 text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-mist-600 hover:text-navy-900"}`}
          >
            <Icon name={o.icon} className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export type FilterOption = { value: string; label: string; count?: number };
/** One filter: its first option is the "everything" default and is never listed. */
export type FilterSection = { key: string; label: string; options: FilterOption[]; value: string; onChange: (v: string) => void };

const SHOW = 5;

/** A section title in the Filters and Display panels: muted, collapses its options. */
function SectionHead({ label, open, onToggle, note }: { label: string; open: boolean; onToggle: () => void; note?: string }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="sticky top-0 z-[1] flex h-7 w-full items-center justify-between gap-2 bg-mist-0 px-1.5 text-left text-adm-xs font-medium text-mist-600 hover:text-navy-900">
      <span className="truncate">
        {label}
        {note && <span className="ml-1 tabular-nums">{note}</span>}
      </span>
      <Icon name="chevronDown" className={`size-3.5 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

/** A selectable row: round mark for one-of, square for on/off. */
function OptionRow({ label, on, onClick, count, kind = "radio" }: { label: string; on: boolean; onClick: () => void; count?: number; kind?: "radio" | "check" }) {
  return (
    <button
      type="button"
      role={kind === "radio" ? "menuitemradio" : "menuitemcheckbox"}
      aria-checked={on}
      onClick={onClick}
      className="flex min-h-7 w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-mist-100"
    >
      <span
        aria-hidden
        className={`grid size-3.5 shrink-0 place-items-center border ${kind === "radio" ? "rounded-full" : "rounded-[3px]"} ${on ? "border-ocean-600 bg-ocean-600 text-white" : "border-mist-400"}`}
      >
        {on && (kind === "radio" ? <span className="size-1.5 rounded-full bg-white" /> : <Icon name="check" className="size-2.5" />)}
      </span>
      <span className={`min-w-0 flex-1 truncate text-adm-xs ${on ? "font-medium text-navy-900" : "text-mist-700"}`}>{label}</span>
      {count !== undefined && <span className="shrink-0 text-adm-xs tabular-nums text-mist-600">{count}</span>}
    </button>
  );
}

function FilterGroup({ s, query }: { s: FilterSection; query: string }) {
  const [open, setOpen] = useState(true);
  const [all, setAll] = useState(false);
  const def = s.options[0]?.value;
  const listed = s.options.slice(1).filter((o) => !query || o.label.toLowerCase().includes(query));
  if (query && listed.length === 0) return null;
  const shown = all || query ? listed : listed.slice(0, SHOW);
  const set = s.value !== def;
  return (
    <div className="py-1">
      <SectionHead label={s.label} note={set ? "(1)" : undefined} open={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <div role="group" aria-label={s.label}>
          {shown.map((o) => (
            <OptionRow key={o.value} label={o.label} count={o.count} on={s.value === o.value} onClick={() => s.onChange(s.value === o.value ? def : o.value)} />
          ))}
          {!query && listed.length > SHOW && (
            <button type="button" onClick={() => setAll((v) => !v)} className="ml-7 py-1 text-adm-xs font-medium text-ocean-700 hover:underline">
              {all ? "View less" : `View all ${listed.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** "Filters": a 300px panel with a search and one collapsible section per filter. */
export function FilterMenu({ sections, extras, applied }: { sections: FilterSection[]; extras?: React.ReactNode; applied: number }) {
  const { open, setOpen, root, trigger } = usePopover();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const id = useId();
  if (sections.length === 0 && !extras) return null;
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={applied ? `Filters, ${applied} applied` : "Filters"}
        className={`${BTN_SECONDARY} ${open ? "bg-mist-50" : ""}`}
      >
        <Icon name="filter" className="size-4" />
        <span className="hidden sm:inline">Filters</span>
        {applied > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-ocean-600 px-1 text-adm-xs font-semibold leading-none tabular-nums text-white">{applied}</span>}
      </button>
      {open && (
        <div id={id} role="menu" aria-label="Filters" className={PANEL}>
          <label className="relative m-2 mb-1 block shrink-0">
            <span className="sr-only">Search filters</span>
            <Icon name="search" className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-mist-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="h-7 w-full rounded-md border border-mist-200 bg-mist-50 pl-7 pr-2 text-adm-xs text-navy-900 placeholder:text-placeholder focus:border-mist-400 focus:outline-none"
            />
          </label>
          <div className="scroll-thin min-h-0 flex-1 divide-y divide-mist-100 overflow-y-auto px-2 pb-2">
            {sections.map((s) => (
              <FilterGroup key={s.key} s={s} query={query} />
            ))}
            {extras && !query && <div className="grid gap-2 px-1.5 py-2.5">{extras}</div>}
            {query && sections.every((s) => !s.options.slice(1).some((o) => o.label.toLowerCase().includes(query))) && (
              <p className="px-1.5 py-4 text-adm-xs italic text-mist-600">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type Density = "compact" | "default" | "relaxed";
export const DENSITIES: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "relaxed", label: "Relaxed" },
];

/** "Display": property chips (columns), order, row height, then one-off actions like export. */
export function DisplayMenu({
  properties,
  onToggleProperty,
  order,
  density,
  onDensity,
  actions = [],
  changed,
}: {
  properties?: { key: string; label: string; on: boolean; locked?: boolean }[];
  onToggleProperty?: (key: string) => void;
  order?: { options: FilterOption[]; value: string; onChange: (v: string) => void };
  density?: Density;
  onDensity?: (d: Density) => void;
  actions?: { label: string; icon: IconName; onSelect: () => void }[];
  /** Shows the dot on the trigger: something differs from the default */
  changed?: boolean;
}) {
  const { open, setOpen, root, trigger } = usePopover();
  const [shut, setShut] = useState<Record<string, boolean>>({});
  const id = useId();
  const sec = (k: string) => ({ open: !shut[k], onToggle: () => setShut((s) => ({ ...s, [k]: !s[k] })) });
  return (
    <div ref={root} className="relative">
      <button ref={trigger} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id} className={`${BTN_SECONDARY} relative ${open ? "bg-mist-50" : ""}`}>
        <Icon name="sliders" className="size-4" />
        <span className="hidden sm:inline">Display</span>
        {changed && <span aria-label="(changed)" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-ocean-600" />}
      </button>
      {open && (
        <div id={id} role="menu" aria-label="Display" className={PANEL}>
          <div className="scroll-thin min-h-0 flex-1 divide-y divide-mist-100 overflow-y-auto px-2.5">
            {properties && properties.length > 0 && (
              <div className="py-2">
                <SectionHead label="Display properties" {...sec("props")} />
                {!shut.props && (
                  <div className="mt-1 flex flex-wrap gap-1.5 px-1.5">
                    {properties.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={p.on}
                        disabled={p.locked}
                        onClick={() => onToggleProperty?.(p.key)}
                        className={`rounded border px-2 py-0.5 text-adm-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                          p.on ? "border-ocean-600 bg-ocean-600 text-white" : "border-mist-200 text-mist-700 hover:bg-mist-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {order && order.options.length > 0 && (
              <div className="py-2">
                <SectionHead label="Order by" {...sec("order")} />
                {!shut.order && order.options.map((o) => <OptionRow key={o.value} label={o.label} on={o.value === order.value} onClick={() => order.onChange(o.value)} />)}
              </div>
            )}
            {density && onDensity && (
              <div className="py-2">
                <SectionHead label="Row height" {...sec("density")} />
                {!shut.density && DENSITIES.map((d) => <OptionRow key={d.value} label={d.label} on={d.value === density} onClick={() => onDensity(d.value)} />)}
              </div>
            )}
            {actions.length > 0 && (
              <div className="py-2">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      a.onSelect();
                      setOpen(false);
                    }}
                    className="flex min-h-7 w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-adm-xs font-medium text-navy-900 hover:bg-mist-100"
                  >
                    <Icon name={a.icon} className="size-3.5 text-mist-600" />
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type AppliedChip = { key: string; label: string; value: string; clear: () => void };

/** The row under the header while anything filters the list: one chip per filter, Clear all. */
export function AppliedFilters({ chips, onClearAll }: { chips: AppliedChip[]; onClearAll: () => void }) {
  const list = chips;
  if (list.length === 0) return null;
  return (
    <div className="kit-fade shrink-0 border-b border-mist-200 bg-mist-0 px-3 py-1.5">
      <div className="flex items-center gap-2 rounded-lg bg-mist-50 px-3 py-1.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {list.map((c) => (
            <span key={c.key} className="kit-pop flex h-7 max-w-full items-stretch overflow-hidden rounded-md border border-mist-200 bg-mist-0 text-adm-xs">
              <span className="flex items-center px-2 text-mist-600">{c.label}</span>
              <span className="flex min-w-0 items-center border-l border-mist-100 px-2 font-medium text-navy-900">
                <span className="max-w-48 truncate" title={c.value}>{c.value}</span>
              </span>
              <button type="button" onClick={c.clear} aria-label={`Remove ${c.label} filter`} className="grid place-items-center border-l border-mist-100 px-1.5 text-mist-500 hover:bg-mist-100 hover:text-navy-900">
                <Icon name="x" className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-l border-mist-200 pl-3">
          <button type="button" onClick={onClearAll} className={BTN_SECONDARY}>
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}

/** Plane's single-choice dropdown: a 28px button naming the current choice, a short radio menu. */
export function MenuSelect<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon?: IconName;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { open, setOpen, root, trigger } = usePopover();
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current?.label}`}
        className={`${BTN_SECONDARY} ${open ? "bg-mist-50" : ""}`}
      >
        {icon && <Icon name={icon} className="size-4 text-mist-600" />}
        {current?.label}
        <Icon name="chevronDown" className={`size-3.5 text-mist-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={id} role="menu" aria-label={label} className={`${POP} w-56`}>
          <div className="p-1.5">
            <p className="px-1.5 pb-1 pt-0.5 text-adm-xs font-medium text-mist-600">{label}</p>
            {options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                on={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  trigger.current?.focus();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
