"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  IconBuilding, IconCalendar, IconDownload, IconJob, IconMail,
  IconMessage, IconPhone, IconSend,
  IconTrash,
} from "@/components/admin/icons";
import type { Contact } from "@/lib/aws/dynamodb";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DisplayMenu, GridSelect, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { FormSelect } from "@/components/admin/forms/primitives";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { type Tone } from "@/components/admin/theme";

// ── config ───────────────────────────────────────────────────────────────────

type ContactStatus = Contact["status"];

/** Enquiry states, in handling order. */
const STATUSES: { key: ContactStatus; label: string; tone: Tone }[] = [
  { key: "new",       label: "New",       tone: "blue" },
  { key: "read",      label: "Read",      tone: "amber" },
  { key: "responded", label: "Responded", tone: "emerald" },
  { key: "archived",  label: "Archived",  tone: "slate" },
];

const STATUS_META = Object.fromEntries(STATUSES.map((s) => [s.key, s])) as Record<string, (typeof STATUSES)[number]>;

const STATUS_TABS = [{ key: "all", label: "All" }, ...STATUSES.map((s) => ({ key: s.key as string, label: s.label }))];

/** Placeholder for an empty cell — an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">—</span>;
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep-link search (global command palette links here as ?search=<name>).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/contacts");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch contacts");
        setContacts(data.contacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch contacts");
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────

  const inquiryTypes = useMemo(
    () => [...new Set(contacts.map(c => c.inquiryType).filter(Boolean))],
    [contacts],
  );

  const filteredContacts = useMemo(() => contacts.filter(contact => {
    const q = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      contact.company.toLowerCase().includes(q) ||
      contact.message.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesInquiry = inquiryFilter === "all" || contact.inquiryType === inquiryFilter;
    return matchesSearch && matchesStatus && matchesInquiry;
  }), [contacts, searchQuery, statusFilter, inquiryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length };
    for (const s of STATUSES) counts[s.key] = contacts.filter(c => c.status === s.key).length;
    return counts;
  }, [contacts]);

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (contactId: string, newStatus: ContactStatus) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: newStatus } : c));
      if (selectedContact?.id === contactId) setSelectedContact({ ...selectedContact, status: newStatus });
    } catch {
      toast.error("Failed to update contact status");
    }
  };

  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/contacts/${pendingDelete}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete contact");
      setContacts(prev => prev.filter(c => c.id !== pendingDelete));
      setSelectedContact(null);
      toast.success("Contact deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  };

  const openContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.status === "new") handleStatusChange(contact.id, "read");
  };

  const exportCSV = () => downloadCsv(
    "contacts",
    ["Name", "Email", "Phone", "Company", "Job Title", "Inquiry Type", "Status", "Date", "Message"],
    filteredContacts.map((c) => [
      `${c.firstName} ${c.lastName}`,
      c.email,
      c.phone || "",
      c.company,
      c.jobTitle || "",
      c.inquiryType,
      c.status,
      fmtDate(c.createdAt),
      c.message,
    ]),
  );

  const hasActiveFilters = statusFilter !== "all" || inquiryFilter !== "all" || searchQuery.trim() !== "";

  const responseRate = contacts.length > 0
    ? `${Math.round(((statusCounts.responded || 0) / contacts.length) * 100)}%`
    : "—";

  const [rows, setRows] = useLocalStorage<number>("adm.contacts.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.contacts.hiddenCols", []);
  const clearFilters = () => { setStatusFilter("all"); setInquiryFilter("all"); setSearchQuery(""); };

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<Contact>[] = [
    {
      key: "name", header: "Contact", label: "Contact", width: "240px", locked: true, sortValue: (c) => `${c.firstName} ${c.lastName}`,
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${c.firstName} ${c.lastName}`} email={c.email} size="sm" />
          <span className="truncate font-semibold text-[var(--adm-ink)]">{c.firstName} {c.lastName}</span>
          {c.status === "new" && (
            <span aria-label="Unread" className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--adm-accent)]" />
          )}
        </div>
      ),
    },
    {
      key: "email", header: "Email", label: "Email", width: "240px", sortValue: (c) => c.email, hideBelow: "lg",
      cell: (c) => (
        <a
          href={`mailto:${c.email}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {c.email}
        </a>
      ),
    },
    {
      key: "company", header: "Company", label: "Company", width: "190px", sortValue: (c) => c.company || "", hideBelow: "md",
      cell: (c) => c.company ? <span className="text-[var(--adm-ink-mute)]">{c.company}</span> : <Blank />,
    },
    {
      key: "inquiryType", header: "Type", label: "Type", width: "150px", sortValue: (c) => c.inquiryType || "", hideBelow: "xl",
      cell: (c) => c.inquiryType
        ? <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--adm-ink-mute)]">{c.inquiryType}</span>
        : <Blank />,
    },
    {
      key: "status", header: "Status", label: "Status", width: "150px", sortValue: (c) => c.status,
      cell: (c) => (
        <GridSelect
          value={c.status}
          ariaLabel={`Status for ${c.firstName} ${c.lastName}`}
          onChange={(e) => handleStatusChange(c.id, e.target.value as ContactStatus)}
        >
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </GridSelect>
      ),
    },
    {
      key: "createdAt", header: "Received", label: "Received", width: "150px", sortValue: (c) => new Date(c.createdAt).getTime(), hideBelow: "sm",
      cell: (c) => <span className="text-[14px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtRelative(c.createdAt)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      cell: (c) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-0.5">
          <a
            href={`mailto:${c.email}?subject=Re: ${c.inquiryType} Inquiry`}
            title="Reply"
            aria-label={`Reply to ${c.firstName} ${c.lastName}`}
            className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
          >
            <IconSend className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            onClick={() => setPendingDelete(c.id)}
            title="Delete"
            aria-label={`Delete ${c.firstName} ${c.lastName}`}
            className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
          >
            <IconTrash className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
          <EmptyState
            variant="error"
            title="Could not load contact submissions"
            description={error}
            action={<WorkspaceButton variant="primary" onClick={() => window.location.reload()}>Retry</WorkspaceButton>}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete contact?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* The KPI strip counted the same read-states the Status filter now
          carries, plus a "Response rate" tile nothing followed from. */}
      <WorkspaceTitle
        title="Contacts"
        actions={
          <>
            <WorkspaceButton onClick={exportCSV} disabled={filteredContacts.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
          </>
        }
      />
      {/* Inline stat strip — the table gets the vertical space, not stat cards. */}
      <StatStrip
        items={[
          { label: "Awaiting a reply", value: statusCounts.new || 0,
            tone: (statusCounts.new || 0) > 0 ? "warning" : "default",
            onClick: () => setStatusFilter("new") },
          { label: "Read, not answered", value: statusCounts.read || 0,
            onClick: () => setStatusFilter("read") },
          { label: "Responded", value: statusCounts.responded || 0,
            tone: "success", onClick: () => setStatusFilter("responded") },
          { label: "Response rate", value: responseRate,
            hint: "Of all enquiries received" },
        ]}
      />

      {/* Toolbar floats on the canvas between the stat strip and the table. */}
      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter enquiries by name, email or message"
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
            label="Status"
            icon={FilterIcon.status}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_TABS.map((t) => ({
              value: t.key,
              label: t.label,
              count: statusCounts[t.key] || 0,
            }))}
          />
          <FilterPill
            label="Type"
            icon={FilterIcon.type}
            value={inquiryFilter}
            onChange={setInquiryFilter}
            options={[
              { value: "all", label: "All types" },
              ...inquiryTypes.map((t) => ({
                value: t,
                label: t,
                count: contacts.filter((c) => c.inquiryType === t).length,
              })),
            ]}
          />
      </WorkspaceToolbar>

      <ActiveFilters
          variant="canvas"
          chips={[
            ...(statusFilter !== "all"
              ? [{ label: `Status: ${STATUS_META[statusFilter]?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }]
              : []),
            ...(inquiryFilter !== "all"
              ? [{ label: `Type: ${inquiryFilter}`, onClear: () => setInquiryFilter("all") }]
              : []),
          ]}
          onClearAll={clearFilters}
      />

      <Workspace>
        <DataTable
          noun="enquiries"
          storageKey="contacts"
          columns={columns}
          rows={filteredContacts}
          rowKey={(c) => c.id}
          onRowClick={openContact}
          initialSort={{ key: "createdAt", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          empty={{
            icon: IconMessage,
            title: contacts.length === 0 ? "No contacts yet" : "No contacts match your filters",
            description: contacts.length === 0
              ? "Submissions from the website contact form will appear here."
              : "Try adjusting your search or clearing a filter.",
            action: contacts.length > 0 && hasActiveFilters
              ? <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>
              : undefined,
          }}
        />
      </Workspace>

      {/* ── detail drawer ── */}
      {selectedContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedContact(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={`${selectedContact.firstName} ${selectedContact.lastName}`} email={selectedContact.email} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold leading-tight text-[var(--adm-ink)]">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <p className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-subtle)]">{selectedContact.company}</p>
                </div>
                <StatusBadge
                  status={selectedContact.status}
                  tone={STATUS_META[selectedContact.status]?.tone}
                  label={STATUS_META[selectedContact.status]?.label}
                  size="md"
                />
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                aria-label="Close"
                className="flex-none rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 md:grid-cols-2">
                {/* Contact details */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Contact information</h3>
                  <div className="divide-y divide-[var(--adm-line-soft)] rounded-[6px] border border-[var(--adm-line)]">
                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]">
                      <IconMail className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" /><span className="truncate">{selectedContact.email}</span>
                    </a>
                    {selectedContact.phone && (
                      <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]">
                        <IconPhone className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />{selectedContact.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)]">
                      <IconBuilding className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" /><span className="truncate">{selectedContact.company}</span>
                    </div>
                    {selectedContact.jobTitle && (
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)]">
                        <IconJob className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" /><span className="truncate">{selectedContact.jobTitle}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] tabular-nums text-[var(--adm-ink-mute)]">
                      <IconCalendar className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />{fmtDateTime(selectedContact.createdAt)}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Inquiry type</p>
                    <span className="inline-flex rounded-[4px] bg-[var(--adm-surface-2)] px-2.5 py-1 text-[13px] font-medium text-[var(--adm-ink-mute)]">
                      {selectedContact.inquiryType}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Status &amp; actions</h3>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-status" className="block text-[13px] font-medium text-[var(--adm-ink-mute)]">Update status</label>
                    <FormSelect
                      id="contact-status"
                      value={selectedContact.status}
                      onChange={e => handleStatusChange(selectedContact.id, e.target.value as ContactStatus)}
                    >
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </FormSelect>
                  </div>
                  <a
                    href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.inquiryType} Inquiry`}
                    onClick={() => { if (selectedContact.status !== "responded") handleStatusChange(selectedContact.id, "responded"); }}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--adm-accent)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
                  >
                    <IconSend className="h-4 w-4" /> Reply via email
                  </a>
                  <button
                    onClick={() => setPendingDelete(selectedContact.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[var(--adm-danger-soft)] px-4 py-2.5 text-[14px] font-semibold text-[var(--adm-danger)] transition-colors hover:bg-[var(--adm-danger-soft)]"
                  >
                    <IconTrash className="h-4 w-4" /> Delete contact
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="mt-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">
                  <IconMessage className="h-3.5 w-3.5" /> Message
                </h3>
                <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-zebra)] p-4">
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
