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
} from "lucide-react";
import Link from "next/link";

// Sample data
const stats = [
  {
    name: "Total Applications",
    value: "128",
    change: "+12%",
    changeType: "increase",
    icon: Users,
    href: "/admin/applications",
  },
  {
    name: "Active Job Postings",
    value: "8",
    change: "+2",
    changeType: "increase",
    icon: Briefcase,
    href: "/admin/jobs",
  },
  {
    name: "Page Views (Monthly)",
    value: "24.5K",
    change: "+18%",
    changeType: "increase",
    icon: Eye,
    href: "#",
  },
  {
    name: "Content Updates",
    value: "15",
    change: "This month",
    changeType: "neutral",
    icon: FileText,
    href: "/admin/content",
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

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewing: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-gray-100 text-gray-700",
};

const statusIcons = {
  pending: Clock,
  reviewing: Eye,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your site.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === "increase"
                    ? "text-green-600"
                    : stat.changeType === "decrease"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {stat.changeType === "increase" && (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                {stat.changeType === "decrease" && (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link
              href="/admin/applications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentApplications.map((app) => {
              const StatusIcon =
                statusIcons[app.status as keyof typeof statusIcons];
              return (
                <div
                  key={app.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                        {app.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.name}</p>
                        <p className="text-sm text-gray-500">{app.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusColors[app.status as keyof typeof statusColors]
                        }`}
                      >
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {app.status}
                      </span>
                      <span className="text-xs text-gray-400">{app.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Job Postings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Active Job Postings</h2>
            <Link
              href="/admin/jobs"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.department} &bull; {job.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {job.applicants}
                      </p>
                      <p className="text-xs text-gray-500">applicants</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        statusColors[job.status as keyof typeof statusColors]
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Add New Job</span>
          </Link>
          <Link
            href="/admin/content"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-gray-900">Edit Content</span>
          </Link>
          <Link
            href="/admin/applications"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900">View Applications</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
              <Eye className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="font-medium text-gray-900">View Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
