"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Briefcase, Users, UserPlus, AlertTriangle, Clock,
  Plus, Mail, RefreshCcw, CheckCircle2, BarChart3, ArrowRight,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { useAdmin } from "@/components/admin/admin-provider";
import { type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { PageLoading, InlineSpinner } from "@/components/ui/ocean-spinner";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
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
const SOURCE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
const JOB_COLORS   = ["#3b82f6", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981"];

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

// ── sparkline ─────────────────────────────────────────────────────────────────
function Spark({ data, color = "#60a5fa", w = 72, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (data.length < 2) return <div style={{ width: w, height: h }} />;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h * 0.85 - h * 0.075}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
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

// ── hero KPI tile ─────────────────────────────────────────────────────────────
function HeroKPI({ label, value, color, spark, suffix = "", sub }: {
  label: string; value: number; color: string; spark: number[];
  suffix?: string; sub?: string;
}) {
  const n = useCountUp(value);
  return (
    <div className="rounded-xl p-3.5 flex flex-col gap-2"
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
        {spark.length >= 2 && <Spark data={spark} color={color} w={60} h={26} />}
      </div>
      <p className="text-[2rem] font-extrabold tracking-tight leading-none" style={{ color }}>{n}{suffix}</p>
      {sub && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>{sub}</p>}
    </div>
  );
}

// ── funnel chart ──────────────────────────────────────────────────────────────
function FunnelChart({ stats, total }: { stats: DashboardStats; total: number }) {
  const stages = [
    { label: "Applied",   count: total,                       color: "#3b82f6" },
    { label: "Screening", count: stats.reviewingApplications, color: "#6366f1" },
    { label: "Interview", count: stats.interviewApplications, color: "#8b5cf6" },
    { label: "Offered",   count: stats.offeredApplications,   color: "#f59e0b" },
    { label: "Hired",     count: stats.hiredApplications,     color: "#10b981" },
  ];
  const max = stages[0].count || 1;
  return (
    <div className="space-y-0.5">
      {stages.map((st, i) => {
        const pct = Math.max((st.count / max) * 100, st.count > 0 ? 10 : 0);
        const mg = (100 - pct) / 2;
        const prev = i > 0 ? stages[i - 1].count : null;
        const conv = prev && prev > 0 ? Math.round((st.count / prev) * 100) : null;
        return (
          <div key={st.label}>
            {i > 0 && (
              <div className="flex items-center justify-center h-5">
                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                  {conv !== null ? `↓ ${conv}%` : "↓"}
                </span>
              </div>
            )}
            <div style={{ paddingLeft: `${mg}%`, paddingRight: `${mg}%`, transition: "padding 0.8s ease" }}>
              <div className="h-8 rounded-lg flex items-center justify-between px-3 shadow-sm" style={{ background: st.color }}>
                <span className="text-[11px] font-bold text-white">{st.label}</span>
                <span className="text-[11px] font-bold text-white/90 tabular-nums">{st.count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
      {stats.rejectedApplications > 0 && (
        <p className="text-[10px] text-center text-slate-400 pt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1" />
          {stats.rejectedApplications} rejected · {total > 0 ? Math.round((stats.rejectedApplications / total) * 100) : 0}%
        </p>
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-blue-100 rounded-md transition-colors">
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
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
  const inPipeline = (stats?.reviewingApplications || 0) + (stats?.interviewApplications || 0) + (stats?.offeredApplications || 0);
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

  const recruiterWorkload = useMemo(() => {
    const map = new Map<string, { name: string; total: number; active: number }>();
    for (const a of applications) {
      const name = a.ownershipName || "Unassigned";
      const active = !["hired", "rejected"].includes(a.status);
      if (!map.has(name)) map.set(name, { name, total: 0, active: 0 });
      const e = map.get(name)!; e.total++; if (active) e.active++;
    }
    return [...map.values()].sort((a, b) => b.active - a.active).slice(0, 5);
  }, [applications]);

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

  const sparkData = useMemo(() => (stats?.monthlyApplications || []).map((m) => m.applications), [stats]);

  const donutSegs = useMemo(() => [
    { label: "New",       value: pipelineCounts.pending   || 0, color: "#94a3b8" },
    { label: "Screening", value: pipelineCounts.reviewing || 0, color: "#3b82f6" },
    { label: "Interview", value: pipelineCounts.interview || 0, color: "#8b5cf6" },
    { label: "Offered",   value: pipelineCounts.offered   || 0, color: "#f59e0b" },
    { label: "Hired",     value: pipelineCounts.hired     || 0, color: "#10b981" },
    { label: "Rejected",  value: pipelineCounts.rejected  || 0, color: "#f43f5e" },
  ], [pipelineCounts]);

  const healthy = staleCandidates.length === 0 && offersAtRisk.length === 0;

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) return <PageLoading label="Loading dashboard…" />;

  if (error || !stats) return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-rose-500" />
      </div>
      <p className="text-slate-900 font-semibold">{error || "Failed to load"}</p>
      <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">

      {/* ── header ── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}, ${user?.name?.split(" ")[0] || "there"}. Here's your recruiting overview.`}
        actions={
          <>
            <button onClick={fetchAll} title="Refresh"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
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

      {/* ── HERO BAND ── */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #1e3a8a 80%, #0c4a6e 100%)" }}>
        {/* dot-grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        {/* ambient glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)" }} />
        <div className="absolute -bottom-16 left-10 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)" }} />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            {/* left: greeting */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                {healthy ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Pipeline healthy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Needs attention
                  </span>
                )}
                <span className="text-slate-400 text-[11px]">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {greeting()}, {user?.name?.split(" ")[0] || "there"}
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
                {velocity.delta > 0
                  ? `+${velocity.delta} more applications vs last week — momentum building`
                  : velocity.delta < 0
                  ? `${Math.abs(velocity.delta)} fewer applications than last week`
                  : "Application velocity is steady this week"}
              </p>
            </div>

            {/* right: KPI tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full lg:flex-1 lg:max-w-2xl">
              <HeroKPI label="Applications" value={total}             color="#60a5fa" spark={sparkData} />
              <HeroKPI label="Active jobs"  value={stats.activeJobs}  color="#34d399" spark={[]} />
              <HeroKPI label="In pipeline"  value={inPipeline}        color="#a78bfa" spark={[]} />
              <HeroKPI label="Conversion"   value={convRate}          color="#fbbf24" spark={[]}
                suffix="%" sub={timeToHire !== null ? `${timeToHire}d avg time-to-hire` : undefined} />
            </div>
          </div>
        </div>
      </div>

      {/* ── charts row ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Application volume
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {chartLabels[period]} · {chartData.reduce((s, d) => s + d.applied, 0)} total
              </p>
            </div>
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
          </div>
          <div className="h-[200px] sm:h-[240px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
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
                  cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }}
                  contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px", padding: "8px 12px", boxShadow: "0 8px 24px -4px rgba(15,23,42,0.12)" }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                />
                <Area type="monotone" dataKey="applied" name="Applied" stroke="#3b82f6" fill="url(#gA)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="hired"   name="Hired"   stroke="#10b981" fill="url(#gH)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Applied</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hired</span>
          </div>
        </div>

        {/* donut ring */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Pipeline distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">Hover to inspect each stage</p>
          <div className="flex-1 flex flex-col items-center gap-4">
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
        </div>
      </div>

      {/* ── middle insights row ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* funnel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900">Hiring funnel</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Conversion through each stage</p>
          <FunnelChart stats={stats} total={total} />
        </div>

        {/* source breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900">Application sources</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Where candidates come from</p>
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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-400 italic text-center py-6">No source data yet</p>
            </div>
          )}
        </div>

        {/* top active jobs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top open roles</h3>
              <p className="text-xs text-slate-400 mt-0.5">By applicant count</p>
            </div>
            <Link href="/admin/jobs" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
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
                        <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{job.title}</span>
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
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No active jobs</p>
            </div>
          )}
        </div>
      </div>

      {/* ── bottom row ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* recent applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest candidates</p>
            </div>
            <Link href="/admin/applications" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentApps.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <Link key={app.id} href={`/admin/candidates/${app.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/40 transition-colors group">
                  <Avatar name={app.name || app.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
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
            <div className="py-14 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No applications yet</p>
            </div>
          )}
        </div>

        {/* right col: attention + workload */}
        <div className="flex flex-col gap-4">

          {/* needs attention */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", healthy ? "bg-emerald-50" : "bg-amber-50")}>
                  {healthy
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900">Needs attention</h3>
              </div>
              {healthy && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All clear</span>
              )}
            </div>
            {healthy && unassignedActive === 0 ? (
              <div className="py-7 px-5 text-center">
                <p className="text-sm font-medium text-slate-600">Pipeline is healthy</p>
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
                  <AttentionItem icon={UserPlus} color="#3b82f6"
                    title={`${unassignedActive} unassigned candidate${unassignedActive > 1 ? "s" : ""}`}
                    desc="Active candidates without an assigned recruiter"
                    href="/admin/applications" />
                )}
              </div>
            )}
          </div>

          {/* recruiter workload */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex-1">
            <h3 className="text-sm font-bold text-slate-900">Recruiter workload</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Active candidates per owner</p>
            {recruiterWorkload.length > 0 ? (
              <ul className="space-y-3">
                {recruiterWorkload.map((r, i) => {
                  const mx = recruiterWorkload[0].active || 1;
                  const pct = (r.active / mx) * 100;
                  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#94a3b8"];
                  return (
                    <li key={r.name}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={r.name} size="xs" />
                          <span className={cn("font-semibold truncate", r.name === "Unassigned" ? "text-slate-400 italic" : "text-slate-700")}>
                            {r.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400">{r.total} total</span>
                          <span className="font-bold text-slate-900 tabular-nums">{r.active} active</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i % 5] }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No active candidates</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
