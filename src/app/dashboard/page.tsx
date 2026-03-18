"use client";

import { useAuth, UserRole } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  FileText,
  Bell,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  Building2,
  Star,
  Eye,
  Sparkles,
  TrendingUp,
  Users,
  UserCheck,
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

// ---- Interfaces ----

interface UserApplication {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: "pending" | "reviewing" | "interview" | "offered" | "hired" | "rejected";
  appliedAt: string;
  updatedAt?: string;
  notes?: string;
  rating?: number;
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  coverLetter?: string;
}

interface JobInfo {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "remote";
  description: string;
  status: "active" | "paused" | "closed" | "draft";
}

interface ApplicationWithJob extends UserApplication {
  job?: JobInfo;
}

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

// ---- Shared Utilities ----

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

// ---- Admin / HR Analytics Dashboard ----

function AdminAnalytics() {
  const { user, signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Ocean Blue Corporation"
                width={140}
                height={40}
                className="h-7 md:h-8 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Admin Panel
              </Link>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-light text-gray-900">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                {user?.name?.split(" ")[0] || "Admin"}
              </span>
            </h1>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-gray-500">
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
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
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
              className="mb-6"
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
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
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
              className="mb-6"
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
                  label: "Settings",
                  href: "/admin/settings",
                  icon: Settings,
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
      </main>
    </div>
  );
}

// ---- User Personal Dashboard ----

const USER_STATUS_CONFIG = [
  { key: "pending",   label: "Pending Review",     color: "#f59e0b", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: Clock,         dot: "bg-amber-400",    barColor: "bg-amber-400"   },
  { key: "reviewing", label: "Under Review",        color: "#3b82f6", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    icon: Eye,           dot: "bg-blue-400",     barColor: "bg-blue-500"    },
  { key: "interview", label: "Interview Scheduled", color: "#8b5cf6", bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  icon: Calendar,      dot: "bg-purple-400",   barColor: "bg-purple-500"  },
  { key: "offered",   label: "Offer Extended",      color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: Star,          dot: "bg-emerald-400",  barColor: "bg-emerald-500" },
  { key: "hired",     label: "Hired",               color: "#059669", bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200",   icon: CheckCircle,   dot: "bg-green-500",    barColor: "bg-green-500"   },
  { key: "rejected",  label: "Not Selected",        color: "#ef4444", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: XCircle,       dot: "bg-red-400",      barColor: "bg-red-400"     },
];

const JOURNEY_STEPS = [
  { key: "pending",   label: "Applied"   },
  { key: "reviewing", label: "Reviewing" },
  { key: "interview", label: "Interview" },
  { key: "offered",   label: "Offered"   },
  { key: "hired",     label: "Hired"     },
];

function ApplicationJourney({ status }: { status: string }) {
  const stepIndex = JOURNEY_STEPS.findIndex((s) => s.key === status);
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-1 mt-3">
      {JOURNEY_STEPS.map((step, i) => {
        const reached = !isRejected && i <= stepIndex;
        const current = !isRejected && i === stepIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  current
                    ? "border-blue-600 bg-blue-600 shadow-sm shadow-blue-300"
                    : reached
                    ? "border-blue-400 bg-blue-400"
                    : "border-gray-200 bg-white"
                }`}
              >
                {reached && !current && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${current ? "text-blue-600" : reached ? "text-gray-600" : "text-gray-300"}`}>
                {step.label}
              </span>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-3 ${i < stepIndex && !isRejected ? "bg-blue-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex items-center gap-1 ml-1">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-[9px] text-red-500 font-medium">Not Selected</span>
        </div>
      )}
    </div>
  );
}

function UserDashboard() {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user?.id && !user?.email) return;
    try {
      setError(null);
      const fetchPromises: Promise<Response>[] = [];
      if (user?.id) fetchPromises.push(fetch(`/api/applications?userId=${user.id}`));
      if (user?.email) {
        fetchPromises.push(fetch(`/api/applications?userId=${encodeURIComponent(user.email)}`));
        fetchPromises.push(fetch(`/api/applications?email=${encodeURIComponent(user.email)}`));
      }
      const responses = await Promise.all(fetchPromises);
      const allApplications: UserApplication[] = [];
      const seenIds = new Set<string>();
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          for (const app of data.applications || []) {
            if (!seenIds.has(app.id)) { seenIds.add(app.id); allApplications.push(app); }
          }
        }
      }
      const applicationsWithJobs: ApplicationWithJob[] = await Promise.all(
        allApplications.map(async (app) => {
          try {
            if (app.jobId) {
              const jobResponse = await fetch(`/api/jobs/${app.jobId}`);
              if (jobResponse.ok) { const jobData = await jobResponse.json(); return { ...app, job: jobData.job }; }
            }
          } catch { /* ignore */ }
          return app;
        })
      );
      applicationsWithJobs.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setApplications(applicationsWithJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleRefresh = async () => { setIsRefreshing(true); await fetchApplications(); };

  const getJobTypeBadge = (type: string) => {
    const labels: Record<string, string> = { "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", remote: "Remote", "contract-to-hire": "Contract-to-Hire", "direct-hire": "Direct Hire" };
    return labels[type] || type;
  };

  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offered: applications.filter((a) => a.status === "offered").length,
    hired: applications.filter((a) => a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const pieData = USER_STATUS_CONFIG
    .map((s) => ({ name: s.label, value: appStats[s.key as keyof typeof appStats] as number, color: s.color }))
    .filter((d) => d.value > 0);

  const kpiCards = [
    { label: "Total Applied",   value: appStats.total,     icon: Briefcase,   gradient: "from-blue-600 to-cyan-600"     },
    { label: "Pending Review",  value: appStats.pending,   icon: Clock,       gradient: "from-amber-500 to-orange-500"  },
    { label: "Under Review",    value: appStats.reviewing, icon: Eye,         gradient: "from-violet-600 to-purple-600" },
    { label: "Interviews",      value: appStats.interview, icon: Calendar,    gradient: "from-indigo-500 to-blue-600"   },
    { label: "Offers / Hired",  value: appStats.offered + appStats.hired, icon: CheckCircle, gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={140} height={40} className="h-7 md:h-8 w-auto" priority />
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {appStats.interview > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/auth/signout" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    Sign Out
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-light text-gray-900">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                {user?.name?.split(" ")[0] || "there"}
              </span>
            </h1>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-gray-500 text-sm">Track your job applications and stay updated on your career opportunities.</p>
        </motion.div>

        {/* KPI cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts + Application list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Status breakdown */}
          <div className="space-y-4">
            {/* Pie chart */}
            <Card className="shadow-sm border-gray-100">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
                <CardDescription className="text-xs">{appStats.total} total application{appStats.total !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[160px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : pieData.length > 0 ? (
                  <>
                    <ChartContainer config={{}} className="h-[160px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="space-y-1.5 mt-2">
                      {USER_STATUS_CONFIG.filter((s) => (appStats[s.key as keyof typeof appStats] as number) > 0).map((s) => {
                        const count = appStats[s.key as keyof typeof appStats] as number;
                        const pct = appStats.total > 0 ? Math.round((count / appStats.total) * 100) : 0;
                        return (
                          <div key={s.key} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-xs text-gray-600 flex-1 truncate">{s.label}</span>
                            <span className="text-xs font-semibold text-gray-900">{count}</span>
                            <span className="text-[10px] text-gray-400 w-7 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="shadow-sm border-gray-100">
              <CardContent className="p-4 space-y-2">
                <Link href="/careers" className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-md transition-all group">
                  <Briefcase className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Browse Open Jobs</p>
                    <p className="text-xs opacity-80">Find your next opportunity</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {appStats.interview > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">{appStats.interview} interview{appStats.interview > 1 ? "s" : ""} pending</p>
                      <p className="text-xs text-purple-600">Prepare & review job details</p>
                    </div>
                  </div>
                )}
                {(appStats.offered + appStats.hired) > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Congratulations!</p>
                      <p className="text-xs text-emerald-600">{appStats.offered + appStats.hired} offer{(appStats.offered + appStats.hired) > 1 ? "s" : ""} received</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application list */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-gray-100 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Your Applications</CardTitle>
                  <Link href="/careers" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                    Browse Jobs <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading && (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-gray-500">Loading your applications…</p>
                  </div>
                )}
                {!isLoading && error && (
                  <div className="py-12 text-center px-6">
                    <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">{error}</p>
                    <button onClick={handleRefresh} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </div>
                )}
                {!isLoading && !error && (
                  <AnimatePresence>
                    {applications.length > 0 ? (
                      <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                        {applications.map((application, index) => {
                          const statusCfg = USER_STATUS_CONFIG.find((s) => s.key === application.status) || USER_STATUS_CONFIG[0];
                          const StatusIcon = statusCfg.icon;
                          return (
                            <motion.div key={application.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                              className={`px-5 py-4 hover:bg-gray-50 transition-colors border-l-4 ${statusCfg.border}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                                      {application.job?.title || "Position"}
                                    </h3>
                                    {application.job?.type && (
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                        {getJobTypeBadge(application.job.type)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                                    {application.job?.department && (
                                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{application.job.department}</span>
                                    )}
                                    {application.job?.location && (
                                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{application.job.location}</span>
                                    )}
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                                      {new Date(application.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                  </div>
                                  <ApplicationJourney status={application.status} />
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusCfg.label}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-16 text-center px-6">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-7 h-7 text-gray-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">No applications yet</h3>
                        <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                          Start exploring career opportunities and apply for your dream role.
                        </p>
                        <Link href="/careers" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-semibold">
                          Browse Open Positions <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ---- Role-based routing ----

function DashboardContent() {
  const { user } = useAuth();
  const isAdminOrHR =
    user?.role === UserRole.ADMIN || user?.role === UserRole.HR;

  if (isAdminOrHR) return <AdminAnalytics />;
  return <UserDashboard />;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR, UserRole.USER]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
