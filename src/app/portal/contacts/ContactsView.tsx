"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker } from "@/lib/contact";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useResource } from "@/hooks/use-resource";
import DataTable, { TableTabs, type Column, type Filter } from "@/components/portal/DataTable";
import { RoleGate } from "@/components/portal/session";
import {
  Avatar, Badge, Button, ConfirmDialog, EmptyState, ErrorState, InsightsSheet, KpiRow, ListPageSkeleton, Page, PageHeader, Panel, StatCard, usePortalRouter,
} from "@/components/portal/kit";
import type { MenuEntry } from "@/components/portal/records/Menu";
import { DonutChart, SERIES, TrendChart } from "@/components/portal/charts";
import { GoneNotice, InlineDelete, SegmentChips, errorText, send, useToast, weekBuckets } from "@/components/portal/relationships/shared";
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
const typeOf = (c: Contact) => (isJobSeeker(c.inquiryType) ? "Job seekers" : c.inquiryType || "Other");

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
        <h3 className="text-[14px] font-semibold text-navy-900">{c.inquiryType} enquiry</h3>
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
  const [segment, setSegment] = useState("All");
  const toast = useToast();
  const router = usePortalRouter();
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

  const weeks = useMemo(() => {
    const b = weekBuckets(12);
    return {
      labels: b.labels,
      series: [
        { name: "Hiring staff", values: b.count(contacts.filter((c) => !isJobSeeker(c.inquiryType)).map((c) => c.createdAt)) },
        { name: "Looking for work", values: b.count(contacts.filter((c) => isJobSeeker(c.inquiryType)).map((c) => c.createdAt)) },
      ],
      total: b.count(contacts.map((c) => c.createdAt)),
    };
  }, [contacts]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of contacts) m.set(typeOf(c), (m.get(typeOf(c)) ?? 0) + 1);
    const sorted = [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    // Donut keeps to six slices; the tail folds into "Other".
    if (sorted.length <= 6) return sorted;
    return [...sorted.slice(0, 5), { label: "Other", value: sorted.slice(5).reduce((a, x) => a + x.value, 0) }];
  }, [contacts]);
  const bucketOf = (c: Contact) => (byType.some((t) => t.label === typeOf(c)) ? typeOf(c) : "Other");

  const since30 = Date.now() - 30 * 86_400_000;
  const last30 = contacts.filter((c) => new Date(c.createdAt).getTime() >= since30).length;
  const seekers = contacts.filter((c) => isJobSeeker(c.inquiryType)).length;
  const visible = contacts.filter((c) => (tab === "all" || c.status === tab) && (segment === "All" || bucketOf(c) === segment));

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      value: (c) => contactName(c),
      cell: (c) => {
        const unread = c.status === "new";
        return (
          <span className="flex min-w-0 items-center gap-3">
            <Avatar name={contactName(c)} size="sm" />
            <span className="min-w-0">
              {/* Unread reads as bold plus the New status column; no dot */}
              <span className={`flex items-center truncate ${unread ? "font-semibold" : "font-medium"}`}>
                <span className="truncate">{contactName(c)}</span>
                {unread && <span className="sr-only">(unread)</span>}
              </span>
              <span className="block max-w-[14rem] truncate text-[12px] font-normal text-mist-600" title={c.email}>
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
      hideBelow: "lg",
      value: (c) => c.company || "",
      cell: (c) => (c.company ? <span className="block max-w-[14rem] truncate" title={c.company}>{c.company}</span> : <span className="text-mist-400">–</span>),
    },
    { key: "topic", header: "Enquiry / area", sortable: true, hideBelow: "xl", value: topicOf },
    { key: "status", header: "Status", sortable: true, value: (c) => contactStatusMeta(c.status).label, cell: (c) => <ContactStatusBadge status={c.status} /> },
    {
      key: "createdAt",
      header: "Received",
      sortable: true,
      value: (c) => new Date(c.createdAt).getTime(),
      cell: (c) => (
        <time
          dateTime={c.createdAt}
          className={`whitespace-nowrap tabular-nums ${
            c.status !== "new" ? "text-mist-600" : Date.now() - new Date(c.createdAt).getTime() > WAITING_MS ? "font-medium text-[#b54708]" : "font-medium text-navy-900"
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

  const clearScope = () => {
    setTab("all");
    setSegment("All");
  };

  return (
    <RoleGate href="/portal/contacts">
      <Page>
        <PageHeader
          title="Contacts"
          icon="contact"
          section="relationships"
          description="Enquiries from the website contact form: companies hiring and people looking for work."
          meta={
            counts.new > 0 ? (
              <Badge tone="blue" dot>
                {counts.new} awaiting a reply
              </Badge>
            ) : undefined
          }
          actions={
            contacts.length > 0 && (
              <InsightsSheet title="Contacts insights" description="How many enquiries arrive, who sends them and what is still waiting. Pick a type to filter the list.">
                {(close) => (
                  <>
                    <KpiRow>
                      <StatCard section="relationships" label="Enquiries" value={contacts.length} icon="contact" hint={`${last30} in the last 30 days`} trend="flat" spark={weeks.total} />
                      <StatCard section="relationships" label="Awaiting a reply" value={counts.new} icon="inbox" hint="status New" trend="flat" />
                      <StatCard section="relationships" label="Looking for work" value={seekers} icon="userCheck" hint={`${contacts.length - seekers} hiring staff`} trend="flat" />
                    </KpiRow>
                    <Panel title="Enquiries per week" description="Last 12 weeks">
                      <TrendChart title="Enquiries per week from companies hiring and people looking for work" labels={weeks.labels} series={weeks.series} height={268} />
                    </Panel>
                    <Panel title="Enquiries by type" description="Pick a type to filter the list">
                      <div className="grid gap-5">
                        <DonutChart title="Enquiries by type" data={byType} centerLabel="Enquiries" size={168} />
                        <SegmentChips
                          label="Filter the list by type"
                          items={byType.map((b) => ({ label: b.label, count: b.value }))}
                          value={segment}
                          onChange={(v) => {
                            setSegment(v);
                            close();
                          }}
                          colors={SERIES}
                        />
                      </div>
                    </Panel>
                  </>
                )}
              </InsightsSheet>
            )
          }
        />

        {isLoading ? (
          <ListPageSkeleton header={false} label="Loading contacts" kpis={0} insights={false} />
        ) : error && !data ? (
          <ErrorState title="Couldn't load contacts" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
        ) : contacts.length === 0 ? (
          <EmptyState framed variant="first-use" icon="contact" title="No enquiries yet" body="Submissions from the website contact form appear here, newest first." />
        ) : (
          <section aria-label="Enquiries" className="grid gap-4">
            {visible.length === 0 ? (
              <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
                <div className="border-b border-mist-200 px-2 sm:px-4">{statusTabs}</div>
                {tab === "new" && segment === "All" ? (
                  <EmptyState icon="check" title="You're all caught up" body="No enquiries are waiting for a reply." secondary={{ label: "Show all enquiries", onClick: clearScope }} />
                ) : (
                  <EmptyState variant="no-results" title="No enquiries match your filters" body="Try another status or type." onClearFilters={clearScope} />
                )}
              </div>
            ) : (
              <DataTable
                key={deepSearch}
                rows={visible}
                tabs={statusTabs}
                extraChips={segment !== "All" ? [{ key: "segment", label: `Type: ${segment}`, clear: () => setSegment("All") }] : []}
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
      </Page>
    </RoleGate>
  );
}
