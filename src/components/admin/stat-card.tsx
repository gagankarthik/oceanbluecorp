"use client";

import * as React from "react";
import Link from "next/link";
// IconTrend covers the rising case. There is no falling counterpart in the
// custom set, so the down arrow stays on lucide rather than reusing the up
// glyph rotated — a mirrored trend line reads as a different shape, not the
// same one inverted.
import { TrendingDown } from "lucide-react";
import { IconTrend } from "./icons";
import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  /** Any 24x24 stroke icon: Lucide, or one of the custom domain icons. */
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: Tone;
  /** Optional period-over-period delta chip. */
  delta?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
  /**
   * Renders a proportion bar under the figure: this metric's share of a whole.
   *
   * A KPI row of six bare integers gives no sense of scale — "12" means nothing
   * until you know whether the total is 14 or 1,400. The bar answers that in
   * the same glance, without a second panel or a legend.
   *
   * Pass the denominator only where a part-to-whole reading is truthful. A
   * median or an average is not a share of anything; leave it off there.
   */
  share?: { of: number; label?: string };
  /** If set, the whole card becomes a link and gains a hover lift. */
  href?: string;
  /** "sm" is a more compact variant for dense list-page headers. */
  size?: "default" | "sm";
  className?: string;
}

/**
 * KPI tile.
 *
 * Reworked from a rounded card with a large tinted icon chip into a flat
 * business-system metric tile: the label leads (uppercase, small), the figure
 * dominates, and the icon shrinks to a quiet marker. Tiles are designed to be
 * butted together in a grid so a KPI row reads as one instrument panel rather
 * than four floating cards.
 */
export function StatCard({ label, value, icon: Icon, tone = "blue", delta, hint, share, href, size = "default", className }: StatCardProps) {
  const t = tones[tone];
  const sm = size === "sm";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
  const pct = share && share.of > 0 && Number.isFinite(numeric)
    ? Math.min(100, Math.max(0, (numeric / share.of) * 100))
    : null;
  const body = (
    <div
      className={cn(
        "group relative flex flex-col rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)] transition-colors duration-150",
        sm ? "gap-3 p-5" : "gap-3.5 p-6",
        href && "cursor-pointer hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className={cn("h-[18px] w-[18px] flex-none", t.text)} strokeWidth={1.75} />
          <span className="truncate text-[13.5px] font-medium text-[var(--adm-ink-mute)]">
            {label}
          </span>
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
              delta.direction === "up"
                ? "bg-emerald-50 text-emerald-700"
                : delta.direction === "down"
                ? "bg-rose-50 text-rose-700"
                : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
            )}
          >
            {delta.direction === "up" && <IconTrend className="h-3 w-3" />}
            {delta.direction === "down" && <TrendingDown className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <div className={cn("font-bold leading-none tracking-tight tabular-nums text-[var(--adm-ink)]", sm ? "text-[24px]" : "text-[32px]")}>
          {value}
        </div>
        {pct !== null && (
          <div className="mt-2.5 flex items-center gap-2">
            {/* Accent token rather than the tone's colour: the bar encodes
                magnitude, not category, so it should read the same on every
                tile in the strip. */}
            <span className="h-1.5 flex-1 overflow-hidden rounded-[2px] bg-[var(--adm-line-soft)]">
              <span
                className="block h-full rounded-[2px] bg-[var(--adm-accent)] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="text-[11.5px] font-semibold tabular-nums text-[var(--adm-ink-subtle)]">
              {Math.round(pct)}%
            </span>
          </div>
        )}
        {hint && <div className="mt-2 text-[12.5px] leading-snug text-[var(--adm-ink-subtle)]">{hint}</div>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

const STRIP_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

/**
 * The KPI row at the top of a module screen: a single bordered instrument
 * panel whose cells are divided by hairlines, rather than N floating cards
 * with gaps between them.
 *
 * Every list page was rebuilding this border/divider arithmetic inline and
 * getting a slightly different answer — different radii, doubled borders at
 * the wrap point, a stray right edge on the last cell of a row. Pass StatCards
 * as children and the strip handles it:
 *
 *   <KpiStrip cols={4}>
 *     <StatCard label="Open roles" value={12} icon={IconRequisition} />
 *     …
 *   </KpiStrip>
 *
 * Children are cloned to drop their own border and radius so the outer frame
 * is the only one drawn.
 */
export function KpiStrip({
  cols = 4,
  children,
  className,
}: {
  cols?: 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Separated tiles, not one bordered frame with hairline-divided cells.
        // The butted strip was the older look; the detail and utility screens
        // that still use KpiStrip were the only places left rendering it, so
        // they read as a different design from every list screen. Changing it
        // here rather than at those four call sites keeps them in step for
        // free — and StatCard already carries its own radius and shadow, so
        // the cells no longer need them stripped off.
        "grid gap-3",
        STRIP_COLS[cols],
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement<{ className?: string }>(child)
          ? React.cloneElement(child, { className: cn("h-full", child.props.className) })
          : child,
      )}
    </div>
  );
}
