"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";
// The contact-detail icons moved with the detail pane into
// components/admin/contacts/contact-detail.tsx.
import { IconDownload, IconMessage } from "@/components/admin/icons";
import type { Contact } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/empty-state";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, StatStrip,
} from "@/components/admin/workspace";
import { ContactList } from "@/components/admin/contacts/contact-list";
import { ContactDetail } from "@/components/admin/contacts/contact-detail";
import { cn } from "@/lib/utils";
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
    : "–";

  const clearFilters = () => { setStatusFilter("all"); setInquiryFilter("all"); setSearchQuery(""); };


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
    <div className="flex h-full min-h-0 flex-col">
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
      {/* Inline stat strip, the table gets the vertical space, not stat cards. */}
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
          /* No DisplayMenu: it managed hidden columns and page size for a
             grid that no longer exists. A split view has one row shape and an
             index that simply scrolls, so there is nothing left to configure. */
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

      {/* ── Split view: index left, reading pane right ─────────────────────
          Was a full-width grid plus a centred modal, which made triage
          open → read → close → find your place → open again. A mail layout
          removes three of those five steps, and it is the shape everyone
          already knows from their inbox (Jakob's Law).

          `h-full min-h-0` on the wrapper and `min-h-0` on both panes: the
          shell gives `main` a fixed height, so bounding this makes each pane
          scroll independently instead of the page scrolling as one. Without
          `min-h-0` a flex child refuses to shrink below its content and both
          panes grow the page instead. */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Index. Fixed width on desktop so the reading measure stays stable
            as the window resizes; full width on mobile, where it swaps with
            the detail rather than sitting beside it. */}
        <Workspace
          className={cn(
            "min-h-0 lg:w-[22rem] lg:flex-none xl:w-[26rem]",
            selectedContact && "hidden lg:flex",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-none border-b border-[var(--adm-line)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">
              {filteredContacts.length} {filteredContacts.length === 1 ? "enquiry" : "enquiries"}
            </div>
            <div className="min-h-0 flex-1">
              <ContactList
                contacts={filteredContacts}
                selectedId={selectedContact?.id}
                onSelect={openContact}
                statusMeta={STATUS_META}
                emptyTitle={contacts.length === 0 ? "No contacts yet" : "No contacts match your filters"}
                emptyDescription={
                  contacts.length === 0
                    ? "Submissions from the website contact form will appear here."
                    : "Try adjusting your search or clearing a filter."
                }
                emptyAction={
                  contacts.length > 0 && hasActiveFilters
                    ? <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>
                    : undefined
                }
              />
            </div>
          </div>
        </Workspace>

        {/* Reading pane */}
        <Workspace className={cn("min-h-0 flex-1", !selectedContact && "hidden lg:flex")}>
          {selectedContact ? (
            <>
              {/* Back to the list, mobile only, where the panes swap. */}
              <button
                onClick={() => setSelectedContact(null)}
                className="flex flex-none items-center gap-1.5 border-b border-[var(--adm-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)] lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" /> All enquiries
              </button>
              <ContactDetail
                contact={selectedContact}
                statuses={STATUSES}
                statusMeta={STATUS_META}
                onStatusChange={handleStatusChange}
                onDelete={setPendingDelete}
              />
            </>
          ) : (
            <div className="grid h-full place-items-center p-8">
              <div className="text-center">
                <IconMessage className="mx-auto h-8 w-8 text-[var(--adm-line-strong)]" />
                <p className="mt-3 text-[14px] font-semibold text-[var(--adm-ink-mute)]">
                  Select an enquiry to read it
                </p>
                <p className="mt-1 text-[13px] text-[var(--adm-ink-subtle)]">
                  Use ↑ and ↓ to move through the list.
                </p>
              </div>
            </div>
          )}
        </Workspace>
      </div>

    </div>
  );
}
