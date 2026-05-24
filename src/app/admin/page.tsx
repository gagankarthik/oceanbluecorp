"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Briefcase, Users, UserPlus, AlertTriangle, Clock,
  Plus, Mail, RefreshCcw, CheckCircle2, BarChart3, ArrowRight,
  TrendingUp, Filter, PieChart, Radar, Activity, Trophy,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { useAdmin } from "@/components/admin/admin-provider";
import { type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  submittedApplications: number;
  interviewApplications: number;
  offeredApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  applicationsByStatus: Record<string, number>;
  jobsByDepartment: Record<string, number>;
  monthlyApplications?: { month: string; applications: number }[];
}

const STALE_DAYS = 7;
const OFFER_STALE_DAYS = 5;
const SOURCE_COLORS = ["#1d4ed8", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
const JOB_COLORS   = ["#1d4ed8", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981"];

// ── motion presets (respect reduced-motion via useReducedMotion at call site) ───
const SPRING_EASE = [0.22, 1, 0.36, 1] as const;
function useStagger(disabled: boolean) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: disabled ? 0 : 0.05 } },
  };
  const item: Variants = {
    hidden: disabled ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: disabled ? 0 : 0.4, ease: SPRING_EASE } },
  };
  return { container, item };
}

// ── count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) { setN(0); return; }
    let raf: number, t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / ms, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

// ── donut ring (SVG) ──────────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DonutRing({ segs, size = 160, thick = 20 }: {
  segs: { label: string; value: number; color: string }[];
  size?: number; thick?: number;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const total = segs.reduce((s, g) => s + g.value, 0);
  const cx = size / 2, cy = size / 2, r = (size - thick) / 2 - 2;

  if (!total) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <p className="text-xs text-slate-400">No data</p>
    </div>
  );

  let cum = 0;
  const arcs = segs.map((seg, i) => {
    if (!seg.value) return null;
    const deg = (seg.value / total) * 360;
    const s = polar(cx, cy, r, cum + 0.5);
    const e = polar(cx, cy, r, cum + deg - 0.5);
    const big = deg > 180 ? 1 : 0;
    cum += deg;
    return (
      <path key={i}
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${big} 1 ${e.x} ${e.y}`}
        fill="none" stroke={seg.color}
        strokeWidth={hov === i ? thick + 4 : thick}
        strokeLinecap="butt"
        style={{ transition: "stroke-width 0.15s ease", cursor: "pointer" }}
        onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
      />
    );
  });

  const active = hov !== null ? segs[hov] : null;
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thick} />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {active ? (
          <>
            <span className="text-xl font-bold tabular-nums leading-none" style={{ color: active.color }}>{active.value}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">{active.label}</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{total}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">candidates</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── funnel chart (true tapering funnel) ─────────────────────────────────────────
function FunnelChart({ stats, total }: { stats: DashboardStats; total: number }) {
  const stages = [
    { label: "Applied",   count: total,                       color: "#1d4ed8" },
    { label: "Screening", count: stats.reviewingApplications, color: "#3b5bd4" },
    { label: "Submitted", count: stats.submittedApplications, color: "#4f46e5" },
    { label: "Interview", count: stats.interviewApplications, color: "#7c3aed" },
    { label: "Offered",   count: stats.offeredApplications,   color: "#d97706" },
    { label: "Hired",     count: stats.hiredApplications,     color: "#059669" },
  ];
  const max = stages[0].count || 1;
  const FLOOR = 30; // min segment width (%) so labels stay legible even at tiny counts
  const widths = stages.map((s) => Math.max((s.count / max) * 100, FLOOR));

  return (
    <div>
      <div className="space-y-1">
        {stages.map((st, i) => {
          const topW = widths[i];
          const botW = i < stages.length - 1 ? widths[i + 1] : widths[i] * 0.82;
          const clip = `polygon(${(100 - topW) / 2}% 0, ${(100 + topW) / 2}% 0, ${(100 + botW) / 2}% 100%, ${(100 - botW) / 2}% 100%)`;
          const prev = i > 0 ? stages[i - 1].count : null;
          const conv = prev && prev > 0 ? Math.round((st.count / prev) * 100) : null;
          return (
            <div key={st.label}>
              {i > 0 && (
                <div className="relative z-10 -my-1 flex justify-center">
                  <span className="rounded-full bg-white px-1.5 py-px text-[9px] font-bold tabular-nums text-slate-500 shadow-sm ring-1 ring-slate-100">
                    {conv !== null ? `${conv}%` : "—"}
                  </span>
                </div>
              )}
              <div
                className="flex h-[52px] items-center justify-center text-white shadow-sm"
                style={{ clipPath: clip, background: st.color }}
              >
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-[11px] font-semibold">{st.label}</span>
                  <span className="text-[13px] font-bold tabular-nums">{st.count.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {stats.rejectedApplications > 0 && (
        <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          {stats.rejectedApplications} not selected · {total > 0 ? Math.round((stats.rejectedApplications / total) * 100) : 0}% of applied
        </div>
      )}
    </div>
  );
}

// ── attention row ─────────────────────────────────────────────────────────────
function AttentionItem({ icon: Icon, color, title, desc, href, apps }: {
  icon: React.ComponentType<{ className?: string }>;
  color: string; title: string; desc: string;
  href?: string; apps?: Application[];
}) {
  const router = useRouter();
  return (
    <div className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
          <span style={{ color }}><Icon className="w-4 h-4" /></span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
          {apps && apps.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {apps.slice(0, 4).map((c) => (
                <button key={c.id} onClick={() => router.push(`/admin/candidates/${c.id}`)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-[var(--hz-cobalt-100)] rounded-md transition-colors">
                  <Avatar name={c.name || c.email} size="xs" />
                  <span className="text-[10px] font-semibold text-slate-700 max-w-[72px] truncate">{c.name || "—"}</span>
                </button>
              ))}
              {apps.length > 4 && <span className="text-[10px] text-slate-400 px-1 self-center">+{apps.length - 4}</span>}
            </div>
          )}
        </div>
        {href && (
          <Link href={href} className="flex-shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold hover:opacity-80" style={{ color }}>
            View <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ── main dashboard ────────────────────────────────────────────────────────────
const chartLabels: Record<string, string> = {
  "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days",
  "ytd": "Year to date", "1y": "Last 12 months", "all": "All time",
};
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000), hr = Math.floor(ms / 3600000), dy = Math.floor(ms / 86400000);
  if (m < 60) return `${m}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── loading skeleton (mirrors the dashboard layout) ────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-6 w-36" />
          <Skel className="h-3.5 w-72 max-w-[60vw]" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-9" />
          <Skel className="hidden h-9 w-24 sm:block" />
          <Skel className="h-9 w-28" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <Skel className="h-10 w-10 rounded-xl" />
              <Skel className="h-6 w-16" />
            </div>
            <Skel className="h-7 w-14" />
            <Skel className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Skel className="h-4 w-40" />
            <Skel className="h-7 w-52" />
          </div>
          <Skel className="h-[200px] w-full sm:h-[240px]" />
          <div className="flex gap-4 border-t border-slate-100 pt-3">
            <Skel className="h-3 w-16" />
            <Skel className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5">
          <Skel className="h-4 w-40 self-start" />
          <div className="h-40 w-40 animate-pulse rounded-full bg-slate-200/70" />
          <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-3 w-full" />)}
          </div>
        </div>
      </div>

      {/* insights row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5">
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-40" />
            <div className="space-y-2.5 pt-2">
              {Array.from({ length: 5 }).map((_, j) => <Skel key={j} className="h-6 w-full" />)}
            </div>
          </div>
        ))}
      </div>

      {/* bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
            <Skel className="h-4 w-40" />
            <div className="space-y-3 pt-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200/70" />
                  <div className="flex-1 space-y-1.5">
                    <Skel className="h-3 w-1/2" />
                    <Skel className="h-2.5 w-1/3" />
                  </div>
                  <Skel className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const { container, item } = useStagger(reduceMotion);
  const { setJobs: setProviderJobs, candidateRevision, openCandidateEditor } = useAdmin();

  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [applications, setApps]     = useState<Application[]>([]);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [period, setPeriod]         = useState<"7d"|"30d"|"90d"|"ytd"|"1y"|"all">("30d");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [sr, ar, jr] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/applications"), fetch("/api/jobs")]);
      const [sd, ad, jd] = await Promise.all([sr.json(), ar.json(), jr.json()]);
      if (!sr.ok) throw new Error(sd.error || "Failed to fetch stats");
      setStats(sd.stats);
      const jobsList: Job[] = jd.jobs || [];
      const jmap = new Map(jobsList.map((j: Job) => [j.id, j]));
      setApps((ad.applications || []).map((a: Application) => ({ ...a, jobTitle: a.jobTitle || (a.jobId ? jmap.get(a.jobId)?.title : "") })));
      setJobs(jobsList);
      setProviderJobs(jobsList);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [setProviderJobs]);

  useEffect(() => { void fetchAll(); }, [fetchAll, candidateRevision]);

  // ── derived ───────────────────────────────────────────────────────────────
  const total      = stats?.totalApplications || 0;
  const inPipeline = (stats?.reviewingApplications || 0) + (stats?.submittedApplications || 0) + (stats?.interviewApplications || 0) + (stats?.offeredApplications || 0);
  const convRate   = total > 0 ? Math.round(((stats?.hiredApplications || 0) / total) * 100) : 0;

  const pipelineCounts = useMemo(() => {
    const c: Partial<Record<AppStatus, number>> = {};
    for (const a of applications) { const k = a.status as AppStatus; c[k] = (c[k] || 0) + 1; }
    return c;
  }, [applications]);

  const timeToHire = useMemo(() => {
    const hired = applications.filter((a) => a.status === "hired" && a.statusHistory?.length);
    if (!hired.length) return null;
    const days = hired.flatMap((a) => {
      const e = a.statusHistory!.find((h) => h.status === "hired");
      if (!e) return [];
      const d = (new Date(e.changedAt).getTime() - new Date(a.appliedAt).getTime()) / 86400000;
      return d >= 0 ? [d] : [];
    });
    return days.length ? Math.round(days.reduce((s, d) => s + d, 0) / days.length) : null;
  }, [applications]);

  const staleCandidates = useMemo(() => {
    const cut = Date.now() - STALE_DAYS * 86400000;
    return applications.filter((a) => (a.status === "pending" || a.status === "reviewing") && new Date(a.appliedAt).getTime() < cut).slice(0, 5);
  }, [applications]);

  const offersAtRisk = useMemo(() => {
    const cut = Date.now() - OFFER_STALE_DAYS * 86400000;
    return applications.filter((a) => {
      if (a.status !== "offered") return false;
      const e = a.statusHistory?.find((h) => h.status === "offered");
      return (e ? new Date(e.changedAt).getTime() : new Date(a.updatedAt || a.appliedAt).getTime()) < cut;
    });
  }, [applications]);

  const submissionsByOwner = useMemo(() => {
    const SUBMITTED_PLUS = new Set(["submitted", "interview", "offered", "hired"]);
    const map = new Map<string, { name: string; total: number; submitted: number; hired: number; active: number }>();
    for (const a of applications) {
      const name = a.ownershipName || "Unassigned";
      if (!map.has(name)) map.set(name, { name, total: 0, submitted: 0, hired: 0, active: 0 });
      const e = map.get(name)!;
      e.total++;
      if (SUBMITTED_PLUS.has(a.status)) e.submitted++;
      if (a.status === "hired") e.hired++;
      if (!["hired", "rejected"].includes(a.status)) e.active++;
    }
    return [...map.values()].sort((a, b) => b.submitted - a.submitted || b.hired - a.hired || b.total - a.total);
  }, [applications]);

  const submissionTotals = useMemo(
    () => submissionsByOwner.reduce(
      (acc, r) => ({ submitted: acc.submitted + r.submitted, hired: acc.hired + r.hired }),
      { submitted: 0, hired: 0 },
    ),
    [submissionsByOwner],
  );

  const unassignedActive = useMemo(
    () => applications.filter((a) => !a.ownership && !["hired", "rejected"].includes(a.status)).length,
    [applications],
  );

  const recentApps = useMemo(
    () => [...applications].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).slice(0, 8),
    [applications],
  );

  const topJobs = useMemo(
    () => [...jobs].filter((j) => j.status === "active").sort((a, b) => (b.applicationsCount || 0) - (a.applicationsCount || 0)).slice(0, 5),
    [jobs],
  );

  const sourceData = useMemo(() => {
    if (!total) return [];
    const map = new Map<string, number>();
    for (const a of applications) { const s = a.source || "Other"; map.set(s, (map.get(s) || 0) + 1); }
    return [...map.entries()].map(([name, count]) => ({ name, count, pct: (count / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [applications, total]);

  const velocity = useMemo(() => {
    const now = Date.now();
    const last7 = applications.filter((a) => now - new Date(a.appliedAt).getTime() < 7 * 86400000).length;
    const prev7 = applications.filter((a) => { const age = now - new Date(a.appliedAt).getTime(); return age >= 7 * 86400000 && age < 14 * 86400000; }).length;
    return { last7, prev7, delta: last7 - prev7 };
  }, [applications]);

  const chartData = useMemo(() => {
    const now = new Date();
    let start: Date; let group: "day"|"week"|"month";
    switch (period) {
      case "7d":  start = new Date(now); start.setDate(now.getDate() - 7);          group = "day";   break;
      case "30d": start = new Date(now); start.setDate(now.getDate() - 30);         group = "day";   break;
      case "90d": start = new Date(now); start.setDate(now.getDate() - 90);         group = "week";  break;
      case "ytd": start = new Date(now.getFullYear(), 0, 1);                        group = "month"; break;
      case "1y":  start = new Date(now); start.setFullYear(now.getFullYear() - 1);  group = "month"; break;
      default:    start = new Date(0);                                               group = "month";
    }
    const filtered = applications.filter((a) => new Date(a.appliedAt) >= start);
    const b: Record<string, { applied: number; hired: number }> = {};
    if (group === "day") {
      const d = new Date(start);
      while (d <= now) { b[d.toISOString().split("T")[0]] = { applied: 0, hired: 0 }; d.setDate(d.getDate() + 1); }
      filtered.forEach((a) => { const k = new Date(a.appliedAt).toISOString().split("T")[0]; if (k in b) { b[k].applied++; if (a.status === "hired") b[k].hired++; } });
    } else if (group === "week") {
      const d = new Date(start); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      while (d <= now) { b[d.toISOString().split("T")[0]] = { applied: 0, hired: 0 }; d.setDate(d.getDate() + 7); }
      filtered.forEach((a) => { const ad = new Date(a.appliedAt); const m = new Date(ad); m.setDate(ad.getDate() - ((ad.getDay() + 6) % 7)); const k = m.toISOString().split("T")[0]; if (k in b) { b[k].applied++; if (a.status === "hired") b[k].hired++; } });
    } else {
      filtered.forEach((a) => { const ad = new Date(a.appliedAt); const k = `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, "0")}`; if (!b[k]) b[k] = { applied: 0, hired: 0 }; b[k].applied++; if (a.status === "hired") b[k].hired++; });
    }
    return Object.entries(b).sort(([a], [c]) => a.localeCompare(c)).map(([date, v]) => ({ date, ...v }));
  }, [applications, period]);

  const donutSegs = useMemo(() => [
    { label: "New",       value: pipelineCounts.pending   || 0, color: "#94a3b8" },
    { label: "Screening", value: pipelineCounts.reviewing || 0, color: "#1d4ed8" },
    { label: "Submitted", value: pipelineCounts.submitted || 0, color: "#4f46e5" },
    { label: "Interview", value: pipelineCounts.interview || 0, color: "#8b5cf6" },
    { label: "Offered",   value: pipelineCounts.offered   || 0, color: "#f59e0b" },
    { label: "Hired",     value: pipelineCounts.hired     || 0, color: "#10b981" },
    { label: "Rejected",  value: pipelineCounts.rejected  || 0, color: "#f43f5e" },
  ], [pipelineCounts]);

  const healthy = staleCandidates.length === 0 && offersAtRisk.length === 0;

  // count-up values for the KPI row (preserves the count-up animation)
  const totalCount      = useCountUp(total);
  const activeJobsCount = useCountUp(stats?.activeJobs || 0);
  const pipelineCount   = useCountUp(inPipeline);
  const convRateCount   = useCountUp(convRate);

  const velocityDelta = velocity.delta !== 0
    ? { value: `${velocity.delta > 0 ? "+" : ""}${velocity.delta}`, direction: (velocity.delta > 0 ? "up" : "down") as "up" | "down" }
    : { value: "0", direction: "flat" as const };

  const chartTotal = chartData.reduce((s, d) => s + d.applied, 0);

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />;

  if (error || !stats) return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-rose-500" />
      </div>
      <p className="text-slate-900 font-semibold">{error || "Failed to load"}</p>
      <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--hz-cobalt-600)]">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">

      {/* ── header ── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}, ${user?.name?.split(" ")[0] || "there"}. Here's your recruiting overview.`}
        meta={
          <div className="flex flex-wrap items-center gap-2.5">
            {healthy ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Pipeline healthy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Needs attention
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
        }
        actions={
          <>
            <button onClick={fetchAll} title="Refresh"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors active:scale-[0.97]">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <PageHeaderButton variant="secondary" onClick={() => router.push("/admin/jobs/new")}>
              <Briefcase className="w-3.5 h-3.5" /> Post job
            </PageHeaderButton>
            <PageHeaderButton variant="primary" onClick={() => openCandidateEditor()}>
              <Plus className="w-3.5 h-3.5" /> Add candidate
            </PageHeaderButton>
          </>
        }
      />

      {/* ── KPI cards ── */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <StatCard
            label="Total applications"
            value={totalCount}
            icon={Users}
            tone="blue"
            delta={velocityDelta}
            hint={velocity.delta !== 0 ? `${Math.abs(velocity.delta)} ${velocity.delta > 0 ? "more" : "fewer"} vs last week` : "Steady vs last week"}
            href="/admin/applications"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Active jobs"
            value={activeJobsCount}
            icon={Briefcase}
            tone="emerald"
            hint={`${stats.totalJobs} roles total`}
            href="/admin/jobs"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="In pipeline"
            value={pipelineCount}
            icon={Activity}
            tone="violet"
            hint={`${stats.interviewApplications} in interview`}
            href="/admin/applications"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            label="Conversion to hire"
            value={`${convRateCount}%`}
            icon={CheckCircle2}
            tone="amber"
            hint={timeToHire !== null ? `${timeToHire}d avg time-to-hire` : `${stats.hiredApplications} hired all-time`}
          />
        </motion.div>
      </motion.div>

      {/* ── charts row ── */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid gap-4 lg:grid-cols-3"
      >

        {/* area chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <AdminCard className="h-full">
            <AdminCardHeader
              icon={BarChart3}
              tone="blue"
              title="Application volume"
              action={
                <div className="overflow-x-auto scrollbar-none flex-shrink-0">
                  <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg min-w-max">
                    {(["7d","30d","90d","ytd","1y","all"] as const).map((p) => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={cn("px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors",
                          period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        {p === "ytd" ? "YTD" : p === "1y" ? "1Y" : p === "all" ? "All" : p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
            <div className="p-5">
              <p className="-mt-1 mb-3 text-xs text-slate-400">
                {chartLabels[period]} · <span className="font-semibold text-slate-600 tabular-nums">{chartTotal}</span> applications
              </p>
              <div className="h-[200px] sm:h-[240px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return (period === "ytd" || period === "1y" || period === "all")
                          ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
                          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <RechartsTooltip
                      cursor={{ stroke: "#1d4ed8", strokeWidth: 1, strokeDasharray: "4 4" }}
                      contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px", padding: "8px 12px", boxShadow: "0 8px 24px -4px rgba(15,23,42,0.12)" }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    />
                    <Area type="monotone" dataKey="applied" name="Applied" stroke="#1d4ed8" fill="url(#gA)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="hired"   name="Hired"   stroke="#10b981" fill="url(#gH)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--hz-cobalt)]" /> Applied</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hired</span>
              </div>
            </div>
          </AdminCard>
        </motion.div>

        {/* donut ring */}
        <motion.div variants={item}>
          <AdminCard className="flex h-full flex-col">
            <AdminCardHeader icon={PieChart} tone="violet" title="Pipeline distribution" />
            <div className="flex flex-1 flex-col items-center gap-4 p-5">
              <DonutRing segs={donutSegs} size={164} thick={22} />
              <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 w-full">
                {donutSegs.filter((s) => s.value > 0).map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                    <span className="text-[11px] text-slate-600 font-medium">{seg.label}</span>
                    <span className="text-[11px] font-bold text-slate-800 ml-auto tabular-nums">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>
        </motion.div>
      </motion.div>

      {/* ── middle insights row ── */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid gap-4 lg:grid-cols-3"
      >

        {/* funnel */}
        <motion.div variants={item}>
          <AdminCard className="h-full">
            <AdminCardHeader icon={Filter} tone="indigo" title="Hiring funnel" />
            <div className="p-5">
              <p className="-mt-1 mb-4 text-xs text-slate-400">Conversion through each stage</p>
              <FunnelChart stats={stats} total={total} />
            </div>
          </AdminCard>
        </motion.div>

        {/* source breakdown */}
        <motion.div variants={item}>
          <AdminCard className="flex h-full flex-col">
            <AdminCardHeader icon={Radar} tone="cyan" title="Application sources" />
            <div className="flex flex-1 flex-col p-5">
              <p className="-mt-1 mb-4 text-xs text-slate-400">Where candidates come from</p>
              {sourceData.length > 0 ? (
                <div className="flex-1 space-y-4">
                  <div className="flex rounded-full overflow-hidden h-3 gap-px">
                    {sourceData.map((s, i) => (
                      <div key={s.name} title={`${s.name}: ${s.count}`}
                        style={{ width: `${s.pct}%`, background: SOURCE_COLORS[i % 6] }} />
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {sourceData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: SOURCE_COLORS[i % 6] }} />
                        <span className="text-xs text-slate-600 font-medium flex-1 truncate">{s.name}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{s.count}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right">{s.pct.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50">
                    <Radar className="h-5 w-5 text-cyan-600" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-xs text-slate-400">No source data yet</p>
                </div>
              )}
            </div>
          </AdminCard>
        </motion.div>

        {/* top active jobs */}
        <motion.div variants={item}>
          <AdminCard className="h-full">
            <AdminCardHeader
              icon={Trophy}
              tone="amber"
              title="Top open roles"
              action={
                <Link href="/admin/jobs" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            <div className="p-5">
              <p className="-mt-1 mb-4 text-xs text-slate-400">By applicant count</p>
              {topJobs.length > 0 ? (
                <div className="space-y-3.5">
                  {topJobs.map((job, i) => {
                    const mx = topJobs[0].applicationsCount || 1;
                    const pct = ((job.applicationsCount || 0) / mx) * 100;
                    return (
                      <Link key={job.id} href={`/admin/jobs/${job.id}`} className="block group">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-slate-300 w-3.5 tabular-nums">{i + 1}</span>
                            <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-[var(--hz-cobalt)] transition-colors">{job.title}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-700 tabular-nums flex-shrink-0">{job.applicationsCount || 0}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-5">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(to right, ${JOB_COLORS[i % 5]}, ${JOB_COLORS[(i + 1) % 5]})` }} />
                        </div>
                        {job.department && (
                          <p className="text-[10px] text-slate-400 mt-0.5 ml-5 truncate">{job.department}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50">
                    <Briefcase className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 text-xs text-slate-400">No active jobs</p>
                </div>
              )}
            </div>
          </AdminCard>
        </motion.div>
      </motion.div>

      {/* ── submissions by team member ── */}
      <motion.div variants={item} initial="hidden" animate="show">
        <AdminCard className="overflow-hidden">
          <AdminCardHeader
            icon={TrendingUp}
            tone="blue"
            title="Submissions by team member"
            action={
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900 tabular-nums leading-none">{submissionTotals.submitted}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">Submitted</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-emerald-600 tabular-nums leading-none">{submissionTotals.hired}</p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">Hired</p>
                </div>
                <Link href="/admin/applications" className="hidden sm:inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            }
          />
          {submissionsByOwner.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Team member</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Candidates</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Submitted</th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hired</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Hire rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissionsByOwner.map((r) => {
                    const maxSub = submissionsByOwner[0].submitted || 1;
                    const conv = r.submitted > 0 ? Math.round((r.hired / r.submitted) * 100) : 0;
                    return (
                      <tr key={r.name} className="hover:bg-[#eef3fe] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={r.name} size="sm" />
                            <span className={cn("font-semibold truncate", r.name === "Unassigned" ? "italic text-slate-400" : "text-slate-800")}>{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-600">{r.total}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-right font-bold tabular-nums text-slate-900">{r.submitted}</span>
                            <div className="h-1.5 min-w-[36px] max-w-[140px] flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-[var(--hz-cobalt)]" style={{ width: `${(r.submitted / maxSub) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={cn("font-bold tabular-nums", r.hired > 0 ? "text-emerald-600" : "text-slate-300")}>{r.hired}</span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-500">{conv}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--hz-cobalt-100)]">
                <Users className="h-6 w-6 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-500">No submissions yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Assign candidates to team members to track ownership</p>
            </div>
          )}
        </AdminCard>
      </motion.div>

      {/* ── bottom row ── */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="grid gap-4 lg:grid-cols-2"
      >

        {/* recent applications */}
        <motion.div variants={item}>
          <AdminCard className="h-full overflow-hidden">
            <AdminCardHeader
              icon={Activity}
              tone="blue"
              title="Recent applications"
              action={
                <Link href="/admin/applications" className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:opacity-80">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            />
            {recentApps.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentApps.map((app) => (
                  <Link key={app.id} href={`/admin/candidates/${app.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#eef3fe] transition-colors group">
                    <Avatar name={app.name || app.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-[var(--hz-cobalt)] transition-colors">
                        {app.name || "—"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{app.jobTitle || app.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={app.status} size="sm" />
                      <span className="text-[10px] text-slate-400">{timeAgo(app.appliedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--hz-cobalt-100)]">
                  <Users className="h-6 w-6 text-[var(--hz-cobalt)]" strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-500">No applications yet</p>
              </div>
            )}
          </AdminCard>
        </motion.div>

        {/* needs attention */}
        <motion.div variants={item}>
          <AdminCard className="h-full overflow-hidden">
            <AdminCardHeader
              icon={healthy ? CheckCircle2 : AlertTriangle}
              tone={healthy ? "emerald" : "amber"}
              title="Needs attention"
              action={
                healthy
                  ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">All clear</span>
                  : <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Action needed</span>
              }
            />
            {healthy && unassignedActive === 0 ? (
              <div className="flex flex-col items-center px-5 py-9 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-600">Pipeline is healthy</p>
                <p className="text-xs text-slate-400 mt-1">No stale candidates or pending offers at risk</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {offersAtRisk.length > 0 && (
                  <AttentionItem icon={Mail} color="#f59e0b"
                    title={`${offersAtRisk.length} offer${offersAtRisk.length > 1 ? "s" : ""} pending response`}
                    desc={`${OFFER_STALE_DAYS}+ days without reply — follow up now`}
                    href="/admin/applications?status=offered" />
                )}
                {staleCandidates.length > 0 && (
                  <AttentionItem icon={Clock} color="#f43f5e"
                    title={`${staleCandidates.length} stale candidate${staleCandidates.length > 1 ? "s" : ""}`}
                    desc={`Stuck in early stages for ${STALE_DAYS}+ days`}
                    apps={staleCandidates} />
                )}
                {unassignedActive > 0 && (
                  <AttentionItem icon={UserPlus} color="#1d4ed8"
                    title={`${unassignedActive} unassigned candidate${unassignedActive > 1 ? "s" : ""}`}
                    desc="Active candidates without an assigned recruiter"
                    href="/admin/applications" />
                )}
              </div>
            )}
          </AdminCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
