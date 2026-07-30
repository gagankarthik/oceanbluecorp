"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronDown, X, Loader2, Check,
} from "lucide-react";
import type { IconComponent } from "@/components/admin/icons";
import {
  IconShield, IconTrash, IconUserCheck, IconWarning, IconGroup,
  IconUserPlus, IconSend,
} from "@/components/admin/icons";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { type Tone } from "@/components/admin/theme";

type Role = "admin" | "hr" | "recruiter" | "sales";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role | null;
  status: "active" | "inactive" | "pending";
  groups: string[];
  createdAt: string;
  lastModified?: string;
  enabled: boolean;
}

/**
 * The four assignable staff roles in access-hierarchy order. One table drives
 * the badge, the invite/change-role pickers, and the role filter — so a role
 * can never render as two different things on the same screen.
 */
const ROLE_ORDER: Role[] = ["admin", "hr", "sales", "recruiter"];

const ROLE_META: Record<Role, { label: string; tone: Tone; icon: IconComponent; desc: string }> = {
  admin:     { label: "Admin",     tone: "rose",   icon: IconShield,    desc: "Full access to all features, settings, and user management" },
  hr:        { label: "HR",        tone: "violet", icon: IconGroup,     desc: "Jobs, applications, candidates, bench, clients, vendors, and contacts" },
  sales:     { label: "Sales",     tone: "amber",  icon: IconUserCheck, desc: "Can create/edit jobs, plus applications, candidates, and bench" },
  recruiter: { label: "Recruiter", tone: "teal",   icon: IconUserCheck, desc: "View-only jobs, plus applications, candidates, and bench" },
};

const NO_ROLE = { label: "No role", tone: "slate" as Tone };

/** Account states carry reserved status meaning, never a categorical slot. */
const STATUS_META: Record<User["status"], { label: string; tone: Tone }> = {
  active:   { label: "Active",   tone: "emerald" },
  pending:  { label: "Invited",  tone: "amber"   },
  inactive: { label: "Inactive", tone: "slate"   },
};

const ROLE_TABS: { key: string; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "admin",     label: "Admins" },
  { key: "hr",        label: "HR" },
  { key: "sales",     label: "Sales" },
  { key: "recruiter", label: "Recruiters" },
];

/** Placeholder for an empty cell — an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">—</span>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("recruiter");
  const [inviting, setInviting] = useState(false);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send invite");
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("recruiter");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToEdit || !newRole) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role");
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...u, role: newRole as Role } : u));
      setShowRoleModal(false);
      setUserToEdit(null);
      setNewRole("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete user");
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as "active" | "inactive" } : u));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || user.name.toLowerCase().includes(q)
      || user.email.toLowerCase().includes(q);
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, searchQuery, selectedRole, selectedStatus]);

  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.status === "active").length,
    pending:  users.filter(u => u.status === "pending").length,
    inactive: users.filter(u => u.status === "inactive").length,
    admins:   users.filter(u => u.role === "admin").length,
  }), [users]);

  const roleCounts = useMemo(() => ROLE_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? users.length : users.filter(u => u.role === tab.key).length;
    return acc;
  }, {} as Record<string, number>), [users]);

  const hasActiveFilters = selectedRole !== "all" || selectedStatus !== "all" || searchQuery.trim() !== "";

  /** Authenticated but in no staff group, so they can reach nothing. */
  const noRoleCount = useMemo(() => users.filter((u) => !u.role).length, [users]);

  const [rows, setRows] = useLocalStorage<number>("adm.users.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.users.hiddenCols", []);
  const clearFilters = () => { setSelectedRole("all"); setSelectedStatus("all"); setSearchQuery(""); };

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      label: "Name",
      width: "250px",
      locked: true,
      header: "Staff member",
      sortValue: u => u.name || u.email,
      cell: u => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} email={u.email} size="sm" />
          <span className="truncate font-semibold text-[var(--adm-ink)]">{u.name || "Unnamed"}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      width: "260px",
      header: "Email",
      hideBelow: "md",
      sortValue: u => u.email,
      cell: u => (
        <a
          href={`mailto:${u.email}`}
          onClick={e => e.stopPropagation()}
          className="block truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {u.email}
        </a>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      width: "160px",
      header: "Phone",
      hideBelow: "xl",
      sortValue: u => u.phone || "",
      cell: u => u.phone
        ? <span className="block truncate tabular-nums text-[var(--adm-ink-mute)]">{u.phone}</span>
        : <Blank />,
    },
    {
      key: "role",
      label: "Role",
      width: "150px",
      header: "Role",
      sortValue: u => u.role || "",
      cell: u => {
        const meta = u.role ? ROLE_META[u.role] : NO_ROLE;
        return (
          <button
            type="button"
            onClick={() => { setUserToEdit(u); setNewRole(u.role || ""); setShowRoleModal(true); }}
            aria-label={`Change role for ${u.name || u.email}`}
            className="inline-flex items-center gap-1 rounded-[4px] transition-opacity hover:opacity-75"
          >
            <StatusBadge tone={meta.tone} label={meta.label} size="md" />
            <ChevronDown className="h-3 w-3 text-[var(--adm-ink-subtle)]" />
          </button>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      width: "150px",
      header: "Status",
      hideBelow: "md",
      sortValue: u => u.status,
      cell: u => {
        const meta = STATUS_META[u.status] || STATUS_META.pending;
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(u)}
            aria-label={`Toggle status for ${u.name || u.email}`}
            className="rounded-[4px] transition-opacity hover:opacity-75"
          >
            <StatusBadge tone={meta.tone} label={meta.label} size="md" />
          </button>
        );
      },
    },
    {
      key: "joined",
      label: "Joined",
      width: "140px",
      header: "Joined",
      hideBelow: "xl",
      sortValue: u => new Date(u.createdAt).getTime(),
      cell: u => u.createdAt
        ? <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(u.createdAt)}</span>
        : <Blank />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: u => (
        <button
          onClick={() => { setUserToDelete(u.id); setShowDeleteModal(true); }}
          aria-label={`Delete ${u.name || u.email}`}
          className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
        >
          <IconTrash className="h-4 w-4" aria-hidden="true" />
        </button>
      ),
    },
  ];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
        <p className="text-sm text-[var(--adm-danger)]">{error}</p>
        <button
          onClick={fetchUsers}
          className="rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--adm-accent-strong)]"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* The KPI strip counted staff by role and state — the two filters in the
          toolbar below. "Admins 4, 31%" was a share of headcount nothing
          followed from. */}
      <WorkspaceTitle
        title="Users & access"
        actions={
          <>
            <Link
              href="/admin/roles"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3.5 text-[14px] font-semibold text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
            >
              <IconShield className="h-4 w-4" />Roles
            </Link>
            <WorkspaceButton variant="primary" onClick={() => setShowInviteModal(true)}>
              <IconUserPlus className="h-4 w-4" />Invite user
            </WorkspaceButton>
          </>
        }
      />
      {/* Inline stat strip — the table gets the vertical space, not stat cards. */}
      <StatStrip
        items={[
          { label: "Active staff", value: stats.active,
            onClick: () => setSelectedStatus("active") },
          { label: "Invites pending", value: stats.pending,
            tone: stats.pending > 0 ? "warning" : "default",
            hint: stats.pending > 0 ? "Not yet signed in" : undefined,
            onClick: () => setSelectedStatus("pending") },
          { label: "Admins", value: stats.admins,
            hint: "Full access to every screen",
            onClick: () => setSelectedRole("admin") },
          { label: "Without a role", value: noRoleCount,
            tone: noRoleCount > 0 ? "danger" : "default",
            hint: noRoleCount > 0 ? "Signed in but no access" : undefined },
        ]}
      />

      {/* Toolbar floats on the canvas between the stat strip and the table. */}
      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter staff by name or email"
            />
          }
          trailing={
            <>
              <DisplayMenu
                columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
                hidden={hiddenColumns}
                onHiddenChange={setHiddenColumns}
                rows={rows}
                onRowsChange={setRows}
                onReset={() => { setHiddenColumns([]); setRows(25); }}
              />
            </>
          }
        >
          <FilterPill
            label="Role"
            icon={FilterIcon.role}
            value={selectedRole}
            onChange={setSelectedRole}
            options={ROLE_TABS.map(tab => ({
              value: tab.key,
              label: tab.label,
              count: roleCounts[tab.key] || 0,
            }))}
          />
          <FilterPill
            label="Status"
            icon={FilterIcon.status}
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: "all",      label: "All",                      count: stats.total },
              { value: "active",   label: STATUS_META.active.label,   count: stats.active },
              { value: "inactive", label: STATUS_META.inactive.label, count: stats.inactive },
              { value: "pending",  label: STATUS_META.pending.label,  count: stats.pending },
            ]}
          />
      </WorkspaceToolbar>

      <ActiveFilters
          variant="canvas"
          chips={[
            ...(selectedRole !== "all"
              ? [{ label: `Role: ${ROLE_TABS.find(t => t.key === selectedRole)?.label ?? selectedRole}`, onClear: () => setSelectedRole("all") }]
              : []),
            ...(selectedStatus !== "all"
              ? [{ label: `Status: ${STATUS_META[selectedStatus as keyof typeof STATUS_META]?.label ?? selectedStatus}`, onClear: () => setSelectedStatus("all") }]
              : []),
          ]}
          onClearAll={clearFilters}
      />

      <Workspace>
        <DataTable
          noun="staff"
          storageKey="users"
          columns={columns}
          rows={filteredUsers}
          rowKey={u => u.id}
          initialSort={{ key: "name", dir: "asc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          empty={{
            icon: IconGroup,
            title: users.length === 0 ? "No teammates yet" : "No users match your filters",
            description: users.length === 0
              ? "Invite a teammate to give them access to the console."
              : "Try adjusting your search, role, or status filter.",
            action: users.length === 0 ? (
              <WorkspaceButton variant="primary" onClick={() => setShowInviteModal(true)}>
                <IconUserPlus className="h-4 w-4" />Invite user
              </WorkspaceButton>
            ) : hasActiveFilters ? (
              <WorkspaceButton onClick={clearFilters}>
                <X className="h-4 w-4" />Clear filters
              </WorkspaceButton>
            ) : undefined,
          }}
        />
      </Workspace>

      {/* ── invite modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleInvite} className="w-full max-w-md overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--adm-line)] px-5 py-3.5">
              <h2 className="text-[15px] font-semibold text-[var(--adm-ink)]">Invite a teammate</h2>
              <button
                type="button"
                onClick={() => { setShowInviteModal(false); setInviteEmail(""); }}
                aria-label="Close"
                className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-[var(--adm-ink-mute)]">Email address</label>
                <input
                  id="inviteEmail" type="email" required autoFocus autoComplete="off" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@oceanbluecorp.com"
                  className="w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-2.5 text-sm text-[var(--adm-ink)] transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                />
                <p className="text-xs text-[var(--adm-ink-subtle)]">
                  We&apos;ll email them an invite with a temporary password. They set their name, phone, and password on first sign-in.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">Role</p>
                <div className="space-y-1.5">
                  {ROLE_ORDER.map(role => {
                    const meta = ROLE_META[role];
                    const selected = inviteRole === role;
                    return (
                      <label
                        key={role}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[6px] border p-3 transition-colors",
                          selected
                            ? "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]"
                            : "border-[var(--adm-line)] hover:bg-[var(--adm-row-hover)]",
                        )}
                      >
                        <input
                          type="radio" name="inviteRole" value={role} checked={selected}
                          onChange={() => setInviteRole(role)}
                          className="mt-0.5 h-4 w-4 accent-[var(--adm-accent)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[var(--adm-ink)]">{meta.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--adm-ink-subtle)]">{meta.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-5 py-3.5">
              <button
                type="button"
                onClick={() => { setShowInviteModal(false); setInviteEmail(""); }}
                className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-2 text-sm font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)] disabled:opacity-50"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSend className="h-4 w-4" />}Send Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── change-role modal ── */}
      {showRoleModal && userToEdit && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={userToEdit.name} email={userToEdit.email} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{userToEdit.name || "Unnamed"}</p>
                  <p className="truncate text-xs text-[var(--adm-ink-subtle)]">{userToEdit.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }}
                aria-label="Close"
                className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">Select a role</p>
              <div className="space-y-1.5">
                {ROLE_ORDER.map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  const selected = newRole === role;
                  const current = userToEdit.role === role;
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setNewRole(role)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[6px] border p-3 text-left transition-colors",
                        selected
                          ? "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]"
                          : "border-[var(--adm-line)] hover:bg-[var(--adm-row-hover)]",
                      )}
                    >
                      <span className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--adm-ink)]">{meta.label}</span>
                          {current && (
                            <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--adm-ink-subtle)]">
                              Current
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--adm-ink-subtle)]">{meta.desc}</span>
                      </span>
                      <span className={cn(
                        "mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 transition-colors",
                        selected ? "border-[var(--adm-accent)] bg-[var(--adm-accent)]" : "border-[var(--adm-line)]",
                      )}>
                        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-5 py-3.5">
              <button
                onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }}
                className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-2 text-sm font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updating || newRole === userToEdit.role || !newRole}
                className="inline-flex items-center gap-2 rounded-[6px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)] disabled:opacity-50"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}Save role
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteModal}
        title="Delete this user?"
        body="Their account and access are removed permanently. This cannot be undone."
        confirmLabel="Delete User"
        busy={updating}
        onCancel={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        onConfirm={handleDeleteUser}
      />
    </>
  );
}
