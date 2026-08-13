"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import {
  IconShield, IconGroup, IconJob, IconFile, IconMessage, IconBuilding,
  IconSettings, IconOverview, IconBoxes, IconUserStar, IconInfo,
} from "@/components/admin/icons";
import { UserRole, routeAccess, roleHierarchy } from "@/lib/auth/config";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatCard, KpiStrip } from "@/components/admin/stat-card";
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
};

const roles = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

interface RouteRow {
  path: string;
  name: string;
  icon: typeof IconShield;
}

// One row per route, paths are unique (the duplicate "/admin" entry was the
// source of a React key collision).
const routes: RouteRow[] = [
  { path: "/admin",              name: "Dashboard",    icon: IconOverview },
  { path: "/admin/jobs",         name: "Job Postings", icon: IconJob },
  { path: "/admin/applications", name: "Applications", icon: IconFile },
  { path: "/admin/candidates",   name: "Candidates",   icon: IconUserStar },
  { path: "/admin/bench",        name: "Talent Bench", icon: IconBoxes },
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
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--adm-success)]">
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
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="font-semibold text-[var(--adm-ink)]">{r.name}</p>
              <p className="font-mono text-[11px] text-[var(--adm-ink-subtle)]">{r.path}</p>
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
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Who can access what. Read-only, assignments are managed in Cognito."
        icon={IconShield}
        actions={
          <PageHeaderButton variant="secondary" asChild>
            <Link href="/admin/users">
              <IconGroup className="h-4 w-4" />Users
            </Link>
          </PageHeaderButton>
        }
      />

      {/* Access granted per role, counted straight off the routeAccess table. */}
      <KpiStrip cols={4}>
        {roles.map((role) => {
          const c = roleConfigs[role];
          return (
            <StatCard
              key={role}
              size="sm"
              tone="slate"
              icon={c.icon}
              label={c.name}
              value={`${grantedCount(role)} / ${routes.length}`}
              hint={`Level ${c.level} · ${c.description}`}
            />
          );
        })}
      </KpiStrip>

      {/* Permission matrix, routes down, roles across. */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconShield} tone="blue" title="Route access" count={routes.length} />
        <DataTable
          columns={columns}
          rows={routes}
          rowKey={(r) => r.path}
          initialSort={{ key: "route", dir: "asc" }}
          empty={{ icon: IconShield, title: "No routes defined" }}
        />
      </AdminCard>

      <div className="flex items-start gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-accent-tint)] p-4">
        <IconInfo className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--adm-accent)]" />
        <p className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
          Permissions are defined in{" "}
          <code className="rounded-[4px] bg-[var(--adm-surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--adm-ink-mute)]">src/lib/auth/config.ts</code>.
          Role assignments live in AWS Cognito groups, change a teammate&apos;s role from the{" "}
          <Link href="/admin/users" className="font-semibold text-[var(--adm-accent)] hover:underline">Users</Link> page.
        </p>
      </div>
    </div>
  );
}
