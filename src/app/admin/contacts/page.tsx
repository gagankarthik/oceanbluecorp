"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { IconDownload } from "@/components/admin/icons";
import type { Contact } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminCard } from "@/components/admin/admin-card";
import {
  Workspace, WorkspaceButton, WorkspaceSearch, FilterPill, FilterIcon, DisplayMenu,
} from "@/components/admin/workspace";
import { ListHeader, ListTabs, ListToolbar, MetaStrong, FilterChips, FilterSet, type ListFilter } from "@/components/admin/list-shell";
import { ContactTable, CONTACT_COLUMN_OPTIONS } from "@/components/admin/contacts/contact-table";
import { CONTACT_STATUSES, type ContactStatus } from "@/components/admin/contacts/contact-status";

const STATUS_TABS = [{ key: "all", label: "All" }, ...CONTACT_STATUSES.map((s) => ({ key: s.key as string, label: s.label }))];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Skeleton on first load only; later reloads keep the list on screen.
  const loadedOnce = useRef(false);
  useEffect(() => { if (!loading && !error) loadedOnce.current = true; }, [loading, error]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [rows, setRows] = useLocalStorage<number>("adm.contacts.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.contacts.hiddenCols", []);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep link: ?search=<name> from the command palette.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearchQuery(q);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      if (!loadedOnce.current) setLoading(true);
      setError(null);
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch contacts");
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchContacts(); }, [fetchContacts]);

  // ── derived ───────────────────────────────────────────────────────────────


  const inquiryTypes = useMemo(
    () => [...new Set(contacts.map(c => c.inquiryType).filter(Boolean))].sort(),
    [contacts],
  );

  const filteredContacts = useMemo(() => contacts.filter(contact => {
    const q = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      (contact.company || "").toLowerCase().includes(q) ||
      contact.message.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesInquiry = inquiryFilter === "all" || contact.inquiryType === inquiryFilter;
    return matchesSearch && matchesStatus && matchesInquiry;
  }), [contacts, searchQuery, statusFilter, inquiryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contacts.length };
    for (const s of CONTACT_STATUSES) counts[s.key] = contacts.filter(c => c.status === s.key).length;
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
      toast.success("Contact deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => downloadCsv(
    "contacts",
    ["Name", "For", "Email", "Phone", "Company", "Job Title", "Enquiry / area", "LinkedIn", "Status", "Date", "Message"],
    filteredContacts.map((c) => [
      `${c.firstName} ${c.lastName}`,
      isJobSeeker(c.inquiryType) ? "Looking for work" : "Hiring staff",
      c.email,
      c.phone || "",
      c.company,
      c.jobTitle || "",
      isJobSeeker(c.inquiryType) ? seekerArea(c.inquiryType) : c.inquiryType,
      c.linkedinUrl || "",
      c.status,
      fmtDate(c.createdAt),
      c.message,
    ]),
  );

  const hasActiveFilters = statusFilter !== "all" || inquiryFilter !== "all" || searchQuery.trim() !== "";

  const clearFilters = () => { setStatusFilter("all"); setInquiryFilter("all"); setSearchQuery(""); };

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} label="Loading contacts" />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <AdminCard className="w-full max-w-md">
          <EmptyState
            variant="error"
            title="Could not load contact submissions"
            description={error}
            action={<WorkspaceButton variant="primary" onClick={fetchContacts}>Retry</WorkspaceButton>}
          />
        </AdminCard>
      </div>
    );
  }

  const listFilters: ListFilter[] = [
    { key: "type", label: "Type", value: inquiryFilter, onChange: setInquiryFilter, options: [
                { value: "all", label: "All types" },
                ...inquiryTypes.map((t) => ({
                  value: t,
                  label: isJobSeeker(t) ? `Job seeker: ${seekerArea(t)}` : t,
                  count: contacts.filter((c) => c.inquiryType === t).length,
                })),
              ] },
  ];

  return (
    <>
      <ListHeader
        title="Contacts"
        meta={<>
          {contacts.length.toLocaleString()} enquir{contacts.length === 1 ? "y" : "ies"} from the website
          {statusCounts.new ? <>, <MetaStrong>{statusCounts.new} awaiting a reply</MetaStrong></> : null}
        </>}
        actions={
          <WorkspaceButton onClick={exportCSV} disabled={filteredContacts.length === 0} aria-label="Export CSV">
            <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </WorkspaceButton>
        }
      />

      <Workspace>
        <ListToolbar
          tabs={
            <ListTabs
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              tabs={STATUS_TABS
                .filter((t) => t.key !== "archived" || statusCounts.archived)
                .map((t) => ({ key: t.key, label: t.label, count: statusCounts[t.key] || 0 }))}
            />
          }
          search={<WorkspaceSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search contacts…" />}
        >
            <FilterSet filters={listFilters} />
            <DisplayMenu
              columns={CONTACT_COLUMN_OPTIONS}
              hidden={hiddenColumns}
              onHiddenChange={setHiddenColumns}
              rows={rows}
              onRowsChange={setRows}
              onReset={() => { setHiddenColumns([]); setRows(25); }}
            />
        </ListToolbar>
        <FilterChips filters={listFilters} />

        <ContactTable
          contacts={filteredContacts}
          onOpen={(c) => router.push(`/admin/contacts/${c.id}`)}
          onStatusChange={handleStatusChange}
          onDelete={setPendingDelete}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          empty={{
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

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete contact?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
