"use client";

import { useAuth, UserRole } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  FileText,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  Building2,
  Star,
  Eye,
  Sparkles,
} from "lucide-react";
import {
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Ocean Blue Corporation" width={140} height={40} className="h-7 md:h-8 w-auto" priority />
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                My Dashboard
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {appStats.interview > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />}
              </button>
              <div className="relative group ml-2">
                <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                    <p className="text-xs text-gray-400">Candidate</p>
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-white/80 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/careers" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Briefcase className="w-4 h-4" />
                      Browse Jobs
                    </Link>
                  </div>
                  <div className="border-t border-gray-100">
                    <Link href="/auth/signout" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Sign Out
                    </Link>
                  </div>
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

// ---- Dashboard Page ----

function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect admin/hr/recruiter/sales to admin dashboard
      if (user.role === UserRole.ADMIN || user.role === UserRole.HR ||
          user.role === UserRole.RECRUITER || user.role === UserRole.SALES) {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking role or redirecting
  if (isLoading || (user && user.role !== UserRole.USER)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return <UserDashboard />;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.USER]}>
      <DashboardRouter />
    </ProtectedRoute>
  );
}
