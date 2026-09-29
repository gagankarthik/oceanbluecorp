"use client";

import { useEffect, useState, useCallback } from "react";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";
import { cn } from "@/lib/utils";
import {
  IconServer, IconLayers, IconShieldLock, IconMail, IconCloudUp, IconClock, IconChevronDown, type IconProps,
} from "@/components/site/icons";

// ── Types ──────────────────────────────────────────────────────────────────────

type S = "operational" | "degraded" | "outage" | "investigating" | "unknown";

interface ServiceItem {
  id: string;
  label: string;
  category: string;
  status: S;
  statusCode: number;
  message: string | null;
  recentLogs: { summary: string; message: string; status: S; time: number }[];
}

interface Incident {
  arn: string;
  regionName: string;
  serviceName: string;
  summary: string;
  status: S;
  statusCode: number;
  startedAt: number;
  log: { summary: string; message: string; status: S; time: number }[];
}

interface StatusData {
  ok: boolean;
  checkedAt: string;
  region: string;
  regionLabel: string;
  overall: S;
  services: ServiceItem[];
  activeIncidents: Incident[];
  totalEvents: number;
  ohioEvents: number;
  error?: string;
}

// ── Glyphs: same 24px grid and 1.5 stroke as site/icons ─────────────────────────

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}
const IconOk = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-4.9" /></Svg>);
const IconInfo = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Svg>);
const IconWarn = (p: IconProps) => (<Svg {...p}><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4M12 17h.01" /></Svg>);
const IconStop = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6M15 9l-6 6" /></Svg>);
const IconRefresh = (p: IconProps) => (<Svg {...p}><path d="M19.5 11A7.5 7.5 0 0 0 6.2 6.8M4.5 13a7.5 7.5 0 0 0 13.3 4.2M5.5 3.5V7H9M18.5 20.5V17H15" /></Svg>);
const IconGlobe = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z" /></Svg>);

// ── Config ─────────────────────────────────────────────────────────────────────

const ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  dynamodb: IconServer,
  s3:       IconLayers,
  cognito:  IconShieldLock,
  ses:      IconMail,
  amplify:  IconCloudUp,
};

/* Each state's text sits at the 700 step on its own tint, so labels clear AA. */
const ST: Record<S, {
  label: string; dot: string; ring: string; bg: string; text: string; bar: string; icon: (p: IconProps) => React.ReactElement;
}> = {
  operational:  { label: "Operational",   dot: "bg-success", ring: "ring-success/25", bg: "bg-success-container", text: "text-success", bar: "bg-success", icon: IconOk },
  investigating:{ label: "Investigating", dot: "bg-sky-500",     ring: "ring-sky-200",     bg: "bg-sky-50",     text: "text-sky-700",     bar: "bg-sky-500",     icon: IconInfo },
  degraded:     { label: "Degraded",      dot: "bg-warning",   ring: "ring-warning/25",   bg: "bg-warning-container",   text: "text-warning",   bar: "bg-warning",   icon: IconWarn },
  outage:       { label: "Outage",        dot: "bg-danger",    ring: "ring-danger/25",    bg: "bg-danger-container",    text: "text-danger",    bar: "bg-danger",    icon: IconStop },
  unknown:      { label: "Unknown",       dot: "bg-line-strong", ring: "ring-line",        bg: "bg-paper",      text: "text-ink-muted",   bar: "bg-line-strong", icon: IconInfo },
};

const BANNER: Record<S, { heading: string; sub: string }> = {
  operational:  { heading: "All Systems Operational",  sub: "All platform services are running normally." },
  investigating:{ heading: "Investigating an Issue",   sub: "We are monitoring a potential issue with our platform." },
  degraded:     { heading: "Partial Service Degradation", sub: "Some platform services are experiencing degraded performance." },
  outage:       { heading: "Service Disruption",       sub: "One or more platform services have a significant outage." },
  unknown:      { heading: "Status Unknown",           sub: "Unable to retrieve live status data right now." },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ts(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZoneName: "short",
  });
}

function relTime(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: S }) {
  const cfg = ST[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-caption font-semibold whitespace-nowrap", cfg.bg, cfg.text)}>
      <Icon size={13} />
      {cfg.label}
    </span>
  );
}

function Dot({ status, pulse }: { status: S; pulse?: boolean }) {
  const cfg = ST[status];
  return (
    <span className="relative flex size-2.5 shrink-0">
      {pulse && (status === "degraded" || status === "outage" || status === "investigating") && (
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-50 motion-reduce:animate-none", cfg.dot)} />
      )}
      <span className={cn("relative inline-flex size-2.5 rounded-full", cfg.dot)} />
    </span>
  );
}

// ── Service card ───────────────────────────────────────────────────────────────

function ServiceCard({ svc }: { svc: ServiceItem }) {
  const [open, setOpen] = useState(false);
  const cfg = ST[svc.status];
  const Icon = ICONS[svc.id] ?? IconServer;
  const hasDetail = svc.message || svc.recentLogs.length > 0;

  return (
    <div className="relative flex h-full flex-col bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border border-line", cfg.text)}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-semibold text-ink">{svc.label}</p>
          <p className="mt-0.5 type-caption text-ink-subtle">{svc.category} · US East (Ohio)</p>
        </div>
        <Dot status={svc.status} pulse />
      </div>

      <div className="mt-4">
        <StatusBadge status={svc.status} />
      </div>

      {svc.message && <p className="mt-3 line-clamp-2 type-body-sm text-ink-muted">{svc.message}</p>}

      {hasDetail && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-3 inline-flex min-h-11 items-center gap-1 self-start type-label font-semibold text-cobalt"
        >
          <IconChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
          {open ? "Hide log" : "View log"}
        </button>
      )}

      {open && svc.recentLogs.length > 0 && (
        <div className="mt-2 space-y-2">
          {svc.recentLogs.map((l, i) => (
            <div key={i} className="rounded-lg bg-paper px-3 py-2.5 type-caption">
              <div className="mb-1 flex items-center justify-between gap-2">
                <StatusBadge status={l.status} />
                <span className="text-ink-subtle">{relTime(l.time)}</span>
              </div>
              <p className="leading-relaxed text-ink-muted">{l.message || l.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Incident timeline ──────────────────────────────────────────────────────────

function IncidentCard({ inc }: { inc: Incident }) {
  const [open, setOpen] = useState(false);
  const cfg = ST[inc.status];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 px-5 py-4 text-left">
        <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-line", cfg.text)}>
          <IconWarn size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={inc.status} />
            <span className="type-caption text-ink-subtle">{inc.regionName} · {inc.serviceName}</span>
          </div>
          <p className="text-[15px] font-semibold text-ink">{inc.summary}</p>
          <p className="mt-1 flex items-center gap-1 type-caption text-ink-subtle">
            <IconClock size={13} /> Started {relTime(inc.startedAt)} · {ts(inc.startedAt)}
          </p>
        </div>
        <IconChevronDown size={16} className={cn("mt-1 shrink-0 text-ink-subtle transition-transform", open && "rotate-180")} />
      </button>

      {open && inc.log.length > 0 && (
        <div className="border-t border-line px-5 pt-3 pb-4">
          {inc.log.map((entry, i) => (
            <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
              {i < inc.log.length - 1 && <div className="absolute top-5 bottom-0 left-[11px] w-px bg-line" />}
              <div className={cn("relative z-10 mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-white ring-2", ST[entry.status].ring, ST[entry.status].bg)}>
                <Dot status={entry.status} />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="type-label font-semibold text-ink">{entry.summary}</span>
                  <span className="type-caption whitespace-nowrap text-ink-subtle">{relTime(entry.time)}</span>
                </div>
                <p className="type-body-sm text-ink-muted">{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary counts ─────────────────────────────────────────────────────────────

function SummaryBar({ services }: { services: ServiceItem[] }) {
  const counts = services.reduce<Record<S, number>>(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    {} as Record<S, number>
  );

  return (
    // The dot carries the state; the cells stay paper, so a healthy system
    // does not show three coloured boxes reading zero.
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
      {(["operational", "investigating", "degraded", "outage"] as S[]).map((s) => (
        <div key={s} className="flex items-center gap-3 bg-white px-4 py-4">
          <Dot status={s} />
          <div>
            <dd className="type-title-lg font-semibold tabular-nums text-ink">{counts[s] || 0}</dd>
            <dt className="mt-1 type-caption text-ink-subtle">{ST[s].label}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const REFRESH = 60;

export default function StatusContent() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      setData(await res.json());
    } catch { setData(null); }
    finally { setLoading(false); setRefreshing(false); setCountdown(REFRESH); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { void load(); return REFRESH; } return c - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [load]);

  const overall: S = data?.overall ?? "unknown";
  const banner = BANNER[overall];

  return (
    <>
      {/* The status colour is real signal, so it appears as a dot and a label
          beside the heading, not as the ground of the whole header. */}
      <header data-opener className="border-b border-line bg-paper">
        <div className={`${CONTAINER} ${OPENER_Y}`}>
          <p className="type-label font-semibold text-cobalt">System status</p>
          <h1 className="mt-3 max-w-[20ch] type-headline-lg font-semibold text-ink" aria-live="polite">
            {banner.heading}
          </h1>
          <p className="mt-5 max-w-[56ch] type-body-lg text-ink-muted">{banner.sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 type-body-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-ink">
              <Dot status={overall} pulse />
              {ST[overall].label}
            </span>
            <span className="inline-flex items-center gap-2 text-ink-muted">
              <IconGlobe size={15} />
              US East (Ohio)
            </span>
            {data && (
              <span className="inline-flex items-center gap-2 text-ink-muted">
                <IconInfo size={15} />
                {data.ohioEvents ?? 0} active event{(data.ohioEvents ?? 0) !== 1 ? "s" : ""} in region
              </span>
            )}
          </div>
        </div>
      </header>

      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12`}>
          {/* Summary rail: first on phones, beside the services from lg. */}
          <aside className="space-y-4 lg:order-2 lg:sticky lg:top-28 lg:self-start">
            {!loading && data?.services && <SummaryBar services={data.services} />}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 type-body-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <IconClock size={14} /> Next check in <span className="tabular-nums">{countdown}s</span>
              </span>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 font-semibold text-ink transition-colors hover:border-cobalt disabled:opacity-50"
              >
                <IconRefresh size={14} className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined} />
                Refresh
              </button>
            </div>
            {data && (
              <p className="px-1 type-caption text-ink-subtle">
                Last checked: {new Date(data.checkedAt).toLocaleString()}. Status refreshes automatically every {REFRESH}s.
              </p>
            )}
          </aside>

          <div className="min-w-0 space-y-10 lg:order-1">
            <div>
              <h2 className="type-title-lg font-semibold text-ink">Platform Services</h2>
              <p className="mt-1 type-body-sm text-ink-subtle">Tracked platform services</p>

              <div className="mt-5">
                {loading ? (
                  <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-[140px] animate-pulse bg-white motion-reduce:animate-none" />
                    ))}
                  </div>
                ) : !data?.ok ? (
                  <div className="rounded-2xl border border-line bg-paper p-8 text-center">
                    <IconStop size={30} className="mx-auto text-danger" />
                    <p className="mt-3 text-[16px] font-semibold text-ink">Could not load status data</p>
                    <p className="mt-1 type-body-sm text-ink-muted">The status feed may be temporarily unavailable.</p>
                    <button type="button" onClick={() => void load(true)} className="mt-4 min-h-11 type-label font-semibold text-cobalt underline underline-offset-4">
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                    {data.services.map((svc) => <ServiceCard key={svc.id} svc={svc} />)}
                    {/* Keeps the hairline grid square when the count is odd. */}
                    {data.services.length % 2 === 1 && <div aria-hidden className="hidden bg-white sm:block" />}
                  </div>
                )}
              </div>
            </div>

            {data?.activeIncidents && data.activeIncidents.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 type-title-lg font-semibold text-ink">
                  <IconWarn size={20} className="text-warning" />
                  Active Incidents
                  <span className="type-body-sm font-normal text-ink-subtle">({data.activeIncidents.length})</span>
                </h2>
                <div className="mt-5 space-y-3">
                  {data.activeIncidents.map((inc) => (
                    <IncidentCard key={inc.arn} inc={inc} />
                  ))}
                </div>
              </div>
            )}

            {data?.ok && data.activeIncidents.length === 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-white px-6 py-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-container text-success">
                  <IconOk size={20} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">No active incidents</p>
                  <p className="mt-0.5 type-body-sm text-ink-muted">No active events reported for the US East (Ohio) region.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
