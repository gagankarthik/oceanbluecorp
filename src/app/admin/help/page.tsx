"use client";

import * as React from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminDialog } from "@/components/admin/admin-dialog";
import Link from "next/link";
import { Check, ChevronRight, X, Plus, Loader2 } from "lucide-react";
import {
  IconCopy, IconInfo, IconMail, IconPhone, IconEdit, IconTrash,
} from "@/components/admin/icons";
import { ListHeader, ListTabs, ListToolbar } from "@/components/admin/list-shell";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { Avatar } from "@/components/admin/avatar";
import { Kbd } from "@/components/admin/kbd";
import { FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { FieldError, FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, isBlank, maxLen, phone, required } from "@/lib/form-validation";
import { NotePanel, Workspace, WorkspaceButton, WorkspaceSearch } from "@/components/admin/workspace";
import { useAdmin } from "@/components/admin/admin-provider";
import { useAuth, UserRole, JOB_EDIT_ROLES, RECRUITING_ROLES } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/company";

// Directory grouped by what each team handles, so "who do I ask about payroll"
// is one glance at a heading rather than a read of every card.

type Team = "Leadership" | "People & HR" | "Recruiting" | "Sales";

interface TeamMember {
  name: string;
  designation: string;
  email: string;
  phone: string;
  team: Team;
}

const TEAMS: Team[] = ["Leadership", "People & HR", "Recruiting", "Sales"];

/** Built-in seed, shown until Admin/HR save a directory to the content store. */
const DEFAULT_TEAM: TeamMember[] = [
  { name: "Sarojini Gude",       designation: "President",                  email: "sgude@oceanbluecorp.com",    phone: "",                   team: "Leadership"  },
  { name: "Ravi OceanBlue",      designation: "Chief Operating Officer",    email: "ravi@oceanbluecorp.com",     phone: "+1 (614) 352-0189",  team: "Leadership"  },
  { name: "Sushma Moturu",       designation: "Global HR",                  email: "hr@oceanbluecorp.com",       phone: "+1 (614) 352-2777",  team: "People & HR" },
  { name: "Harika Kalam",        designation: "HR Coordinator",             email: "services@oceanbluecorp.com", phone: "+1 (614) 352-2701",  team: "People & HR" },
  { name: "Venky Tadikonda",     designation: "Executive Recruiter",        email: "venky@oceanbluecorp.com",    phone: "+1 (614) 352-2668",  team: "Recruiting"  },
  { name: "Susmitha Pampana",    designation: "Senior Recruiter",           email: "susmitha@oceanbluecorp.com", phone: "+1 (614) 352-2527",  team: "Recruiting"  },
  { name: "Clark A Cristolfoli", designation: "Executive Recruiter",        email: "clark@oceanbluecorp.com",    phone: "+1 (614) 352-2759",  team: "Recruiting"  },
  { name: "Raja Kethineni",      designation: "Executive Recruiter",        email: "raja@oceanbluecorp.com",     phone: "+1 (614) 352-2877",  team: "Recruiting"  },
  { name: "Brent Wallace",       designation: "Sr. Vice President - Sales", email: "bwallace@oceanbluecorp.com", phone: "+1 (614) 352-2701",  team: "Sales"       },
];

/** Group order is seniority-then-function, and doubles as "who to ask first". */
const TEAM_ORDER: { key: Team; blurb: string }[] = [
  { key: "Leadership",  blurb: "Escalations and anything commercial." },
  { key: "People & HR", blurb: "Payroll, benefits, onboarding and policy." },
  { key: "Recruiting",  blurb: "Requisitions, candidates and submissions." },
  { key: "Sales",       blurb: "Client accounts and new business." },
];

// ── copy-to-clipboard ────────────────────────────────────────────────────────

/**
 * Copying an address is the single most common thing anyone does on a
 * directory, and selecting truncated text with a mouse is fiddly. The button
 * confirms in place for ~1.5s rather than firing a toast, so the feedback
 * appears where the eye already is.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard is permission-gated and unavailable over plain http on
          // some hosts. Staying silent is right: the address is still visible
          // and selectable, so there is nothing the user needs to act on.
        }
      }}
      className={cn(
        "grid h-8 w-8 flex-none place-items-center rounded-[var(--adm-radius-control)] transition-colors duration-150",
        copied
          ? "text-[var(--adm-success-ink)]"
          : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <IconCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

/** One contact method, the value is the link, the copy button sits beside it. */
function ContactRow({
  icon: Icon,
  href,
  value,
  label,
  numeric,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  value?: string;
  label: string;
  numeric?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex h-9 items-center gap-2.5 text-adm-xs">
        <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="select-none text-[var(--adm-ink-subtle)]">Not on record</span>
      </div>
    );
  }
  return (
    <div className="group/row flex items-center gap-2.5">
      <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
      <a
        href={href}
        title={value}
        className={cn(
          "min-w-0 flex-1 truncate text-adm-xs text-[var(--adm-ink-mute)] transition-colors duration-150 hover:text-[var(--adm-accent)]",
          numeric && "tabular-nums",
        )}
      >
        {value}
      </a>
      <CopyButton value={value} label={label} />
    </div>
  );
}

/** One person: identity, then each way to reach them with copy beside it. */
function DirectoryRow({ member }: { member: TeamMember }) {
  return (
    <li className="grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-3 transition-colors duration-150 hover:bg-[var(--adm-row-hover)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={member.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-adm-base font-semibold text-[var(--adm-ink)]">{member.name}</p>
          <p className="truncate text-adm-xs text-[var(--adm-ink-subtle)]">{member.designation || "No title on record"}</p>
        </div>
      </div>
      <div className="min-w-0 pl-11 md:pl-0">
        <ContactRow icon={IconMail} href={`mailto:${member.email}`} value={member.email} label="email address" />
      </div>
      <div className="min-w-0 pl-11 md:pl-0">
        <ContactRow
          icon={IconPhone}
          href={member.phone ? `tel:${member.phone.replace(/[^+\d]/g, "")}` : undefined}
          value={member.phone}
          label="phone number"
          numeric
        />
      </div>
    </li>
  );
}

// ── directory editor (Admin / HR) ────────────────────────────────────────────

/** Modal for Admin/HR to add, edit and remove directory people. Saves the whole
 *  list to the content store via /api/help/directory. */
function DirectoryEditor({
  initial, onClose, onSaved,
}: {
  initial: TeamMember[];
  onClose: () => void;
  onSaved: (members: TeamMember[]) => void;
}) {
  const { user } = useAuth();
  const [rows, setRows] = React.useState<TeamMember[]>(initial.length ? initial : DEFAULT_TEAM);
  const [saving, setSaving] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [baseline] = React.useState(rows);
  const requestClose = () => {
    if (!saving && JSON.stringify(rows) !== JSON.stringify(baseline)) setConfirmDiscard(true);
    else onClose();
  };

  // Keys are the control ids (`dir-${row}-${field}`) so the hook can focus them. Fully blank
  // rows are dropped on save, so they are never flagged. Limits match the API's truncation.
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors<string>(() => {
    const out: Record<string, string | undefined> = {};
    rows.forEach((m, i) => {
      if (isBlank(m.name) && isBlank(m.email) && isBlank(m.designation) && isBlank(m.phone)) return;
      out[`dir-${i}-name`] = check(m.name, required("Enter this person's name, or remove the row."), maxLen(120));
      out[`dir-${i}-designation`] = check(m.designation, maxLen(120));
      out[`dir-${i}-email`] = check(m.email, email("Enter an email like name@oceanbluecorp.com."), maxLen(160));
      out[`dir-${i}-phone`] = check(m.phone, phone(), maxLen(40));
    });
    return collectErrors(out);
  });

  // Removing a row shifts every index after it, so re-run the checks.
  React.useEffect(() => { revalidate(); }, [rows.length, revalidate]);

  const update = (i: number, patch: Partial<TeamMember>) =>
    setRows((r) => r.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((r) => [...r, { name: "", designation: "", email: "", phone: "", team: "Recruiting" }]);

  const save = async () => {
    if (saving) return;
    if (!validateAll()) return;
    const cleaned = rows
      .map((m) => ({ ...m, name: m.name.trim(), email: m.email.trim() }))
      .filter((m) => m.name || m.email);
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/help/directory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: cleaned, updatedByName: user?.name }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "The directory could not be saved. Try again in a moment.");
      }
      onSaved(cleaned);
      toast.success("Directory updated");
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "The directory could not be saved. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminDialog
        open
        onOpenChange={(next) => { if (!next) requestClose(); }}
        title="Edit directory"
        description="Add, edit or remove the people shown on the Help page."
        size="xl"
        busy={saving}
        footer={
          <>
            <WorkspaceButton onClick={requestClose}>Cancel</WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save directory
            </WorkspaceButton>
          </>
        }
      >
        <div className="space-y-3" onBlur={revalidate}>
          <FormErrorBanner message={serverError} onDismiss={() => setServerError(null)} />
          {rows.map((m, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-center gap-2 rounded-[var(--adm-radius-card)] border border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] p-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
            >
              {([
                ["name", "Name", "text"],
                ["designation", "Title", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
              ] as const).map(([field, label, type]) => {
                const key = `dir-${i}-${field}`;
                return (
                  <div key={field} className="min-w-0">
                    <FormInput
                      id={key}
                      type={type}
                      aria-label={label}
                      placeholder={label}
                      value={m[field]}
                      onChange={(e) => update(i, { [field]: e.target.value })}
                      {...invalidProps(key)}
                    />
                    <FieldError id={`${key}-error`}>{errors[key]}</FieldError>
                  </div>
                );
              })}
              <FormSelect
                value={m.team}
                onChange={(e) => update(i, { team: e.target.value as Team })}
                aria-label="Team"
              >
                {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </FormSelect>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${m.name || "person"}`}
                className="grid h-8 w-8 flex-none place-items-center justify-self-end rounded-[var(--adm-radius-control)] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
          <WorkspaceButton onClick={add}>
            <Plus className="h-4 w-4" /> Add person
          </WorkspaceButton>
        </div>
      </AdminDialog>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        body="Your edits to the directory have not been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

type TeamFilter = Team | "all";

export default function HelpPage() {
  const { openCommandPalette } = useAdmin();
  const { user, hasAnyRole } = useAuth();
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;
  const isAdmin = user?.role === UserRole.ADMIN;

  const [members, setMembers] = React.useState<TeamMember[]>(DEFAULT_TEAM);
  const [editing, setEditing] = React.useState(false);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [team, setTeam] = React.useState<TeamFilter>("all");

  // Stored directory, falling back to the built-in list until one is saved.
  React.useEffect(() => {
    let alive = true;
    fetch("/api/help/directory")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (alive && d && Array.isArray(d.members) && d.members.length) setMembers(d.members);
      })
      .catch(() => { if (alive) setLoadFailed(true); });
    return () => { alive = false; };
  }, []);

  const q = query.trim().toLowerCase();
  const searched = React.useMemo(
    () =>
      !q
        ? members
        : members.filter((m) =>
            [m.name, m.designation, m.email, m.team].some((f) => f.toLowerCase().includes(q)),
          ),
    [q, members],
  );

  const groups = TEAM_ORDER
    .filter((t) => team === "all" || t.key === team)
    .map((t) => ({ ...t, people: searched.filter((m) => m.team === t.key) }))
    .filter((g) => g.people.length > 0);

  // What people come to Help to do, each offered only to roles that can do it.
  const tasks = [
    { label: "Post a job", hint: "State or open role", href: "/admin/jobs/new?category=state", show: hasAnyRole(JOB_EDIT_ROLES) },
    { label: "Add an applicant", hint: "Upload a resume or type it in", href: "/admin/applications/new", show: hasAnyRole(RECRUITING_ROLES) },
    { label: "Change your password", hint: "Profile and security", href: "/admin/settings", show: true },
    { label: "Developer docs", hint: "Routes and API reference", href: "/admin/docs", show: isAdmin },
  ].filter((t) => t.show);

  return (
    <div className="pb-10">
      <ListHeader
        title="Help"
        meta="Who to reach at Oceanblue, and how to get things done in the console."
        actions={canEdit ? (
          <WorkspaceButton onClick={() => setEditing(true)}>
            <IconEdit aria-hidden="true" />Edit directory
          </WorkspaceButton>
        ) : undefined}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
        {/* Directory: the main thing people look up here. */}
        <section aria-labelledby="directory-title" className="min-w-0 space-y-3">
          {loadFailed && (
            <NotePanel className="flex items-start gap-2.5">
              <IconInfo className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
              The saved directory could not be loaded, so this is the built-in list and may be out of date. Refresh to try again.
            </NotePanel>
          )}
          <Workspace className="min-h-0">
            <h2 id="directory-title" className="sr-only">Team directory</h2>
            <ListToolbar
              tabs={
                <ListTabs
                  label="Team"
                  value={team}
                  onChange={setTeam}
                  tabs={[
                    { key: "all" as TeamFilter, label: "All", count: searched.length },
                    ...TEAM_ORDER.map((t) => ({
                      key: t.key as TeamFilter,
                      label: t.key,
                      count: searched.filter((m) => m.team === t.key).length,
                    })),
                  ]}
                />
              }
              search={<WorkspaceSearch value={query} onChange={setQuery} placeholder="Find a person, role or team" />}
            />

            {groups.length === 0 ? (
              <EmptyState
                variant="filtered"
                title={q ? `No one matches “${query}”` : "No one in this team yet"}
                description={q ? "Try a name, a role, or a team like “recruiting”." : "Pick another team, or add people with Edit directory."}
                action={
                  <WorkspaceButton onClick={() => { setQuery(""); setTeam("all"); }}>
                    <X aria-hidden="true" />Show everyone
                  </WorkspaceButton>
                }
              />
            ) : (
              <div>
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-x-4 border-b border-[var(--adm-line)] bg-[var(--adm-head)] px-4 py-2.5 text-adm-xs font-semibold uppercase tracking-[0.05em] text-[var(--adm-head-ink)] md:grid">
                  <span>Person</span>
                  <span>Email</span>
                  <span>Phone</span>
                </div>
                {groups.map((group) => (
                  <section key={group.key} aria-labelledby={`team-${group.key}`}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-2">
                      <h3 id={`team-${group.key}`} className="text-adm-xs font-semibold text-[var(--adm-ink)]">{group.key}</h3>
                      <span className="text-adm-xs tabular-nums text-[var(--adm-ink-mute)]">{group.people.length}</span>
                      <span className="text-adm-xs text-[var(--adm-ink-mute)]">· {group.blurb}</span>
                    </div>
                    <ul className="divide-y divide-[var(--adm-line-soft)] border-b border-[var(--adm-line-soft)] last:border-0">
                      {group.people.map((member) => (
                        <DirectoryRow key={member.email + member.name} member={member} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Workspace>
        </section>

        {/* Rail: how to reach the company, and the common jobs, beside the people. */}
        <aside className="space-y-4 lg:sticky lg:top-0">
          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Get in touch" />
            <ul className="divide-y divide-[var(--adm-line-soft)]">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={RAIL_LINK}>
                  <IconMail className="h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--adm-ink)]">Email the team</span>
                    <span className="block truncate text-adm-xs text-[var(--adm-ink-mute)]">{CONTACT_EMAIL}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={CONTACT_PHONE.href} className={RAIL_LINK}>
                  <IconPhone className="h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--adm-ink)]">Call the office</span>
                    <span className="block text-adm-xs tabular-nums text-[var(--adm-ink-mute)]">{CONTACT_PHONE.label}</span>
                  </span>
                </a>
              </li>
            </ul>
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Common tasks" />
            <ul className="divide-y divide-[var(--adm-line-soft)]">
              {tasks.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className={RAIL_LINK}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-[var(--adm-ink)]">{t.label}</span>
                      <span className="block truncate text-adm-xs text-[var(--adm-ink-mute)]">{t.hint}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={openCommandPalette} className={cn(RAIL_LINK, "w-full text-left")}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--adm-ink)]">Find anything</span>
                    <span className="block text-adm-xs text-[var(--adm-ink-mute)]">Jobs, people and screens</span>
                  </span>
                  <span className="flex flex-none items-center gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
                </button>
              </li>
            </ul>
          </AdminCard>
        </aside>
      </div>

      {editing && canEdit && (
        <DirectoryEditor
          initial={members}
          onClose={() => setEditing(false)}
          onSaved={setMembers}
        />
      )}
    </div>
  );
}

/** A full-width row link in a rail card: one 48px target per action. */
const RAIL_LINK =
  "flex min-h-12 items-center gap-3 px-4 py-2.5 text-adm-base transition-colors duration-150 hover:bg-[var(--adm-row-hover)]";
