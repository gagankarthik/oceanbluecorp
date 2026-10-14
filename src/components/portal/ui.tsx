import Icon, { type IconName } from "./icons";
import { Sparkline } from "./charts";
import { sectionTone, type Section } from "./kit/tone";

// Layout, states and Button live in ./kit; re-exported so existing imports keep working.
export { sectionTone, type Section } from "./kit/tone";
export { Button } from "./kit/Button";
export { PageHeader, Panel } from "./kit/layout";
export { EmptyState, NoAccess } from "./kit/states";

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

/** Segmented control for 2–4 mutually exclusive views (period, chart metric, table/cards) */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  size = "md",
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: IconName }[];
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit max-w-full shrink-0 justify-self-start overflow-x-auto rounded-lg bg-mist-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ${
            size === "sm" ? "px-2.5 py-1 text-[12px]" : "min-h-9 px-3 py-1.5 text-[13px]"
          } ${value === o.value ? "bg-mist-0 text-navy-900 shadow-sm" : "text-mist-600 hover:text-navy-900"}`}
        >
          {o.icon && <Icon name={o.icon} className="size-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                        */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  change,
  trend = "up",
  icon,
  hint,
  spark,
  section = "recruiting",
}: {
  label: string;
  value: React.ReactNode;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon: IconName;
  hint?: string;
  /** Optional trend values drawn as a sparkline */
  spark?: number[];
  section?: Section;
}) {
  const trendCls = trend === "up" ? "text-[#067647]" : trend === "down" ? "text-[#b42318]" : "text-navy-900";
  const footer = [change, hint].filter(Boolean).join(" · ");
  // Fixed rows (label, value, one-line footer) so every card in a row is the same height
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl bg-mist-0 p-4 ring-1 ring-mist-200">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[13px] font-medium text-mist-600">{label}</p>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${sectionTone[section].chip}`}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      <div className="mt-2 flex h-8 items-end justify-between gap-3">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-navy-900 tabular-nums">{value}</p>
        {spark && <Sparkline values={spark} color={sectionTone[section].spark} width={80} height={28} label={`${label} trend`} />}
      </div>
      <p className="mt-auto truncate pt-3 text-[13px] text-mist-600" title={footer || undefined}>
        {change && <span className={`font-medium ${trendCls}`}>{change}</span>}
        {change && hint && <span aria-hidden> · </span>}
        {hint}
        {!footer && " "}
      </p>
    </div>
  );
}

export type Tone = "blue" | "green" | "amber" | "red" | "grey" | "navy" | "cyan";

const toneStyles: Record<Tone, string> = {
  blue: "bg-ocean-50 text-ocean-700 ring-ocean-200",
  green: "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]",
  amber: "bg-[#fffaeb] text-[#b54708] ring-[#fedf89]",
  red: "bg-[#fef3f2] text-[#b42318] ring-[#fecdca]",
  grey: "bg-mist-100 text-mist-700 ring-mist-300",
  navy: "bg-navy-900 text-white ring-navy-900",
  cyan: "bg-cyan-100 text-navy-900 ring-cyan-200",
};

export function Badge({ children, tone = "grey", dot = false }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${toneStyles[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps common status words to a tone so every page colours them the same way */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/(filled|hired|placed|published|active|won|approved|live|signed|healthy|completed|success)/.test(s)) return "green";
  if (/(interview|submitted|review|scheduled|in progress|scheduled|pending|draft|proposal|invited|negotiat)/.test(s)) return "amber";
  if (/(rejected|lost|closed|suspended|expired|withdrawn|failed|archived|declined|revoked)/.test(s)) return "red";
  if (/(new|open|sourcing|screening|available|lead|prospect)/.test(s)) return "blue";
  return "grey";
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone(status)} dot>
      {status}
    </Badge>
  );
}

const avatarTones = ["bg-ocean-100 text-ocean-800", "bg-cyan-100 text-cyan-700", "bg-tide-200 text-tide-800", "bg-[#fdead7] text-[#b54708]", "bg-[#e9e4fb] text-[#5b3cc4]", "bg-[#dcfae6] text-[#067647]"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const tone = avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length];
  const sz = size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-12 text-[16px]" : "size-9 text-[13px]";
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-semibold ${sz} ${tone}`}>
      {initials}
    </span>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" }) {
  const fill = tone === "green" ? "bg-[#17b26a]" : tone === "amber" ? "bg-[#f79009]" : "bg-ocean-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function KeyValue({ items }: { items: { k: string; v: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.k}>
          <dt className="text-[12px] font-medium text-mist-500">{i.k}</dt>
          <dd className="mt-0.5 text-[14px] text-navy-900">{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A small chart-free bar list: label, value and a proportional bar */
export function BarList({ items, format = (n: number) => String(n) }: { items: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="grid gap-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-navy-900">{i.label}</span>
            <span className="font-medium tabular-nums text-navy-900">{format(i.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist-100">
            <div className="h-full rounded-full bg-ocean-600" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
