"use client";

import { useState } from "react";
import Icon, { type IconName } from "../icons";
import { useToast } from "../toast";
import { Badge, type Tone } from "../ui";
import type { Role } from "@/lib/portal/roles";
import type { Article, ArticleKind, ArticleStatus } from "@/lib/aws/dynamodb";
import { articleStatusLabel } from "@/lib/articles";
import { SERIES } from "../charts";
import { Modal as KitModal } from "../kit/overlay";

const SERIES_COLORS: readonly string[] = SERIES;

/** Roles that can create and edit publishing content; mirrors PUBLISHING_ROLES. */
export const canEdit = (role: Role) => role === "admin" || role === "hr" || role === "marketing";

export function ReadOnlyNote() {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-mist-100 px-4 py-2.5 text-[13px] text-mist-700">
      <Icon name="eye" className="size-4 shrink-0" />
      View only. Admin, HR and Media can edit this content.
    </p>
  );
}

/** "Oct 14, 2026"; a dash for a missing or unparseable date. */
export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "3 days ago", falling back to the date past a month. */
export function fmtRelative(iso?: string | null) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

const inputCls =
  "mt-1.5 block w-full rounded-lg bg-mist-0 px-3 text-[14px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600 disabled:bg-mist-50 disabled:text-mist-600";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  max,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  max?: number;
  disabled?: boolean;
  type?: string;
}) {
  const over = max !== undefined && value.length > max;
  return (
    <label className="block text-[13px] font-medium text-navy-900">
      <span className="flex items-center justify-between gap-2">
        {label}
        {max !== undefined && (
          <span className={`text-[12px] tabular-nums ${over ? "text-[#b42318]" : "text-mist-500"}`}>
            {value.length}/{max}
          </span>
        )}
      </span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`${inputCls} h-10`} />
      {hint && <span className="mt-1 block text-[12px] font-normal text-mist-500">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  max,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
}) {
  const over = max !== undefined && value.length > max;
  return (
    <label className="block text-[13px] font-medium text-navy-900">
      <span className="flex items-center justify-between gap-2">
        {label}
        {max !== undefined && (
          <span className={`text-[12px] tabular-nums ${over ? "text-[#b42318]" : "text-mist-500"}`}>
            {value.length}/{max}
          </span>
        )}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputCls} resize-y py-2 leading-relaxed`}
      />
    </label>
  );
}

/** View switches use the shared control so every portal page matches */
export { Segmented } from "../ui";

/** Kit Modal; `wide` is the extra-large size. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <KitModal title={title} onClose={onClose} footer={footer} size={wide ? "xl" : "md"}>
      {children}
    </KitModal>
  );
}

/** Copies a public link and confirms inline */
export function CopyLinkButton({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const notify = useToast();
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
          setCopied(true);
          notify("Link copied");
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
          notify("Couldn't copy the link", { tone: "error" });
        }
      }}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-mist-0 px-3 text-[13px] font-medium text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50"
    >
      <Icon name={copied ? "check" : "external"} className="size-4" />
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/**
 * Clickable legend for a breakdown chart. Uses the same order (largest first)
 * and colours as DonutChart, so each entry matches its slice. Selecting an
 * entry filters the page's table; selecting it again clears the filter.
 */
export function ChartFilter({
  label,
  data,
  value,
  onChange,
  colors,
  bare = false,
}: {
  /** No top rule, when it is the panel's only content */
  bare?: boolean;
  label: string;
  data: { label: string; value: number }[];
  value: string | null;
  onChange: (v: string | null) => void;
  /** Colour per entry in the sorted order; defaults to the categorical series */
  colors?: readonly string[];
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const palette = colors ?? SERIES_COLORS;
  return (
    <div className={bare ? "" : "mt-4 border-t border-mist-200 pt-4"}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {sorted.map((d, i) => {
          const on = value === d.label;
          return (
            <button
              key={d.label}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : d.label)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                on ? "bg-navy-900 text-white" : "bg-mist-50 text-navy-900 ring-1 ring-inset ring-mist-200 hover:bg-mist-100"
              }`}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ background: palette[i % palette.length] }} />
              {d.label}
              <span className={`tabular-nums ${on ? "text-tide-300" : "text-mist-500"}`}>{d.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Builds { label, value } counts for a category across rows */
export function countBy<T>(rows: T[], get: (r: T) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(get(r), (m.get(get(r)) ?? 0) + 1));
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}

/** Kit KpiRow; kept for existing imports. */
export { KpiRow } from "../kit/layout";

export const ARTICLE_ICONS: Record<ArticleKind, IconName> = { blog: "pen", "case-study": "chart", news: "megaphone", "customer-story": "quote" };

const STATUS_TONE: Record<ArticleStatus, Tone> = {
  draft: "grey",
  "in-review": "amber",
  scheduled: "blue",
  published: "green",
  archived: "grey",
};

export function ArticleStatusBadge({ article }: { article: Pick<Article, "status" | "publishedAt"> }) {
  return (
    <Badge tone={STATUS_TONE[article.status] ?? "grey"} dot>
      {articleStatusLabel(article.status)}
    </Badge>
  );
}

/** One compact figure in a strip; a button when it filters the queue. */
export function MiniStat({
  label,
  value,
  hint,
  icon,
  tone = "default",
  onClick,
  active,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: IconName;
  tone?: "default" | "warn";
  onClick?: () => void;
  active?: boolean;
}) {
  const chip = tone === "warn" ? "bg-[#fffaeb] text-[#b54708]" : "bg-ocean-50 text-ocean-700";
  const inner = (
    <>
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${chip}`}>
        <Icon name={icon} className="size-[18px]" />
      </span>
      <span className="min-w-0 text-left">
        <span className="flex items-baseline gap-2">
          <span className="text-[20px] font-semibold leading-none tabular-nums text-navy-900">{value}</span>
          <span className="truncate text-[13px] font-medium text-mist-700">{label}</span>
        </span>
        {hint && <span className="mt-1 block truncate text-[12px] text-mist-500">{hint}</span>}
      </span>
    </>
  );
  const cls = `flex min-h-16 min-w-0 items-center gap-3 rounded-xl bg-mist-0 px-4 py-3 ring-1 ${active ? "ring-2 ring-ocean-600" : "ring-mist-200"}`;
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${cls} transition-colors duration-150 hover:bg-mist-50`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
