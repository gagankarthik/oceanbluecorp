"use client";

import * as React from "react";
import Link from "next/link";
import { Slot } from "radix-ui";
import {
  AlignJustify, ArrowLeft, BadgeCheck, Bookmark, Briefcase, Check, ChevronDown, CircleDot,
  Plus, RotateCcw, Route, Search, Settings2, Shield, SlidersHorizontal, Tag, UserRound,
  Workflow, Wrench, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "./kbd";
import { cn } from "@/lib/utils";

/* ============================================================================
   Workspace — the shell an operations screen is built from.

   The list pages were assembled from four stacked surfaces: a full-bleed
   PageHeader band, a KPI strip, a standalone toolbar card, then the table card.
   Each had its own border, its own padding and its own copy of the record
   count, and together they pushed the first row ~340px down a 1000px viewport.

   A workspace inverts that. There is ONE panel. The screen's identity, its
   saved views, its filters, its records and its status bar are bands within
   that panel, separated by hairlines rather than by gaps. Everything above the
   first record earns its place by being a control, not a label.

   Density here means fewer layers, not smaller type. Cell text stays 14px at
   every density; what changes is how much chrome sits between you and the data.
   ========================================================================== */

// ── Panel ────────────────────────────────────────────────────────────────────

/**
 * The single surface a workspace screen sits on.
 *
 * A full-bleed edge-to-edge slab was tried and read as "clumsy": with no margin
 * the panel had no edge, so the header, the tabs, the toolbar and the grid all
 * ran together into one undifferentiated block pinned to the chrome. Giving it
 * a real border, a radius and canvas around it restores the thing the eye
 * actually needs — a boundary telling it where the screen's content begins.
 */
export function Workspace({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        // flex-1 inside the shell's full-height flex column, so the panel takes
        // exactly the space left over after any KPI row above it and the grid
        // inside reaches the footer. A fixed `min-h-[calc(100vh-Nrem)]` was
        // wrong the moment anything was added above the panel: the table
        // stopped short and left a band of white above the footer.
        // min-w-0 is load-bearing, not defensive. A flex item defaults to
        // `min-width: auto`, so the panel refused to shrink below the width of
        // the grid inside it: with fixed column widths totalling ~1340px, a
        // 1280px viewport pushed the whole page sideways and clipped the KPI
        // row and the right-hand toolbar controls. With it, the panel fits the
        // viewport and the GRID scrolls horizontally inside its own container,
        // which is where a wide table should scroll.
        "flex min-h-[420px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

/*
 * There is deliberately NO WorkspaceHeader component.
 *
 * A page-title band was built here and rejected: "I don't like this part of
 * design on all pages, they look very bad." It restated what the sidebar's
 * active item and the command bar's breadcrumb already said, and it was the
 * tallest element on every screen while carrying the least.
 *
 * Workspace screens lead with ViewTabs instead, with the primary action in that
 * row's `trailing` slot. Do not reintroduce a title band.
 */

/**
 * Screen title with its primary actions.
 *
 * The earlier full-bleed white title BAND was rejected, and that judgement
 * stands — this is plain content on the canvas, no fill and no bottom rule.
 * What it restores is the convention every admin tool shares (Jakob's Law):
 * the screen's name anchors the top-left, its primary actions sit top-right,
 * and the toolbar below is left to do filtering only. Actions were previously
 * buried at the end of a row of eight filter controls, which is the last place
 * you look for "New".
 */
export function WorkspaceTitle({
  title,
  meta,
  actions,
  className,
}: {
  title: string;
  /** One line of live context under the title. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
          {title}
        </h1>
        {meta && <p className="mt-1 text-[13.5px] text-[var(--adm-ink-mute)]">{meta}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Toolbar button. One geometry for every control in the workspace chrome.
 *
 * `asChild` renders the styling onto the child element instead of a <button> —
 * needed wherever the action is really navigation and must be a real <a>, so
 * it keeps middle-click, "open in new tab" and the browser's own link
 * affordances. Without it the prop fell through to the DOM and React warned
 * ("React does not recognize the asChild prop on a DOM element"), which is
 * exactly the symptom of a link being forced into a button.
 */
export function WorkspaceButton({
  variant = "secondary",
  asChild = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      {...(asChild ? {} : { type: "button" as const })}
      {...props}
      className={cn(
        // h-9: page actions stay slim so the chrome never outweighs the data.
        "inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13.5px] font-semibold",
        // Transform as well as colour, and a press that actually depresses.
        // The 1px lift on hover is the difference between a control that
        // acknowledges the pointer and one that just recolours under it.
        "transition-all duration-150 ease-[var(--adm-ease)] active:translate-y-px active:shadow-none",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--adm-accent)] text-white shadow-[var(--adm-shadow-accent)] hover:-translate-y-px hover:bg-[var(--adm-accent-strong)]",
        variant === "secondary" &&
          "border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)] hover:-translate-y-px hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] hover:shadow-[var(--adm-shadow-md)]",
        variant === "ghost" && "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

// ── Record + form shells ─────────────────────────────────────────────────────

/**
 * Header for a single-record screen (detail or form).
 *
 * Unlike a list screen, a record screen SHOULD state its title: it is the
 * record's own name, and it is the one thing the sidebar and breadcrumb cannot
 * tell you. What it must not do is rebuild the rejected page band — so there is
 * no white fill, no bottom rule and no icon tile, just the back link, the name,
 * its status, and the actions.
 */
export function RecordHeader({
  back,
  title,
  subtitle,
  status,
  meta,
  actions,
  className,
}: {
  /** Renders a back link. Pass an href or a handler. */
  back?: { label: string; href?: string; onClick?: () => void };
  title: string;
  subtitle?: string;
  /** Status chip, rendered beside the title. */
  status?: React.ReactNode;
  /** Secondary facts: ID, dates, owner. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const backContent = back && (
    <>
      <ArrowLeft className="h-4 w-4" />
      {back.label}
    </>
  );
  return (
    <div className={cn("mb-6 flex-none", className)}>
      {back && (
        <div className="mb-3">
          {back.href ? (
            <Link
              href={back.href}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
            >
              {backContent}
            </Link>
          ) : (
            <button
              type="button"
              onClick={back.onClick}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
            >
              {backContent}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
              {title}
            </h1>
            {status}
          </div>
          {subtitle && <p className="mt-1 text-[14px] text-[var(--adm-ink-mute)]">{subtitle}</p>}
          {meta && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--adm-ink-mute)]">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** One labelled fact in a RecordHeader's meta row or a detail panel. */
export function RecordFact({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />}
      {label && <span className="text-[var(--adm-ink-subtle)]">{label}</span>}
      <span className="font-medium text-[var(--adm-ink-mute)]">{children}</span>
    </span>
  );
}

/**
 * Sticky action bar for a form.
 *
 * Long forms put Save at the bottom, which on a ten-section page means
 * scrolling past everything you just filled in to reach it — and gives no
 * persistent signal that there are unsaved changes. Pinned to the foot of the
 * viewport, the commit is always one click away and `dirty` can say so.
 */
export function FormActionBar({
  dirty,
  message,
  children,
}: {
  /** Shows the unsaved-changes note. */
  dirty?: boolean;
  /** Overrides the default status text. */
  message?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/95 px-5 py-3 backdrop-blur lg:-mx-6 lg:px-6">
      <p className="text-[13px] text-[var(--adm-ink-mute)]">
        {message ?? (dirty ? (
          <span className="inline-flex items-center gap-2 font-medium text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        ) : null)}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// ── Overview KPIs ────────────────────────────────────────────────────────────

export interface KpiItem {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Short qualifier under the figure. Use for context, never to restate it. */
  hint?: string;
  /** Draws the figure in a state colour. Use only where the value IS a state. */
  tone?: "default" | "warning" | "danger" | "success";
  /** Makes the tile a filter shortcut. */
  onClick?: () => void;
}

const KPI_COLS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

const KPI_TONE = {
  default: "text-[var(--adm-ink)]",
  warning: "text-amber-700",
  danger:  "text-rose-700",
  success: "text-emerald-700",
} as const;

/**
 * Overview strip above a workspace panel.
 *
 * An earlier pass deleted the KPI rows outright, because what was there was
 * filler: "Total clients 14 / Active 14 / Inactive 0" restated the status
 * filter, and three of four tiles drew a proportion bar against a denominator
 * the figure was not a part of ("Reachable 1, 7%").
 *
 * Reinstated deliberately, under two rules that the old rows broke:
 *   1. No share bars. If a percentage is not a true part-to-whole, it is noise.
 *   2. Every tile is either something you cannot get by reading the grid
 *      (an age, a median, a rate) or something you can click to filter to.
 * A tile that only counts rows the footer already counts does not earn a place.
 */
export function KpiRow({ items, className }: { items: KpiItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        // Static class names only — Tailwind cannot see an interpolated
        // `lg:grid-cols-${n}`, so that variant would never be generated.
        "mb-4 grid flex-none gap-3 grid-cols-2",
        KPI_COLS[Math.min(items.length, 5) as 1 | 2 | 3 | 4 | 5],
        className,
      )}
    >
      {items.map((k) => {
        const Icon = k.icon;
        const body = (
          <>
            <span className="flex items-center gap-2">
              {Icon && (
                <span className="grid h-6 w-6 flex-none place-items-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)] transition-colors group-hover/kpi:bg-[var(--adm-accent-soft)] group-hover/kpi:text-[var(--adm-accent)]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
              )}
              <span className="truncate text-[13px] font-medium text-[var(--adm-ink-mute)]">{k.label}</span>
            </span>
            <span
              className={cn(
                // -0.02em tracking: at 30px the default spacing makes a figure
                // read as loose, and tightening it is most of what separates a
                // considered metric from a number in a box.
                "text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums",
                KPI_TONE[k.tone ?? "default"],
              )}
            >
              {k.value}
            </span>
            {k.hint && <span className="text-[12.5px] leading-snug text-[var(--adm-ink-subtle)]">{k.hint}</span>}
          </>
        );
        const cls = cn(
          "group/kpi flex flex-col gap-3 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5 text-left shadow-[var(--adm-shadow-sm)]",
          k.onClick &&
            "transition-all duration-150 ease-[var(--adm-ease)] hover:-translate-y-0.5 hover:border-[var(--adm-line-strong)] hover:shadow-[var(--adm-shadow-md)] active:translate-y-0",
        );
        return k.onClick ? (
          <button key={k.label} type="button" onClick={k.onClick} className={cls}>{body}</button>
        ) : (
          <div key={k.label} className={cls}>{body}</div>
        );
      })}
    </div>
  );
}

/**
 * Conduktor-style inline stat strip: LABEL value · LABEL value, one short line
 * under the page title. Replaces the KpiRow card grid on list screens where
 * vertical space belongs to the table, not to four boxes repeating what the
 * grid already shows. Clickable stats filter, exactly like KPI tiles did.
 */
export interface StatItem {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
  /** Tooltip explaining the figure. */
  hint?: string;
}

const STAT_TONE: Record<NonNullable<StatItem["tone"]>, string> = {
  default: "text-[var(--adm-ink)]",
  success: "text-[var(--adm-success)]",
  warning: "text-[var(--adm-warning)]",
  danger:  "text-[var(--adm-danger)]",
};

export function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1.5", className)}>
      {items.map((s) => {
        const body = (
          <>
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
              {s.label}
            </span>
            <span className={cn("text-[15px] font-bold tabular-nums leading-none", STAT_TONE[s.tone ?? "default"])}>
              {s.value}
            </span>
          </>
        );
        return s.onClick ? (
          <button
            key={s.label}
            type="button"
            onClick={s.onClick}
            title={s.hint}
            className="inline-flex items-baseline gap-1.5 rounded-[4px] transition-colors hover:bg-[var(--adm-row-hover)] px-1 -mx-1 py-0.5"
          >
            {body}
          </button>
        ) : (
          <span key={s.label} title={s.hint} className="inline-flex items-baseline gap-1.5">
            {body}
          </span>
        );
      })}
    </div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

/**
 * A named group of panels.
 *
 * The console previously ran ten panels down the page as one undifferentiated
 * column: a KPI strip, then an alert panel, then a stage band, then two charts,
 * then a table, with identical 16px gaps between all of them. Nothing said
 * which panels belonged together, so the eye had to re-orient at every border
 * and the screen read as a list of widgets rather than as a report.
 *
 * A section states what a group of panels is FOR before you read any of them,
 * and the space around it is what makes the grouping legible — the gap between
 * sections is deliberately much larger than the gap between panels inside one.
 */
export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  /** One line on what question this group answers. */
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">{title}</h2>
          {description && <p className="mt-0.5 text-[13.5px] leading-snug text-[var(--adm-ink-mute)]">{description}</p>}
        </div>
        {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/**
 * Inline explanatory note.
 *
 * A metric panel says what the number is; it rarely says what a bad number
 * looks like. Where the reading is not obvious ("is 9.5 candidates per role
 * good?") a short note beside the panel is worth more than another chart.
 */
export function NotePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-4 text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Saved views ──────────────────────────────────────────────────────────────

/*
 * There is deliberately NO ViewTabs component.
 *
 * Status filters were briefly rendered as a tab row and rejected: "the filters
 * are not designed properly, unwanted tabs thing."
 *
 * The criticism is correct and worth stating so it is not repeated. A tab row
 * means "these are sibling PAGES" — in the Datadog console the user pointed at,
 * the tabs are Users / Roles / Mappings, three different screens, while the
 * filtering on those screens is done with checkboxes and dropdowns. Rendering
 * "Active / Inactive" as tabs borrows the visual language of navigation for
 * something that is not navigation, and it forces one filter to outrank every
 * other one purely because it got there first.
 *
 * Every filter now sits in one WorkspaceToolbar row as a FilterPill, with no
 * filter privileged over the others, and ActiveFilters shows what is applied.
 */

// ── Toolbar ──────────────────────────────────────────────────────────────────

/** Vertical rule for separating groups of controls inside a toolbar. */
export function ToolbarDivider() {
  return <span aria-hidden className="mx-0.5 h-6 w-px flex-none bg-[var(--adm-line)]" />;
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

/**
 * Filter/search band, fused to the panel directly above the grid. Search sits
 * left, filters follow it, and view controls anchor right.
 */
export function WorkspaceToolbar({
  search,
  children,
  trailing,
  className,
  variant = "panel",
}: {
  search?: React.ReactNode;
  /** Filter controls, in reading order. */
  children?: React.ReactNode;
  /** Right-anchored controls: density, columns, record count. */
  trailing?: React.ReactNode;
  className?: string;
  /**
   * "panel" fuses the toolbar to the table panel (band + border). "canvas"
   * floats it on the page between the stat strip and the table — the
   * Conduktor arrangement, one slim line, no chrome of its own.
   */
  variant?: "panel" | "canvas";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        variant === "panel"
          ? "border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3 py-2 lg:px-4"
          : "mb-3",
        className,
      )}
    >
      {search}
      {/* Filters are their own cluster, separated from the search box and from
          the view/action group on the right. Eleven controls in one evenly
          spaced row read as eleven equal choices; grouped by what they do, the
          eye picks the right cluster first and only then the control. */}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      {trailing && <div className="ml-auto flex flex-shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  );
}

/** Workspace search field. Compact, clearable, and slash-focusable. */
export function WorkspaceSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);

  // "/" focuses search, the convention in every keyboard-driven workspace.
  // Ignored while the user is already typing somewhere, so it never steals a
  // literal slash from a filter field or a text input.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={cn("relative w-full sm:w-[260px]", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
      <input
        ref={ref}
        type="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { onChange(""); ref.current?.blur(); } }}
        className="h-8 w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-8 pr-12 text-[13px] text-[var(--adm-ink)] transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[5px] p-1 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <Kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">/</Kbd>
      )}
    </div>
  );
}

// ── Filter pill ──────────────────────────────────────────────────────────────

/**
 * Canonical glyph per filter DIMENSION.
 *
 * The icons were picked ad hoc and were both wrong and inconsistent: a download
 * arrow for "Source", a bookmark for "Position", and "Status" rendered as a
 * briefcase on Jobs but a tick on Clients. Two faults there —
 *
 *   1. several depicted the page's ENTITY (a job is a briefcase) rather than
 *      the filter's dimension (status is a state), so the icon said nothing the
 *      column beside it did not;
 *   2. the same dimension looked different on different screens, which breaks
 *      the one thing an icon in a repeated control is for: being recognised
 *      without reading the label.
 *
 * Import from here rather than picking a glyph per page.
 */
export const FilterIcon = {
  status:   CircleDot,    // any lifecycle state: active/inactive, read/unread
  stage:    Workflow,     // position in an ordered process
  type:     Tag,          // a category the record belongs to
  position: Briefcase,    // a job / requisition
  source:   Route,        // where a record came from
  skill:    Wrench,       // capability
  workAuth: BadgeCheck,   // credential / authorisation
  person:   UserRound,    // owner, lead, added-by, uploaded-by
  role:     Shield,       // permission level
  view:     Bookmark,     // a saved view
} as const;

export interface PillOption<V extends string> {
  value: V;
  label: string;
  count?: number;
  /** Optional leading swatch, for status-coloured options. */
  color?: string;
}

/**
 * Compact filter control.
 *
 * Reads as one word plus its value ("Source: Career Portal") and takes the
 * accent only when it is actually narrowing something — a control resting at
 * "All" is not an active filter and must not look like one, or a toolbar of six
 * filters looks permanently engaged and you stop reading it.
 */
export function FilterPill<V extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  allValue = "all" as V,
  className,
}: {
  label: string;
  /**
   * Leading glyph identifying what this filter acts on.
   *
   * A row of five identically-shaped pills reading "Stage / Position / Source /
   * Skill / Added by" is scanned word by word; with an icon each one is found
   * by shape, which is how you reach for the same filter twice in a row without
   * re-reading the toolbar.
   */
  icon?: React.ComponentType<{ className?: string }>;
  value: V;
  options: readonly PillOption<V>[];
  onChange: (v: V) => void;
  allValue?: V;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  const active = value !== allValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            // Dashed "+ Label" add-filter pill when idle; once a value is picked
            // it fills solid with the accent tint and shows the chosen value.
            // h-8: the toolbar is one slim line — search, filters and table
            // controls together — so the grid starts as high as possible.
            "inline-flex h-8 max-w-[240px] items-center gap-1.5 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors",
            active
              ? "border-solid border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "border-dashed border-[var(--adm-line-strong)] bg-transparent text-[var(--adm-ink-mute)] hover:border-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]",
            "data-[state=open]:border-solid data-[state=open]:border-[var(--adm-accent)]",
            className,
          )}
        >
          {active ? (
            <>
              {current?.color ? (
                <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: current.color }} />
              ) : Icon ? (
                <Icon className="h-3.5 w-3.5 flex-none opacity-80" />
              ) : null}
              <span className="opacity-70">{label}</span>
              <span className="truncate font-semibold">{current?.label}</span>
              <ChevronDown className="h-3.5 w-3.5 flex-none opacity-60" />
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
              <span>{label}</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="max-h-[320px] min-w-[200px] overflow-y-auto rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <DropdownMenuItem
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px]",
                selected && "font-semibold text-[var(--adm-accent)]",
              )}
            >
              <Check className={cn("h-3.5 w-3.5 flex-none", selected ? "opacity-100" : "opacity-0")} />
              {o.color && (
                <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: o.color }} />
              )}
              <span className="flex-1 truncate">{o.label}</span>
              {o.count !== undefined && (
                <span className={cn("tabular-nums text-[12px]", selected ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")}>
                  {o.count}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Toggle for the advanced-filter drawer. Badges the count of active fields. */
export function AdvancedFilterToggle({
  open,
  activeCount = 0,
  onClick,
}: {
  open: boolean;
  activeCount?: number;
  onClick: () => void;
}) {
  const engaged = open || activeCount > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors",
        engaged
          ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
          : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Filters</span>
      {activeCount > 0 && (
        <span className="rounded-[5px] bg-[var(--adm-accent)] px-1.5 text-[11.5px] font-bold leading-[1.5] text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// ── In-grid select ───────────────────────────────────────────────────────────

/**
 * Editable cell control.
 *
 * A bare `<select>` is drawn by the operating system — a grey bevel on Windows,
 * a different metric on macOS — so it was the one element inside a designed
 * grid that looked unfinished, and it resized itself as the selected label
 * changed. `appearance-none` plus a fixed width and our own chevron fixes both
 * while keeping a real native select, so keyboard use and mobile pickers still
 * work. Pass `dot` to carry the value's status colour.
 */
export function GridSelect({
  value,
  onChange,
  dot,
  width = 140,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Status colour for the current value. */
  dot?: string;
  width?: number;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="relative inline-flex items-center"
      style={{ width }}
      onClick={(e) => e.stopPropagation()}
    >
      {dot && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 h-2 w-2 flex-none rounded-full"
          style={{ background: dot }}
        />
      )}
      <select
        value={value}
        onChange={onChange}
        autoComplete="off"
        aria-label={ariaLabel}
        className={cn(
          "h-9 w-full cursor-pointer appearance-none rounded-[8px] border border-transparent bg-transparent pr-7 text-[14px] font-medium text-[var(--adm-ink-mute)]",
          "transition-colors hover:border-[var(--adm-line)] hover:bg-[var(--adm-surface)]",
          "focus:border-[var(--adm-accent)] focus:bg-[var(--adm-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]",
          dot ? "pl-7" : "pl-2.5",
        )}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--adm-ink-subtle)]"
        fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

// ── Density + columns ────────────────────────────────────────────────────────

export type Density = "compact" | "default" | "relaxed";

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Compact",
  default: "Default",
  relaxed: "Relaxed",
};

/** Row-height control. Persisted by the caller so it survives navigation. */
export function DensityMenu({ value, onChange }: { value: Density; onChange: (d: Density) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Row density"
          aria-label={`Row density: ${DENSITY_LABEL[value]}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] data-[state=open]:bg-[var(--adm-row-hover)]"
        >
          <AlignJustify className="h-3.5 w-3.5" />
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[150px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11.5px] font-semibold text-[var(--adm-ink-subtle)]">
          Row density
        </DropdownMenuLabel>
        {(Object.keys(DENSITY_LABEL) as Density[]).map((d) => (
          <DropdownMenuItem
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px]",
              d === value && "font-semibold text-[var(--adm-accent)]",
            )}
          >
            <Check className={cn("h-3.5 w-3.5", d === value ? "opacity-100" : "opacity-0")} />
            {DENSITY_LABEL[d]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Column visibility. Takes the full column list and the set currently hidden.
 * `locked` columns (the identity column, the row-action column) are listed but
 * not togglable, so the control never lets you hide the thing that identifies
 * the record you are looking at.
 */
export function ColumnsMenu({
  columns,
  hidden,
  onChange,
}: {
  columns: { key: string; label: string; locked?: boolean }[];
  hidden: string[];
  onChange: (hidden: string[]) => void;
}) {
  const toggle = (key: string) =>
    onChange(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);

  const hiddenCount = hidden.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Edit columns"
          aria-label="Edit columns"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors data-[state=open]:bg-[var(--adm-row-hover)]",
            hiddenCount > 0
              ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Columns</span>
          {hiddenCount > 0 && <span className="text-[12px] font-semibold tabular-nums">{hiddenCount}</span>}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[190px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11.5px] font-semibold text-[var(--adm-ink-subtle)]">
          Columns
        </DropdownMenuLabel>
        {columns.map((c) => {
          const shown = !hidden.includes(c.key);
          return (
            <DropdownMenuItem
              key={c.key}
              disabled={c.locked}
              onSelect={(e) => { e.preventDefault(); if (!c.locked) toggle(c.key); }}
              className={cn(
                "flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px]",
                c.locked ? "cursor-default opacity-45" : "cursor-pointer",
              )}
            >
              <Check className={cn("h-3.5 w-3.5 flex-none", shown ? "opacity-100 text-[var(--adm-accent)]" : "opacity-0")} />
              <span className="flex-1 truncate">{c.label}</span>
            </DropdownMenuItem>
          );
        })}
        {hiddenCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange([])}
              className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-accent)]"
            >
              Show all columns
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Display menu ─────────────────────────────────────────────────────────────

/**
 * The table's single settings control (Conduktor's "Display" popover): column
 * visibility toggles, rows-per-page and a reset, behind one gear. Replaces the
 * separate Columns and Density menus — row density is gone entirely; every
 * grid uses the one comfortable height.
 */
export function DisplayMenu({
  columns,
  hidden = [],
  onHiddenChange,
  rows,
  rowsOptions = [25, 50, 100],
  onRowsChange,
  view,
  viewOptions,
  onViewChange,
  onReset,
}: {
  /** Toggleable columns. Omit to hide the section (grids with fixed columns). */
  columns?: { key: string; label: string; locked?: boolean }[];
  hidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
  /** Current rows-per-page. Omit to hide the section. */
  rows?: number;
  rowsOptions?: number[];
  onRowsChange?: (n: number) => void;
  /** Layout switch (Table / Kanban / List). Omit to hide the section. */
  view?: string;
  viewOptions?: { value: string; label: string }[];
  onViewChange?: (v: string) => void;
  onReset?: () => void;
}) {
  const toggle = (key: string) =>
    onHiddenChange?.(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
  const hasColumns = !!columns && !!onHiddenChange;
  const hasRows = rows !== undefined && !!onRowsChange;
  const hasView = view !== undefined && !!viewOptions && !!onViewChange;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Display settings"
          aria-label="Display settings"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-[13px] font-medium transition-colors data-[state=open]:bg-[var(--adm-row-hover)]",
            hidden.length > 0
              ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Display</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="max-h-[440px] w-[230px] overflow-y-auto rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        {hasView && (
          <>
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
              View
            </DropdownMenuLabel>
            <div className="flex gap-1 px-2 pb-1.5 pt-0.5">
              {viewOptions!.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onViewChange!(o.value)}
                  aria-pressed={o.value === view}
                  className={cn(
                    "flex-1 rounded-[6px] border px-2 py-1 text-[12.5px] font-semibold transition-colors",
                    o.value === view
                      ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                      : "border-[var(--adm-line)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {hasColumns && (
          <>
            {hasView && <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />}
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
              Table columns
            </DropdownMenuLabel>
            {columns!.filter((c) => !c.locked).map((c) => {
              const shown = !hidden.includes(c.key);
              return (
                <DropdownMenuItem
                  key={c.key}
                  onSelect={(e) => { e.preventDefault(); toggle(c.key); }}
                  className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px]"
                >
                  <span className="flex-1 truncate">{c.label}</span>
                  {/* Mini switch, like the reference — reads as on/off at a glance. */}
                  <span
                    aria-hidden
                    className={cn(
                      "relative inline-flex h-4 w-7 flex-none items-center rounded-full transition-colors",
                      shown ? "bg-[var(--adm-accent)]" : "bg-[var(--adm-line-strong)]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute h-3 w-3 rounded-full bg-white shadow transition-transform",
                        shown ? "translate-x-[14px]" : "translate-x-[2px]",
                      )}
                    />
                  </span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {hasRows && (
          <>
            {(hasColumns || hasView) && <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />}
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
              Table rows
            </DropdownMenuLabel>
            <div className="flex gap-1 px-2 pb-1.5 pt-0.5">
              {rowsOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onRowsChange!(n)}
                  aria-pressed={n === rows}
                  className={cn(
                    "flex-1 rounded-[6px] border px-2 py-1 text-[12.5px] font-semibold tabular-nums transition-colors",
                    n === rows
                      ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                      : "border-[var(--adm-line)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {onReset && (
          <>
            <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
            <DropdownMenuItem
              onClick={onReset}
              className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-ink-mute)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Active filter chips ──────────────────────────────────────────────────────

/**
 * Applied filters, each individually removable.
 *
 * Renders nothing when no filter is applied, so it costs zero vertical space on
 * the default view. That is the whole reason it can live inside the panel: a
 * band that is always present has to justify itself on every screen; one that
 * appears only once you have narrowed something is answering a question you
 * just asked.
 */
export function ActiveFilters({
  chips,
  onClearAll,
  variant = "panel",
}: {
  chips: { label: string; onClear: () => void }[];
  onClearAll: () => void;
  /** Match the toolbar it sits under — see WorkspaceToolbar. */
  variant?: "panel" | "canvas";
}) {
  if (chips.length === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        variant === "panel"
          ? "border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-2.5 lg:px-5"
          : "mb-3",
      )}
    >
      {chips.map((c) => (
        <span
          key={c.label}
          className="inline-flex items-center gap-1.5 rounded-[7px] border border-[var(--adm-line)] bg-[var(--adm-surface)] py-1 pl-2.5 pr-1.5 text-[13px] text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)]"
        >
          {c.label}
          <button
            type="button"
            onClick={c.onClear}
            aria-label={`Remove filter ${c.label}`}
            className="rounded-[4px] p-0.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-[13px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:text-rose-600"
      >
        Clear all
      </button>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

/** Record status bar, fused to the bottom of the panel. */
export function WorkspaceFooter({
  shown,
  total,
  noun,
  children,
}: {
  shown: number;
  total: number;
  noun: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-5 py-3 lg:px-6">
      <p className="text-[13.5px] tabular-nums text-[var(--adm-ink-mute)]">
        <span className="font-semibold text-[var(--adm-ink-mute)]">{shown}</span>
        {shown !== total && <> of <span className="font-semibold text-[var(--adm-ink-mute)]">{total}</span></>} {noun}
      </p>
      {children}
    </div>
  );
}

// ── Bulk selection bar ───────────────────────────────────────────────────────

/**
 * Floating action bar for a multi-row selection.
 *
 * Anchored to the bottom of the viewport rather than inlined in the toolbar.
 * Inline, it appeared between the filters and the grid and pushed every row
 * down the instant you ticked a checkbox, so the row under your cursor moved
 * out from under it. Floating, the grid never shifts.
 */
export function SelectionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-[10px] border border-slate-700 bg-slate-900 py-1.5 pl-3 pr-1.5 text-white shadow-[var(--adm-shadow-lg)]">
        <span className="text-[13px] font-medium tabular-nums">
          {count} selected
        </span>
        <span aria-hidden className="h-4 w-px bg-slate-700" />
        {children}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
