"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronDown, X, Loader2, Check,
} from "lucide-react";
import type { IconComponent } from "@/components/admin/icons";
import {
  IconShield, IconTrash, IconUserCheck, IconGroup, IconRadar,
  IconUserPlus, IconSend,
} from "@/components/admin/icons";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { AccountState } from "@/components/admin/users/account-state";
import { undoable } from "@/lib/undo";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { type Tone } from "@/components/admin/theme";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { Field, FormInput } from "@/components/admin/forms/primitives";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, LIMITS, maxLen, required } from "@/lib/form-validation";

type Role = "admin" | "hr" | "recruiter" | "sales" | "media";

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

/** Staff roles in access order; one table drives the badge, the pickers and the filter. Media sits last: a different job, not a junior recruiter. */
const ROLE_ORDER: Role[] = ["admin", "hr", "sales", "recruiter", "media"];

const ROLE_META: Record<Role, { label: string; tone: Tone; icon: IconComponent; desc: string }> = {
  admin:     { label: "Admin",     tone: "blue",   icon: IconShield,    desc: "Full access to all features, settings, and user management" },
  hr:        { label: "HR",        tone: "slate",  icon: IconGroup,     desc: "Jobs, applications, candidates, bench, clients, vendors, and contacts" },
  sales:     { label: "Sales",     tone: "slate",  icon: IconUserCheck, desc: "Can create/edit jobs, plus applications, candidates, and bench" },
  recruiter: { label: "Recruiter", tone: "slate",  icon: IconUserCheck, desc: "View-only jobs, plus applications, candidates, and bench" },
  media:     { label: "Media",     tone: "slate",  icon: IconRadar,     desc: "Blog, case studies, news, customer stories, and writing job postings. No candidate, client, or rate data" },
};

const NO_ROLE = { label: "No role", tone: "slate" as Tone };

/** Account states carry reserved status meaning, never a categorical slot. */
const STATUS_META: Record<User["status"], { label: string; tone: Tone }> = {
  active:   { label: "Active",   tone: "emerald" },
  pending:  { label: "Invited",  tone: "amber"   },
  // Rose, not slate: a revoked account is a state, not an absence of one.
  inactive: { label: "Inactive", tone: "rose"    },
};

const ROLE_TABS: { key: string; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "admin",     label: "Admins" },
  { key: "hr",        label: "HR" },
  { key: "sales",     label: "Sales" },
  { key: "recruiter", label: "Recruiters" },
  { key: "media",     label: "Media" },
];

/** Empty cell. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]"></span>;
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
  const [inviteError, setInviteError] = useState<string | null>(null);
  const {
    errors: inviteErrors, validateAll: validateInvite, revalidate: revalidateInvite,
    reset: resetInviteErrors, invalidProps: inviteInvalidProps,
  } = useFormErrors<"email">(() => {
    const addr = inviteEmail.trim().toLowerCase();
    return collectErrors({
      email:
        check(
          inviteEmail,
          required("Enter your teammate's work email, like name@company.com."),
          email("Enter your teammate's work email, like name@company.com."),
          maxLen(LIMITS.email),
        ) ??
        (users.some((u) => u.email.toLowerCase() === addr)
          ? "Someone with this email already has an account. Change their role from the list instead."
          : undefined),
    });
  }, { email: "inviteEmail" });

  const openInvite = () => {
    setInviteEmail("");
    setInviteRole("recruiter");
    setInviteError(null);
    resetInviteErrors();
    setShowInviteModal(true);
  };

  const closeInvite = () => {
    setShowInviteModal(false);
    setInviteEmail("");
  };

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
      console.error("Failed to load users:", err);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Which row's switch is mid-flight, so only that one shows the spinner. */
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviting) return;
    setInviteError(null);
    if (!validateInvite()) return;
    setInviting(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The invite could not be sent. Check your connection and try again.");
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("recruiter");
      fetchUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "The invite could not be sent. Check your connection and try again.");
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

  // Deactivation has an exact inverse, so it's undoable from the toast rather than confirmed. Delete keeps its dialog.
  const setStatus = async (user: User, next: "active" | "inactive") => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update status");
    setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: next } : u)));
  };

  const handleToggleStatus = async (user: User) => {
    const next = user.status === "active" ? "inactive" : "active";
    const previous = user.status as "active" | "inactive";
    setTogglingId(user.id);
    try {
      await setStatus(user, next);
      const who = user.name || user.email;
      undoable({
        message: next === "inactive"
          ? `${who} can no longer sign in`
          : `${who} can sign in again`,
        undo: () => setStatus(user, previous),
        undoErrorMessage: "Couldn't undo that - the account status is unchanged from the new value.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingId(null);
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
            className="-ml-1 inline-flex items-center gap-1 rounded-full py-0.5 pl-1 pr-1.5 transition-colors duration-150 hover:bg-[var(--adm-surface-2)]"
          >
            <StatusBadge tone={meta.tone} label={meta.label} size="md" />
            <ChevronDown className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" />
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
          <AccountState
            status={u.status}
            label={meta.label}
            tone={meta.tone}
            busy={togglingId === u.id}
            onToggle={() => void handleToggleStatus(u)}
          />
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
        ? <span className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(u.createdAt)}</span>
        : <Blank />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: u => (
        <button
          type="button"
          onClick={() => { setUserToDelete(u.id); setShowDeleteModal(true); }}
          aria-label={`Delete ${u.name || u.email}`}
          title="Delete"
          className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
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
      <AdminCard className="w-full max-w-md">
        <EmptyState
          variant="error"
          title="Couldn't load users"
          description={error}
          action={<WorkspaceButton variant="primary" onClick={fetchUsers}>Try again</WorkspaceButton>}
        />
      </AdminCard>
    </div>
  );

  return (
    <>
      <WorkspaceTitle
        title="Users & access"
        actions={
          <>
            <WorkspaceButton asChild>
              <Link href="/admin/roles">
                <IconShield className="h-4 w-4" />Roles
              </Link>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={openInvite}>
              <IconUserPlus className="h-4 w-4" />Invite user
            </WorkspaceButton>
          </>
        }
      />
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
              <WorkspaceButton variant="primary" onClick={openInvite}>
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

      {showInviteModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
        >
          {/* Bounded, middle scrolls: the role list outgrows a laptop viewport. */}
          <form onSubmit={handleInvite} onBlur={revalidateInvite} noValidate className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
              <h2 id="invite-title" className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Invite a teammate</h2>
              <button
                type="button"
                onClick={closeInvite}
                aria-label="Close"
                className="grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <FormErrorBanner message={inviteError} onDismiss={() => setInviteError(null)} />
              <Field
                label="Email address"
                htmlFor="inviteEmail"
                required
                error={inviteErrors.email}
                helper="We'll email them an invite with a temporary password. They set their name, phone, and password on first sign-in."
              >
                <FormInput
                  id="inviteEmail" type="email" required autoFocus autoComplete="off" value={inviteEmail}
                  {...inviteInvalidProps("email")}
                  onChange={e => setInviteEmail(e.target.value)} placeholder="teammate@oceanbluecorp.com"
                />
              </Field>

              <fieldset>
                <legend className="mb-2 text-[14px] font-medium text-[var(--adm-ink-mute)]">Role</legend>
                <div className="space-y-2">
                  {ROLE_ORDER.map(role => {
                    const meta = ROLE_META[role];
                    const selected = inviteRole === role;
                    return (
                      <label
                        key={role}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[12px] border p-3 transition-colors duration-150",
                          selected
                            ? "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]"
                            : "border-[var(--adm-line)] hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]",
                        )}
                      >
                        <input
                          type="radio" name="inviteRole" value={role} checked={selected}
                          onChange={() => setInviteRole(role)}
                          className="mt-0.5 h-4 w-4 flex-none accent-[var(--adm-accent)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-[var(--adm-ink)]">{meta.label}</span>
                          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">{meta.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="flex flex-none flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              <WorkspaceButton onClick={closeInvite} className="w-full sm:w-auto">
                Cancel
              </WorkspaceButton>
              <WorkspaceButton type="submit" variant="primary" disabled={inviting} className="w-full sm:w-auto">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <IconSend className="h-4 w-4" aria-hidden="true" />}
                {inviting ? "Sending invite" : "Send invite"}
              </WorkspaceButton>
            </div>
          </form>
        </div>
      )}

      {showRoleModal && userToEdit && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-title"
        >
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={userToEdit.name} email={userToEdit.email} size="md" />
                <div className="min-w-0">
                  <h2 id="role-title" className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Change role</h2>
                  <p className="truncate text-[13px] text-[var(--adm-ink-mute)]">{userToEdit.name || "Unnamed"} · {userToEdit.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }}
                aria-label="Close"
                className="grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div role="radiogroup" aria-labelledby="role-title" className="space-y-2">
                {ROLE_ORDER.map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta.icon;
                  const selected = newRole === role;
                  const current = userToEdit.role === role;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={role}
                      onClick={() => setNewRole(role)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[12px] border p-3 text-left transition-colors duration-150",
                        selected
                          ? "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]"
                          : "border-[var(--adm-line)] hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]",
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 flex-none", selected ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-[var(--adm-ink)]">{meta.label}</span>
                          {current && <StatusBadge tone="slate" label="Current" />}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">{meta.desc}</span>
                      </span>
                      <span className={cn(
                        "mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition-colors",
                        selected ? "border-[var(--adm-accent)] bg-[var(--adm-accent)]" : "border-[var(--adm-line-strong)]",
                      )}>
                        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-none flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              <WorkspaceButton onClick={() => { setShowRoleModal(false); setUserToEdit(null); setNewRole(""); }} className="w-full sm:w-auto">
                Cancel
              </WorkspaceButton>
              <WorkspaceButton
                variant="primary"
                onClick={handleUpdateRole}
                disabled={updating || newRole === userToEdit.role || !newRole}
                className="w-full sm:w-auto"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}Save role
              </WorkspaceButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteModal}
        title="Delete this user?"
        body="Their account and access are removed permanently. This cannot be undone."
        confirmLabel="Delete user"
        busy={updating}
        onCancel={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        onConfirm={handleDeleteUser}
      />
    </>
  );
}
