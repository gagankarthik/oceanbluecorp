"use client";

import Icon, { type IconName } from "../icons";

/** Reading measure for posting copy and long notes. */
export const PROSE =
  "max-w-[72ch] text-adm-base leading-normal text-mist-700 [&_li]:marker:text-mist-500 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-navy-900 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5";

export type TabDef<K extends string> = { key: K; label: string; icon?: IconName; count?: number };

/**
 * Record tabs: a scrolling tab row from sm, a select on phones (brief: tabs
 * become a select on mobile). Same keys and counts either way.
 */
export function RecordTabs<K extends string>({
  label,
  tabs,
  value,
  onChange,
  className = "",
}: {
  label: string;
  tabs: TabDef<K>[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative sm:hidden">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value as K)}
          className="block h-10 w-full cursor-pointer appearance-none rounded-lg bg-mist-0 pl-3 pr-9 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-mist-300 focus:outline-none focus:ring-2 focus:ring-ocean-600"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
              {t.count ? ` (${t.count})` : ""}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
      </div>
      <div role="tablist" aria-label={label} className="hidden gap-5 scroll-strip border-b border-mist-200 sm:flex">
        {tabs.map((t) => {
          const on = t.key === value;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.key)}
              className={`-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 text-adm-base transition-colors duration-150 ${
                on ? "border-ocean-600 font-semibold text-navy-900" : "border-transparent text-mist-600 hover:border-mist-300 hover:text-navy-900"
              }`}
            >
              {t.icon && <Icon name={t.icon} className={`size-4 ${on ? "text-ocean-600" : "text-mist-500"}`} />}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="rounded-md bg-mist-100 px-1.5 text-adm-xs tabular-nums text-mist-700">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Label / value rows; blanks render as a quiet dash. */
export function FactRows({ items }: { items: { label: string; value?: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-mist-100">
      {items.map((f) => (
        <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="shrink-0 text-adm-base text-mist-600">{f.label}</dt>
          <dd className="min-w-0 break-words text-right text-adm-base text-navy-900">
            {f.value === undefined || f.value === null || f.value === "" ? <span className="text-mist-600">–</span> : f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** One line of facts under a record title: icon + text, wrapping. */
export function FactLine({ items }: { items: { icon: IconName; text: React.ReactNode }[] }) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-adm-base text-mist-600">
      {items.map((f, i) => (
        <span key={i} className="inline-flex min-w-0 items-center gap-1.5">
          <Icon name={f.icon} className="size-4 shrink-0 text-mist-500" />
          <span className="min-w-0 truncate">{f.text}</span>
        </span>
      ))}
    </span>
  );
}
