"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type S = "operational" | "degraded" | "outage" | "investigating" | "unknown";

type LogEntry = { summary: string; message: string; status: S; time: number };

interface ServiceItem {
  id: string;
  label: string;
  category: string;
  status: S;
  statusCode: number;
  message: string | null;
  recentLogs: LogEntry[];
}

interface Incident {
  arn: string;
  regionName: string;
  serviceName: string;
  summary: string;
  status: S;
  statusCode: number;
  startedAt: number;
  log: LogEntry[];
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

// Text sits on its own container tint, so every label clears AA.
const ST: Record<S, { label: string; dot: string; chip: string }> = {
  operational: { label: "Operational", dot: "bg-kelp-700", chip: "bg-kelp-50 text-kelp-800" },
  investigating: { label: "Investigating", dot: "bg-ocean-600", chip: "bg-ocean-50 text-ocean-700" },
  degraded: { label: "Degraded", dot: "bg-buoy-500", chip: "bg-buoy-50 text-buoy-700" },
  outage: { label: "Outage", dot: "bg-coral-700", chip: "bg-coral-50 text-coral-700" },
  unknown: { label: "Unknown", dot: "bg-mist-400", chip: "bg-mist-100 text-mist-700" },
};

const BANNER: Record<S, { heading: string; sub: string }> = {
  operational: { heading: "All systems operational", sub: "All platform services are running normally." },
  investigating: { heading: "Investigating an issue", sub: "We are monitoring a potential issue with our platform." },
  degraded: { heading: "Partial service degradation", sub: "Some platform services are experiencing degraded performance." },
  outage: { heading: "Service disruption", sub: "One or more platform services have a significant outage." },
  unknown: { heading: "Status unknown", sub: "Unable to retrieve live status data right now." },
};

const REFRESH = 60;

function ts(ms: number) {
  return new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
}

function relTime(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Chip({ status }: { status: S }) {
  return <span className={`inline-flex items-center px-2.5 py-1 text-small font-medium whitespace-nowrap ${ST[status].chip}`}>{ST[status].label}</span>;
}

function Dot({ status, pulse }: { status: S; pulse?: boolean }) {
  const live = pulse && (status === "degraded" || status === "outage" || status === "investigating");
  return (
    <span className="relative flex size-2.5 shrink-0">
      {live && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-50 motion-reduce:animate-none ${ST[status].dot}`} />}
      <span className={`relative inline-flex size-2.5 rounded-full ${ST[status].dot}`} />
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  );
}

function Log({ entries }: { entries: LogEntry[] }) {
  return (
    <ol className="mt-4 grid gap-2">
      {entries.map((l, i) => (
        <li key={i} className="bg-mist-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-small font-medium">
              <Dot status={l.status} />
              {l.summary}
            </span>
            <span className="text-small text-mist-600">{relTime(l.time)}</span>
          </div>
          {l.message && <p className="mt-1.5 text-small leading-normal text-mist-600">{l.message}</p>}
        </li>
      ))}
    </ol>
  );
}

function ServiceRow({ svc }: { svc: ServiceItem }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="bg-mist-0 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Dot status={svc.status} pulse />
        <div className="min-w-0 flex-1">
          <p className="text-title font-medium">{svc.label}</p>
          <p className="text-small text-mist-600">{svc.category} · US East (Ohio)</p>
        </div>
        <Chip status={svc.status} />
      </div>
      {svc.message && <p className="mt-3 text-small text-mist-600">{svc.message}</p>}
      {svc.recentLogs.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-medium text-ocean-700 underline underline-offset-4"
          >
            {open ? "Hide log" : "View log"}
            <Chevron open={open} />
          </button>
          {open && <Log entries={svc.recentLogs} />}
        </>
      )}
    </li>
  );
}

function IncidentRow({ inc }: { inc: Incident }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="bg-mist-0">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-4 p-5 text-left md:p-6">
        <span className="mt-2">
          <Dot status={inc.status} pulse />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <Chip status={inc.status} />
            <span className="text-small text-mist-600">
              {inc.regionName} · {inc.serviceName}
            </span>
          </span>
          <span className="mt-2 block text-title font-medium">{inc.summary}</span>
          <span className="mt-1 block text-small text-mist-600">
            Started {relTime(inc.startedAt)} · {ts(inc.startedAt)}
          </span>
        </span>
        <span className="mt-2 text-mist-600">
          <Chevron open={open} />
        </span>
      </button>
      {open && inc.log.length > 0 && (
        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <Log entries={inc.log} />
        </div>
      )}
    </li>
  );
}

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
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void load();
          return REFRESH;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [load]);

  const overall: S = loading ? "unknown" : (data?.overall ?? "unknown");
  const banner = loading ? { heading: "Checking status", sub: "Fetching the latest status of our platform services." } : BANNER[overall];

  const counts = (data?.services ?? []).reduce<Partial<Record<S, number>>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-field-paper">
      {/* Live state first: no photo band, the verdict is the headline. */}
      <header id="top" className="gutter grid gap-8 pb-12 pt-14 md:pb-16 md:pt-20 lg:grid-cols-12">
        <div className="side">
          <p className="font-medium text-mist-600">System status</p>
          <p className="mt-3 inline-flex items-center gap-2 text-small font-medium">
            <Dot status={overall} pulse />
            {loading ? "Checking" : ST[overall].label}
          </p>
          <p className="mt-1 text-small text-mist-600">US East (Ohio)</p>
        </div>
        <div className="axis">
          <h1 className="display text-head-xl" aria-live="polite">
            {banner.heading}
          </h1>
          <p className="mt-5 max-w-measure-narrow text-lead leading-snug">{banner.sub}</p>
        </div>
      </header>

      <section aria-labelledby="services-title" className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
        <aside className="side">
          <div className="grid gap-px bg-mist-200 lg:sticky lg:top-24">
            {!loading && data?.ok && (
              <dl className="grid grid-cols-2 gap-px">
                {(["operational", "investigating", "degraded", "outage"] as S[]).map((s) => (
                  <div key={s} className="flex flex-col-reverse bg-mist-0 p-4">
                    <dt className="mt-1 flex items-center gap-2 text-small text-mist-600">
                      <Dot status={s} />
                      {ST[s].label}
                    </dt>
                    <dd className="display text-head-sm tabular-nums">{counts[s] ?? 0}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="bg-mist-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-small text-mist-600">
                  Next check in <span className="tabular-nums text-navy-900">{countdown}s</span>
                </p>
                <button
                  type="button"
                  onClick={() => void load(true)}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  className="inline-flex min-h-11 items-center px-4 text-small font-medium text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline disabled:opacity-50"
                >
                  {refreshing ? "Checking…" : "Refresh"}
                </button>
              </div>
              {data?.checkedAt && (
                <p className="mt-3 text-small text-mist-600">
                  Last checked {new Date(data.checkedAt).toLocaleString()}. Refreshes every {REFRESH}s.
                </p>
              )}
              {data?.ok && (
                <p className="mt-1 text-small text-mist-600">
                  {data.ohioEvents ?? 0} active event{(data.ohioEvents ?? 0) !== 1 ? "s" : ""} in region.
                </p>
              )}
            </div>
          </div>
        </aside>

        <div className="axis grid content-start gap-14">
          <div>
            <h2 id="services-title" className="display text-head-md">
              Platform services
            </h2>
            {loading ? (
              <ul className="mt-6 grid gap-2" aria-label="Loading services">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="h-[92px] animate-pulse bg-mist-0 motion-reduce:animate-none" />
                ))}
              </ul>
            ) : !data?.ok ? (
              <div role="alert" className="mt-6 bg-mist-100 p-8">
                <p className="text-title font-medium">Could not load status data</p>
                <p className="mt-2 text-mist-600">The status feed may be temporarily unavailable.</p>
                <button
                  type="button"
                  onClick={() => void load(true)}
                  className="mt-6 inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
                >
                  Try again
                </button>
              </div>
            ) : (
              <ul className="mt-6 grid gap-2">
                {data.services.map((svc) => (
                  <ServiceRow key={svc.id} svc={svc} />
                ))}
              </ul>
            )}
          </div>

          {data?.ok && (
            <div>
              <h2 className="display text-head-md">
                Active incidents{data.activeIncidents.length > 0 && <span className="text-mist-600"> ({data.activeIncidents.length})</span>}
              </h2>
              {data.activeIncidents.length > 0 ? (
                <ul className="mt-6 grid gap-2">
                  {data.activeIncidents.map((inc) => (
                    <IncidentRow key={inc.arn} inc={inc} />
                  ))}
                </ul>
              ) : (
                <div className="mt-6 flex items-center gap-4 bg-mist-0 p-5 md:p-6">
                  <Dot status="operational" />
                  <div>
                    <p className="text-title font-medium">No active incidents</p>
                    <p className="mt-1 text-small text-mist-600">No active events reported for the US East (Ohio) region.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-mist-600">
            Something not working that this page does not show?{" "}
            <Link href="/contact" className="text-ocean-700 underline underline-offset-4">
              Tell us
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
