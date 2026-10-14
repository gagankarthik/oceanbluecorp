"use client";

import { useMemo, useState } from "react";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { check, collectErrors, email, LIMITS, maxLen, required } from "@/lib/form-validation";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/hooks/use-resource";
import { USERS_KEY } from "@/hooks/use-console-data";
import DataTable, { type Column, type Filter } from "@/components/portal/DataTable";
import Icon, { type IconName } from "@/components/portal/icons";
import Select, { type SelectOption } from "@/components/portal/Select";
import { RoleGate, useSession } from "@/components/portal/session";
import { BarChart, DonutChart } from "@/components/portal/charts";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  deleteConfirmText,
  EmptyState,
  ErrorState,
  InsightsSheet,
  KpiRow,
  KpiRowSkeleton,
  Modal,
  Page,
  PageHeader,
  Panel,
  StatCard,
  TableSkeleton,
  type Tone,
} from "@/components/portal/kit";
import { Facts, Field, FormError, GoneNotice, InlineDelete, SegmentChips, ViewTabs, errorText, inputCls, send, useToast } from "@/components/portal/relationships/shared";
import { canAccess, nav, roles, type Role } from "@/lib/portal/roles";
import type { MenuEntry } from "@/components/portal/records/Menu";

/** Cognito role names, as /api/users returns them. Media is the portal's marketing role. */
type StaffRole = "admin" | "hr" | "sales" | "recruiter" | "media";
type Status = "active" | "inactive" | "pending";
type User = {
  id: string;
  sub?: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole | null;
  status: Status;
  groups?: string[];
  createdAt: string;
  lastModified?: string;
  enabled?: boolean;
};
type Tab = "users" | "roles";
type Focus = "pending" | "inactive" | "norole" | null;

const ROLE_ORDER: StaffRole[] = ["admin", "hr", "sales", "recruiter", "media"];
const PORTAL: Record<StaffRole, Role> = { admin: "admin", hr: "hr", sales: "sales", recruiter: "recruiter", media: "marketing" };
const roleTone: Record<StaffRole, Tone> = { admin: "navy", hr: "cyan", recruiter: "blue", sales: "amber", media: "green" };
const roleIcon: Record<StaffRole, IconName> = { admin: "key", hr: "userCheck", recruiter: "briefcase", sales: "dollar", media: "megaphone" };
const roleLabel = (r: StaffRole | null) => (r ? roles[PORTAL[r]].label : "No role");
const ELEVATED: StaffRole[] = ["admin", "hr"];

// Inactive is a deliberate choice, not an error: grey, never red.
const STATUS: Record<Status, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "green" },
  pending: { label: "Invited", tone: "amber" },
  inactive: { label: "Inactive", tone: "grey" },
};

const FOCUS: Record<Exclude<Focus, null>, { label: string; match: (u: User) => boolean }> = {
  pending: { label: "Invited, awaiting first sign-in", match: (u) => u.status === "pending" },
  inactive: { label: "Sign-in turned off", match: (u) => u.status === "inactive" },
  norole: { label: "Without a role", match: (u) => !u.role },
};

const roleOptions = (allowed: StaffRole[]): SelectOption[] =>
  allowed.map((r) => ({ value: r, label: roles[PORTAL[r]].label, description: roles[PORTAL[r]].description, icon: roleIcon[r] }));

function RoleBadge({ role }: { role: StaffRole | null }) {
  return <Badge tone={role ? roleTone[role] : "grey"}>{roleLabel(role)}</Badge>;
}

function StatusChip({ status }: { status: Status }) {
  const m = STATUS[status] ?? STATUS.pending;
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** StatCard that filters the table; pressed state rings it. */
function KpiToggle({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`block w-full rounded-xl text-left transition-shadow duration-150 hover:shadow-md ${active ? "ring-2 ring-ocean-600 ring-offset-2 ring-offset-mist-50" : ""}`}
    >
      {children}
    </button>
  );
}

function UserDetail({
  u,
  isSelf,
  canManage,
  allowedRoles,
  onRole,
  onStatus,
  onDelete,
}: {
  u: User;
  isSelf: boolean;
  canManage: boolean;
  allowedRoles: StaffRole[];
  onRole: (r: StaffRole) => Promise<void>;
  onStatus: (s: "active" | "inactive") => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [role, setRole] = useState<string>(u.role ?? "");
  const [busy, setBusy] = useState<"role" | "status" | "delete" | null>(null);
  const run = (kind: "role" | "status" | "delete", fn: () => Promise<void>) => {
    setBusy(kind);
    void fn().finally(() => setBusy(null));
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={u.name || u.email} size="lg" />
        <div className="min-w-0">
          <p className="text-adm-md font-semibold text-navy-900">
            {u.name || "Unnamed"}
            {isSelf && <span className="ml-2 text-adm-base font-normal text-mist-600">(you)</span>}
          </p>
          <p className="truncate text-adm-base text-mist-600">{u.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <RoleBadge role={u.role} />
            <StatusChip status={u.status} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button href={`mailto:${u.email}`} variant="secondary" icon="mail">
          Email
        </Button>
        {u.phone && (
          <Button href={`tel:${u.phone.replace(/[^\d+]/g, "")}`} variant="secondary" icon="phone">
            Call
          </Button>
        )}
      </div>

      <Facts
        items={[
          ["Email", u.email],
          ["Phone", u.phone],
          ["Joined", fmtDate(u.createdAt)],
          ["Last changed", u.lastModified ? fmtDateTime(u.lastModified) : undefined],
        ]}
      />

      <section className="rounded-xl ring-1 ring-mist-200">
        <h3 className="border-b border-mist-200 px-4 py-3 text-adm-base font-semibold">Access</h3>
        <div className="grid gap-4 p-4">
          {!canManage && (
            <p className="flex items-start gap-2 rounded-lg bg-mist-50 px-3 py-2.5 text-adm-base text-mist-700">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-mist-500" />
              {isSelf ? "You can't change your own account here." : "Only an administrator can change an Admin or HR account."}
            </p>
          )}
          <div className="text-adm-base font-medium">
            <p className="mb-1.5">Role</p>
            {canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 sm:flex-none">
                  <Select
                    label="Role"
                    showLabel={false}
                    variant="field"
                    width="w-full sm:w-80"
                    value={role}
                    onChange={setRole}
                    options={[...(u.role ? [] : [{ value: "", label: "No role" }]), ...roleOptions(allowedRoles)]}
                  />
                </div>
                <Button disabled={!role || role === u.role} loading={busy === "role"} onClick={() => run("role", () => onRole(role as StaffRole))}>
                  Save role
                </Button>
              </div>
            ) : (
              <p className="flex h-10 items-center rounded-lg bg-mist-100 px-3 text-adm-base font-medium text-mist-700">{roleLabel(u.role)}</p>
            )}
          </div>
          {canManage && u.status !== "pending" && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 pt-4">
              <p className="text-adm-base text-mist-700">{u.status === "active" ? "This person can sign in." : "Sign-in is turned off for this account."}</p>
              {u.status === "active" ? (
                <Button variant="secondary" icon="x" loading={busy === "status"} onClick={() => run("status", () => onStatus("inactive"))}>
                  Deactivate
                </Button>
              ) : (
                <Button variant="secondary" icon="check" loading={busy === "status"} onClick={() => run("status", () => onStatus("active"))}>
                  Reactivate
                </Button>
              )}
            </div>
          )}
          {u.status === "pending" && (
            <p className="border-t border-mist-200 pt-4 text-adm-base text-mist-600">Invite sent. They finish setting up the account on first sign-in.</p>
          )}
        </div>
      </section>

      {canManage && (
        <div className="border-t border-mist-200 pt-5">
          <InlineDelete label="Delete user" warning="Their account and access are removed permanently. This cannot be undone." busy={busy === "delete"} onConfirm={() => run("delete", onDelete)} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Roles & permissions                                                 */
/* ------------------------------------------------------------------ */

const ROLE_KEYS = Object.keys(roles) as Role[];

// Screens outside the sidebar that still have their own access rule.
const ACCOUNT_GROUP = {
  title: "Account & reference",
  items: [
    { href: "/portal/settings", label: "Settings", icon: "settings" as IconName },
    { href: "/portal/notifications", label: "Notifications", icon: "bell" as IconName },
    { href: "/portal/help", label: "Help", icon: "help" as IconName },
    { href: "/portal/docs", label: "Docs", icon: "code" as IconName },
  ],
};
const MATRIX = [...nav, ACCOUNT_GROUP];
const SCREENS = MATRIX.flatMap((g) => g.items);

// What the matrix can't show: rules inside a screen. Mirrors lib/auth/config and the API guards.
const DATA_RULES: { icon: IconName; title: string; body: string }[] = [
  { icon: "megaphone", title: "Media writes postings it cannot price", body: "Media creates and edits job postings, but never sees or sets bill rate, pay rate, client, vendor, recruitment manager or assignees. It has no candidate, application or resume data." },
  { icon: "briefcase", title: "Recruiters read postings", body: "Recruiters open every posting but cannot create or edit one. Sales, HR, Admin and Media can." },
  { icon: "trash", title: "Deleting a posting is a recruiting call", body: "Only Admin, HR, Recruiter and Sales can delete a posting, because it removes the applications attached to it." },
  { icon: "shield", title: "Only an Admin grants Admin or HR", body: "HR invites teammates and manages Sales, Recruiter and Media accounts. Changing, deactivating or deleting an Admin or HR account takes an Admin." },
  { icon: "userCheck", title: "Nobody edits their own access", body: "Your own role and sign-in can't be changed from Users. Ask another Admin." },
  { icon: "bell", title: "Notifications follow the data", body: "Contact enquiries reach Admin and HR. Applications and tasks reach recruiting roles. Deleted-application alerts reach Admins only." },
  { icon: "settings", title: "System settings are Admin only", body: "Every role edits its own profile and password. Maintenance mode, site content, API keys and docs are Admin only." },
];

function RolesPanel() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {ROLE_KEYS.map((r) => {
          const n = SCREENS.filter((s) => canAccess(r, s.href)).length;
          return (
            <div key={r} className="flex min-w-0 flex-col gap-2 rounded-xl bg-mist-0 p-5 ring-1 ring-mist-200">
              <p className="text-adm-base font-semibold text-navy-900">{roles[r].label}</p>
              <p className="text-adm-base tabular-nums text-mist-600">
                <span className="text-adm-lg font-semibold text-navy-900">{n}</span> of {SCREENS.length} screens
              </p>
              <p className="text-adm-base leading-snug text-mist-600">{roles[r].description}</p>
            </div>
          );
        })}
      </div>

      <Panel title="Who can open each screen" description="Read from the same access rules the portal enforces. Change a teammate's role from the Users tab." padded={false}>
        <div className="scroll-thin overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[36rem] border-collapse text-adm-base">
            <thead>
              <tr className="border-b border-mist-200 bg-mist-50 text-adm-xs text-mist-600">
                <th scope="col" className="px-4 py-3 text-left font-medium">
                  Screen
                </th>
                {ROLE_KEYS.map((r) => (
                  <th key={r} scope="col" className="px-3 py-3 text-center font-medium">
                    {roles[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((g) => (
                <PermGroup key={g.title} title={g.title} items={g.items} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Rules inside a screen" description="What a role can see or change once it is in.">
        <ul className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {DATA_RULES.map((d) => (
            <li key={d.title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ocean-50 text-ocean-700">
                <Icon name={d.icon} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-adm-base font-semibold text-navy-900">{d.title}</span>
                <span className="mt-0.5 block text-adm-base leading-normal text-mist-600">{d.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function PermGroup({ title, items }: { title: string; items: { href: string; label: string; icon: IconName }[] }) {
  return (
    <>
      <tr className="bg-mist-50/60">
        <th colSpan={ROLE_KEYS.length + 1} scope="colgroup" className="px-4 pb-1.5 pt-3 text-left text-adm-xs font-semibold uppercase tracking-[0.08em] text-mist-600">
          {title}
        </th>
      </tr>
      {items.map((i) => (
        <tr key={i.href} className="border-b border-mist-100">
          <th scope="row" className="px-4 py-2.5 text-left font-normal">
            <span className="flex items-center gap-2">
              <Icon name={i.icon} className="size-4 text-mist-500" />
              {i.label}
            </span>
          </th>
          {ROLE_KEYS.map((r) => (
            <td key={r} className="px-3 py-2.5 text-center">
              {canAccess(r, i.href) ? (
                <span className="inline-grid size-6 place-items-center rounded-full bg-status-success-soft text-status-success">
                  <Icon name="check" className="size-3.5" title={`${roles[r].label} can open ${i.label}`} />
                </span>
              ) : (
                <span className="inline-grid size-6 place-items-center text-mist-300">
                  <Icon name="x" className="size-3.5" title={`${roles[r].label} cannot open ${i.label}`} />
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Invite                                                              */
/* ------------------------------------------------------------------ */

function InviteForm({ existing, allowedRoles, onClose, onSent }: { existing: User[]; allowedRoles: StaffRole[]; onClose: () => void; onSent: (email: string) => void }) {
  const [addr, setAddr] = useState("");
  const [role, setRole] = useState<StaffRole>("recruiter");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sending) return;
    const value = addr.trim().toLowerCase();
    const msg = "Enter your teammate's work email, like name@company.com.";
    const err =
      collectErrors({ email: check(addr, required(msg), email(msg), maxLen(LIMITS.email)) }).email ??
      (existing.some((u) => u.email.toLowerCase() === value) ? "Someone with this email already has an account. Change their role from the list instead." : undefined);
    setFieldError(err);
    if (err) return;
    setSending(true);
    setError(null);
    try {
      await send("/api/users/invite", "POST", { email: addr.trim(), role });
      onSent(addr.trim());
    } catch (x) {
      setError(errorText(x, "The invite could not be sent. Try again."));
      setSending(false);
    }
  };

  return (
    <Modal
      title="Invite a teammate"
      description="They get an email with a temporary password."
      onClose={() => !sending && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button type="submit" icon="send" loading={sending} onClick={() => void submit()}>
            Send invite
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormError message={error} />
        <Field label="Work email" required error={fieldError} hint="They set their name, phone and password on first sign-in.">
          <input type="email" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="name@oceanbluecorp.com" aria-invalid={!!fieldError || undefined} className={inputCls} autoComplete="off" autoFocus />
        </Field>
        <div className="text-adm-base font-medium">
          <p className="mb-1.5">
            Role <span className="text-status-danger">*</span>
          </p>
          <Select label="Role" value={role} onChange={(v) => setRole(v as StaffRole)} options={roleOptions(allowedRoles)} width="w-full" variant="field" showLabel={false} />
          {allowedRoles.length < ROLE_ORDER.length && <p className="mt-1 text-adm-xs font-normal text-mist-600">Only an administrator can grant Admin or HR.</p>}
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function UsersView({ initialTab = "users" }: { initialTab?: Tab }) {
  const { realRole } = useSession();
  const { user: me } = useAuth();
  const isAdmin = realRole === "admin";
  // HR manages ordinary accounts; granting or touching Admin/HR stays with admins (denyElevatedAction).
  const allowedRoles = isAdmin ? ROLE_ORDER : ROLE_ORDER.filter((r) => !ELEVATED.includes(r));

  const { data, error, isLoading, isValidating, reload, setData } = useResource<{ users?: User[] }>(USERS_KEY, { freshMs: 5 * 60_000 });
  const users = useMemo(() => data?.users ?? [], [data]);
  const [tabState, setTabState] = useState<Tab>(initialTab);
  const tab: Tab = isAdmin ? tabState : "users";
  const [roleFilter, setRoleFilter] = useState("All");
  const [focus, setFocus] = useState<Focus>(null);
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const switchTab = (t: Tab) => {
    setTabState(t);
    try {
      const url = new URL(window.location.href);
      if (t === "users") url.searchParams.delete("tab");
      else url.searchParams.set("tab", t);
      window.history.replaceState(null, "", url);
    } catch {}
  };

  const isSelf = (u: User) => !!me && (u.sub === me.id || u.id === me.id || u.email.toLowerCase() === me.email?.toLowerCase());
  const canManage = (u: User) => !isSelf(u) && (isAdmin || !u.role || !ELEVATED.includes(u.role));

  const patchLocal = (id: string, p: Partial<User>) => setData((d) => ({ ...d, users: (d?.users ?? []).map((u) => (u.id === id ? { ...u, ...p } : u)) }));

  const changeRole = async (u: User, role: StaffRole) => {
    try {
      await send(`/api/users/${u.id}`, "PATCH", { role });
      patchLocal(u.id, { role });
      toast.show(`${u.name || u.email} is now ${roleLabel(role)}`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't change the role. Try again."));
    }
  };

  const setStatus = async (u: User, status: "active" | "inactive", undoable = true) => {
    try {
      await send(`/api/users/${u.id}`, "PATCH", { status });
      patchLocal(u.id, { status });
      const who = u.name || u.email;
      const msg = status === "inactive" ? `${who} can no longer sign in` : `${who} can sign in again`;
      if (undoable) toast.notify(msg, { undo: () => void setStatus({ ...u, status }, u.status === "inactive" ? "inactive" : "active", false) });
      else toast.show(msg);
    } catch (e) {
      toast.error(errorText(e, "Couldn't update the account. Try again."));
    }
  };

  const remove = async (u: User) => {
    try {
      await send(`/api/users/${u.id}`, "DELETE");
      setData((d) => ({ ...d, users: (d?.users ?? []).filter((x) => x.id !== u.id) }));
      toast.show(`${u.name || u.email} deleted`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't delete the user. Try again."));
    }
  };

  // Same self-account and Admin/HR rules as the detail sheet.
  const rowMenu = (u: User, openDetail: () => void): MenuEntry[] => {
    const items: MenuEntry[] = [{ label: "Open", icon: "eye", onSelect: openDetail }];
    if (!canManage(u)) return items;
    items.push(
      { kind: "separator" },
      { kind: "label", label: "Change role" },
      ...allowedRoles.map((r): MenuEntry => ({ label: roleLabel(r), checked: u.role === r, onSelect: () => void (u.role !== r && changeRole(u, r)) })),
    );
    items.push({ kind: "separator" });
    if (u.status === "active") items.push({ label: "Deactivate", icon: "x", onSelect: () => void setStatus(u, "inactive") });
    else if (u.status === "inactive") items.push({ label: "Reactivate", icon: "check", onSelect: () => void setStatus(u, "active") });
    items.push({ label: "Delete", icon: "trash", danger: true, onSelect: () => setConfirmDelete(u) });
    return items;
  };

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const count = (s: Status) => users.filter((u) => u.status === s).length;
  const noRole = users.filter((u) => !u.role).length;
  const byRole = [...ROLE_ORDER.map((r) => ({ label: roleLabel(r), value: users.filter((u) => u.role === r).length })), ...(noRole ? [{ label: "No role", value: noRole }] : [])]
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value);
  const visible = users.filter((u) => (roleFilter === "All" || roleLabel(u.role) === roleFilter) && (!focus || FOCUS[focus].match(u)));
  const toggleFocus = (f: Exclude<Focus, null>) => setFocus((cur) => (cur === f ? null : f));

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      value: (u) => u.name || u.email,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.name || u.email} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {u.name || "Unnamed"}
              {isSelf(u) && <span className="ml-1.5 text-adm-xs font-normal text-mist-600">(you)</span>}
            </span>
            <span className="block max-w-[16rem] truncate text-adm-xs text-mist-600" title={u.email}>
              {u.email}
            </span>
          </span>
        </span>
      ),
    },
    { key: "role", header: "Role", sortable: true, value: (u) => roleLabel(u.role), cell: (u) => <RoleBadge role={u.role} /> },
    { key: "status", header: "Status", sortable: true, align: "center", value: (u) => STATUS[u.status]?.label ?? u.status, cell: (u) => <StatusChip status={u.status} /> },
    { key: "phone", header: "Phone", hideBelow: "xl", value: (u) => u.phone || "" },
    { key: "createdAt", header: "Joined", sortable: true, hideBelow: "lg", value: (u) => new Date(u.createdAt).getTime(), cell: (u) => <span className="tabular-nums text-mist-700">{fmtDate(u.createdAt)}</span> },
    { key: "email", header: "Email", defaultHidden: true, value: (u) => u.email },
  ];

  const filters: Filter<User>[] = [
    { key: "status", label: "Status", options: ["Active", "Invited", "Inactive"], value: (u) => STATUS[u.status]?.label ?? "" },
    { key: "role", label: "Role", options: [...ROLE_ORDER.map(roleLabel), "No role"], value: (u) => roleLabel(u.role) },
  ];

  const loaded = !isLoading && !(error && !data);

  return (
    <RoleGate href="/portal/users">
      <Page>
        <PageHeader
          title="Users"
          icon="shield"
          section="workspace"

          actions={
            <>
              {tab === "users" && loaded && users.length > 0 && (
                <InsightsSheet title="Users insights" description="How accounts split across roles and sign-in status. Pick a role to filter the table.">
                  {(close) => (
                    <>
                      <Panel title="Accounts by role and status">
                        <BarChart
                          title="Accounts per role, split by active, invited and inactive"
                          labels={ROLE_ORDER.map(roleLabel)}
                          series={(["active", "pending", "inactive"] as Status[]).map((s) => ({ name: STATUS[s].label, values: ROLE_ORDER.map((r) => users.filter((u) => u.role === r && u.status === s).length) }))}
                          height={240}
                        />
                      </Panel>
                      <Panel title="Users by role">
                        <div className="grid gap-5">
                          <DonutChart title="Users by role" data={byRole} centerLabel="Users" size={160} />
                          <SegmentChips
                            label="Filter the table by role"
                            items={byRole.map((b) => ({ label: b.label, count: b.value }))}
                            value={roleFilter}
                            onChange={(v) => {
                              setRoleFilter(v);
                              close();
                            }}
                          />
                        </div>
                      </Panel>
                    </>
                  )}
                </InsightsSheet>
              )}
              <Button icon="send" onClick={() => setInviting(true)}>
                Invite user
              </Button>
            </>
          }
          tabs={
            isAdmin ? (
              <ViewTabs
                label="Users views"
                tabs={[
                  { id: "users", label: "Users", count: loaded ? users.length : undefined },
                  { id: "roles", label: "Roles & permissions" },
                ]}
                value={tab}
                onChange={switchTab}
              />
            ) : undefined
          }
        />

        {tab === "roles" ? (
          <RolesPanel />
        ) : isLoading ? (
          <div role="status" aria-label="Loading users" className="grid gap-6">
            <KpiRowSkeleton count={4} />
            <TableSkeleton rows={8} />
          </div>
        ) : error && !data ? (
          <ErrorState title="Couldn't load users" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
        ) : users.length === 0 ? (
          <EmptyState
            framed
            variant="first-use"
            icon="send"
            title="No teammates yet"
            body="Invite a teammate to give them access to the portal."
            primary={{ label: "Invite user", icon: "send", onClick: () => setInviting(true) }}
          />
        ) : (
          <>
            <KpiRow>
              <StatCard section="workspace" label="Active" value={count("active")} icon="userCheck" hint={`of ${users.length} accounts`} trend="flat" />
              <KpiToggle label="Show invited accounts" active={focus === "pending"} onClick={() => toggleFocus("pending")}>
                <StatCard section="workspace" label="Invited" value={count("pending")} icon="send" hint="awaiting first sign-in" trend="flat" />
              </KpiToggle>
              <KpiToggle label="Show inactive accounts" active={focus === "inactive"} onClick={() => toggleFocus("inactive")}>
                <StatCard section="workspace" label="Inactive" value={count("inactive")} icon="x" hint="sign-in turned off" trend="flat" />
              </KpiToggle>
              <KpiToggle label="Show accounts without a role" active={focus === "norole"} onClick={() => toggleFocus("norole")}>
                <StatCard section="workspace" label="Without a role" value={noRole} icon="alert" change={noRole ? "Needs a role" : undefined} hint="can't open any section" trend={noRole ? "down" : "flat"} />
              </KpiToggle>
            </KpiRow>

            {(focus || roleFilter !== "All") && (
              <div className="flex flex-wrap items-center gap-2 text-adm-base">
                <span className="text-mist-600">Showing</span>
                {[focus && { text: FOCUS[focus].label, clear: () => setFocus(null) }, roleFilter !== "All" && { text: roleFilter, clear: () => setRoleFilter("All") }]
                  .filter((c): c is { text: string; clear: () => void } => !!c)
                  .map((c) => (
                    <span key={c.text} className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 py-1 pl-3 pr-1 font-medium text-ocean-800 ring-1 ring-inset ring-ocean-200">
                      {c.text}
                      <button type="button" onClick={c.clear} aria-label={`Clear ${c.text}`} title={`Clear ${c.text}`} className="adm-hit grid size-6 place-items-center rounded-full hover:bg-ocean-100">
                        <Icon name="x" className="size-3.5" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <DataTable
              rows={visible}
              columns={columns}
              filters={filters}
              exportName="users"
              storageKey="portal.users"
              searchPlaceholder="Search name or email"
              emptyTitle="No users match your filters"
              detailTitle={(u) => u.name || u.email}
              rowMenu={rowMenu}
              renderDetail={(r) => {
                const live = users.find((x) => x.id === r.id);
                if (!live) return <GoneNotice noun="user" />;
                return (
                  <UserDetail
                    key={`${live.id}${live.role}${live.status}`}
                    u={live}
                    isSelf={isSelf(live)}
                    canManage={canManage(live)}
                    allowedRoles={allowedRoles}
                    onRole={(role) => changeRole(live, role)}
                    onStatus={(s) => setStatus(live, s)}
                    onDelete={() => remove(live)}
                  />
                );
              }}
            />
          </>
        )}
      </Page>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this user?"
          body={`${confirmDelete.name || confirmDelete.email} loses their account and access permanently. This cannot be undone.`}
          confirmLabel="Delete"
          requireText={deleteConfirmText(confirmDelete.name || confirmDelete.email)}
          busy={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void confirmRemove()}
        />
      )}
      {inviting && (
        <InviteForm
          existing={users}
          allowedRoles={allowedRoles}
          onClose={() => setInviting(false)}
          onSent={(addr) => {
            setInviting(false);
            void reload();
            toast.show(`Invite sent to ${addr}`);
          }}
        />
      )}
    </RoleGate>
  );
}
