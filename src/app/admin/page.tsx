"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  FileText,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  UserPlus,
  Loader2,
  MessageSquare,
  Mail,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
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
}

const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const, icon: Clock },
  reviewing: { label: "Reviewing", variant: "secondary" as const, icon: Eye },
  interview: { label: "Interview", variant: "default" as const, icon: MessageSquare },
  offered: { label: "Offered", variant: "default" as const, icon: Mail },
  hired: { label: "Hired", variant: "default" as const, icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
  active: { label: "Active", variant: "default" as const, icon: CheckCircle2 },
  paused: { label: "Paused", variant: "secondary" as const, icon: Clock },
  draft: { label: "Draft", variant: "outline" as const, icon: FileText },
  closed: { label: "Closed", variant: "destructive" as const, icon: XCircle },
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const chartData = generateChartData(stats.totalApplications);
  const conversionRate =
    stats.totalApplications > 0
      ? ((stats.hiredApplications / stats.totalApplications) * 100).toFixed(1)
      : "0";

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      description: `${stats.pendingApplications} pending review`,
      trend: stats.pendingApplications > 0 ? "up" : "neutral",
      trendValue: `${stats.pendingApplications} new`,
      icon: Users,
      href: "/admin/applications",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      description: `${stats.totalJobs} total positions`,
      trend: "up",
      trendValue: `${stats.activeJobs} open`,
      icon: Briefcase,
      href: "/admin/jobs",
    },
    {
      title: "In Pipeline",
      value: stats.reviewingApplications + stats.interviewApplications,
      description: `${stats.interviewApplications} in interviews`,
      trend: stats.interviewApplications > 0 ? "up" : "neutral",
      trendValue: "Active candidates",
      icon: Eye,
      href: "/admin/applications?status=reviewing",
    },
    {
      title: "Hired",
      value: stats.hiredApplications,
      description: `${conversionRate}% conversion rate`,
      trend: stats.hiredApplications > 0 ? "up" : "neutral",
      trendValue: `${stats.offeredApplications} offers pending`,
      icon: UserPlus,
      href: "/admin/applications?status=hired",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your recruitment pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Data
          </Badge>
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Add New Job
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.title}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : stat.trend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {stat.trendValue}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Chart and Quick Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Applications Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
            <CardDescription>
              Applications received over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-applications)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-applications)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
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
                  stroke="var(--color-applications)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Summary</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.applicationsByStatus).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config?.icon || Clock;
              const percentage =
                stats.totalApplications > 0
                  ? ((count / stats.totalApplications) * 100).toFixed(0)
                  : 0;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <Badge variant="outline" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
              );
            })}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-lg font-bold text-primary">
                  {conversionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidates in the pipeline</CardDescription>
            </div>
            <Link
              href="/admin/applications"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentApplications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentApplications.map((app) => {
                    const config =
                      statusConfig[app.status as keyof typeof statusConfig] ||
                      statusConfig.pending;
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {app.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <div className="font-medium">{app.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {app.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{app.position}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="capitalize">
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {getTimeAgo(app.appliedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No applications yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Job Postings</CardTitle>
              <CardDescription>Current open positions</CardDescription>
            </div>
            <Link
              href="/admin/jobs"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Applicants</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentJobs.map((job) => {
                    const config =
                      statusConfig[job.status as keyof typeof statusConfig] ||
                      statusConfig.active;
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{job.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {job.applicants}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={config.variant} className="capitalize">
                            {job.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No jobs posted yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/jobs/new"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Add New Job</div>
                <div className="text-xs text-muted-foreground">Create posting</div>
              </div>
            </Link>
            <Link
              href="/admin/applications"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Applications</div>
                <div className="text-xs text-muted-foreground">
                  {stats.pendingApplications} pending
                </div>
              </div>
            </Link>
            <Link
              href="/admin/jobs"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Manage Jobs</div>
                <div className="text-xs text-muted-foreground">
                  {stats.totalJobs} jobs
                </div>
              </div>
            </Link>
            <Link
              href="/careers"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">View Careers</div>
                <div className="text-xs text-muted-foreground">Preview site</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
