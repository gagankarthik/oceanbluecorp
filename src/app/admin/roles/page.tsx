"use client";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";

import { UserRole, routeAccess, roleHierarchy } from "@/lib/auth/config";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Building,
  UsersRound,
  Settings,
  LayoutDashboard,
  Boxes,
  UserStar,
  Info,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface RoleConfig {
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Shield;
  level: number;
}

const roleConfigs: Record<string, RoleConfig> = {
  [UserRole.ADMIN]: {
    name: "Administrator",
    description: "Full access to all features, settings, and user management",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    icon: Shield,
    level: roleHierarchy[UserRole.ADMIN],
  },
  [UserRole.HR]: {
    name: "HR Manager",
    description: "Access to HR features including jobs, applications, candidates, clients, vendors, and contacts",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    icon: Users,
    level: roleHierarchy[UserRole.HR],
  },
  [UserRole.RECRUITER]: {
    name: "Recruiter",
    description: "View-only access to jobs, plus applications, candidates, and bench. No access to clients, vendors, or contacts",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    icon: UserStar,
    level: roleHierarchy[UserRole.RECRUITER],
  },
  [UserRole.SALES]: {
    name: "Sales",
    description: "Can create/edit job postings, access applications, candidates, and bench. No access to clients, vendors, or contacts",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Briefcase,
    level: roleHierarchy[UserRole.SALES],
  },
};

interface RouteConfig {
  path: string;
  name: string;
  icon: typeof Shield;
}

const routes: RouteConfig[] = [
  { path: "/admin", name: "Admin Home", icon: LayoutDashboard },
  { path: "/admin", name: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/roles", name: "Roles", icon: Shield },
  { path: "/admin/jobs", name: "Job Postings", icon: Briefcase },
  { path: "/admin/applications", name: "Applications", icon: FileText },
  { path: "/admin/candidates", name: "Candidates", icon: UserStar },
  { path: "/admin/bench", name: "Talent Bench", icon: Boxes },
  { path: "/admin/contacts", name: "Contacts", icon: MessageSquare },
  { path: "/admin/clients", name: "Clients", icon: Building },
  { path: "/admin/vendors", name: "Vendors", icon: UsersRound },
  { path: "/admin/settings", name: "Settings", icon: Settings },
];

const roles = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

function hasAccess(route: string, role: UserRole): boolean {
  const allowedRoles = routeAccess[route];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export default function RolesPage() {
  const totalRoles = Object.keys(roleConfigs).length;
  const totalRoutes = routes.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="View role hierarchy and route access permissions"
        icon={Shield}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Roles", value: totalRoles, icon: Shield, color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
          { label: "Admin-only Routes", value: routes.filter(r => routeAccess[r.path]?.length === 1).length, icon: Shield, color: "text-[var(--hz-cobalt)]", bg: "bg-[var(--hz-cobalt-100)] border-[var(--hz-cobalt-100)]" },
          { label: "Shared Routes", value: routes.filter(r => (routeAccess[r.path]?.length ?? 0) > 1).length, icon: Users, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Total Routes", value: totalRoutes, icon: Settings, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Role Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Role Hierarchy</CardTitle>
            <CardDescription>System roles ordered by hierarchy level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role, index) => {
                const config = roleConfigs[role];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${config.color}`}>{config.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.borderColor} border ${config.color} font-medium`}>
                          Level {config.level}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {config.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Permissions Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Permissions Matrix</CardTitle>
            <CardDescription>Route access by role (read-only view)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 z-10">
                      Route
                    </th>
                    {roles.map(role => {
                      const config = roleConfigs[role];
                      return (
                        <th key={role} className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide min-w-[100px]">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                            {config.name}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes.map((route, index) => {
                    const Icon = route.icon;
                    return (
                      <tr key={route.path} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="py-3 px-4 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{route.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{route.path}</p>
                            </div>
                          </div>
                        </td>
                        {roles.map(role => {
                          const access = hasAccess(route.path, role);
                          return (
                            <td key={`${route.path}-${role}`} className="py-3 px-4 text-center">
                              {access ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                                  <X className="w-4 h-4 text-slate-400" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-4 p-4 bg-[var(--hz-cobalt-100)] border border-[var(--hz-cobalt-100)] rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-[var(--hz-cobalt-100)] flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-[var(--hz-cobalt)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--hz-cobalt)]">Configuration Note</h3>
            <p className="text-sm text-[var(--hz-cobalt)] mt-1">
              Permissions are managed in the code configuration at{" "}
              <code className="px-1.5 py-0.5 bg-[var(--hz-cobalt-100)] rounded text-xs font-mono">
                src/lib/auth/config.ts
              </code>
              . Role assignments are managed through AWS Cognito user groups. To change a user&apos;s role,
              use the Users Management page or AWS Cognito console.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
