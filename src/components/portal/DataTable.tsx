"use client";

import { Fragment, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { downloadCsv } from "@/lib/csv";
import Icon from "./icons";
import { EmptyState } from "./ui";
import { Drawer } from "./kit/overlay";
import { SelectSide } from "./Select";
import { ActionMenu, type MenuEntry } from "./records/Menu";
import { AppliedFilters, BTN_SECONDARY, DisplayMenu, FilterMenu, HeaderSearch, LayoutSwitch, ListHeader, type Density } from "./kit/list-chrome";
import type { IconName } from "./icons";

export type Column<T> = {
  key: string;
  header: string;
  /** Render the cell; defaults to the field value */
  cell?: (row: T) => React.ReactNode;
  /** Value used for sorting, searching and CSV export */
  value?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
  /** Hide this column on smaller desktops (phones always get the card layout) */
  hideBelow?: "md" | "lg" | "xl" | "2xl";
  /** Start hidden; the viewer can turn it on from the Display menu */
  defaultHidden?: boolean;
  /** false leaves the column off the phone card (still in the table from md) */
  card?: boolean;
  /** Numbers and money: right-aligned on tabular figures (shorthand for align "right" + tnum) */
  numeric?: boolean;
  /** "center" for status pills and short badges: centred in a column sized to its content */
  align?: "left" | "center" | "right";
  /**
   * Long-text column (name, company, position): takes this share (%) of the spare width and
   * truncates instead of widening the table. Its cell content must be able to truncate.
   */
  grow?: number;
  /** Floor in px for a grow column once the table overflows; defaults from `grow` */
  minWidth?: number;
};

/** One figure in the footer strip, computed from the rows the filters leave. */
export type Summary = { label: string; value: React.ReactNode; warn?: boolean };

// max-w-0 makes grow columns truncate while the table fits; once it overflows, auto
// layout would squeeze them to their padding, so min-width (which beats max-width) holds them
const growMin = (c: { grow?: number; minWidth?: number }) => c.minWidth ?? ((c.grow ?? 0) >= 30 ? 224 : (c.grow ?? 0) >= 20 ? 176 : 128);

const ALIGN = { left: "", center: "w-px whitespace-nowrap text-center", right: "text-right" } as const;
const alignOf = <T,>(c: Column<T>) => ALIGN[c.numeric ? "right" : (c.align ?? "left")];

// Row heights 36 / 44 / 56, Plane's 44px by default; td height acts as a min-height
const ROW_H: Record<Density, string> = { compact: "h-9 py-1", default: "h-11 py-1", relaxed: "h-14 py-2" };
const PER_PAGE = [10, 25, 50];

/** Page numbers with gaps: 1 … 4 5 6 … 12 */
function pageList(current: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const set = new Set([0, pages - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export type Filter<T> = {
  key: string;
  label: string;
  options: string[];
  value: (row: T) => string;
  /** Overrides equality, for rows that hold several values (e.g. multiple assignees) */
  match?: (row: T, option: string) => boolean;
  /** Accepted for existing call sites; every filter now lives in the Filters menu */
  inline?: boolean;
};

const matches = <T,>(f: Filter<T>, r: T, o: string) => (f.match ? f.match(r, o) : f.value(r) === o);

const hide = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" };

// Sticky 44px header band (z-20; z-30 where it meets a pinned column) and pinned body cells (z-10).
// Row rules only: every table in the portal reads the same, without column lines.
const HEAD = "sticky h-11 whitespace-nowrap border-b border-mist-200 bg-mist-50 px-3";
const PIN = "sticky z-10 bg-inherit";

/**
 * Searchable, filterable, sortable table.
 * - Phones: each row becomes a card with labelled fields.
 * - Options: column visibility, density, rows per page, CSV export.
 * - Active filters show as removable chips.
 * - Optional row selection with bulk actions, and a detail drawer.
 */
export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchPlaceholder = "Search",
  renderDetail,
  detailTitle,
  detailActions,
  rowMenu,
  emptyTitle = "Nothing matches your filters",
  toolbar,
  tabs,
  filterExtras,
  extraChips = [],
  selectable = false,
  bulkActions,
  pageSize = 10,
  exportName = "export",
  onExport,
  renderGrid,
  gridAll = false,
  initialQuery = "",
  initialSort = null,
  searchMatch,
  initialFilters,
  onStateChange,
  storageKey,
  layouts,
  fill = false,
  summary,
  noun = "rows",
}: {
  rows: T[];
  columns: Column<T>[];
  filters?: Filter<T>[];
  searchPlaceholder?: string;
  /** `close` shuts the drawer, e.g. after the record is deleted */
  renderDetail?: (row: T, close: () => void) => React.ReactNode;
  detailTitle?: (row: T) => string;
  /** Buttons in the detail sheet's header, beside close (e.g. "Open job") */
  detailActions?: (row: T, close: () => void) => React.ReactNode;
  /** Row "⋯" menu at the end of each row; without it the menu offers Open only */
  rowMenu?: (row: T, openDetail: () => void) => MenuEntry[];
  emptyTitle?: string;
  toolbar?: React.ReactNode;
  /** Status or saved-view tabs, joined to the top of the table */
  tabs?: React.ReactNode;
  /** Page-owned filters (e.g. a date range) shown in the filter row */
  filterExtras?: React.ReactNode;
  /** Chips for those page-owned filters, so they show and clear like the rest */
  extraChips?: { key: string; label: string; clear: () => void }[];
  selectable?: boolean;
  bulkActions?: (ids: string[]) => React.ReactNode;
  pageSize?: number;
  /** File name (without .csv) for the export */
  exportName?: string;
  /** Replaces the default export of the visible columns; receives the filtered rows */
  onExport?: (rows: T[]) => void;
  /** Replaces the rows with a custom layout (e.g. cards); search, filters, export and paging still apply */
  renderGrid?: (rows: T[], open: (row: T) => void) => React.ReactNode;
  /** renderGrid gets every filtered row and the pager hides, for layouts that page themselves (boards) */
  gridAll?: boolean;
  /** Starting search text, e.g. from a ?search= deep link */
  initialQuery?: string;
  initialSort?: { key: string; dir: 1 | -1 } | null;
  /** Extra search predicate OR'd with the column values, for fields that have no column */
  searchMatch?: (row: T, query: string) => boolean;
  /** Starting filter values by filter key; remount with a new `key` to apply a saved view */
  initialFilters?: Record<string, string>;
  /** Reports search and filter changes, so a parent can save or share them */
  onStateChange?: (state: { query: string; filters: Record<string, string> }) => void;
  /** Persists rows per page and hidden columns in this browser */
  storageKey?: string;
  /** Icon-only layout switch (e.g. Table / Cards) at the head of the header controls */
  layouts?: { value: string; onChange: (v: string) => void; options: { value: string; label: string; icon: IconName }[] };
  /**
   * The CRM list: fills its parent's height edge to edge, the rows scroll under a fixed header,
   * every row shows (no pages), and the footer carries the count, the figures and the bulk actions.
   */
  fill?: boolean;
  /** Footer figures (sums, averages) from the filtered rows */
  summary?: (rows: T[]) => Summary[];
  /** Plural for the footer count ("contacts in view") */
  noun?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState<Record<string, string>>(initialFilters ?? {});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(initialSort);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<T | null>(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);
  const [density, setDensity] = useState<Density>("default");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ wide: false, left: false, right: false });

  useEffect(() => {
    onStateChange?.({ query, filters: active });
  }, [query, active]);

  // Stored prefs load after mount so the server render matches the first client render.
  const prefsKey = storageKey ? `portal.table.${storageKey}` : null;
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    if (!prefsKey) return;
    try {
      const p = JSON.parse(window.localStorage.getItem(prefsKey) ?? "null") as { perPage?: number; hidden?: string[]; density?: Density } | null;
      if (p && PER_PAGE.includes(p.perPage ?? 0)) setPerPage(p.perPage!);
      if (p && Array.isArray(p.hidden)) setHidden(new Set(p.hidden.filter((k) => columns.some((c) => c.key === k))));
      if (p?.density && p.density in ROW_H) setDensity(p.density);
    } catch {}
    setPrefsLoaded(true);
  }, [prefsKey]);
  useEffect(() => {
    if (!prefsKey || !prefsLoaded) return;
    try {
      window.localStorage.setItem(prefsKey, JSON.stringify({ perPage, hidden: [...hidden], density }));
    } catch {}
  }, [prefsKey, prefsLoaded, perPage, hidden, density]);

  const shown = columns.filter((c) => !hidden.has(c.key));
  const getValue = (c: Column<T>, r: T) => (c.value ? c.value(r) : ((r as Record<string, unknown>)[c.key] as string | number | undefined));

  // The field updates at once; the filter over every row follows a deferred copy, so typing never waits on it
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    let out = rows.filter((r) => {
      for (const f of filters) {
        const v = active[f.key];
        if (v && v !== "All" && !matches(f, r, v)) return false;
      }
      if (!q) return true;
      if (searchMatch?.(r, q)) return true;
      return columns.some((c) => {
        const v = c.value ? c.value(r) : (r as Record<string, unknown>)[c.key];
        return v !== undefined && v !== null && String(v).toLowerCase().includes(q);
      });
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = col.value ? col.value(a) : ((a as Record<string, unknown>)[col.key] as string | number);
          const bv = col.value ? col.value(b) : ((b as Record<string, unknown>)[col.key] as string | number);
          return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
        });
      }
    }
    return out;
  }, [rows, filters, active, deferredQuery, sort, columns, searchMatch]);

  const pages = fill ? 1 : Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pages - 1);
  const visible = fill ? filtered : filtered.slice(current * perPage, current * perPage + perPage);
  const unpaged = fill || (!!renderGrid && gridAll);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = !allVisibleSelected && visible.some((r) => selected.has(r.id));
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const isOn = (f: Filter<T>) => !!active[f.key] && active[f.key] !== "All";
  // Extra chips arrive as "Label: value"; split them so they read like the rest
  const chips = [
    ...(query ? [{ key: "__q", label: "Search", value: `“${query}”`, clear: () => setQuery("") }] : []),
    ...filters.filter(isOn).map((f) => ({ key: f.key, label: f.label, value: active[f.key], clear: () => setActive((a) => ({ ...a, [f.key]: "All" })) })),
    ...extraChips.map((c) => {
      const i = c.label.indexOf(": ");
      return { key: c.key, label: i > 0 ? c.label.slice(0, i) : "Filter", value: i > 0 ? c.label.slice(i + 2) : c.label, clear: c.clear };
    }),
  ];
  const applied = filters.filter(isOn).length + extraChips.length;
  const setFilter = (key: string, v: string) => {
    setActive((a) => ({ ...a, [key]: v }));
    setPage(0);
  };
  const clearAll = () => {
    setQuery("");
    setActive({});
    extraChips.forEach((c) => c.clear());
    setPage(0);
  };
  // Option counts walk every row once per option: worked out when the rows or the option lists
  // change, not on every keystroke, hover or menu toggle (pages rebuild `filters` each render).
  const optionsKey = filters.map((f) => `${f.key}:${f.options.join("")}`).join("");
  const optionCounts = useMemo(
    () => filters.map((f) => f.options.map((o) => rows.reduce((n, r) => n + (matches(f, r, o) ? 1 : 0), 0))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, optionsKey],
  );
  const filterSections = filters.map((f, i) => ({
    key: f.key,
    label: f.label,
    value: active[f.key] ?? "All",
    onChange: (v: string) => setFilter(f.key, v),
    options: [{ value: "All", label: "All" }, ...f.options.map((o, j) => ({ value: o, label: o, count: optionCounts[i]?.[j] }))],
  }));
  const sortable = columns.filter((c) => c.sortable);
  const dirWord = (c: Column<T>, dir: 1 | -1) => (c.numeric ? (dir === 1 ? "low to high" : "high to low") : dir === 1 ? "ascending" : "descending");
  const orderOptions = [
    { value: "", label: "Default" },
    ...sortable.map((c) => ({ value: c.key, label: sort?.key === c.key ? `${c.header}, ${dirWord(c, sort.dir)}` : c.header })),
  ];
  const defaultHidden = columns.filter((c) => c.defaultHidden).map((c) => c.key).sort().join();
  const displayChanged = density !== "default" || [...hidden].sort().join() !== defaultHidden;

  // A table that fits stays un-clipped, so its header sticks under the top bar as the page
  // scrolls. Only a table wider than its box scrolls sideways (pinned columns, seams once
  // content runs under them); the page stays the one vertical scroller either way.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const table = el.firstElementChild as HTMLElement | null;
      const wide = !!table && table.offsetWidth > el.clientWidth + 1;
      const left = wide && el.scrollLeft > 0;
      const right = wide && el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
      setEdges((e) => (e.wide === wide && e.left === left && e.right === right ? e : { wide, left, right }));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [visible.length === 0, !!renderGrid]);

  // Batch bar: keeps the last selection on screen while it animates out
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);
  const barOn = selectable && selected.size > 0;
  // In the CRM list the bulk actions live in the footer, not a floating bar
  const floatBar = selectable && !fill;
  const lastSel = useRef<string[]>([]);
  if (barOn) lastSel.current = [...selected];

  const toggleSort = (key: string) => setSort((s) => (!s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) visible.forEach((r) => n.delete(r.id));
      else visible.forEach((r) => n.add(r.id));
      return n;
    });

  function exportCsv() {
    if (onExport) return onExport(filtered);
    // Shared helper: RFC 4180 quoting, formula-injection guard, UTF-8 BOM for Excel.
    downloadCsv(exportName, shown.map((c) => String(c.header)), filtered.map((r) => shown.map((c) => getValue(c, r))));
  }

  // Rules live on the cells: `border-separate` (needed for sticky cells) never paints tr borders
  const cellPad = `border-b border-mist-100 px-3 ${ROW_H[density]}`;
  // <main> is the scroller, so the header pins to its top whether the list fills or flows
  const head = `${HEAD} top-0`;
  // Plane shows a row's checkbox on hover; once anything is selected they all stay visible
  const anySelected = selected.size > 0;
  const boxReveal = anySelected ? "" : "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100";
  const hasRowEnd = !!renderDetail || !!rowMenu;
  const rowEnd = (r: T) => {
    const openRow = () => renderDetail && setOpen(r);
    const items: MenuEntry[] = rowMenu ? rowMenu(r, openRow) : [{ label: "Open", icon: "eye", onSelect: openRow }];
    return (
      <ActionMenu
        label="Row actions"
        width="w-48"
        items={items}
        trigger={
          <button
            type="button"
            aria-label="Row actions"
            title="Row actions"
            onClick={(e) => e.stopPropagation()}
            className="grid size-7 shrink-0 place-items-center rounded-md text-mist-500 hover:bg-mist-100 hover:text-navy-900 data-[state=open]:bg-mist-100 data-[state=open]:text-navy-900"
          >
            <Icon name="dotsVertical" className="size-4" />
          </button>
        }
      />
    );
  };

  return (
    // Room under the footer while the batch bar floats, so it never sits on the pagination
    <div className={fill ? "flex min-h-0 min-w-0 flex-1 flex-col bg-mist-0" : `min-w-0 overflow-hidden rounded-lg border border-mist-200 bg-mist-0 ${barOn ? "mb-20" : ""}`}>
      <ListHeader crumb={fill} count={fill ? filtered.length : undefined} total={rows.length} tabs={tabs}>
        {layouts && <LayoutSwitch value={layouts.value} onChange={layouts.onChange} options={layouts.options} />}
        <HeaderSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
        />
        <FilterMenu sections={filterSections} extras={filterExtras} applied={applied} />
        <DisplayMenu
          properties={columns.map((c) => ({ key: c.key, label: c.header, on: !hidden.has(c.key), locked: !hidden.has(c.key) && shown.length === 1 }))}
          onToggleProperty={(key) =>
            setHidden((h) => {
              const n = new Set(h);
              if (n.has(key)) n.delete(key);
              else n.add(key);
              return n;
            })
          }
          order={sortable.length ? {
            options: orderOptions,
            value: sort?.key ?? "",
            onChange: (key) => (key ? toggleSort(key) : setSort(null)),
          } : undefined}
          density={density}
          onDensity={setDensity}
          actions={[{ label: `Export ${filtered.length === rows.length ? "all" : filtered.length} as CSV`, icon: "download", onSelect: exportCsv }]}
          changed={displayChanged}
        />
        {toolbar}
      </ListHeader>

      <AppliedFilters chips={chips} onClearAll={clearAll} />

      <div className={fill ? "scroll-thin min-h-0 flex-1 overflow-auto" : "contents"}>
      {(unpaged ? filtered : visible).length === 0 ? (
        <EmptyState
          variant="no-results"
          title={emptyTitle}
          body={chips.length ? "Try a different search or clear the filters." : undefined}
          onClearFilters={chips.length ? clearAll : undefined}
        />
      ) : renderGrid ? (
        renderGrid(unpaged ? filtered : visible, (r) => setOpen(r))
      ) : (
        <>
          {/* Phones: rows as cards */}
          <ul className="divide-y divide-mist-100 md:hidden">
            {visible.map((r) => {
              const [first, ...rest] = shown;
              return (
                <li key={r.id} className={selected.has(r.id) ? "bg-ocean-50/60" : ""}>
                  <div className="flex items-start gap-3 p-4">
                    {selectable && (
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected.has(r.id)}
                        onChange={() => toggleRow(r.id)}
                        className="mt-1 size-4 shrink-0 accent-ocean-600"
                      />
                    )}
                    <div onClick={() => renderDetail && setOpen(r)} className={`min-w-0 flex-1 ${renderDetail ? "cursor-pointer" : ""}`}>
                      <div className="text-adm-base font-medium text-navy-900">{first.cell ? first.cell(r) : String(getValue(first, r) ?? "")}</div>
                      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                        {rest.filter((c) => c.card !== false).map((c) => (
                          <div key={c.key} className="min-w-0">
                            <dt className="text-adm-xs font-medium text-mist-600">{c.header}</dt>
                            <dd className="mt-0.5 truncate text-adm-base text-navy-900">
                              {c.cell ? c.cell(r) : String(getValue(c, r) ?? "").trim() || <span className="text-mist-600">—</span>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {hasRowEnd && rowEnd(r)}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tablets and up: the table. Fits → unclipped, header sticks under the 64px top bar.
              Too wide → scrolls sideways with the identifier and actions columns pinned. */}
          <div
            ref={scrollRef}
            data-left={edges.left || undefined}
            data-right={edges.right || undefined}
            className={`dt-scroll relative isolate hidden md:block ${!fill && edges.wide ? "scroll-thin overflow-x-auto overflow-y-hidden" : ""}`}
          >
            <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-adm-base">
              <thead>
                <tr className="group/row text-adm-base font-medium text-mist-600">
                  {selectable && (
                    <th scope="col" className={`${head} left-0 z-30 w-10 min-w-10 pr-0`}>
                      <label className="adm-hit inline-grid cursor-pointer place-items-center align-middle">
                        <input ref={selectAllRef} type="checkbox" aria-label="Select all on this page" checked={allVisibleSelected} onChange={toggleAll} className={`size-3.5 cursor-pointer accent-ocean-600 ${boxReveal}`} />
                      </label>
                    </th>
                  )}
                  {shown.map((c, i) => {
                    const sorted = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={sorted ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                        className={`${head} font-medium ${i === 0 ? `dt-pin-l z-30 ${selectable ? "left-10" : "left-0"}` : "z-20"} ${c.grow ? "max-w-0" : ""} ${alignOf(c)} ${c.hideBelow ? hide[c.hideBelow] : ""} ${c.className ?? ""}`}
                        // max-width 0 + a share of the width: the column absorbs what is spare and its cells truncate
                        style={c.grow ? { width: `${c.grow}%`, minWidth: growMin(c) } : undefined}
                      >
                        {c.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={`group/sort inline-flex items-center gap-1 rounded hover:text-navy-900 ${c.numeric ? "flex-row-reverse" : ""} ${sorted ? "text-navy-900" : ""}`}
                          >
                            {c.header}
                            {/* Arrow only on the sorted column; a hint on hover elsewhere */}
                            <Icon
                              name="chevronDown"
                              className={`size-3.5 transition-[transform,opacity] ${sorted ? "opacity-100" : "opacity-0 group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50"} ${sorted && sort.dir === 1 ? "rotate-180" : ""}`}
                            />
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                  {hasRowEnd && (
                    <th scope="col" className={`${head} dt-pin-r right-0 z-30 w-12`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    // Solid row fills: the pinned cells inherit them, so nothing shows through
                    className={`group/row transition-colors ${selected.has(r.id) ? "bg-ocean-50" : "bg-mist-0 hover:bg-mist-50"} ${renderDetail ? "cursor-pointer focus-visible:bg-mist-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ocean-600" : ""}`}
                    onClick={() => renderDetail && setOpen(r)}
                    // Keyboard reaches the same detail as a click
                    tabIndex={renderDetail ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (renderDetail && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setOpen(r);
                      }
                    }}
                  >
                    {selectable && (
                      <td className={`${cellPad} ${PIN} left-0 w-10 min-w-10 pr-0`} onClick={(e) => e.stopPropagation()}>
                        <label className="adm-hit inline-grid cursor-pointer place-items-center align-middle">
                          <input type="checkbox" aria-label="Select row" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} className={`size-3.5 cursor-pointer accent-ocean-600 ${boxReveal}`} />
                        </label>
                      </td>
                    )}
                    {shown.map((c, i) => (
                      <td
                        key={c.key}
                        className={`${cellPad} align-middle text-navy-900 ${i === 0 ? `dt-pin-l ${PIN} ${selectable ? "left-10" : "left-0"}` : ""} ${c.grow ? "max-w-0 overflow-hidden" : c.cell ? "" : "whitespace-nowrap"} ${alignOf(c)} ${c.numeric ? "tabular-nums" : ""} ${c.hideBelow ? hide[c.hideBelow] : ""} ${c.className ?? ""}`}
                        style={c.grow ? { minWidth: growMin(c) } : undefined}
                      >
                        {c.cell ? (
                          c.cell(r)
                        ) : String(getValue(c, r) ?? "").trim() === "" ? (
                          // An empty value reads as empty, not as a missing cell
                          <span className="text-mist-600">—</span>
                        ) : c.grow ? (
                          <span className="block truncate" title={String(getValue(c, r) ?? "")}>
                            {String(getValue(c, r) ?? "")}
                          </span>
                        ) : (
                          // Plain text stays on one line but never past 20rem (e.g. a long skills list)
                          <span className="block max-w-80 truncate" title={String(getValue(c, r) ?? "")}>
                            {String(getValue(c, r) ?? "")}
                          </span>
                        )}
                      </td>
                    ))}
                    {hasRowEnd && (
                      <td className={`${cellPad} dt-pin-r ${PIN} right-0 text-right`} onClick={(e) => e.stopPropagation()}>
                        {rowEnd(r)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      </div>

      {/* The CRM footer: count and figures, or the bulk actions while rows are selected */}
      {fill && (barOn || summary) && (
        <div className="flex min-h-10 shrink-0 flex-wrap items-center border-t border-mist-200 bg-mist-0 sm:px-1">
          {barOn ? (
            <div role="region" aria-label="Selected rows" className="flex flex-wrap items-center gap-2 px-2 py-2 sm:px-2">
              <span className="mr-2 text-adm-base font-semibold tabular-nums text-navy-900" aria-live="polite">
                {selected.size} selected
              </span>
              {bulkActions?.([...selected])}
              <button type="button" onClick={() => setSelected(new Set())} className={BTN_SECONDARY}>
                Deselect all
              </button>
            </div>
          ) : (
            <dl className="flex flex-wrap items-center text-adm-xs">
              {summary?.(filtered).map((f) => (
                <div key={f.label} className="flex items-baseline gap-1.5 border-r border-mist-200 px-3 py-2.5 last:border-r-0">
                  <dd className={`font-semibold tabular-nums ${f.warn ? "text-status-warning" : "text-navy-900"}`}>{f.value}</dd>
                  <dt className="text-mist-600">{f.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Pagination */}
      {!unpaged && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 px-4 py-3 text-adm-base text-mist-600">
          <div className="flex items-center gap-4">
            <span className="tabular-nums">{filtered.length === 0 ? "0 results" : `${current * perPage + 1}–${Math.min(filtered.length, (current + 1) * perPage)} of ${filtered.length}`}</span>
            <label className="hidden items-center gap-2 sm:flex">
              Rows
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="h-8 rounded-md bg-mist-0 px-2 text-adm-base tabular-nums text-navy-900 ring-1 ring-inset ring-mist-300 focus:outline-2 focus:outline-ocean-600"
              >
                {PER_PAGE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {pages > 1 && (
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={current === 0}
                aria-label="Previous page"
                className="grid size-8 place-items-center rounded-md text-navy-900 hover:bg-mist-100 disabled:opacity-40"
              >
                <Icon name="chevronLeft" className="size-4" />
              </button>
              {pageList(current, pages).map((p, i) =>
                p === null ? (
                  <span key={`gap${i}`} aria-hidden className="w-6 text-center">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p + 1}`}
                    aria-current={p === current ? "page" : undefined}
                    className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 font-medium tabular-nums ${p === current ? "bg-contrast text-on-contrast" : "text-navy-900 hover:bg-mist-100"}`}
                  >
                    {p + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={current >= pages - 1}
                aria-label="Next page"
                className="grid size-8 place-items-center rounded-md text-navy-900 hover:bg-mist-100 disabled:opacity-40"
              >
                <Icon name="chevronRight" className="size-4" />
              </button>
            </nav>
          )}
        </div>
      )}

      {/* Batch bar: floats bottom-centre over the page (z-40), under drawers and modals (z-50) */}
      {floatBar &&
        portalReady &&
        createPortal(
          <div
            role="region"
            aria-label="Selected rows"
            inert={!barOn}
            className={`dt-batch fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-lg bg-navy-950 py-2 pl-4 pr-2 text-adm-base text-white shadow-xl ring-1 ring-white/10 transition-[opacity,translate,visibility] motion-reduce:transition-none ${
              barOn ? "visible translate-y-0 opacity-100 duration-200 ease-out" : "invisible translate-y-4 opacity-0 duration-150 ease-in"
            }`}
          >
            <span className="mr-2 whitespace-nowrap font-medium tabular-nums" aria-live="polite">
              {lastSel.current.length} selected
            </span>
            <SelectSide.Provider value="top">
              <div className="dt-batch-actions flex flex-wrap items-center gap-2">{bulkActions?.(lastSel.current)}</div>
            </SelectSide.Provider>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="min-h-8 whitespace-nowrap rounded-lg px-3 text-adm-base font-medium text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Deselect all
            </button>
          </div>,
          document.body,
        )}

      {renderDetail && open && (
        <Drawer title={detailTitle ? detailTitle(open) : "Details"} onClose={() => setOpen(null)} actions={detailActions?.(open, () => setOpen(null))}>
          {renderDetail(open, () => setOpen(null))}
        </Drawer>
      )}
    </div>
  );
}

/** The kit Drawer; kept here for existing imports. */
export { Drawer } from "./kit/overlay";

/** Status or saved-view tabs for DataTable's `tabs` slot: underline on the active one, count beside each */
export function TableTabs<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  /** `divider` rules off the tab from the ones before it; `attention` flags a non-zero count (icon + amber). */
  options: { value: T; label: string; count?: number; tone?: "attention"; divider?: boolean }[];
}) {
  return (
    // Plane's underline tabs: they fill the 44px header and the active one sits on its rule
    <div role="tablist" aria-label={label} className="-mb-px flex h-full min-h-11 items-stretch gap-4 scroll-strip">
      {options.map((o) => {
        const on = o.value === value;
        const flagged = o.tone === "attention" && (o.count ?? 0) > 0;
        return (
          <Fragment key={o.value}>
            {o.divider && <span aria-hidden className="h-4 w-px shrink-0 self-center bg-mist-200" />}
            <button
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(o.value)}
              className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 pt-0.5 text-adm-base leading-none transition-colors duration-150 ${
                on ? "border-ocean-600 font-semibold text-navy-900" : "border-transparent text-mist-600 hover:border-mist-300 hover:text-navy-900"
              }`}
            >
              {flagged && <Icon name="alert" className="size-3.5 shrink-0 text-status-warning" />}
              {/* Medium copy reserves the active width, so switching tabs never shifts the strip */}
              <span className="inline-grid">
                <span aria-hidden className="invisible font-semibold [grid-area:1/1]">{o.label}</span>
                <span className="[grid-area:1/1]">{o.label}</span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
