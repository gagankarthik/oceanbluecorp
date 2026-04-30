"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Briefcase, Users, Target, UserPlus, Loader2, MessageSquareText,
  TrendingUp, ArrowRight, BarChart3, AlertTriangle, Clock, Plus,
  Activity, Mail, Calendar, Eye, FileText, KanbanSquare,
  TableProperties, RefreshCcw, Zap, Layers,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
  ResponsiveContainer, BarChart, Bar, Tooltip, Cell,
} from "recharts";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { PipelineStrip } from "@/components/admin/pipeline-strip";
import { PipelineKanban } from "@/components/admin/pipeline-kanban";
import { EmptyState } from "@/components/admin/empty-state";
import { useAdmin } from "@/components/admin/admin-provider";
import { tones, statusMeta, type AppStatus } from "@/components/admin/theme";
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
  interviewApplications: number;
  offeredApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  applicationsByStatus: Record<string, number>;
  jobsByDepartment: Record<string, number>;
  monthlyApplications?: { month: string; applications: number }[];
}

const STALE_THRESHOLD_DAYS = 7;
const OFFER_STALE_DAYS = 5;

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { setJobs: setProviderJobs, candidateRevision, openCandidateEditor } = useAdmin();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "90d" | "ytd" | "1y" | "all">("30d");
  const [pipelineView, setPipelineView] = useState<"kanban" | "table">("kanban");
  const [pipelineFilter, setPipelineFilter] = useState<AppStatus | "all">("all");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes, jobsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/applications"),
        fetch("/api/jobs"),
      ]);
      const [statsData, appsData, jobsData] = await Promise.all([
        statsRes.json(), appsRes.json(), jobsRes.json(),
      ]);
      if (!statsRes.ok) throw new Error(statsData.error || "Failed to fetch stats");
      setStats(statsData.stats);

      const jobsList: Job[] = jobsData.jobs || [];
      const jobsMap = new Map(jobsList.map((j) => [j.id, j]));
      const apps: Application[] = (appsData.applications || []).map((a: Application) => ({
        ...a,
        jobTitle: a.jobTitle || (a.jobId ? jobsMap.get(a.jobId)?.title : ""),
      }));
      setApplications(apps);
      setJobs(jobsList);
      setProviderJobs(jobsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [setProviderJobs]);

  useEffect(() => { void fetchAll(); }, [fetchAll, candidateRevision]);

  const handleStatusChange = useCallback(async (id: string, status: AppStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: status as Application["status"] } : a)),
    );
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, changedBy: user?.id, changedByName: user?.name || "Admin" }),
      });
    } catch {
      void fetchAll();
    }
  }, [user, fetchAll]);

  // ── Derived data ─────────────────────────────────────────────────

  const filteredApps = useMemo(() => {
    if (pipelineFilter === "all") return applications;
    return applications.filter((a) => a.status === pipelineFilter);
  }, [applications, pipelineFilter]);

  const recentApps = useMemo(
    () => [...applications].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).slice(0, 6),
    [applications],
  );

  const pipelineCounts = useMemo(() => {
    const counts: Partial<Record<AppStatus, number>> = {};
    for (const a of applications) {
      const k = a.status as AppStatus;
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [applications]);

  const rejectedCount = pipelineCounts["rejected"] || 0;

  // ── Unique enterprise insights ───────────────────────────────────

  /** Avg time from applied → hired in days */
  const timeToHire = useMemo(() => {
    const hired = applications.filter((a) => a.status === "hired" && a.statusHistory?.length);
    if (hired.length === 0) return null;
    const days = hired
      .map((a) => {
        const hireEntry = a.statusHistory!.find((h) => h.status === "hired");
        if (!hireEntry) return null;
        const start = new Date(a.appliedAt).getTime();
        const end = new Date(hireEntry.changedAt).getTime();
        return Math.max(0, (end - start) / 86400000);
      })
      .filter((d): d is number => d !== null);
    if (days.length === 0) return null;
    return Math.round(days.reduce((s, d) => s + d, 0) / days.length);
  }, [applications]);

  /** Stale: not moved past pending in ≥ STALE_THRESHOLD_DAYS days */
  const staleCandidates = useMemo(() => {
    const cutoff = Date.now() - STALE_THRESHOLD_DAYS * 86400000;
    return applications.filter((a) =>
      (a.status === "pending" || a.status === "reviewing") && new Date(a.appliedAt).getTime() < cutoff,
    ).slice(0, 5);
  }, [applications]);

  /** Offers pending too long */
  const offersAtRisk = useMemo(() => {
    const cutoff = Date.now() - OFFER_STALE_DAYS * 86400000;
    return applications.filter((a) => {
      if (a.status !== "offered") return false;
      const offerEntry = a.statusHistory?.find((h) => h.status === "offered");
      const since = offerEntry ? new Date(offerEntry.changedAt).getTime() : new Date(a.updatedAt || a.appliedAt).getTime();
      return since < cutoff;
    });
  }, [applications]);

  /** Recruiter workload (by ownership) */
  const recruiterWorkload = useMemo(() => {
    const map = new Map<string, { name: string; total: number; active: number }>();
    for (const a of applications) {
      const name = a.ownershipName || "Unassigned";
      const isActive = !["hired", "rejected"].includes(a.status);
      if (!map.has(name)) map.set(name, { name, total: 0, active: 0 });
      const entry = map.get(name)!;
      entry.total += 1;
      if (isActive) entry.active += 1;
    }
    return [...map.values()].sort((a, b) => b.active - a.active).slice(0, 5);
  }, [applications]);

  /** Unassigned (no owner) candidates that aren't terminal */
  const unassignedActive = useMemo(
    () => applications.filter((a) => !a.ownership && !["hired", "rejected"].includes(a.status)).length,
    [applications],
  );

  // ── Chart data ───────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let groupBy: "day" | "week" | "month";
    switch (chartPeriod) {
      case "7d":  startDate = new Date(now); startDate.setDate(now.getDate() - 7);  groupBy = "day";   break;
      case "30d": startDate = new Date(now); startDate.setDate(now.getDate() - 30); groupBy = "day";   break;
      case "90d": startDate = new Date(now); startDate.setDate(now.getDate() - 90); groupBy = "week";  break;
      case "ytd": startDate = new Date(now.getFullYear(), 0, 1);                     groupBy = "month"; break;
      case "1y":  startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); groupBy = "month"; break;
      default:    startDate = new Date(0);                                            groupBy = "month";
    }
    const filtered = applications.filter((a) => new Date(a.appliedAt) >= startDate);
    const buckets: Record<string, { applied: number; hired: number }> = {};

    if (groupBy === "day") {
      const d = new Date(startDate);
      while (d <= now) { buckets[d.toISOString().split("T")[0]] = { applied: 0, hired: 0 }; d.setDate(d.getDate() + 1); }
      filtered.forEach((a) => {
        const k = new Date(a.appliedAt).toISOString().split("T")[0];
        if (k in buckets) {
          buckets[k].applied += 1;
          if (a.status === "hired") buckets[k].hired += 1;
        }
      });
    } else if (groupBy === "week") {
      const d = new Date(startDate);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      while (d <= now) { buckets[d.toISOString().split("T")[0]] = { applied: 0, hired: 0 }; d.setDate(d.getDate() + 7); }
      filtered.forEach((a) => {
        const ad = new Date(a.appliedAt);
        const mon = new Date(ad);
        mon.setDate(ad.getDate() - ((ad.getDay() + 6) % 7));
        const k = mon.toISOString().split("T")[0];
        if (k in buckets) {
          buckets[k].applied += 1;
          if (a.status === "hired") buckets[k].hired += 1;
        }
      });
    } else {
      filtered.forEach((a) => {
        const ad = new Date(a.appliedAt);
        const k = `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, "0")}`;
        if (!buckets[k]) buckets[k] = { applied: 0, hired: 0 };
        buckets[k].applied += 1;
        if (a.status === "hired") buckets[k].hired += 1;
      });
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }, [applications, chartPeriod]);

  // ── Department chart ─────────────────────────────────────────────
  const departmentData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.jobsByDepartment || {})
      .slice(0, 6)
      .map(([name, count]) => ({
        name: name.length > 14 ? name.slice(0, 14) + "…" : name,
        jobs: count,
      }))
      .sort((a, b) => b.jobs - a.jobs);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/loading.png" alt="Loading" width={80} height={80} className="rounded-full" priority />
            </div>
          </div>
          <p className="text-slate-500 mt-4 text-sm font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <SectionCard className="max-w-md mx-auto">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load dashboard"
          description={error || "Something went wrong"}
          action={
            <button onClick={fetchAll} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
              Retry
            </button>
          }
        />
      </SectionCard>
    );
  }

  const total = stats.totalApplications;
  const conversionRate = total > 0 ? ((stats.hiredApplications / total) * 100).toFixed(1) : "0";
  const inPipeline = stats.reviewingApplications + stats.interviewApplications + stats.offeredApplications;
  const pipelineHealth = staleCandidates.length === 0 && offersAtRisk.length === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}, ${user?.name?.split(" ")[0] || "there"}. Here's what needs your attention today.`}
        actions={
          <>
            <button
              onClick={fetchAll}
              title="Refresh"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
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

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Applications"
          value={total}
          tone="blue"
          icon={Users}
          href="/admin/applications"
          hint={`${stats.pendingApplications} new this week`}
          trend={stats.pendingApplications > 0 ? { direction: "up", value: `+${stats.pendingApplications} new` } : undefined}
        />
        <StatCard
          label="Active jobs"
          value={stats.activeJobs}
          tone="emerald"
          icon={Briefcase}
          href="/admin/jobs"
          hint={`${stats.totalJobs} total positions`}
          trend={{ direction: "up", value: `${stats.draftJobs} drafts` }}
        />
        <StatCard
          label="In pipeline"
          value={inPipeline}
          tone="violet"
          icon={Target}
          href="/admin/applications?status=reviewing"
          hint={`${stats.interviewApplications} interviewing`}
        />
        <StatCard
          label="Conversion"
          value={`${conversionRate}%`}
          tone="cyan"
          icon={TrendingUp}
          hint={`${stats.hiredApplications} hires this period`}
          trend={timeToHire !== null ? { direction: "flat", value: `${timeToHire}d avg time-to-hire` } : undefined}
        />
      </div>

      {/* Insights row — UNIQUE ENTERPRISE FEATURES */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Needs attention */}
        <SectionCard
          title="Needs attention"
          description={pipelineHealth ? "Pipeline is healthy" : "Action recommended"}
          icon={Zap}
          actions={pipelineHealth ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All clear
            </span>
          ) : null}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-slate-100">
            {staleCandidates.length === 0 && offersAtRisk.length === 0 && unassignedActive === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">You&apos;re all caught up</p>
                <p className="text-xs text-slate-400 mt-1">No stale candidates, no offers at risk</p>
              </div>
            ) : (
              <>
                {offersAtRisk.length > 0 && (
                  <AttentionRow
                    icon={Mail}
                    tone="amber"
                    title={`${offersAtRisk.length} offer${offersAtRisk.length > 1 ? "s" : ""} pending response`}
                    description={`No action in ${OFFER_STALE_DAYS}+ days — consider following up`}
                    href="/admin/applications?status=offered"
                  />
                )}
                {staleCandidates.length > 0 && (
                  <AttentionRow
                    icon={Clock}
                    tone="rose"
                    title={`${staleCandidates.length} stale candidate${staleCandidates.length > 1 ? "s" : ""}`}
                    description={`Stuck in early pipeline for ${STALE_THRESHOLD_DAYS}+ days`}
                    items={staleCandidates}
                  />
                )}
                {unassignedActive > 0 && (
                  <AttentionRow
                    icon={UserPlus}
                    tone="blue"
                    title={`${unassignedActive} unassigned candidate${unassignedActive > 1 ? "s" : ""}`}
                    description="Active candidates without an owner"
                    href="/admin/applications"
                  />
                )}
              </>
            )}
          </div>
        </SectionCard>

        {/* Recruiter workload */}
        <SectionCard title="Workload" description="Active candidates per owner" icon={Layers}>
          {recruiterWorkload.length > 0 ? (
            <ul className="space-y-3">
              {recruiterWorkload.map((r, i) => {
                const max = recruiterWorkload[0].active || 1;
                const pct = (r.active / max) * 100;
                return (
                  <li key={r.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {r.name === "Unassigned" ? (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        ) : (
                          <Avatar name={r.name} size="xs" />
                        )}
                        <span className={cn("font-semibold truncate", r.name === "Unassigned" ? "text-slate-500 italic" : "text-slate-700")}>
                          {r.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums flex-shrink-0">{r.active}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full",
                          r.name === "Unassigned" ? "bg-slate-400" :
                          i === 0 ? "bg-blue-500" : i === 1 ? "bg-violet-500" : i === 2 ? "bg-cyan-500" : "bg-slate-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4 italic">No active candidates</p>
          )}
        </SectionCard>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Application trends"
          description={`${chartLabels[chartPeriod]} · ${chartData.reduce((s, d) => s + d.applied, 0)} applications`}
          icon={BarChart3}
          actions={
            <div className="flex items-center gap-1">
              {(["7d", "30d", "90d", "ytd", "1y", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors",
                    chartPeriod === p
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-100",
                  )}
                >
                  {p === "ytd" ? "YTD" : p === "1y" ? "1Y" : p === "all" ? "All" : p.toUpperCase()}
                </button>
              ))}
            </div>
          }
          className="lg:col-span-2"
        >
          <div className="h-[260px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="appliedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="hiredFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    if (chartPeriod === "ytd" || chartPeriod === "1y" || chartPeriod === "all")
                      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4" }}
                  contentStyle={{
                    backgroundColor: "white", border: "1px solid #e2e8f0",
                    borderRadius: "8px", fontSize: "12px", padding: "8px 12px",
                    boxShadow: "0 4px 12px -2px rgba(15,23,42,0.1)",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  }
                />
                <Area type="monotone" dataKey="applied" name="Applied" stroke="#3b82f6" fill="url(#appliedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="hired"   name="Hired"   stroke="#10b981" fill="url(#hiredFill)"   strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Applied</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Hired</span>
          </div>
        </SectionCard>

        {/* Department breakdown */}
        <SectionCard title="Jobs by department" description="Open positions" icon={Briefcase}>
          {departmentData.length > 0 ? (
            <div className="h-[260px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" barCategoryGap={6} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white", border: "1px solid #e2e8f0",
                      borderRadius: "8px", fontSize: "12px",
                    }}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="jobs" radius={[0, 4, 4, 0]}>
                    {departmentData.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Briefcase} title="No jobs yet" description="Post your first job to see departments" />
          )}
        </SectionCard>
      </div>

      {/* Pipeline strip */}
      <PipelineStrip
        counts={pipelineCounts}
        active={pipelineFilter}
        onSelect={setPipelineFilter}
        rejectedCount={rejectedCount}
      />

      {/* Pipeline view (kanban / table toggle) 
      <SectionCard
        title="Active pipeline"
        description={`${filteredApps.length} of ${applications.length} candidates · drag cards to update status`}
        icon={KanbanSquare}
        actions={
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setPipelineView("kanban")}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                pipelineView === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              <KanbanSquare className="w-3 h-3" /> Kanban
            </button>
            <button
              onClick={() => setPipelineView("table")}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                pipelineView === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              <TableProperties className="w-3 h-3" /> Recent
            </button>
          </div>
        }
        bodyClassName={pipelineView === "kanban" ? "p-3" : "p-0"}
      >
        {applications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates yet"
            description="Add your first candidate to start tracking the pipeline"
            action={
              <PageHeaderButton variant="primary" onClick={() => openCandidateEditor()}>
                <Plus className="w-3.5 h-3.5" /> Add candidate
              </PageHeaderButton>
            }
          />
        ) : pipelineView === "kanban" ? (
          <PipelineKanban
            applications={pipelineFilter === "all" ? applications : filteredApps}
            onStatusChange={handleStatusChange}
            onDelete={(id) => setApplications((prev) => prev.filter((a) => a.id !== id))}
            onUpdate={(app) => setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...app } : a)))}
          />
        ) : (
          <RecentTable apps={recentApps} />
        )}
      </SectionCard>
*/}
      {/* Hiring funnel */}
      <SectionCard title="Hiring funnel" description="Conversion across stages" icon={TrendingUp}>
        <HiringFunnel stats={stats} total={total} />
      </SectionCard>
    </div>
  );
}

const chartLabels = {
  "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days",
  "ytd": "Year to date", "1y": "Last 12 months", "all": "All time",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function AttentionRow({
  icon: Icon, tone, title, description, href, items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "rose" | "blue";
  title: string;
  description: string;
  href?: string;
  items?: Application[];
}) {
  const t = tones[tone];
  const router = useRouter();
  return (
    <div className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", t.bg)}>
          <Icon className={cn("w-4 h-4", t.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          {items && items.length > 0 && (
            <div className="flex items-center gap-1 mt-2.5 flex-wrap">
              {items.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/admin/candidates/${c.id}`)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Avatar name={c.name || c.email} size="xs" />
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]">{c.name || "Unnamed"}</span>
                </button>
              ))}
              {items.length > 4 && (
                <span className="text-[11px] text-slate-500 px-1">+{items.length - 4} more</span>
              )}
            </div>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

{/*
function RecentTable({ apps }: { apps: Application[] }) {
  const router = useRouter();
  if (apps.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400 italic">No recent activity</div>;
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50/60 border-b border-slate-100">
          <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left px-5 py-2.5">Candidate</th>
          <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left px-5 py-2.5">Position</th>
          <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left px-5 py-2.5">Status</th>
          <th className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right px-5 py-2.5">Applied</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {apps.map((a) => (
          <tr
            key={a.id}
            onClick={() => router.push(`/admin/candidates/${a.id}`)}
            className="hover:bg-blue-50/40 cursor-pointer transition-colors"
          >
            <td className="px-5 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={a.name || a.email} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.name || "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{a.email}</p>
                </div>
              </div>
            </td>
            <td className="px-5 py-3 text-sm text-slate-700 max-w-[180px] truncate">{a.jobTitle || <span className="text-slate-300">No position</span>}</td>
            <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
            <td className="px-5 py-3 text-right text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {timeAgo(a.appliedAt)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
*/}

// ── Hiring Funnel (proper funnel shape) ──────────────────────────────────────

function HiringFunnel({ stats, total }: { stats: DashboardStats; total: number }) {
  const stages = [
    { label: "Applied",   count: total,                         colors: { bg: "#3b82f6", text: "white" } },
    { label: "Screening", count: stats.reviewingApplications,   colors: { bg: "#6366f1", text: "white" } },
    { label: "Interview", count: stats.interviewApplications,   colors: { bg: "#8b5cf6", text: "white" } },
    { label: "Offered",   count: stats.offeredApplications,     colors: { bg: "#f59e0b", text: "white" } },
    { label: "Hired",     count: stats.hiredApplications,       colors: { bg: "#10b981", text: "white" } },
  ];

  const max = stages[0].count || 1;

  return (
    <div className="py-2">
      {stages.map((stage, i) => {
        const pct = Math.max((stage.count / max) * 100, stage.count > 0 ? 8 : 0);
        const marginPct = (100 - pct) / 2;
        const prevCount = i > 0 ? stages[i - 1].count : null;
        const convRate = prevCount && prevCount > 0
          ? Math.round((stage.count / prevCount) * 100)
          : null;

        return (
          <div key={stage.label}>
            {/* Connector with conversion rate */}
            {i > 0 && (
              <div className="flex items-center justify-center gap-2 py-1 relative">
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 9L1 3h10L6 9z" />
                  </svg>
                  {convRate !== null && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {convRate}% converted
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Funnel stage block */}
            <div
              style={{
                paddingLeft: `${marginPct}%`,
                paddingRight: `${marginPct}%`,
                transition: "padding 0.6s ease",
              }}
            >
              <div
                className="h-11 rounded-lg flex items-center justify-between px-4 transition-all duration-700 shadow-sm"
                style={{ backgroundColor: stage.colors.bg }}
              >
                <span className="text-sm font-semibold text-white">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{stage.count.toLocaleString()}</span>
                  {total > 0 && (
                    <span className="text-[11px] font-medium text-white/70">
                      {Math.round((stage.count / total) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Dropped off */}
      {stats.rejectedApplications > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
          {stats.rejectedApplications} rejected · {total > 0 ? Math.round((stats.rejectedApplications / total) * 100) : 0}% of applicants
        </div>
      )}
    </div>
  );
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}
