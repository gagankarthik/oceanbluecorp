"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Clock, Database, HardDrive, Mail,
  Shield, Zap, Search, Loader2, ChevronDown, ChevronUp,
  Activity, Globe, Info, ArrowLeft,
} from "lucide-react";

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

// ── Config ─────────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dynamodb: Database,
  s3:       HardDrive,
  cognito:  Shield,
  ses:      Mail,
  amplify:  Zap,
};

const ST: Record<S, {
  label: string; dot: string; ring: string; bg: string; text: string;
  border: string; bar: string; icon: React.ComponentType<{ className?: string }>;
}> = {
  operational:  { label: "Operational",  dot: "bg-emerald-500", ring: "ring-emerald-200", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", icon: CheckCircle2 },
  investigating:{ label: "Investigating",dot: "bg-blue-500",    ring: "ring-blue-200",    bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    bar: "bg-blue-500",    icon: Info },
  degraded:     { label: "Degraded",     dot: "bg-amber-500",  ring: "ring-amber-200",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   bar: "bg-amber-500",   icon: AlertTriangle },
  outage:       { label: "Outage",       dot: "bg-rose-500",   ring: "ring-rose-200",    bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    bar: "bg-rose-500",    icon: XCircle },
  unknown:      { label: "Unknown",      dot: "bg-gray-400",   ring: "ring-gray-200",    bg: "bg-gray-100",   text: "text-[var(--hz-text-subtle)]",    border: "border-[var(--hz-paper-line)]",    bar: "bg-gray-400",    icon: Info },
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function Dot({ status, pulse }: { status: S; pulse?: boolean }) {
  const cfg = ST[status];
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {pulse && (status === "degraded" || status === "outage" || status === "investigating") && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
    </span>
  );
}

// ── Service diagram card ───────────────────────────────────────────────────────

function ServiceCard({ svc }: { svc: ServiceItem }) {
  const [open, setOpen] = useState(false);
  const cfg = ST[svc.status];
  const Icon = ICONS[svc.id] ?? Database;
  const hasDetail = svc.message || svc.recentLogs.length > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--hz-paper-line)] bg-white transition-colors hover:border-[color-mix(in_srgb,var(--hz-cobalt)_40%,transparent)]">
      {/* coloured left rail */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-[var(--hz-text-subtle)]">
            <Icon className={`w-[18px] h-[18px] ${cfg.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--hz-text)] truncate">{svc.label}</p>
            <p className="text-[11px] text-[var(--hz-text-subtle)] mt-0.5">{svc.category} · US East (Ohio)</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Dot status={svc.status} pulse />
            <StatusBadge status={svc.status} />
          </div>
        </div>

        {svc.message && (
          <p className="mt-2.5 text-xs text-[var(--hz-text-subtle)] leading-relaxed line-clamp-2 pl-12">
            {svc.message}
          </p>
        )}

        {hasDetail && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-2.5 pl-12 flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
          >
            {open ? <><ChevronUp className="w-3 h-3" />Hide log</> : <><ChevronDown className="w-3 h-3" />View log</>}
          </button>
        )}

        {open && svc.recentLogs.length > 0 && (
          <div className="mt-3 pl-12 space-y-2">
            {svc.recentLogs.map((l, i) => (
              <div key={i} className="bg-[var(--hz-paper)] rounded-lg px-3 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <StatusBadge status={l.status} />
                  <span className="text-[var(--hz-text-subtle)]">{relTime(l.time)}</span>
                </div>
                <p className="text-[var(--hz-text-mute)] leading-relaxed">{l.message || l.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Incident timeline ──────────────────────────────────────────────────────────

function IncidentCard({ inc }: { inc: Incident }) {
  const [open, setOpen] = useState(false);
  const cfg = ST[inc.status];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--hz-paper-line)] bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center text-[var(--hz-text-subtle)]">
          <AlertTriangle className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <StatusBadge status={inc.status} />
            <span className="text-[11px] text-[var(--hz-text-subtle)]">{inc.regionName} · {inc.serviceName}</span>
          </div>
          <p className="text-sm font-semibold text-[var(--hz-text)]">{inc.summary}</p>
          <p className="text-[11px] text-[var(--hz-text-subtle)] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Started {relTime(inc.startedAt)} · {ts(inc.startedAt)}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--hz-text-subtle)] mt-1 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--hz-text-subtle)] mt-1 flex-shrink-0" />}
      </button>

      {open && inc.log.length > 0 && (
        <div className="border-t border-[var(--hz-paper-line)] px-5 pb-4 pt-3 space-y-0">
          {inc.log.map((entry, i) => (
            <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
              {/* vertical connector */}
              {i < inc.log.length - 1 && (
                <div className="absolute left-[11px] top-5 bottom-0 w-px bg-gray-200" />
              )}
              <div className={`relative z-10 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center flex-shrink-0 mt-0.5 ring-2 ${ST[entry.status].ring} ${ST[entry.status].bg}`}>
                <Dot status={entry.status} />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-[var(--hz-text)]">{entry.summary}</span>
                  <span className="text-[10px] text-[var(--hz-text-subtle)] whitespace-nowrap">{relTime(entry.time)}</span>
                </div>
                <p className="text-xs text-[var(--hz-text-mute)] leading-relaxed">{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────────

function SummaryBar({ services }: { services: ServiceItem[] }) {
  const counts = services.reduce<Record<S, number>>(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    {} as Record<S, number>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(["operational", "investigating", "degraded", "outage"] as S[]).map((s) => {
        const cfg = ST[s];
        const count = counts[s] || 0;
        return (
          // One card, not four tinted ones. Filling each tile with its state's
          // colour meant a healthy system showed four coloured boxes, three of
          // them reading zero — the page shouted amber and red while nothing
          // was wrong. The dot carries the state; the tile stays paper.
          <div key={s} className="flex items-center gap-3 rounded-xl border border-[var(--hz-paper-line)] bg-white px-4 py-3.5">
            <Dot status={s} />
            <div>
              <p className="hz-tnum text-xl font-semibold text-[var(--hz-text)]">{count}</p>
              <p className="text-[11px] capitalize text-[var(--hz-text-subtle)]">{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
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
    <div className="horizon min-h-screen bg-[var(--hz-paper)]">

      {/* ── Header ──
          Was a full-bleed colour band — emerald, amber or rose across the whole
          width, with a dotted grid overlay, white type and blurred pill chips.
          It made the page look like a different product from the rest of the
          site, and it spent the loudest object on the page saying something a
          dot says just as well.

          The status colour is real signal and it stays, but as an accent on a
          paper ground rather than the ground itself: a dot and a label in the
          state's own colour, next to the heading. Everything else is the
          landing page's header. */}
      <section className="w-full bg-[var(--hz-paper)] pt-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[13px] font-medium text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-text)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>

          <span className="hz-eyebrow mt-8 block text-[var(--hz-cobalt)]">System status</span>
          <h1 className="hz-display mt-4 max-w-[18ch] text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] tracking-[-0.03em] text-[var(--hz-text)]">
            {banner.heading}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)]">
            {banner.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--hz-paper-line)] pt-6">
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--hz-text)]">
              <span className={`h-2.5 w-2.5 flex-none rounded-full ${ST[overall].dot}`} />
              {ST[overall].label}
            </span>
            <span className="inline-flex items-center gap-2 text-[13px] text-[var(--hz-text-mute)]">
              <Globe className="h-3.5 w-3.5" />
              US East (Ohio)
            </span>
            {data && (
              <span className="inline-flex items-center gap-2 text-[13px] text-[var(--hz-text-mute)]">
                <Search className="h-3.5 w-3.5" />
                {data.ohioEvents ?? 0} active event{(data.ohioEvents ?? 0) !== 1 ? "s" : ""} in region
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-14 space-y-8 sm:px-8">

        {/* Summary counts */}
        {!loading && data?.services && <SummaryBar services={data.services} />}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--hz-text)]">Platform Services</h2>
            <p className="text-xs text-[var(--hz-text-subtle)] mt-0.5">Tracked platform services</p>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--hz-text-subtle)]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />{countdown}s
            </span>
            <button
              onClick={() => void load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--hz-paper-line)] rounded-lg text-[var(--hz-text-mute)] hover:bg-[var(--hz-paper)] disabled:opacity-50 transition-colors"
            >
              {refreshing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
          </div>
        </div>

        {/* Service grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[var(--hz-paper-line)] h-[76px] animate-pulse" />
            ))}
          </div>
        ) : !data?.ok ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center">
            <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--hz-text-mute)]">Could not load status data</p>
            <p className="text-xs text-[var(--hz-text-subtle)] mt-1">The status feed may be temporarily unavailable.</p>
            <button onClick={() => void load(true)} className="mt-4 text-xs text-blue-600 underline">Try again</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.services.map((svc) => <ServiceCard key={svc.id} svc={svc} />)}
          </div>
        )}

        {/* Active incidents */}
        {data?.activeIncidents && data.activeIncidents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-[var(--hz-text)]">
                Active Incidents
                <span className="ml-2 text-xs font-normal text-[var(--hz-text-subtle)]">({data.activeIncidents.length})</span>
              </h2>
            </div>
            <div className="space-y-3">
              {data.activeIncidents.map((inc) => (
                <IncidentCard key={inc.arn} inc={inc} />
              ))}
            </div>
          </div>
        )}

        {/* No incidents */}
        {data?.ok && data.activeIncidents.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-200 px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--hz-text)]">No active incidents</p>
              <p className="text-xs text-[var(--hz-text-subtle)] mt-0.5">
                No active events reported for the US East (Ohio) region.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {data && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-[var(--hz-paper-line)] text-xs text-[var(--hz-text-subtle)]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Last checked: {new Date(data.checkedAt).toLocaleString()}
            </span>
            <span>Status refreshes automatically every {REFRESH}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
