"use client";

import Link from "next/link";
import {
  Shield, Users, Briefcase, FileText, MessageSquare, Building,
  UsersRound, Settings, LayoutDashboard, Boxes, UserStar, Info, Check, Minus,
} from "lucide-react";
import { UserRole, routeAccess, roleHierarchy } from "@/lib/auth/config";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { tones, type Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

interface RoleConfig {
  name: string;
  description: string;
  tone: Tone;
  icon: typeof Shield;
  level: number;
}

const roleConfigs: Record<string, RoleConfig> = {
  [UserRole.ADMIN]: {
    name: "Administrator",
    description: "Full access to every feature, setting, and user.",
    tone: "rose",
    icon: Shield,
    level: roleHierarchy[UserRole.ADMIN],
  },
  [UserRole.HR]: {
    name: "HR Manager",
    description: "Jobs, applications, candidates, clients, vendors, and contacts.",
    tone: "violet",
    icon: Users,
    level: roleHierarchy[UserRole.HR],
  },
  [UserRole.RECRUITER]: {
    name: "Recruiter",
    description: "Jobs (view), applications, candidates, and bench. No CRM.",
    tone: "teal",
    icon: UserStar,
    level: roleHierarchy[UserRole.RECRUITER],
  },
  [UserRole.SALES]: {
    name: "Sales",
    description: "Create/edit jobs, applications, candidates, and bench. No CRM.",
    tone: "amber",
    icon: Briefcase,
    level: roleHierarchy[UserRole.SALES],
  },
};

const roles = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

// One row per route — paths are unique (the duplicate "/admin" entry was the
// source of a React key collision).
const routes: { path: string; name: string; icon: typeof Shield }[] = [
  { path: "/admin",              name: "Dashboard",    icon: LayoutDashboard },
  { path: "/admin/jobs",         name: "Job Postings", icon: Briefcase },
  { path: "/admin/applications", name: "Applications", icon: FileText },
  { path: "/admin/candidates",   name: "Candidates",   icon: UserStar },
  { path: "/admin/bench",        name: "Talent Bench", icon: Boxes },
  { path: "/admin/contacts",     name: "Contacts",     icon: MessageSquare },
  { path: "/admin/clients",      name: "Clients",      icon: Building },
  { path: "/admin/vendors",      name: "Vendors",      icon: UsersRound },
  { path: "/admin/content",      name: "Content",      icon: FileText },
  { path: "/admin/users",        name: "Users",        icon: Users },
  { path: "/admin/roles",        name: "Roles",        icon: Shield },
  { path: "/admin/settings",     name: "Settings",     icon: Settings },
];

function hasAccess(route: string, role: UserRole): boolean {
  return routeAccess[route]?.includes(role) ?? false;
}

export default function RolesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Who can access what. Read-only — assignments are managed in Cognito."
        icon={Shield}
        actions={
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:scale-[0.98]"
          >
            <Users className="h-4 w-4" /> Users
          </Link>
        }
      />

      {/* Roles, ordered by access level */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => {
          const c = roleConfigs[role];
          const t = tones[c.tone];
          const Icon = c.icon;
          return (
            <AdminCard key={role} className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-xl", t.bg)}>
                  <Icon className={cn("h-5 w-5", t.text)} strokeWidth={2} />
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", t.bg, t.text)}>
                  Level {c.level}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.description}</p>
            </AdminCard>
          );
        })}
      </div>

      {/* Permissions matrix */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={Shield} tone="blue" title="Route access" count={routes.length} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="sticky left-0 z-10 bg-slate-50/60 px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Route
                </th>
                {roles.map((role) => (
                  <th key={role} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {roleConfigs[role].name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <tr key={route.path} className="transition-colors hover:bg-[var(--adm-accent-tint)]">
                    <td className="sticky left-0 z-10 bg-inherit px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-slate-100">
                          <Icon className="h-3.5 w-3.5 text-slate-500" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{route.name}</p>
                          <p className="font-mono text-[11px] text-slate-400">{route.path}</p>
                        </div>
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={`${route.path}-${role}`} className="px-3 py-3 text-center">
                        {hasAccess(route.path, role) ? (
                          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-50">
                            <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100">
                            <Minus className="h-3.5 w-3.5 text-slate-300" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)]/40 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--hz-cobalt)]" />
        <p className="text-xs leading-relaxed text-slate-600">
          Permissions are defined in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700">src/lib/auth/config.ts</code>.
          Role assignments live in AWS Cognito groups — change a teammate&apos;s role from the{" "}
          <Link href="/admin/users" className="font-semibold text-[var(--hz-cobalt)] hover:underline">Users</Link> page.
        </p>
      </div>
    </div>
  );
}
