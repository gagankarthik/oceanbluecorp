"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import {
  IconShield, IconGroup, IconJob, IconFile, IconMessage, IconBuilding,
  IconSettings, IconOverview, IconBoxes, IconUserStar, IconInfo, IconRadar,
} from "@/components/admin/icons";
import { UserRole, routeAccess, roleHierarchy } from "@/lib/auth/config";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton, NotePanel } from "@/components/admin/workspace";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

interface RoleConfig {
  name: string;
  short: string;
  description: string;
  icon: typeof IconShield;
  level: number;
}

const roleConfigs: Record<string, RoleConfig> = {
  [UserRole.ADMIN]: {
    name: "Administrator",
    short: "Admin",
    description: "Full access to every feature, setting, and user.",
    icon: IconShield,
    level: roleHierarchy[UserRole.ADMIN],
  },
  [UserRole.HR]: {
    name: "HR Manager",
    short: "HR",
    description: "Jobs, applications, candidates, clients, vendors, and contacts.",
    icon: IconGroup,
    level: roleHierarchy[UserRole.HR],
  },
  [UserRole.RECRUITER]: {
    name: "Recruiter",
    short: "Recruiter",
    description: "Jobs (view), applications, candidates, and bench. No CRM.",
    icon: IconUserStar,
    level: roleHierarchy[UserRole.RECRUITER],
  },
  [UserRole.SALES]: {
    name: "Sales",
    short: "Sales",
    description: "Create/edit jobs, applications, candidates, and bench. No CRM.",
    icon: IconJob,
    level: roleHierarchy[UserRole.SALES],
  },
  [UserRole.MEDIA]: {
    name: "Media",
    short: "Media",
    description: "Blog, case studies, news, and customer stories. Jobs view-only, no rates or clients. Never sees candidate data.",
    icon: IconRadar,
    level: roleHierarchy[UserRole.MEDIA],
  },
};

const roles = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.MEDIA];

interface RouteRow {
  path: string;
  name: string;
  icon: typeof IconShield;
}

// Paths double as React keys, keep them unique.
const routes: RouteRow[] = [
  { path: "/admin",              name: "Dashboard",    icon: IconOverview },
  { path: "/admin/jobs",         name: "Job postings", icon: IconJob },
  { path: "/admin/applications", name: "Applications", icon: IconFile },
  { path: "/admin/candidates",   name: "Candidates",   icon: IconUserStar },
  { path: "/admin/bench",        name: "Talent bench", icon: IconBoxes },
  { path: "/admin/contacts",     name: "Contacts",     icon: IconMessage },
  { path: "/admin/clients",      name: "Clients",      icon: IconBuilding },
  { path: "/admin/vendors",      name: "Vendors",      icon: IconGroup },
  { path: "/admin/content",      name: "Content",      icon: IconFile },
  { path: "/admin/users",        name: "Users",        icon: IconGroup },
  { path: "/admin/roles",        name: "Roles",        icon: IconShield },
  { path: "/admin/settings",     name: "Settings",     icon: IconSettings },
];

function hasAccess(route: string, role: UserRole): boolean {
  return routeAccess[route]?.includes(role) ?? false;
}

/** Allow / deny mark. Never colour alone, each carries its own glyph. */
function Allow() {
  return (
    <span className="inline-flex items-center text-[var(--adm-success-ink)]">
      <Check className="h-4 w-4" strokeWidth={2.5} />
      <span className="sr-only">Allowed</span>
    </span>
  );
}

function Deny() {
  return (
    <span className="inline-flex items-center text-[var(--adm-ink-subtle)]">
      <Minus className="h-4 w-4" strokeWidth={2} />
      <span className="sr-only">No access</span>
    </span>
  );
}

export default function RolesPage() {
  // Derived from the same routeAccess table the grid renders, no extra data.
  const grantedCount = (role: UserRole) => routes.filter((r) => hasAccess(r.path, role)).length;

  const columns: DataTableColumn<RouteRow>[] = [
    {
      key: "route",
      header: "Route",
      sortValue: (r) => r.name,
      cell: (r) => {
        const Icon = r.icon;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="font-semibold text-[var(--adm-ink)]">{r.name}</p>
              <p className="truncate font-mono text-[12px] text-[var(--adm-ink-subtle)]">{r.path}</p>
            </div>
          </div>
        );
      },
    },
    ...roles.map<DataTableColumn<RouteRow>>((role) => ({
      key: role,
      header: roleConfigs[role].short,
      align: "center" as const,
      sortValue: (r: RouteRow) => (hasAccess(r.path, role) ? 1 : 0),
      cell: (r: RouteRow) => (hasAccess(r.path, role) ? <Allow /> : <Deny />),
    })),
  ];

  return (
    <div className="space-y-4 pb-10 lg:space-y-5">
      <PageHeader
        title="Roles & permissions"
        info="Who can access what. Read-only, assignments are managed in Cognito."
        actions={
          <WorkspaceButton asChild>
            <Link href="/admin/users">
              <IconGroup className="h-4 w-4" />Users
            </Link>
          </WorkspaceButton>
        }
      />

      {/* Routes granted per role, counted off the same routeAccess table as the matrix. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {roles.map((role) => {
          const c = roleConfigs[role];
          const Icon = c.icon;
          return (
            <AdminCard key={role} className="flex flex-col gap-2.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-[var(--adm-ink-mute)]">{c.name}</span>
                <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[24px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[var(--adm-ink)]">
                  {grantedCount(role)}
                </span>
                <span className="text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">of {routes.length} routes</span>
              </div>
              <p className="text-[12.5px] leading-snug text-[var(--adm-ink-subtle)]">
                <span className="tabular-nums">Level {c.level}</span> · {c.description}
              </p>
            </AdminCard>
          );
        })}
      </div>

      <AdminCard className="overflow-hidden">
        <AdminCardHeader title="Route access" subtitle="Routes down, roles across" count={routes.length} />
        <DataTable
          columns={columns}
          rows={routes}
          rowKey={(r) => r.path}
          initialSort={{ key: "route", dir: "asc" }}
          empty={{ icon: IconShield, title: "No routes defined" }}
        />
      </AdminCard>

      <NotePanel className="flex items-start gap-3">
        <IconInfo className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
        <p>
          Permissions are defined in{" "}
          <code className="rounded-[6px] border border-[var(--adm-line-soft)] bg-[var(--adm-surface)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--adm-ink-mute)]">src/lib/auth/config.ts</code>.
          Role assignments live in AWS Cognito groups, change a teammate&apos;s role from the{" "}
          <Link href="/admin/users" className="font-medium text-[var(--adm-accent)] hover:underline">Users</Link> page.
        </p>
      </NotePanel>
    </div>
  );
}
