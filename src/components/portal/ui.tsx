import Icon, { type IconName } from "./icons";
import { Sparkline } from "./charts";
import { sectionTone, type Section } from "./kit/tone";
import { STATE_PILL, StateIcon, statusState, type StateMark } from "./kit/state-icon";

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
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit max-w-full shrink-0 justify-self-start scroll-strip rounded-md bg-mist-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded font-medium transition-colors duration-150 ${
            size === "sm" ? "h-7 px-2.5 text-adm-xs" : "h-8 px-3 text-adm-base"
          } ${value === o.value ? "bg-mist-0 text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-mist-600 hover:text-navy-900"}`}
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

/** Period-over-period change: arrow, sign and percent on a semantic pill. */
export type StatDelta = {
  /** Percent change; null when there is nothing to compare against */
  value: number | null;
  /** e.g. "vs previous 30 days" */
  label?: string;
  /** Which direction is good news; defaults to up */
  goodWhen?: "up" | "down";
};

export function DeltaPill({ value, goodWhen = "up" }: StatDelta) {
  if (value === null) return <span className="shrink-0 rounded-md bg-mist-100 px-1.5 py-0.5 text-adm-xs font-medium text-mist-700">No data</span>;
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const tone = dir === "flat" ? "bg-mist-100 text-mist-700" : dir === goodWhen ? "bg-kelp-50 text-kelp-800" : "bg-coral-50 text-coral-700";
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-adm-xs font-medium tabular-nums ${tone}`}>
      <svg aria-hidden viewBox="0 0 12 12" className={`size-3 ${dir === "down" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {dir === "flat" ? <path d="M2.5 6h7" /> : <path d="M6 9.5v-7M2.75 5.75 6 2.5l3.25 3.25" />}
      </svg>
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  change,
  trend = "up",
  hint,
  spark,
  delta,
  section = "recruiting",
}: {
  label: string;
  value: React.ReactNode;
  change?: string;
  trend?: "up" | "down" | "flat";
  /** Accepted for older call sites; KPI cards carry no icon chip (DESIGN_SYSTEM §2.6) */
  icon?: IconName;
  hint?: string;
  /** Optional trend values drawn as a sparkline */
  spark?: number[];
  /** Change on a pill; `change` and `hint` then take their own muted line */
  delta?: StatDelta;
  section?: Section;
}) {
  const trendCls = trend === "up" ? "text-kelp-800" : trend === "down" ? "text-coral-700" : "text-navy-900";
  const footer = [change, hint].filter(Boolean).join(" · ");
  // Fixed rows (label, value, footer) so every card in a row is the same height
  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg bg-mist-0 p-4 ring-1 ring-mist-200">
      <p className="truncate text-adm-xs text-mist-600">{label}</p>
      <div className="mt-2.5 flex h-7 items-end justify-between gap-3">
        <p className="text-adm-xl font-medium leading-none tracking-tight text-navy-900 tabular-nums">{value}</p>
        {spark && <Sparkline values={spark} color={sectionTone[section].spark} width={80} height={28} label={`${label} trend`} />}
      </div>
      {delta && (
        <div className="mt-auto grid gap-1 pt-3 text-adm-xs text-mist-600">
          <p className="flex min-w-0 items-center gap-1.5">
            <DeltaPill {...delta} />
            {delta.label && <span className="truncate">{delta.label}</span>}
          </p>
          <p className="truncate" title={footer || undefined}>
            {footer || " "}
          </p>
        </div>
      )}
      {!delta && <p className="mt-auto truncate pt-3 text-adm-xs text-mist-600" title={footer || undefined}>
        {change && <span className={`font-medium ${trendCls}`}>{change}</span>}
        {change && hint && <span aria-hidden> · </span>}
        {hint}
        {!footer && " "}
      </p>}
    </div>
  );
}

type StageTone = "stage-new" | "stage-screening" | "stage-submitted" | "stage-interview" | "stage-offered" | "stage-hired" | "stage-rejected";
/** `violet` is kept for older call sites; it draws as a deep ocean step, not an off-brand hue. */
export type Tone = "blue" | "green" | "amber" | "red" | "grey" | "navy" | "cyan" | "violet" | StageTone;

// Plane's labels: a neutral bordered pill, the colour carried by a dot or icon. Spelled out:
// Tailwind only sees whole class names.
const toneMark: Record<Exclude<Tone, StageTone>, string> = {
  blue: "text-ocean-600",
  green: "text-kelp-700",
  amber: "text-buoy-600",
  red: "text-coral-600",
  grey: "text-mist-500",
  navy: "text-navy-900",
  cyan: "text-cyan-600",
  violet: "text-ocean-800",
};

const STAGE_MARK: Record<StageTone, StateMark> = {
  "stage-new": { group: "backlog" },
  "stage-screening": { group: "started", progress: 0.25 },
  "stage-submitted": { group: "started", progress: 0.5 },
  "stage-interview": { group: "started", progress: 0.7 },
  "stage-offered": { group: "started", progress: 0.9 },
  "stage-hired": { group: "completed" },
  "stage-rejected": { group: "cancelled" },
};

export function Badge({
  children,
  tone = "grey",
  dot = false,
  icon,
  mark,
}: {
  children: React.ReactNode;
  tone?: Tone;
  /** Accepted for existing call sites: every label pill carries its dot */
  dot?: boolean;
  icon?: IconName;
  /** A state icon instead of the dot (stages, statuses) */
  mark?: StateMark;
}) {
  void dot;
  const state = mark ?? STAGE_MARK[tone as StageTone];
  return (
    <span className={STATE_PILL}>
      {state ? (
        <StateIcon {...state} />
      ) : icon ? (
        <Icon name={icon} className={`size-3.5 shrink-0 ${toneMark[tone as Exclude<Tone, StageTone>]}`} />
      ) : (
        <span aria-hidden className={`size-2 shrink-0 rounded-full bg-current ${toneMark[tone as Exclude<Tone, StageTone>]}`} />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Maps common status words to a tone, for callers that colour something other than a badge */
export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  // Deliberate pauses and unstarted work are neutral, never green or red.
  if (/(inactive|disabled|archived|draft|on hold|paused)/.test(s)) return "grey";
  // Ended is not failed: closed and expired sit with the neutrals.
  if (/(closed|expired|withdrawn)/.test(s)) return "grey";
  if (/(filled|hired|placed|published|active|won|approved|live|signed|healthy|completed|success|responded)/.test(s)) return "green";
  // Amber means time pressure only; work in progress is blue.
  if (/(due soon|negotiat)/.test(s)) return "amber";
  if (/(rejected|lost|suspended|failed|declined|revoked|overdue)/.test(s)) return "red";
  if (/(scheduled|interview|submitted|review|in progress|pending|proposal|invited|new|open|sourcing|screening|available|lead|prospect)/.test(s)) return "blue";
  return "grey";
}

/** Status word with its Plane state icon: the group reads before the word does. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge mark={statusState(status)}>{status}</Badge>;
}

const avatarTones = ["bg-ocean-100 text-ocean-800", "bg-tide-200 text-tide-800", "bg-mist-200 text-mist-700", "bg-ocean-50 text-ocean-700", "bg-mist-100 text-navy-900", "bg-cyan-100 text-cyan-700"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const tone = avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length];
  const sz = size === "sm" ? "size-7 text-adm-xs" : size === "lg" ? "size-12 text-adm-md" : "size-9 text-adm-base";
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-semibold ${sz} ${tone}`}>
      {initials}
    </span>
  );
}

/** Fills clear 3:1 against the track; amber only when the bar is a warning. */
export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" }) {
  const fill = tone === "green" ? "bg-kelp-700" : tone === "amber" ? "bg-buoy-700" : "bg-ocean-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Plane's property list: an icon and muted label, the value beside it, one 32px row each. */
export function KeyValue({
  items,
  narrow = false,
}: {
  items: { k: string; v: React.ReactNode; icon?: IconName }[];
  /** A properties rail: a tighter label column so values keep one line */
  narrow?: boolean;
}) {
  return (
    <dl className="grid">
      {items.map((i) => (
        <div key={i.k} className={`grid items-start gap-3 ${narrow ? "grid-cols-[7.5rem_minmax(0,1fr)]" : "grid-cols-[8.5rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)]"}`}>
          <dt className="flex min-h-8 min-w-0 items-center gap-2 text-adm-base text-mist-600">
            {i.icon && <Icon name={i.icon} className="size-4 shrink-0 text-mist-500" />}
            <span className="truncate">{i.k}</span>
          </dt>
          <dd className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-2 py-1 text-adm-base text-navy-900 [overflow-wrap:anywhere]">{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A side sheet's title block: who or what the record is, and one line under it. */
export function PeekTitle({ name, subtitle }: { name: string; subtitle?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="lg" />
      <div className="min-w-0">
        <h3 className="truncate text-adm-lg font-semibold leading-tight text-navy-900">{name}</h3>
        {subtitle && <p className="mt-0.5 truncate text-adm-base text-mist-600">{subtitle}</p>}
      </div>
    </div>
  );
}

/** A side sheet's actions, pinned to its bottom edge while the record scrolls. */
export function PeekFooter({ children }: { children: React.ReactNode }) {
  return <div className="sticky -bottom-5 z-[1] -mx-5 -mb-5 flex flex-wrap items-center gap-2 border-t border-mist-200 bg-mist-0 px-5 py-3 sm:-mx-8 sm:px-8">{children}</div>;
}

/** A titled block inside a side sheet (Skills, Stage history). */
export function PeekSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2 border-t border-mist-100 pt-5">
      <h4 className="text-adm-base font-semibold text-navy-900">{title}</h4>
      {children}
    </section>
  );
}

/** A small chart-free bar list: label, value and a proportional bar */
export function BarList({ items, format = (n: number) => String(n) }: { items: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="grid gap-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-center justify-between text-adm-base">
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
