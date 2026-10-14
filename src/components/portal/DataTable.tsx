"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import Icon from "./icons";
import { EmptyState } from "./ui";
import { Drawer } from "./kit/overlay";
import Select from "./Select";
import { ActionMenu, type MenuEntry } from "./records/Menu";

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
  hideBelow?: "md" | "lg" | "xl";
  /** Start hidden; the viewer can turn it on from the Columns menu */
  defaultHidden?: boolean;
  /** false leaves the column off the phone card (still in the table from md) */
  card?: boolean;
  /** Numbers and money: right-aligned on tabular figures */
  numeric?: boolean;
};

type Density = "compact" | "default" | "relaxed";
// Row heights 44 / 56 / 68 (DESIGN_SYSTEM §2.5); td height acts as a min-height
const ROW_H: Record<Density, string> = { compact: "h-11 py-1.5", default: "h-14 py-2", relaxed: "h-[68px] py-3" };
const DENSITIES: { v: Density; l: string }[] = [
  { v: "compact", l: "Compact" },
  { v: "default", l: "Default" },
  { v: "relaxed", l: "Relaxed" },
];
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
};

const matches = <T,>(f: Filter<T>, r: T, o: string) => (f.match ? f.match(r, o) : f.value(r) === o);

const hide = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

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
  initialQuery = "",
  initialSort = null,
  searchMatch,
  initialFilters,
  onStateChange,
  storageKey,
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
  const [menu, setMenu] = useState(false);
  const menuRef = useOutsideClose(menu, () => setMenu(false));
  // Starts open when the page arrives already filtered (deep links, KPI cards)
  const [filtersOpen, setFiltersOpen] = useState(() => extraChips.length > 0 || Object.values(initialFilters ?? {}).some((v) => v && v !== "All"));
  const filterRowId = useId();

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
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
  }, [rows, filters, active, query, sort, columns, searchMatch]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * perPage, current * perPage + perPage);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someVisibleSelected = !allVisibleSelected && visible.some((r) => selected.has(r.id));
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const chips = [
    ...(query ? [{ key: "__q", label: `Search: “${query}”`, clear: () => setQuery("") }] : []),
    ...filters
      .filter((f) => active[f.key] && active[f.key] !== "All")
      .map((f) => ({ key: f.key, label: `${f.label}: ${active[f.key]}`, clear: () => setActive((a) => ({ ...a, [f.key]: "All" })) })),
    ...extraChips,
  ];

  const activeCount = filters.filter((f) => active[f.key] && active[f.key] !== "All").length + extraChips.length;
  const hasFilters = filters.length > 0 || filterExtras != null;

  const toggleSort =(key: string) => setSort((s) => (!s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));
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

  const cellPad = `px-4 ${ROW_H[density]}`;
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
            title="Actions"
            onClick={(e) => e.stopPropagation()}
            className="grid size-8 shrink-0 place-items-center rounded-md text-mist-500 hover:bg-mist-100 hover:text-navy-900 data-[state=open]:bg-mist-100 data-[state=open]:text-navy-900"
          >
            <Icon name="dots" className="size-4" />
          </button>
        }
      />
    );
  };

  return (
    <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      {tabs && <div className="border-b border-mist-200 px-2 sm:px-4">{tabs}</div>}

      {/* Toolbar: search left; page controls, Filters and table settings right */}
      <div className="flex flex-wrap items-center gap-2 border-b border-mist-200 px-4 py-3">
          <label className="relative block min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">{searchPlaceholder}</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-mist-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg bg-mist-50 pl-10 pr-3 text-[14px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-ocean-600"
            />
          </label>
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          {hasFilters && (
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls={filterRowId}
              aria-label={activeCount ? `Filters, ${activeCount} applied` : "Filters"}
              title="Filters"
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-2.5 sm:px-3 text-[14px] font-medium ring-1 ring-inset transition-colors ${
                filtersOpen ? "bg-ocean-50 text-ocean-800 ring-ocean-300" : "text-navy-900 ring-mist-300 hover:bg-mist-50"
              }`}
            >
              <Icon name="filter" className="size-[18px]" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-ocean-600 px-1.5 text-[12px] font-semibold tabular-nums text-white">{activeCount}</span>
              )}
            </button>
          )}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label="Columns, density and export"
              title="Columns, density and export"
              className={`grid size-10 place-items-center rounded-lg ring-1 ring-inset transition-colors ${menu ? "bg-mist-100 text-navy-900 ring-mist-400" : "text-navy-900 ring-mist-300 hover:bg-mist-50"}`}
            >
              <Icon name="sliders" className="size-[18px]" />
            </button>
            {menu && (
              <div className="absolute right-0 top-12 z-30 w-64 rounded-xl bg-mist-0 p-3 shadow-xl ring-1 ring-mist-200">
                <p className="px-1 text-[12px] font-semibold text-mist-500">Columns</p>
                <ul className="scroll-thin mt-1.5 max-h-56 overflow-y-auto">
                  {columns.map((c) => (
                    <li key={c.key}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-[14px] hover:bg-mist-50">
                        <input
                          type="checkbox"
                          checked={!hidden.has(c.key)}
                          disabled={!hidden.has(c.key) && shown.length === 1}
                          onChange={() =>
                            setHidden((h) => {
                              const n = new Set(h);
                              if (n.has(c.key)) n.delete(c.key);
                              else n.add(c.key);
                              return n;
                            })
                          }
                          className="size-4 accent-ocean-600"
                        />
                        {c.header}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="my-2.5 h-px bg-mist-200" />
                <p className="px-1 text-[12px] font-semibold text-mist-500">Density</p>
                <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-mist-100 p-1">
                  {DENSITIES.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setDensity(o.v)}
                      aria-pressed={density === o.v}
                      className={`rounded-md py-1.5 text-[13px] font-medium ${density === o.v ? "bg-mist-0 text-navy-900 shadow-sm" : "text-mist-600"}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                <div className="my-2.5 h-px bg-mist-200" />
                <button
                  type="button"
                  onClick={() => {
                    exportCsv();
                    setMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-[14px] font-medium text-navy-900 hover:bg-mist-50"
                >
                  <Icon name="download" className="size-[18px] text-mist-600" />
                  Export {filtered.length === rows.length ? "all" : filtered.length} as CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Every filter on one line, opened from the Filters button */}
      {hasFilters && filtersOpen && (
        <div id={filterRowId} className="flex flex-wrap items-center gap-2 border-b border-mist-200 bg-mist-50 px-4 py-3">
          {filters.map((f) => (
            <Select
              key={f.key}
              label={f.label}
              value={active[f.key] ?? "All"}
              onChange={(v) => {
                setActive((a) => ({ ...a, [f.key]: v }));
                setPage(0);
              }}
              options={[
                { value: "All", label: `All ${f.label.toLowerCase()}`, count: rows.length },
                ...f.options.map((o) => ({ value: o, label: o, count: rows.filter((r) => matches(f, r, o)).length })),
              ]}
              className="min-w-[8.5rem] flex-1 sm:flex-none"
            />
          ))}
          {filterExtras}
        </div>
      )}

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-mist-200 px-4 py-2.5">
          <span className="text-[13px] text-mist-600">
            {filtered.length} of {rows.length}
          </span>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                c.clear();
                setPage(0);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 py-1 pl-3 pr-2 text-[13px] font-medium text-ocean-800 ring-1 ring-inset ring-ocean-200 hover:bg-ocean-100"
            >
              {c.label}
              <Icon name="x" className="size-3.5" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive({});
              extraChips.forEach((c) => c.clear());
              setPage(0);
            }}
            className="text-[13px] font-medium text-ocean-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist-200 bg-ocean-50 px-4 py-2.5 text-[14px]">
          <span className="font-medium text-ocean-800">{selected.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions?.([...selected])}
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-md px-2 py-1 text-ocean-700 hover:bg-ocean-100">
              Clear selection
            </button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          variant="no-results"
          title={emptyTitle}
          body={chips.length ? "Try a different search or clear the filters." : undefined}
          onClearFilters={
            chips.length
              ? () => {
                  setQuery("");
                  setActive({});
                  extraChips.forEach((c) => c.clear());
                  setPage(0);
                }
              : undefined
          }
        />
      ) : renderGrid ? (
        renderGrid(visible, (r) => setOpen(r))
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
                      <div className="text-[15px] font-medium text-navy-900">{first.cell ? first.cell(r) : String(getValue(first, r) ?? "")}</div>
                      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
                        {rest.filter((c) => c.card !== false).map((c) => (
                          <div key={c.key} className="min-w-0">
                            <dt className="text-[11px] font-medium text-mist-500">{c.header}</dt>
                            <dd className="mt-0.5 truncate text-[13px] text-navy-900">{c.cell ? c.cell(r) : String(getValue(c, r) ?? "")}</dd>
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

          {/* Tablets and up: the table */}
          <div className="scroll-thin relative hidden overflow-x-auto overflow-y-hidden md:block">
            <table className="w-full min-w-[44rem] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-mist-200 bg-mist-50 text-[12px] font-medium text-mist-600">
                  {selectable && (
                    <th scope="col" className="w-10 px-4 py-3">
                      <input ref={selectAllRef} type="checkbox" aria-label="Select all on this page" checked={allVisibleSelected} onChange={toggleAll} className="size-4 accent-ocean-600" />
                    </th>
                  )}
                  {shown.map((c) => {
                    const sorted = sort?.key === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={sorted ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                        className={`px-4 py-3 font-medium ${c.numeric ? "text-right" : ""} ${c.hideBelow ? hide[c.hideBelow] : ""} ${c.className ?? ""}`}
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
                    <th scope="col" className="w-12 px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-mist-100 transition-colors last:border-0 hover:bg-mist-50 ${renderDetail ? "cursor-pointer focus-visible:bg-mist-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ocean-600" : ""} ${selected.has(r.id) ? "bg-ocean-50/60" : ""}`}
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
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Select row" checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} className="size-4 accent-ocean-600" />
                      </td>
                    )}
                    {shown.map((c) => (
                      <td key={c.key} className={`${cellPad} align-middle text-navy-900 ${c.numeric ? "text-right tabular-nums" : ""} ${c.hideBelow ? hide[c.hideBelow] : ""} ${c.className ?? ""}`}>
                        {c.cell ? c.cell(r) : String(getValue(c, r) ?? "")}
                      </td>
                    ))}
                    {hasRowEnd && (
                      <td className={`${cellPad} text-right`} onClick={(e) => e.stopPropagation()}>
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 px-4 py-3 text-[13px] text-mist-600">
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
              className="h-8 rounded-md bg-mist-0 px-2 text-[13px] tabular-nums text-navy-900 ring-1 ring-inset ring-mist-300 focus:outline-2 focus:outline-ocean-600"
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
                  className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 font-medium tabular-nums ${p === current ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-mist-100"}`}
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
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div role="tablist" aria-label={label} className=" -mb-px flex scroll-strip">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-[14px] font-medium transition-colors duration-150 ${
              on ? "border-ocean-600 text-navy-900" : "border-transparent text-mist-600 hover:text-navy-900"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`min-w-6 rounded-full px-1.5 text-center text-[12px] tabular-nums ${on ? "bg-ocean-600 text-white" : "bg-mist-100 text-mist-600"}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
