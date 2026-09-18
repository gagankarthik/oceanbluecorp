"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { ContactTable, CONTACT_COLUMN_OPTIONS } from "@/components/admin/contacts/contact-table";
import { CONTACT_STATUSES, CONTACT_STATUS_META, type ContactStatus } from "@/components/admin/contacts/contact-status";

const STATUS_TABS = [{ key: "all", label: "All" }, ...CONTACT_STATUSES.map((s) => ({ key: s.key as string, label: s.label }))];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [rows, setRows] = useLocalStorage<number>("adm.contacts.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.contacts.hiddenCols", []);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep-link search (global command palette links here as ?search=<name>).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearchQuery(q);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
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

  return (
    <>
      <WorkspaceTitle
        title="Contacts"
        actions={
          <WorkspaceButton onClick={exportCSV} disabled={filteredContacts.length === 0} aria-label="Export CSV">
            <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </WorkspaceButton>
        }
      />
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
          <DisplayMenu
            columns={CONTACT_COLUMN_OPTIONS}
            hidden={hiddenColumns}
            onHiddenChange={setHiddenColumns}
            rows={rows}
            onRowsChange={setRows}
            onReset={() => { setHiddenColumns([]); setRows(25); }}
          />
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
            ? [{ label: `Status: ${CONTACT_STATUS_META[statusFilter]?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }]
            : []),
          ...(inquiryFilter !== "all"
            ? [{ label: `Type: ${inquiryFilter}`, onClear: () => setInquiryFilter("all") }]
            : []),
        ]}
        onClearAll={clearFilters}
      />

      <Workspace>
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
