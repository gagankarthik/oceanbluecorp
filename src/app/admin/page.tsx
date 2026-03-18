"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Users,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  UserPlus,
  Loader2,
  MessageSquare,
  Mail,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Calendar,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  recentApplications: {
    id: string;
    name: string;
    email: string;
    position: string;
    status: string;
    appliedAt: string;
  }[];
  recentJobs: {
    id: string;
    title: string;
    department: string;
    location: string;
    applicants: number;
    status: string;
  }[];
  applicationsByStatus: Record<string, number>;
  jobsByDepartment: Record<string, number>;
  monthlyApplications?: { month: string; applications: number }[];
}

const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  reviewing: { label: "Reviewing", variant: "secondary" as const, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
  interview: { label: "Interview", variant: "default" as const, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
  offered: { label: "Offered", variant: "default" as const, icon: Mail, color: "text-cyan-600", bg: "bg-cyan-50" },
  hired: { label: "Hired", variant: "default" as const, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
  active: { label: "Active", variant: "default" as const, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  paused: { label: "Paused", variant: "secondary" as const, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  draft: { label: "Draft", variant: "outline" as const, icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
  closed: { label: "Closed", variant: "destructive" as const, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
};

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
  hired: {
    label: "Hired",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Generate mock chart data based on stats
function generateChartData(totalApplications: number) {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      applications: Math.floor(Math.random() * (totalApplications / 10)) + 1,
      hired: Math.floor(Math.random() * 3),
    });
  }
  return data;
}

// Stat Card Component
function StatCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: number;
  description: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-100">
            {trend === "up" ? (
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            ) : trend === "down" ? (
              <div className="flex items-center gap-1 text-rose-600">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            )}
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ATS filter state
  const [allApps, setAllApps] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [appPage, setAppPage] = useState(1);
  const [appPerPage, setAppPerPage] = useState(10);
  const [appSort, setAppSort] = useState("date-desc");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [chartPeriod, setChartPeriod] = useState("30d");
  const [pipelinePeriod, setPipelinePeriod] = useState("all");
  const [jobPeriodFilter, setJobPeriodFilter] = useState("all");
  const [jobSelectedMonth, setJobSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => setAllApps(d.applications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setAllJobs(d.jobs || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setAppPage(1); }, [appSearch, appStatusFilter, appSort, periodFilter, selectedMonth, appPerPage]);

  const appStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allApps.length };
    ["pending", "reviewing", "interview", "offered", "hired", "rejected"].forEach((s) => {
      counts[s] = allApps.filter((a) => a.status === s).length;
    });
    return counts;
  }, [allApps]);

  const filteredApps = useMemo(() => {
    let apps = [...allApps];
    const now = new Date();
    if (periodFilter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      apps = apps.filter((a) => new Date(a.appliedAt) >= todayStart);
    } else if (periodFilter === "week") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
      apps = apps.filter((a) => new Date(a.appliedAt) >= cutoff);
    } else if (periodFilter === "this-month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      apps = apps.filter((a) => new Date(a.appliedAt) >= monthStart);
    } else if (periodFilter === "ytd") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      apps = apps.filter((a) => new Date(a.appliedAt) >= yearStart);
    } else if (periodFilter === "by-month" && selectedMonth) {
      const [yr, mo] = selectedMonth.split("-").map(Number);
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 1);
      apps = apps.filter((a) => { const d = new Date(a.appliedAt); return d >= start && d < end; });
    } else if (periodFilter === "last-30") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
      apps = apps.filter((a) => new Date(a.appliedAt) >= cutoff);
    } else if (periodFilter === "last-90") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90);
      apps = apps.filter((a) => new Date(a.appliedAt) >= cutoff);
    }
    if (appStatusFilter !== "all") apps = apps.filter((a) => a.status === appStatusFilter);
    if (appSearch) {
      const q = appSearch.toLowerCase();
      apps = apps.filter(
        (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.jobTitle?.toLowerCase().includes(q)
      );
    }
    apps.sort((a, b) => {
      if (appSort === "date-asc") return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
      if (appSort === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (appSort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      if (appSort === "status") return (a.status || "").localeCompare(b.status || "");
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
    return apps;
  }, [allApps, appSearch, appStatusFilter, appSort, periodFilter, selectedMonth]);

  const appTotalPages = Math.ceil(filteredApps.length / appPerPage);
  const paginatedApps = useMemo(() => {
    const start = (appPage - 1) * appPerPage;
    return filteredApps.slice(start, start + appPerPage);
  }, [filteredApps, appPage, appPerPage]);

  const filteredJobs = useMemo(() => {
    let jobs = [...allJobs];
    const now = new Date();
    if (jobPeriodFilter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      jobs = jobs.filter((j) => new Date(j.createdAt) >= todayStart);
    } else if (jobPeriodFilter === "week") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
      jobs = jobs.filter((j) => new Date(j.createdAt) >= cutoff);
    } else if (jobPeriodFilter === "this-month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      jobs = jobs.filter((j) => new Date(j.createdAt) >= monthStart);
    } else if (jobPeriodFilter === "ytd") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      jobs = jobs.filter((j) => new Date(j.createdAt) >= yearStart);
    } else if (jobPeriodFilter === "by-month" && jobSelectedMonth) {
      const [yr, mo] = jobSelectedMonth.split("-").map(Number);
      const start = new Date(yr, mo - 1, 1);
      const end = new Date(yr, mo, 1);
      jobs = jobs.filter((j) => { const d = new Date(j.createdAt); return d >= start && d < end; });
    } else if (jobPeriodFilter === "last-30") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
      jobs = jobs.filter((j) => new Date(j.createdAt) >= cutoff);
    } else if (jobPeriodFilter === "last-90") {
      const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 90);
      jobs = jobs.filter((j) => new Date(j.createdAt) >= cutoff);
    }
    if (jobStatusFilter !== "all") jobs = jobs.filter((j) => j.status === jobStatusFilter);
    if (jobSearch) {
      const q = jobSearch.toLowerCase();
      jobs = jobs.filter(
        (j) => j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)
      );
    }
    return jobs;
  }, [allJobs, jobSearch, jobStatusFilter, jobPeriodFilter, jobSelectedMonth]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/stats");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stats");
        }

        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-rose-200 bg-rose-50">
          <CardHeader>
            <CardTitle className="text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription className="text-rose-600">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              Retry
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  // ── Chart data (Application Trends) ──────────────────────────────
  const chartPeriodLabels: Record<string, string> = {
    "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days",
    "ytd": "Year to date", "1y": "Last 12 months", "all": "All time",
  };

  const chartData = (() => {
    if (allApps.length === 0) {
      return stats.monthlyApplications && stats.monthlyApplications.length > 0
        ? stats.monthlyApplications.map((m) => ({ date: m.month, applications: m.applications }))
        : generateChartData(stats.totalApplications);
    }
    const now = new Date();
    let startDate: Date;
    let groupBy: "day" | "week" | "month";
    if (chartPeriod === "7d")  { startDate = new Date(now); startDate.setDate(now.getDate() - 7);   groupBy = "day"; }
    else if (chartPeriod === "30d") { startDate = new Date(now); startDate.setDate(now.getDate() - 30);  groupBy = "day"; }
    else if (chartPeriod === "90d") { startDate = new Date(now); startDate.setDate(now.getDate() - 90);  groupBy = "week"; }
    else if (chartPeriod === "ytd") { startDate = new Date(now.getFullYear(), 0, 1);                      groupBy = "month"; }
    else if (chartPeriod === "1y")  { startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); groupBy = "month"; }
    else                            { startDate = new Date(0);                                             groupBy = "month"; }

    const filtered = allApps.filter((a) => new Date(a.appliedAt) >= startDate);
    const buckets: Record<string, number> = {};

    if (groupBy === "day") {
      const d = new Date(startDate);
      while (d <= now) { buckets[d.toISOString().split("T")[0]] = 0; d.setDate(d.getDate() + 1); }
      filtered.forEach((a) => { const k = new Date(a.appliedAt).toISOString().split("T")[0]; if (k in buckets) buckets[k]++; });
    } else if (groupBy === "week") {
      const d = new Date(startDate); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      while (d <= now) { buckets[d.toISOString().split("T")[0]] = 0; d.setDate(d.getDate() + 7); }
      filtered.forEach((a) => {
        const ad = new Date(a.appliedAt); const mon = new Date(ad); mon.setDate(ad.getDate() - ((ad.getDay() + 6) % 7));
        const k = mon.toISOString().split("T")[0]; if (k in buckets) buckets[k]++;
      });
    } else {
      filtered.forEach((a) => { const d = new Date(a.appliedAt); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; buckets[k] = (buckets[k]||0)+1; });
    }
    return Object.entries(buckets).sort(([a],[b])=>a.localeCompare(b)).map(([date,applications])=>({date,applications}));
  })();

  // ── Pipeline data (Pipeline Summary) ─────────────────────────────
  const pipelinePeriodLabels: Record<string, string> = {
    "all": "All time", "today": "Today", "7d": "Last 7 days",
    "30d": "Last 30 days", "90d": "Last 90 days", "ytd": "Year to date",
  };

  const pipelineData = (() => {
    const now = new Date();
    let startDate: Date;
    if (pipelinePeriod === "today")    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (pipelinePeriod === "7d")  { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
    else if (pipelinePeriod === "30d") { startDate = new Date(now); startDate.setDate(now.getDate() - 30); }
    else if (pipelinePeriod === "90d") { startDate = new Date(now); startDate.setDate(now.getDate() - 90); }
    else if (pipelinePeriod === "ytd") startDate = new Date(now.getFullYear(), 0, 1);
    else                               startDate = new Date(0);

    if (allApps.length > 0) {
      const filtered = allApps.filter((a) => new Date(a.appliedAt) >= startDate);
      const byStatus: Record<string, number> = {};
      filtered.forEach((a) => { byStatus[a.status] = (byStatus[a.status]||0)+1; });
      const total = filtered.length;
      const hired = byStatus["hired"] || 0;
      return {
        pieData: Object.entries(byStatus).filter(([,c])=>c>0).map(([s,c])=>({ name: s.charAt(0).toUpperCase()+s.slice(1), value: c })),
        byStatus, total,
        conversionRate: total > 0 ? ((hired/total)*100).toFixed(1) : "0",
      };
    }
    // Fall back to stats
    const total = stats.totalApplications;
    const hired = stats.hiredApplications;
    return {
      pieData: Object.entries(stats.applicationsByStatus).filter(([,c])=>c>0).map(([s,c])=>({ name: s.charAt(0).toUpperCase()+s.slice(1), value: c })),
      byStatus: stats.applicationsByStatus, total,
      conversionRate: total > 0 ? ((hired/total)*100).toFixed(1) : "0",
    };
  })();

  const pieData = pipelineData.pieData;
  const conversionRate = pipelineData.conversionRate;

  // Prepare department data for bar chart
  const departmentData = Object.entries(stats.jobsByDepartment || {})
    .slice(0, 5)
    .map(([dept, count]) => ({
      name: dept.length > 12 ? dept.slice(0, 12) + "..." : dept,
      jobs: count,
    }));

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      description: `${stats.pendingApplications} pending review`,
      trend: (stats.pendingApplications > 0 ? "up" : "neutral") as "up" | "down" | "neutral",
      trendValue: `${stats.pendingApplications} new`,
      icon: Users,
      href: "/admin/applications",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      description: `${stats.totalJobs} total positions`,
      trend: "up" as const,
      trendValue: `${stats.activeJobs} open`,
      icon: Briefcase,
      href: "/admin/jobs",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    {
      title: "In Pipeline",
      value: stats.reviewingApplications + stats.interviewApplications,
      description: `${stats.interviewApplications} in interviews`,
      trend: (stats.interviewApplications > 0 ? "up" : "neutral") as "up" | "down" | "neutral",
      trendValue: "Active candidates",
      icon: Target,
      href: "/admin/applications?status=reviewing",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Hired",
      value: stats.hiredApplications,
      description: `${conversionRate}% conversion rate`,
      trend: (stats.hiredApplications > 0 ? "up" : "neutral") as "up" | "down" | "neutral",
      trendValue: `${stats.offeredApplications} offers pending`,
      icon: UserPlus,
      href: "/admin/applications?status=hired",
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here&apos;s an overview of your recruitment pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-white border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 font-medium">Live Data</span>
          </Badge>
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Add New Job
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Chart and Pipeline Summary Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Applications Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Application Trends</CardTitle>
                <CardDescription>{chartPeriodLabels[chartPeriod]} · {chartData.reduce((s,d)=>s+d.applications,0)} applications</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {(["7d","30d","90d","ytd","1y","all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      chartPeriod === p
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {p === "ytd" ? "YTD" : p === "1y" ? "1Y" : p === "all" ? "All" : p.toUpperCase()}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-400">Applications</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (chartPeriod === "ytd" || chartPeriod === "1y" || chartPeriod === "all") {
                      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    }
                    if (chartPeriod === "90d") {
                      return `Wk ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                    }
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                />
                <ChartTooltip
                  cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="applications"
                  type="monotone"
                  fill="url(#fillApplications)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pipeline Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-gray-400" />
                  Pipeline Summary
                </CardTitle>
                <CardDescription>{pipelinePeriodLabels[pipelinePeriod]} · {pipelineData.total} total</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(["all","today","7d","30d","90d","ytd"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPipelinePeriod(p)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                    pipelinePeriod === p
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {p === "all" ? "All" : p === "today" ? "Today" : p === "ytd" ? "YTD" : p.toUpperCase()}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Mini Pie Chart */}
            <div className="h-[160px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Applications"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Status List */}
            <div className="space-y-2.5">
              {Object.entries(pipelineData.byStatus).map(([status, count], index) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                const Icon = config?.icon || Clock;
                const percentage =
                  pipelineData.total > 0
                    ? ((count / pipelineData.total) * 100).toFixed(0)
                    : 0;
                return (
                  <div key={status} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <Icon className={`h-4 w-4 ${config?.color || "text-gray-500"}`} />
                      <span className="text-sm font-medium capitalize text-gray-700">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-gray-50">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min(parseFloat(pipelineData.conversionRate) * 5, 100)}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{pipelineData.conversionRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs by Department & Quick Stats */}
      {departmentData.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                Jobs by Department
              </CardTitle>
              <CardDescription>Distribution of open positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" barCategoryGap={8}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="jobs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Quick Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Draft Jobs</p>
                    <p className="text-xs text-gray-500">Awaiting publish</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.draftJobs}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Paused Jobs</p>
                    <p className="text-xs text-gray-500">Temporarily hidden</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">{stats.pausedJobs}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Closed Jobs</p>
                    <p className="text-xs text-gray-500">Positions filled</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-rose-600">{stats.closedJobs}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Offers Sent</p>
                    <p className="text-xs text-gray-500">Awaiting response</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{stats.offeredApplications}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ATS Application Pipeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                Application Pipeline
              </CardTitle>
              <CardDescription>
                {filteredApps.length} of {allApps.length} applications
              </CardDescription>
            </div>
            <Link
              href="/admin/applications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Full ATS view <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search name, email, position…"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {appSearch && (
                <button onClick={() => setAppSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Date range quick filters */}
            <div className="flex items-center gap-1 flex-wrap">
              {([
                { value: "all", label: "All" },
                { value: "today", label: "Today" },
                { value: "week", label: "7d" },
                { value: "this-month", label: "This Month" },
                { value: "ytd", label: "YTD" },
                { value: "last-30", label: "30d" },
                { value: "last-90", label: "90d" },
                { value: "by-month", label: "By Month" },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPeriodFilter(value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                    periodFilter === value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {periodFilter === "by-month" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <select
              value={appSort}
              onChange={(e) => setAppSort(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="status">By status</option>
            </select>
            <select
              value={appPerPage}
              onChange={(e) => setAppPerPage(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 flex-wrap pt-1">
            {(["all", "pending", "reviewing", "interview", "offered", "hired", "rejected"] as const).map((s) => {
              const cfg = s === "all" ? null : statusConfig[s as keyof typeof statusConfig];
              return (
                <button
                  key={s}
                  onClick={() => setAppStatusFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    appStatusFilter === s
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span className="capitalize">{s === "all" ? "All" : s}</span>
                  <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${appStatusFilter === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {appStatusCounts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedApps.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase pl-6">Candidate</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Position</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Source</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right pr-6">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApps.map((app) => {
                    const config = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                    return (
                      <TableRow key={app.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href = "/admin/applications"}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                              {(app.name || "NA").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{app.name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{app.email || "No email"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 font-medium max-w-[160px] truncate">{app.jobTitle || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{app.source || "Portal"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.bg} ${config.color} border-0 font-medium capitalize text-xs`}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {getTimeAgo(app.appliedAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Pagination */}
              {appTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Showing {(appPage - 1) * appPerPage + 1}–{Math.min(appPage * appPerPage, filteredApps.length)} of {filteredApps.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                      disabled={appPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, appTotalPages) }, (_, i) => {
                      const page = appTotalPages <= 5 ? i + 1 : appPage <= 3 ? i + 1 : appPage >= appTotalPages - 2 ? appTotalPages - 4 + i : appPage - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setAppPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${appPage === page ? "bg-blue-600 text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-700"}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setAppPage((p) => Math.min(appTotalPages, p + 1))}
                      disabled={appPage === appTotalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No applications match your filters</p>
              <button onClick={() => { setAppSearch(""); setAppStatusFilter("all"); setPeriodFilter("all"); }} className="text-xs text-blue-600 hover:underline mt-1">
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ATS Job Postings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                Job Postings
              </CardTitle>
              <CardDescription>{filteredJobs.length} of {allJobs.length} positions</CardDescription>
            </div>
            <Link href="/admin/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Manage jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Job Filter Bar */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search title, department, location…"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {jobSearch && (
                <button onClick={() => setJobSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Date range quick filters */}
            <div className="flex items-center gap-1 flex-wrap">
              {([
                { value: "all", label: "All" },
                { value: "today", label: "Today" },
                { value: "week", label: "7d" },
                { value: "this-month", label: "This Month" },
                { value: "ytd", label: "YTD" },
                { value: "last-30", label: "30d" },
                { value: "last-90", label: "90d" },
                { value: "by-month", label: "By Month" },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setJobPeriodFilter(value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                    jobPeriodFilter === value
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {jobPeriodFilter === "by-month" && (
              <input
                type="month"
                value={jobSelectedMonth}
                onChange={(e) => setJobSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-sm border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Job Status Tabs */}
          <div className="flex gap-1 flex-wrap pt-1">
            {(["all", "active", "paused", "draft", "closed"] as const).map((s) => {
              const count = s === "all" ? allJobs.length : allJobs.filter((j) => j.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setJobStatusFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    jobStatusFilter === s
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  <span className="capitalize">{s === "all" ? "All" : s}</span>
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${jobStatusFilter === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase pl-6">Position</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Department</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Location</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase">Applicants</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.slice(0, 10).map((job) => {
                  const config = statusConfig[job.status as keyof typeof statusConfig] || statusConfig.active;
                  return (
                    <TableRow
                      key={job.id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => window.location.href = `/admin/jobs`}
                    >
                      <TableCell className="pl-6">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{job.department}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 hidden sm:table-cell">{job.department}</TableCell>
                      <TableCell className="text-sm text-gray-500 hidden md:table-cell">{job.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {[...Array(Math.min(3, job.applicationsCount || 0))].map((_, i) => (
                              <div key={i} className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{job.applicationsCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className={`${config.bg} ${config.color} border-0 font-medium capitalize text-xs`}>
                          {job.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No jobs match your filters</p>
              <button onClick={() => { setJobSearch(""); setJobStatusFilter("all"); }} className="text-xs text-blue-600 hover:underline mt-1">
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hiring Funnel */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Hiring Funnel</CardTitle>
              <CardDescription>Application-to-hire conversion stages</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Conversion rate</p>
              <p className="text-2xl font-bold text-emerald-600">{conversionRate}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Applied", count: stats.totalApplications, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
              { label: "Reviewing", count: stats.reviewingApplications, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700" },
              { label: "Interview", count: stats.interviewApplications, color: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-700" },
              { label: "Offered", count: stats.offeredApplications, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
              { label: "Hired", count: stats.hiredApplications, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
            ].map((stage) => {
              const pct = stats.totalApplications > 0
                ? Math.round((stage.count / stats.totalApplications) * 100)
                : 0;
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-24 text-right">
                    <span className="text-sm font-medium text-gray-600">{stage.label}</span>
                  </div>
                  <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-700 flex items-center justify-end pr-3`}
                      style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
                    >
                      {pct >= 8 && (
                        <span className="text-xs font-semibold text-white">{pct}%</span>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 text-center px-2 py-0.5 rounded-full text-xs font-bold ${stage.light} ${stage.text}`}>
                    {stage.count}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/jobs/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Add New Job</div>
                <div className="text-xs text-gray-500">Create posting</div>
              </div>
            </Link>
            <Link
              href="/admin/applications"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Applications</div>
                <div className="text-xs text-gray-500">
                  {stats.pendingApplications} pending
                </div>
              </div>
            </Link>
            <Link
              href="/admin/candidates"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Candidates</div>
                <div className="text-xs text-gray-500">Talent database</div>
              </div>
            </Link>
            <Link
              href="/careers"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">View Careers</div>
                <div className="text-xs text-gray-500">Preview site</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
