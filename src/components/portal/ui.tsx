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
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit max-w-full shrink-0 justify-self-start scroll-strip rounded-lg bg-mist-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ${
            size === "sm" ? "px-2.5 py-1 text-adm-xs" : "min-h-9 px-3 py-1.5 text-adm-base"
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

/** Period-over-period change: arrow, sign and percent on a semantic pill. */
export type StatDelta = {
  /** Percent change; null when there is nothing to compare against */
  value: number | null;
  /** e.g. "vs previous 30 days" */
  label?: string;
  /** Which direction is good news; defaults to up */
  goodWhen?: "up" | "down";
};

function DeltaPill({ value, goodWhen = "up" }: StatDelta) {
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

// Spelled out: Tailwind only sees whole class names.
const toneStyles: Record<Tone, string> = {
  blue: "bg-ocean-50 text-ocean-700 ring-ocean-200",
  green: "bg-kelp-50 text-kelp-800 ring-kelp-200",
  amber: "bg-buoy-50 text-buoy-700 ring-buoy-200",
  red: "bg-coral-50 text-coral-700 ring-coral-200",
  grey: "bg-mist-100 text-mist-700 ring-mist-300",
  navy: "bg-contrast text-on-contrast ring-contrast",
  cyan: "bg-cyan-100 text-navy-900 ring-cyan-200",
  violet: "bg-ocean-100 text-ocean-800 ring-ocean-200",
  "stage-new": "bg-stage-new-badge-bg text-stage-new-badge-ink ring-stage-new-badge-rim",
  "stage-screening": "bg-stage-screening-badge-bg text-stage-screening-badge-ink ring-stage-screening-badge-rim",
  "stage-submitted": "bg-stage-submitted-badge-bg text-stage-submitted-badge-ink ring-stage-submitted-badge-rim",
  "stage-interview": "bg-stage-interview-badge-bg text-stage-interview-badge-ink ring-stage-interview-badge-rim",
  "stage-offered": "bg-stage-offered-badge-bg text-stage-offered-badge-ink ring-stage-offered-badge-rim",
  "stage-hired": "bg-stage-hired-badge-bg text-stage-hired-badge-ink ring-stage-hired-badge-rim",
  "stage-rejected": "bg-stage-rejected-badge-bg text-stage-rejected-badge-ink ring-stage-rejected-badge-rim",
};

/** Stage badges always carry their icon: the stage is never told by hue alone. */
const STAGE_ICON: Record<StageTone, IconName> = {
  "stage-new": "clock",
  "stage-screening": "eye",
  "stage-submitted": "send",
  "stage-interview": "calendar",
  "stage-offered": "mail",
  "stage-hired": "check",
  "stage-rejected": "x",
};

export function Badge({ children, tone = "grey", dot = false, icon: iconProp }: { children: React.ReactNode; tone?: Tone; dot?: boolean; icon?: IconName }) {
  const icon = iconProp ?? STAGE_ICON[tone as StageTone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-adm-xs font-medium ring-1 ring-inset ${toneStyles[tone]}`}>
      {icon ? <Icon name={icon} className="size-3.5 shrink-0" /> : dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps common status words to a tone so every page colours them the same way */
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

const TONE_ICON: Partial<Record<Tone, IconName>> = { green: "check", red: "x", amber: "timer" };

/** Status word on its tone; semantic tones carry an icon so the state is not hue alone. */
export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <Badge tone={tone} dot icon={TONE_ICON[tone]}>
      {status}
    </Badge>
  );
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

export function KeyValue({ items }: { items: { k: string; v: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.k}>
          <dt className="text-adm-xs font-medium text-mist-600">{i.k}</dt>
          <dd className="mt-0.5 text-adm-base text-navy-900">{i.v}</dd>
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
