"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker } from "@/lib/contact";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useResource } from "@/hooks/use-resource";
import DataTable, { TableTabs, type Column, type Filter, type Summary } from "@/components/portal/DataTable";
import { RoleGate, useSession } from "@/components/portal/session";
import { permissionsFor } from "@/components/portal/recruiting/model";
import { canCreateRoleFromContact } from "@/lib/job-from-contact";
import {
  Avatar, Button, ConfirmDialog, EmptyState, ErrorState, ListPage, ListPageState, usePortalRouter,
  CrmListSkeleton,
} from "@/components/portal/kit";
import type { MenuEntry } from "@/components/portal/records/Menu";
import { GoneNotice, InlineDelete, errorText, send, useToast } from "@/components/portal/relationships/shared";
import {
  AudienceBadge,
  CONTACT_STATUSES,
  ContactFacts,
  ContactIdentity,
  ContactMessage,
  ContactNotes,
  ContactRespond,
  ContactStatusBadge,
  audienceOf,
  contactName,
  contactStatusMeta,
  dropContact,
  replyHref,
  saveContactNotes,
  saveContactStatus,
  syncContact,
  topicOf,
  useMarkReadOnOpen,
  type ContactStatus,
} from "@/components/portal/relationships/contact";

const KEY = "/api/contacts";
/** An unanswered enquiry older than this reads as waiting too long. */
const WAITING_MS = 2 * 86_400_000;
const isWaiting = (c: Contact) => c.status === "new" && Date.now() - new Date(c.createdAt).getTime() > WAITING_MS;

function DrawerBody({
  c,
  onStatus,
  onNotes,
  onDelete,
  markRead,
}: {
  c: Contact;
  onStatus: (s: ContactStatus) => Promise<void>;
  onNotes: (notes: string) => Promise<void>;
  onDelete: () => Promise<void>;
  markRead: (c: Contact) => void;
}) {
  const [busy, setBusy] = useState<"status" | "delete" | null>(null);
  useMarkReadOnOpen(c, markRead);
  const run = async (kind: "status" | "delete", fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6">
      <ContactIdentity c={c} />
      <ContactRespond c={c} busy={busy !== null} onStatus={(s) => void run("status", () => onStatus(s))} />
      <section className="grid gap-2">
        <h3 className="text-adm-base font-semibold text-navy-900">{c.inquiryType} enquiry</h3>
        <div className="rounded-xl p-4 ring-1 ring-mist-200">
          <ContactMessage c={c} />
        </div>
      </section>
      <ContactFacts c={c} />
      <ContactNotes c={c} onSave={onNotes} />
      <div className="flex flex-wrap items-start justify-end gap-3 border-t border-mist-200 pt-5">
        <InlineDelete label="Delete enquiry" warning="This enquiry is removed permanently. This cannot be undone." busy={busy === "delete"} onConfirm={() => void run("delete", onDelete)} />
      </div>
    </div>
  );
}

export default function ContactsView() {
  const { data, error, isLoading, isValidating, reload } = useResource<{ contacts?: Contact[] }>(KEY);
  const contacts = useMemo(() => data?.contacts ?? [], [data]);
  const [tab, setTab] = useState<"all" | ContactStatus>("all");
  const toast = useToast();
  const router = usePortalRouter();
  const { canEditJobs } = permissionsFor(useSession().role);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const setStatus = async (ids: string[], status: ContactStatus) => {
    const before = new Map(contacts.filter((c) => ids.includes(c.id)).map((c) => [c.id, c.status]));
    ids.forEach((id) => syncContact(id, (c) => ({ ...c, status })));
    const results = await Promise.allSettled(ids.map((id) => saveContactStatus(id, status)));
    const failed = ids.filter((_, i) => results[i].status === "rejected");
    failed.forEach((id) => syncContact(id, (c) => ({ ...c, status: before.get(id) ?? c.status })));
    if (failed.length) {
      toast.error(failed.length === ids.length ? "Couldn't update the status. Try again." : `${failed.length} of ${ids.length} enquiries couldn't be updated.`);
      return;
    }
    const label = contactStatusMeta(status).label.toLowerCase();
    toast.show(ids.length === 1 ? `Marked ${label}` : `${ids.length} enquiries marked ${label}`);
  };

  // Silent: opening an unread enquiry is not an action worth a toast.
  const markRead = useCallback(
    (c: Contact) => {
      syncContact(c.id, (x) => ({ ...x, status: "read" }));
      saveContactStatus(c.id, "read").catch(() => {
        syncContact(c.id, (x) => (x.status === "read" ? { ...x, status: "new" } : x));
        toast.error("Couldn't mark this enquiry as read.");
      });
    },
    [toast],
  );

  const saveNotes = async (c: Contact, notes: string) => {
    await saveContactNotes(c, notes);
    syncContact(c.id, (x) => ({ ...x, notes, updatedAt: new Date().toISOString() }));
    toast.show("Notes saved");
  };

  const remove = async (c: Contact, close: () => void) => {
    try {
      await send(`${KEY}/${c.id}`, "DELETE");
      close();
      dropContact(c.id);
      toast.show(`Enquiry from ${contactName(c)} deleted`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't delete the enquiry. Try again."));
    }
  };

  const rowMenu = (c: Contact, openDetail: () => void): MenuEntry[] => [
    { label: "Open", icon: "eye", onSelect: openDetail },
    { label: "Open full record", icon: "external", onSelect: () => router.push(`/portal/contacts/${c.id}`) },
    {
      label: "Reply by email",
      icon: "send",
      onSelect: () => {
        // Replying marks the enquiry responded, as in the drawer.
        if (c.status !== "responded") void setStatus([c.id], "responded");
        window.location.href = replyHref(c);
      },
    },
    ...(c.status !== "responded" ? [{ label: "Mark responded", icon: "check" as const, onSelect: () => void setStatus([c.id], "responded") }] : []),
    ...(canEditJobs && canCreateRoleFromContact(c)
      ? [{ label: "Create role from enquiry", icon: "briefcase" as const, onSelect: () => router.push(`/portal/jobs/new?fromContact=${encodeURIComponent(c.id)}`) }]
      : []),
    { kind: "separator" },
    ...(c.status !== "archived" ? [{ label: "Archive", icon: "layers" as const, onSelect: () => void setStatus([c.id], "archived") }] : []),
    { label: "Delete", icon: "trash", danger: true, onSelect: () => setConfirmDelete(c) },
  ];

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete, () => undefined);
    setDeleting(false);
    setConfirmDelete(null);
  };

  // ?search=<name> deep link; the table is keyed on it so it mounts filtered.
  const [deepSearch, setDeepSearch] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setDeepSearch(q);
  }, []);

  // Full record regardless of visible columns.
  const exportCsv = (rows: Contact[]) =>
    downloadCsv(
      "contacts",
      ["Name", "For", "Email", "Phone", "Company", "Job Title", "Enquiry / area", "LinkedIn", "Status", "Date", "Message", "Notes"],
      rows.map((c) => [contactName(c), audienceOf(c), c.email, c.phone || "", c.company, c.jobTitle || "", topicOf(c), c.linkedinUrl || "", c.status, fmtDate(c.createdAt), c.message, c.notes || ""]),
    );

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: contacts.length };
    for (const s of CONTACT_STATUSES) out[s.id] = contacts.filter((c) => c.status === s.id).length;
    return out;
  }, [contacts]);

  const visible = contacts.filter((c) => tab === "all" || c.status === tab);

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      grow: 40,
      value: (c) => contactName(c),
      cell: (c) => {
        const unread = c.status === "new";
        return (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={contactName(c)} size="sm" />
            <span className="min-w-0">
              {/* Unread reads as bold plus the New status column; no dot */}
              <span className={`flex items-center truncate ${unread ? "font-semibold" : "font-medium"}`}>
                <span className="truncate" title={contactName(c)}>{contactName(c)}</span>
                {unread && <span className="sr-only">(unread)</span>}
              </span>
              <span className="block max-w-[14rem] truncate text-adm-xs font-normal text-mist-600" title={c.email}>
                {c.email}
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "audience", header: "For", sortable: true, hideBelow: "lg", value: audienceOf, cell: (c) => <AudienceBadge c={c} /> },
    {
      key: "company",
      header: "Company",
      sortable: true,
      grow: 20,
      hideBelow: "lg",
      value: (c) => c.company || "",
      cell: (c) => (c.company ? <span className="block max-w-[14rem] truncate" title={c.company}>{c.company}</span> : <span className="text-mist-600">–</span>),
    },
    { key: "topic", header: "Enquiry / area", sortable: true, grow: 15, hideBelow: "xl", value: topicOf },
    { key: "status", header: "Status", sortable: true, align: "center", value: (c) => contactStatusMeta(c.status).label, cell: (c) => <ContactStatusBadge status={c.status} /> },
    {
      key: "createdAt",
      header: "Received",
      sortable: true,
      value: (c) => new Date(c.createdAt).getTime(),
      cell: (c) => (
        <time
          dateTime={c.createdAt}
          className={`whitespace-nowrap tabular-nums ${
            c.status !== "new" ? "text-mist-600" : isWaiting(c) ? "font-medium text-status-warning" : "font-medium text-navy-900"
          }`}
          title={fmtDateTime(c.createdAt)}
        >
          {fmtRelative(c.createdAt)}
        </time>
      ),
    },
    { key: "email", header: "Email", defaultHidden: true, value: (c) => c.email },
    { key: "phone", header: "Phone", defaultHidden: true, value: (c) => c.phone || "" },
    { key: "jobTitle", header: "Job title", defaultHidden: true, value: (c) => c.jobTitle || "" },
    { key: "linkedinUrl", header: "LinkedIn", defaultHidden: true, value: (c) => c.linkedinUrl || "" },
    { key: "date", header: "Date", defaultHidden: true, value: (c) => fmtDate(c.createdAt) },
    { key: "message", header: "Message", defaultHidden: true, value: (c) => c.message, cell: (c) => <span className="block max-w-[20rem] truncate">{c.message}</span> },
  ];

  const filters: Filter<Contact>[] = [
    { key: "audience", label: "For", options: ["Hiring staff", "Looking for work"], value: audienceOf },
    { key: "topic", label: "Enquiry", options: Array.from(new Set(contacts.map(topicOf))).sort(), value: topicOf },
  ];

  const statusTabs = (
    <TableTabs
      label="Enquiry status"
      value={tab}
      onChange={setTab}
      options={[
        { value: "all" as const, label: "All", count: counts.all },
        ...CONTACT_STATUSES.filter((s) => s.id !== "archived" || counts.archived).map((s) => ({ value: s.id, label: s.label, count: counts[s.id] })),
      ]}
    />
  );

  const summary = (rows: Contact[]): Summary[] => {
    const waiting = rows.filter(isWaiting).length;
    return [
      { label: "awaiting a reply", value: rows.filter((c) => c.status === "new").length },
      { label: "waiting over 2 days", value: waiting, warn: waiting > 0 },
      { label: "looking for work", value: rows.filter((c) => isJobSeeker(c.inquiryType)).length },
    ];
  };

  return (
    <RoleGate href="/portal/contacts">
      <ListPage title="Contacts">
        {isLoading ? (
          <CrmListSkeleton label="Loading contacts" />
        ) : error && !data ? (
          <ListPageState>
            <ErrorState title="Couldn't load contacts" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
          </ListPageState>
        ) : contacts.length === 0 ? (
          <ListPageState>
            <EmptyState framed variant="first-use" icon="contact" title="No enquiries yet" body="Submissions from the website contact form appear here, newest first." />
          </ListPageState>
        ) : (
          <section aria-label="Enquiries" className="flex min-h-0 flex-1 flex-col">
            {visible.length === 0 ? (
              <>
                <div className="shrink-0 border-b border-mist-200 px-4">{statusTabs}</div>
                {tab === "new" ? (
                  <EmptyState icon="check" title="You're all caught up" body="No enquiries are waiting for a reply." secondary={{ label: "Show all enquiries", onClick: () => setTab("all") }} />
                ) : (
                  <EmptyState variant="no-results" title="No enquiries match your filters" body="Try another status." onClearFilters={() => setTab("all")} />
                )}
              </>
            ) : (
              <DataTable
                key={deepSearch}
                rows={visible}
                tabs={statusTabs}
                fill
                noun="enquiries"
                summary={summary}
                columns={columns}
                filters={filters}
                initialQuery={deepSearch}
                initialSort={{ key: "createdAt", dir: -1 }}
                onExport={exportCsv}
                exportName="contacts"
                storageKey="contacts"
                searchPlaceholder="Search name, email, company or message"
                searchMatch={(c, q) => c.message.toLowerCase().includes(q)}
                emptyTitle="No enquiries match your filters"
                selectable
                bulkActions={(ids) => (
                  <>
                    <Button size="sm" variant="secondary" icon="eye" onClick={() => void setStatus(ids, "read")}>
                      Mark read
                    </Button>
                    <Button size="sm" variant="secondary" icon="check" onClick={() => void setStatus(ids, "responded")}>
                      Mark responded
                    </Button>
                    <Button size="sm" variant="secondary" icon="layers" onClick={() => void setStatus(ids, "archived")}>
                      Archive
                    </Button>
                  </>
                )}
                detailTitle={(c) => contactName(c)}
                detailActions={(c) => <Button size="sm" variant="secondary" icon="expand" label="Open full record" href={`/portal/contacts/${c.id}`} />}
                rowMenu={rowMenu}
                renderDetail={(r, close) => {
                  const live = contacts.find((x) => x.id === r.id);
                  return live ? (
                    <DrawerBody
                      c={live}
                      markRead={markRead}
                      onStatus={(s) => setStatus([live.id], s)}
                      onNotes={(n) => saveNotes(live, n)}
                      onDelete={() => remove(live, close)}
                    />
                  ) : (
                    <GoneNotice noun="enquiry" />
                  );
                }}
              />
            )}
          </section>
        )}
        {confirmDelete && (
          <ConfirmDialog
            title="Delete this enquiry?"
            body={`The enquiry from ${contactName(confirmDelete)} is removed permanently. This cannot be undone.`}
            confirmLabel="Delete"
            busy={deleting}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => void confirmRemove()}
          />
        )}
      </ListPage>
    </RoleGate>
  );
}
