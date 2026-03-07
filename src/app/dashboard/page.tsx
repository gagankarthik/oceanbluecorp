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

function UserDashboard() {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const response = await fetch(`/api/applications?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      const userApplications: UserApplication[] = data.applications || [];
      const applicationsWithJobs: ApplicationWithJob[] = await Promise.all(
        userApplications.map(async (app) => {
          try {
            const jobResponse = await fetch(`/api/jobs/${app.jobId}`);
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              return { ...app, job: jobData.job };
            }
          } catch {
            // continue without job data
          }
          return app;
        })
      );
      setApplications(applicationsWithJobs);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "reviewing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Eye className="w-3 h-3" />
            Under Review
          </span>
        );
      case "interview":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Calendar className="w-3 h-3" />
            Interview Scheduled
          </span>
        );
      case "offered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Star className="w-3 h-3" />
            Offer Extended
          </span>
        );
      case "hired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Hired
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            Not Selected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getJobTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      "full-time": "Full-time",
      "part-time": "Part-time",
      contract: "Contract",
      remote: "Remote",
    };
    return typeLabels[type] || type;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offered: applications.filter(
      (a) => a.status === "offered" || a.status === "hired"
    ).length,
  };

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
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {stats.interview > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.[0]?.toUpperCase() || "U"}
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
                      href="/dashboard/settings"
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-light text-gray-900">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                {user?.name?.split(" ")[0] || "User"}
              </span>
            </h1>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-gray-500">
            Track your job applications and stay updated on your career opportunities.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8"
        >
          {[
            { label: "Total", value: stats.total, icon: Briefcase, gradient: "from-blue-600 to-cyan-600" },
            { label: "Pending", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-orange-500" },
            { label: "In Review", value: stats.reviewing, icon: AlertCircle, gradient: "from-violet-600 to-purple-600" },
            { label: "Interviews", value: stats.interview, icon: CheckCircle, gradient: "from-emerald-500 to-teal-500" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{s.label}</p>
                  <p className="text-2xl font-light text-gray-900">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
            <Link
              href="/careers"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              Browse Jobs
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading && (
            <div className="px-6 py-16 text-center">
              <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading your applications...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="px-6 py-12 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to load applications
              </h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <AnimatePresence>
              {applications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {applications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {application.job?.title || "Position"}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {application.job?.department || "Department"}
                                </span>
                                {application.job?.location && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {application.job.location}
                                    </span>
                                  </>
                                )}
                                {application.job?.type && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-blue-600 font-medium">
                                      {getJobTypeBadge(application.job.type)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Applied{" "}
                                {new Date(application.appliedAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                                {application.updatedAt &&
                                  application.updatedAt !== application.appliedAt && (
                                    <span>
                                      {" "}
                                      • Updated{" "}
                                      {new Date(application.updatedAt).toLocaleDateString(
                                        "en-US",
                                        { month: "short", day: "numeric" }
                                      )}
                                    </span>
                                  )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          {getStatusBadge(application.status)}
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No applications yet
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Start exploring career opportunities and submit your first application today.
                  </p>
                  <Link
                    href="/careers"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                  >
                    Browse Open Positions
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Interview tip banner */}
        {!isLoading && !error && stats.interview > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  You have {stats.interview} interview{stats.interview > 1 ? "s" : ""} scheduled!
                </h3>
                <p className="text-sm text-gray-600">
                  Prepare for your upcoming interviews by reviewing the job descriptions and
                  practicing common questions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
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
