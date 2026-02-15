"use client";

import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  BarChart3,
  UserPlus,
  DollarSign,
  Target,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Sample data
const stats = [
  {
    name: "Total Applications",
    value: "128",
    change: "+12%",
    changeType: "increase",
    icon: Users,
    href: "/admin/applications",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
  },
  {
    name: "Active Jobs",
    value: "8",
    change: "+2",
    changeType: "increase",
    icon: Briefcase,
    href: "/admin/jobs",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
  },
  {
    name: "Page Views",
    value: "24.5K",
    change: "+18%",
    changeType: "increase",
    icon: Eye,
    href: "#",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50",
  },
  {
    name: "New Users",
    value: "42",
    change: "+8%",
    changeType: "increase",
    icon: UserPlus,
    href: "/admin/users",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50",
  },
];

const recentApplications = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    position: "Senior SAP Consultant",
    status: "pending",
    date: "2 hours ago",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    position: "Cloud Solutions Architect",
    status: "reviewing",
    date: "5 hours ago",
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "m.chen@email.com",
    position: "Salesforce Developer",
    status: "approved",
    date: "1 day ago",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.d@email.com",
    position: "Data Analyst",
    status: "rejected",
    date: "2 days ago",
  },
  {
    id: 5,
    name: "Robert Wilson",
    email: "r.wilson@email.com",
    position: "Project Manager",
    status: "pending",
    date: "3 days ago",
  },
];

const recentJobs = [
  {
    id: 1,
    title: "Senior SAP Consultant",
    department: "ERP Solutions",
    location: "Remote",
    applicants: 24,
    status: "active",
  },
  {
    id: 2,
    title: "Cloud Solutions Architect",
    department: "Cloud Services",
    location: "San Francisco, CA",
    applicants: 18,
    status: "active",
  },
  {
    id: 3,
    title: "Salesforce Developer",
    department: "CRM",
    location: "New York, NY",
    applicants: 32,
    status: "active",
  },
  {
    id: 4,
    title: "Data Analyst",
    department: "Analytics",
    location: "Remote",
    applicants: 45,
    status: "paused",
  },
];

const statusStyles = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  reviewing: { bg: "bg-blue-100", text: "text-blue-700", icon: Eye },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  active: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  paused: { bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
};

const activityData = [
  { label: "Mon", value: 65 },
  { label: "Tue", value: 85 },
  { label: "Wed", value: 45 },
  { label: "Thu", value: 90 },
  { label: "Fri", value: 70 },
  { label: "Sat", value: 35 },
  { label: "Sun", value: 25 },
];

export default function AdminDashboard() {
  const maxActivityValue = Math.max(...activityData.map((d) => d.value));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
          <Link
            href="/admin/jobs/new"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
          >
            Add New Job
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={stat.href}
              className="block bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    stat.changeType === "increase"
                      ? "text-emerald-600"
                      : stat.changeType === "decrease"
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {stat.changeType === "increase" && <ArrowUpRight className="w-4 h-4" />}
                  {stat.changeType === "decrease" && <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{stat.name}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart & Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Weekly Activity</h2>
              <p className="text-sm text-slate-500">Page views and engagement</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-sm text-slate-600">Page Views</span>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-3">
            {activityData.map((day, index) => (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.value / maxActivityValue) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg min-h-[20px] relative group cursor-pointer hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.value} views
                  </div>
                </motion.div>
                <span className="text-xs text-slate-500 font-medium">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Quick Stats</h2>
              <p className="text-sm text-slate-400">Overview</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Conversion Rate</span>
                <span className="text-sm font-semibold text-emerald-400">+5.2%</span>
              </div>
              <p className="text-2xl font-bold">24.8%</p>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[24.8%] bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Avg. Response Time</span>
                <span className="text-sm font-semibold text-emerald-400">-12%</span>
              </div>
              <p className="text-2xl font-bold">2.4 days</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Open Positions</span>
                <span className="text-sm font-semibold text-amber-400">8 active</span>
              </div>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Recent Applications</h2>
              <p className="text-sm text-slate-500">Latest candidates</p>
            </div>
            <Link
              href="/admin/applications"
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentApplications.map((app) => {
              const status = statusStyles[app.status as keyof typeof statusStyles];
              const StatusIcon = status.icon;
              return (
                <div
                  key={app.id}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {app.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{app.name}</p>
                        <p className="text-sm text-slate-500">{app.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${status.bg} ${status.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:block">{app.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Job Postings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Active Job Postings</h2>
              <p className="text-sm text-slate-500">Current openings</p>
            </div>
            <Link
              href="/admin/jobs"
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentJobs.map((job) => {
              const status = statusStyles[job.status as keyof typeof statusStyles];
              return (
                <div
                  key={job.id}
                  className="px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500">
                        {job.department} &bull; {job.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900">{job.applicants}</p>
                        <p className="text-xs text-slate-500">applicants</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${status.bg} ${status.text}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="font-medium text-slate-900 block">Add New Job</span>
              <span className="text-xs text-slate-500">Create posting</span>
            </div>
          </Link>
          <Link
            href="/admin/content"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-emerald-300 transition-colors">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="font-medium text-slate-900 block">Edit Content</span>
              <span className="text-xs text-slate-500">Update pages</span>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center group-hover:from-violet-200 group-hover:to-violet-300 transition-colors">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <span className="font-medium text-slate-900 block">Manage Users</span>
              <span className="text-xs text-slate-500">User accounts</span>
            </div>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-300 transition-colors">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="font-medium text-slate-900 block">View Website</span>
              <span className="text-xs text-slate-500">Preview site</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
