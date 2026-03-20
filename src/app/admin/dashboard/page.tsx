"use client";

import { useAuth, UserRole } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  ChevronRight,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  Building2,
  Sparkles,
  TrendingUp,
  Users,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface AdminStats {
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
  recentApplications: Array<{
    id: string;
    name: string;
    email: string;
    position: string;
    status: string;
    appliedAt: string;
  }>;
  recentJobs: Array<{
    id: string;
    title: string;
    department: string;
    location: string;
    applicants: number;
    status: string;
  }>;
  applicationsByStatus: Record<string, number>;
  jobsByDepartment: Record<string, number>;
  monthlyApplications: Array<{ month: string; applications: number }>;
}

function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    interview: "bg-purple-100 text-purple-800",
    offered: "bg-emerald-100 text-emerald-800",
    hired: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    draft: "bg-slate-100 text-slate-700",
    closed: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  // Chart data derived from stats
  const appStatusData = stats
    ? [
        { status: "Pending", count: stats.pendingApplications, fill: "#eab308" },
        { status: "Reviewing", count: stats.reviewingApplications, fill: "#3b82f6" },
        { status: "Interview", count: stats.interviewApplications, fill: "#8b5cf6" },
        { status: "Offered", count: stats.offeredApplications, fill: "#10b981" },
        { status: "Hired", count: stats.hiredApplications, fill: "#059669" },
        { status: "Rejected", count: stats.rejectedApplications, fill: "#ef4444" },
      ]
    : [];

  const jobStatusData = stats
    ? [
        { name: "Active", value: stats.activeJobs, color: "#22c55e" },
        { name: "Paused", value: stats.pausedJobs, color: "#f59e0b" },
        { name: "Draft", value: stats.draftJobs, color: "#94a3b8" },
        { name: "Closed", value: stats.closedJobs, color: "#ef4444" },
      ].filter((d) => d.value > 0)
    : [];

  const deptData = stats
    ? Object.entries(stats.jobsByDepartment)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([department, count]) => ({
          department: department.length > 14 ? department.slice(0, 13) + "…" : department,
          count,
        }))
    : [];

  const monthlyData = stats?.monthlyApplications || [];

  const appStatusConfig: ChartConfig = { count: { label: "Applications" } };
  const monthlyConfig: ChartConfig = {
    applications: { label: "Applications", color: "hsl(217 91% 60%)" },
  };
  const deptConfig: ChartConfig = { count: { label: "Jobs", color: "hsl(217 91% 60%)" } };

  const kpiCards = stats
    ? [
        {
          label: "Total Applications",
          value: stats.totalApplications,
          icon: FileText,
          gradient: "from-blue-600 to-cyan-600",
          sub: `${stats.pendingApplications} pending`,
        },
        {
          label: "Active Jobs",
          value: stats.activeJobs,
          icon: Briefcase,
          gradient: "from-emerald-500 to-teal-500",
          sub: `${stats.totalJobs} total`,
        },
        {
          label: "In Interview",
          value: stats.interviewApplications,
          icon: Calendar,
          gradient: "from-violet-600 to-purple-600",
          sub: `${stats.reviewingApplications} reviewing`,
        },
        {
          label: "Total Hired",
          value: stats.hiredApplications,
          icon: UserCheck,
          gradient: "from-amber-500 to-orange-500",
          sub: `${stats.offeredApplications} offered`,
        },
      ]
    : [];

  // Role-specific styling
  const roleConfig = {
    [UserRole.ADMIN]: {
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-50 to-pink-50",
      border: "border-rose-200",
      badge: "bg-rose-100 text-rose-700",
      label: "Administrator",
    },
    [UserRole.HR]: {
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      badge: "bg-violet-100 text-violet-700",
      label: "HR Manager",
    },
    [UserRole.RECRUITER]: {
      gradient: "from-teal-500 to-cyan-600",
      bgGradient: "from-teal-50 to-cyan-50",
      border: "border-teal-200",
      badge: "bg-teal-100 text-teal-700",
      label: "Recruiter",
    },
    [UserRole.SALES]: {
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      label: "Sales",
    },
    [UserRole.USER]: {
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      label: "User",
    },
  };

  const currentRole = roleConfig[user?.role as UserRole] || roleConfig[UserRole.USER];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl bg-gradient-to-r ${currentRole.bgGradient} border ${currentRole.border} p-6 shadow-sm`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${currentRole.gradient} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                  Welcome back, {user?.name?.split(" ")[0] || "there"}!
                </h1>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${currentRole.badge}`}>
                  {currentRole.label}
                </span>
                <span className="text-sm text-gray-500">{user?.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        <p className="text-gray-600 mt-3 text-sm">
          Here&apos;s what&apos;s happening with your recruitment pipeline today.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {kpiCards.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}
                  >
                    <kpi.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">{kpi.label}</p>
                    <p className="text-2xl font-light text-gray-900">{kpi.value}</p>
                    <p className="text-xs text-gray-400">{kpi.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row: Pipeline + Job Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Application Pipeline — horizontal bar */}
            <Card className="lg:col-span-2 shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Application Pipeline</CardTitle>
                <CardDescription>Applications by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={appStatusConfig} className="h-[260px]">
                  <BarChart data={appStatusData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="status"
                      type="category"
                      width={68}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4} maxBarSize={26}>
                      {appStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Job Status Donut */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Job Status</CardTitle>
                <CardDescription>{stats.totalJobs} total postings</CardDescription>
              </CardHeader>
              <CardContent>
                {jobStatusData.length > 0 ? (
                  <>
                    <ChartContainer config={{}} className="h-[200px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie
                          data={jobStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                        >
                          {jobStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3">
                      {jobStatusData.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-1.5 text-xs text-gray-600"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}:{" "}
                          <span className="font-semibold text-gray-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                    No jobs yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Applications Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base font-semibold">
                    Applications Trend
                  </CardTitle>
                </div>
                <CardDescription>Monthly applications over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={monthlyConfig} className="h-[200px]">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="var(--color-applications)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "var(--color-applications)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Row: Department Chart + Recent Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Jobs by Department */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Jobs by Department</CardTitle>
                <CardDescription>Open positions per department</CardDescription>
              </CardHeader>
              <CardContent>
                {deptData.length > 0 ? (
                  <ChartContainer config={deptConfig} className="h-[220px]">
                    <BarChart
                      data={deptData}
                      margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="department"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                    No department data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
                  <Link
                    href="/admin/applications"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentApplications.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {stats.recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {app.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{app.position}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(app.status)}`}
                          >
                            {app.status}
                          </span>
                          <span className="text-xs text-gray-400 hidden sm:block whitespace-nowrap">
                            {new Date(app.appliedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">
                    No applications yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Job Postings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Job Postings</CardTitle>
                  <Link
                    href="/admin/jobs"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentJobs.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {stats.recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.department}</span>
                            {job.location && (
                              <>
                                <span className="text-gray-300">•</span>
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{job.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {job.applicants}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center text-sm text-gray-400">
                    No jobs posted yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              {
                label: "Manage Jobs",
                href: "/admin/jobs",
                icon: Briefcase,
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "Applications",
                href: "/admin/applications",
                icon: FileText,
                color: "text-violet-600 bg-violet-50",
              },
              {
                label: "Candidates",
                href: "/admin/candidates",
                icon: Users,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Talent Bench",
                href: "/admin/bench",
                icon: Users,
                color: "text-slate-600 bg-slate-50",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <link.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            ))}
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
