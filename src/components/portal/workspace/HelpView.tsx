"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, isBlank, maxLen, phone, required } from "@/lib/form-validation";
import { useAuth, UserRole } from "@/lib/auth";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/company";
import { hrPortalUrl } from "@/lib/site-content";
import Icon, { type IconName } from "@/components/portal/icons";
import { TableTabs } from "@/components/portal/DataTable";
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Modal, Page, PageHeader, Skeleton } from "@/components/portal/kit";
import { FormError, inputCls, useToast } from "@/components/portal/relationships/shared";

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
  { name: "Sarojini Gude", designation: "President", email: "sgude@oceanbluecorp.com", phone: "", team: "Leadership" },
  { name: "Ravi OceanBlue", designation: "Chief Operating Officer", email: "ravi@oceanbluecorp.com", phone: "+1 (614) 352-0189", team: "Leadership" },
  { name: "Sushma Moturu", designation: "Global HR", email: "hr@oceanbluecorp.com", phone: "+1 (614) 352-2777", team: "People & HR" },
  { name: "Harika Kalam", designation: "HR Coordinator", email: "services@oceanbluecorp.com", phone: "+1 (614) 352-2701", team: "People & HR" },
  { name: "Venky Tadikonda", designation: "Executive Recruiter", email: "venky@oceanbluecorp.com", phone: "+1 (614) 352-2668", team: "Recruiting" },
  { name: "Susmitha Pampana", designation: "Senior Recruiter", email: "susmitha@oceanbluecorp.com", phone: "+1 (614) 352-2527", team: "Recruiting" },
  { name: "Clark A Cristolfoli", designation: "Executive Recruiter", email: "clark@oceanbluecorp.com", phone: "+1 (614) 352-2759", team: "Recruiting" },
  { name: "Raja Kethineni", designation: "Executive Recruiter", email: "raja@oceanbluecorp.com", phone: "+1 (614) 352-2877", team: "Recruiting" },
  { name: "Brent Wallace", designation: "Sr. Vice President - Sales", email: "bwallace@oceanbluecorp.com", phone: "+1 (614) 352-2701", team: "Sales" },
];

/** Seniority, then function; doubles as "who to ask first". */
const TEAM_ORDER: { key: Team; blurb: string }[] = [
  { key: "Leadership", blurb: "Escalations and anything commercial." },
  { key: "People & HR", blurb: "Payroll, benefits, onboarding and policy." },
  { key: "Recruiting", blurb: "Requisitions, candidates and submissions." },
  { key: "Sales", blurb: "Client accounts and new business." },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
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
          // Clipboard can be blocked; the value stays visible and selectable.
        }
      }}
      className={`grid size-10 shrink-0 place-items-center rounded-lg transition-colors duration-150 ${copied ? "text-status-success" : "text-mist-500 hover:bg-mist-100 hover:text-navy-900"}`}
    >
      <Icon name={copied ? "check" : "copy"} className="size-4" />
    </button>
  );
}

function ContactCell({ icon, href, value, label }: { icon: IconName; href?: string; value?: string; label: string }) {
  if (!value) {
    return (
      <span className="flex min-h-10 min-w-0 items-center gap-2 text-adm-base text-mist-600">
        <Icon name={icon} className="size-4 shrink-0" />
        <span className="md:sr-only">No {label.split(" ")[0]} on record</span>
        <span aria-hidden className="hidden md:inline">–</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon name={icon} className="size-4 shrink-0 text-mist-500" />
      <a href={href} title={value} className="min-w-0 truncate text-adm-base tabular-nums text-navy-900 hover:text-ocean-700 hover:underline">
        {value}
      </a>
      <CopyButton value={value} label={label} />
    </span>
  );
}

const rowCols = "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]";

function PersonRow({ m, showTeam }: { m: TeamMember; showTeam: boolean }) {
  return (
    <li className={`grid gap-x-4 px-4 py-2.5 md:items-center ${rowCols}`}>
      <div className="flex min-h-10 min-w-0 items-center gap-3">
        <Avatar name={m.name} />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <p className="min-w-0 truncate text-adm-base font-semibold text-navy-900">{m.name}</p>
            {showTeam && <Badge>{m.team}</Badge>}
          </div>
          <p className="truncate text-adm-base text-mist-600">{m.designation || "No title on record"}</p>
        </div>
      </div>
      <div className="min-w-0 pl-12 md:pl-0">
        <ContactCell icon="mail" href={`mailto:${m.email}`} value={m.email} label="email address" />
      </div>
      <div className="min-w-0 pl-12 md:pl-0">
        <ContactCell icon="phone" href={m.phone ? `tel:${m.phone.replace(/[^+\d]/g, "")}` : undefined} value={m.phone} label="phone number" />
      </div>
    </li>
  );
}

function DirectorySkeleton() {
  return (
    <ul role="status" aria-label="Loading the directory" className="divide-y divide-mist-100">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className={`grid gap-x-4 gap-y-2 px-4 py-3.5 md:items-center ${rowCols}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="ml-12 h-3.5 w-48 md:ml-0" />
          <Skeleton className="ml-12 h-3.5 w-32 md:ml-0" />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Directory editor                                                    */
/* ------------------------------------------------------------------ */

const blank = (m: TeamMember) => isBlank(m.name) && isBlank(m.email) && isBlank(m.designation) && isBlank(m.phone);

function EditorField({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-adm-xs font-medium text-mist-600">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-adm-xs text-status-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function DirectoryEditor({ initial, onClose, onSaved }: { initial: TeamMember[]; onClose: () => void; onSaved: (m: TeamMember[]) => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<TeamMember[]>(initial);
  const [baseline] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = JSON.stringify(rows) !== JSON.stringify(baseline);

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // Ids are `dir-${row}-${field}` so the hook can focus them; limits match the API's truncation.
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors<string>(() => {
    const out: Record<string, string | undefined> = {};
    rows.forEach((m, i) => {
      if (blank(m)) return;
      out[`dir-${i}-name`] = check(m.name, required("Enter this person's name, or remove the row."), maxLen(120));
      out[`dir-${i}-designation`] = check(m.designation, maxLen(120));
      out[`dir-${i}-email`] = check(m.email, email("Enter an email like name@oceanbluecorp.com."), maxLen(160));
      out[`dir-${i}-phone`] = check(m.phone, phone(), maxLen(40));
    });
    return collectErrors(out);
  });

  // Removing or moving a row shifts indexes, so re-run the checks.
  useEffect(() => {
    revalidate();
  }, [rows, revalidate]);

  const update = (i: number, patch: Partial<TeamMember>) => setRows((r) => r.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () => {
    setRows((r) => [...r, { name: "", designation: "", email: "", phone: "", team: "Recruiting" }]);
    setTimeout(() => document.getElementById(`dir-${rows.length}-name`)?.focus(), 0);
  };

  const save = async () => {
    if (saving || !validateAll()) return;
    const cleaned = rows.map((m) => ({ ...m, name: m.name.trim(), email: m.email.trim(), designation: m.designation.trim(), phone: m.phone.trim() })).filter((m) => m.name || m.email);
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
      toast.show("Directory updated");
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "The directory could not be saved. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title="Edit directory"
        description="People shown on the Help page, in this order within each team."
        size="xl"
        onClose={requestClose}
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button icon="check" loading={saving} onClick={() => void save()}>
              Save directory
            </Button>
          </>
        }
      >
        <div className="grid gap-3" onBlur={revalidate}>
          <FormError message={serverError} />
          {rows.length === 0 && <EmptyState compact icon="userCheck" title="No one in the directory" body="Add the people teammates should reach." />}
          <ol className="grid gap-3">
            {rows.map((m, i) => {
              const id = (f: string) => `dir-${i}-${f}`;
              return (
                <li key={i} className="grid gap-3 rounded-xl bg-mist-50 p-4 ring-1 ring-inset ring-mist-200 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-start">
                  {(
                    [
                      ["name", "Name", "text"],
                      ["designation", "Title", "text"],
                      ["email", "Email", "email"],
                      ["phone", "Phone", "tel"],
                    ] as const
                  ).map(([field, label, type]) => (
                    <EditorField key={field} id={id(field)} label={label} error={errors[id(field)]}>
                      <input id={id(field)} type={type} value={m[field]} onChange={(e) => update(i, { [field]: e.target.value })} className={inputCls} autoComplete="off" {...invalidProps(id(field))} />
                    </EditorField>
                  ))}
                  <EditorField id={id("team")} label="Team">
                    <select id={id("team")} value={m.team} onChange={(e) => update(i, { team: e.target.value as Team })} className={inputCls}>
                      {TEAMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </EditorField>
                  <div className="flex items-end justify-end gap-1 sm:col-span-2 lg:col-span-1 lg:pt-5">
                    <Button variant="ghost" size="sm" icon="chevronDown" className="rotate-180" label={`Move ${m.name || "person"} up`} disabled={i === 0} onClick={() => move(i, -1)} />
                    <Button variant="ghost" size="sm" icon="chevronDown" label={`Move ${m.name || "person"} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
                    <Button variant="ghost" size="sm" icon="trash" label={`Remove ${m.name || "person"}`} onClick={() => remove(i)} />
                  </div>
                </li>
              );
            })}
          </ol>
          <div>
            <Button variant="secondary" icon="plus" onClick={add}>
              Add person
            </Button>
          </div>
        </div>
      </Modal>
      {confirmDiscard && (
        <ConfirmDialog
          title="Discard changes?"
          body="Your edits to the directory have not been saved."
          confirmLabel="Discard"
          onConfirm={() => {
            setConfirmDiscard(false);
            onClose();
          }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type TeamFilter = Team | "all";

interface Topic {
  title: string;
  value: string;
  icon: IconName;
  href: string;
  external?: boolean;
}

const topicCls =
  "group flex h-full min-w-0 flex-col rounded-xl bg-mist-0 p-4 ring-1 ring-mist-200 transition-colors duration-150 hover:ring-ocean-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600";

function TopicCard({ t }: { t: Topic }) {
  const inner = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="block text-adm-base font-semibold text-navy-900">{t.title}</span>
        {t.external && <Icon name="external" className="size-4 shrink-0 text-mist-500 group-hover:text-ocean-700" />}
      </span>
      <span className="mt-0.5 block text-adm-base tabular-nums text-mist-600 [overflow-wrap:normal]">{t.value}</span>
    </>
  );
  if (t.external || /^(mailto|tel):/.test(t.href))
    return (
      <a href={t.href} className={topicCls} {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
        {t.external && <span className="sr-only">(opens in a new tab)</span>}
      </a>
    );
  return (
    <Link href={t.href} className={topicCls}>
      {inner}
    </Link>
  );
}

const helpCols: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
const teamRank = (t: Team) => TEAM_ORDER.findIndex((o) => o.key === t);

export default function HelpView() {
  const { user } = useAuth();
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;
  const isAdmin = user?.role === UserRole.ADMIN;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<TeamFilter>("all");

  // Stored directory, falling back to the built-in list until one is saved.
  useEffect(() => {
    let alive = true;
    fetch("/api/help/directory")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setMembers(Array.isArray(d?.members) && d.members.length ? d.members : DEFAULT_TEAM);
        setLoadFailed(false);
      })
      .catch(() => {
        if (!alive) return;
        setMembers((m) => (m.length ? m : DEFAULT_TEAM));
        setLoadFailed(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = () => {
    setLoading(true);
    setAttempt((a) => a + 1);
  };

  const q = query.trim().toLowerCase();
  const searched = useMemo(
    () =>
      members
        .filter((m) => !q || [m.name, m.designation, m.email, m.phone, m.team].some((f) => f?.toLowerCase().includes(q)))
        .sort((a, b) => teamRank(a.team) - teamRank(b.team) || a.name.localeCompare(b.name)),
    [q, members],
  );
  const rows = team === "all" ? searched : searched.filter((m) => m.team === team);

  const help: Topic[] = [
    { title: "Report a problem", value: CONTACT_EMAIL, icon: "alert" as IconName, href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Portal problem")}`, show: true },
    { title: "Call the office", value: CONTACT_PHONE.label, icon: "phone" as IconName, href: CONTACT_PHONE.href, show: true },
    { title: "HR portal", value: "hr.oceanbluecorp.com", icon: "idBadge" as IconName, href: hrPortalUrl("portal"), external: true, show: canEdit },
    { title: "Portal guide", value: "Routes, roles and API reference", icon: "code" as IconName, href: "/portal/docs", show: isAdmin },
  ].filter((t) => t.show);

  const clear = () => {
    setQuery("");
    setTeam("all");
  };

  return (
    <Page>
      <PageHeader
        title="Help"
        icon="help"
        section="workspace"

        actions={
          canEdit ? (
            <Button variant="secondary" icon="edit" disabled={loading} onClick={() => setEditing(true)}>
              Edit directory
            </Button>
          ) : undefined
        }
      />

      <section aria-labelledby="get-help-title" className="grid gap-3">
        <h2 id="get-help-title" className="text-adm-md font-semibold text-navy-900">
          Get help
        </h2>
        <ul className={`grid gap-4 ${helpCols[help.length] ?? ""}`}>
          {help.map((t) => (
            <li key={t.title} className="min-w-0">
              <TopicCard t={t} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="directory-title" className="grid min-w-0 gap-3">
        <h2 id="directory-title" className="text-adm-md font-semibold text-navy-900">
          Team directory
        </h2>
        <div className="min-w-0 overflow-hidden rounded-xl bg-mist-0 ring-1 ring-mist-200">
          <div className="flex flex-col-reverse gap-x-4 border-b border-mist-200 px-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <TableTabs
                label="Team"
                value={team}
                onChange={setTeam}
                options={[{ value: "all" as TeamFilter, label: "All", count: loading ? undefined : searched.length }, ...TEAM_ORDER.map((t) => ({ value: t.key as TeamFilter, label: t.key, count: loading ? undefined : searched.filter((m) => m.team === t.key).length }))]}
              />
            </div>
            <label className="relative block w-full shrink-0 px-2 pt-3 sm:w-64 sm:px-0 sm:py-2">
              <span className="sr-only">Search people</span>
              <span className="relative block">
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                className="h-9 w-full rounded-lg bg-mist-0 pl-9 pr-3 text-adm-base text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600"
              />
              </span>
            </label>
          </div>

          {loadFailed && !loading && (
            <div role="status" className="flex flex-wrap items-center gap-3 border-b border-status-warning-line bg-status-warning-soft px-4 py-2 text-adm-base text-status-warning">
              <Icon name="alert" className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 basis-60">The saved directory couldn&apos;t be loaded, so this is the built-in list and may be out of date.</span>
              <Button variant="secondary" size="sm" icon="refresh" onClick={retry}>
                Try again
              </Button>
            </div>
          )}

          {loading ? (
            <DirectorySkeleton />
          ) : rows.length === 0 ? (
            q ? (
              <EmptyState variant="no-results" title={`No one matches “${query.trim()}”`} body="Try a name, a title or an email." onClearFilters={clear} />
            ) : (
              <EmptyState
                icon="userCheck"
                title={team === "all" ? "No one in the directory yet" : "No one in this team yet"}
                body={canEdit ? "Add people with Edit directory." : "Pick another team."}
                primary={canEdit ? { label: "Edit directory", icon: "edit", onClick: () => setEditing(true) } : undefined}
                secondary={team === "all" ? undefined : { label: "Show everyone", onClick: () => setTeam("all") }}
              />
            )
          ) : (
            <>
              <div className={`hidden gap-x-4 border-b border-mist-100 bg-mist-50 px-4 py-2 text-adm-xs font-medium text-mist-600 md:grid ${rowCols}`}>
                <span>Person</span>
                <span>Email</span>
                <span>Phone</span>
              </div>
              <ul className="divide-y divide-mist-100">
                {rows.map((m, i) => (
                  <PersonRow key={`${m.email}${m.name}${i}`} m={m} showTeam={team === "all"} />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {editing && canEdit && <DirectoryEditor initial={members} onClose={() => setEditing(false)} onSaved={setMembers} />}
    </Page>
  );
}
