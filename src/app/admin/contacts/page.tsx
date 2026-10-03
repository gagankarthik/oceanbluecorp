"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { cn } from "@/lib/utils";
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
  Workspace, BrandBand, BAND_PRIMARY, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu,
} from "@/components/admin/workspace";
import { ContactTable, contactColumnOptions, type ContactPath } from "@/components/admin/contacts/contact-table";
import { CONTACT_STATUSES, CONTACT_STATUS_META, type ContactStatus } from "@/components/admin/contacts/contact-status";

const STATUS_TABS = [{ key: "all", label: "All" }, ...CONTACT_STATUSES.map((s) => ({ key: s.key as string, label: s.label }))];

// The website's contact page has two paths; this inbox mirrors them.
const PATHS: Array<{ key: ContactPath; label: string }> = [
  { key: "hiring", label: "Hiring staff" },
  { key: "work", label: "Looking for work" },
  { key: "all", label: "All enquiries" },
];

const onPath = (c: Contact, path: ContactPath) => path === "all" || (path === "work") === isJobSeeker(c.inquiryType);

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
  const [path, setPathState] = useState<ContactPath>("hiring");
  const [rows, setRows] = useLocalStorage<number>("adm.contacts.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.contacts.hiddenCols", []);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Deep links: ?search=<name> from the command palette, ?for=hiring|work|all.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    if (q) { setSearchQuery(q); setPathState("all"); }
    const p = params.get("for");
    if (p === "hiring" || p === "work" || p === "all") setPathState(p);
  }, []);

  const setPath = (p: ContactPath) => {
    setPathState(p);
    // A type picked on one path means nothing on the other.
    setInquiryFilter("all");
    const url = new URL(window.location.href);
    url.searchParams.set("for", p);
    window.history.replaceState(null, "", url);
  };

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

  const pathContacts = useMemo(() => contacts.filter((c) => onPath(c, path)), [contacts, path]);

  const inquiryTypes = useMemo(
    () => [...new Set(pathContacts.map(c => c.inquiryType).filter(Boolean))].sort(),
    [pathContacts],
  );

  const filteredContacts = useMemo(() => pathContacts.filter(contact => {
    const q = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      (contact.company || "").toLowerCase().includes(q) ||
      contact.message.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesInquiry = inquiryFilter === "all" || contact.inquiryType === inquiryFilter;
    return matchesSearch && matchesStatus && matchesInquiry;
  }), [pathContacts, searchQuery, statusFilter, inquiryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pathContacts.length };
    for (const s of CONTACT_STATUSES) counts[s.key] = pathContacts.filter(c => c.status === s.key).length;
    return counts;
  }, [pathContacts]);

  const pathCounts = useMemo(() => Object.fromEntries(PATHS.map((p) => {
    const list = contacts.filter((c) => onPath(c, p.key));
    return [p.key, { total: list.length, unread: list.filter((c) => c.status === "new").length }];
  })) as Record<ContactPath, { total: number; unread: number }>, [contacts]);

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

  const responseRate = pathContacts.length > 0
    ? `${Math.round(((statusCounts.responded || 0) / pathContacts.length) * 100)}%`
    : "–";

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

  return (
    <>
      <BrandBand
        size="sm"
        className="mb-3"
        title="Contacts"
        meta={`${pathContacts.length.toLocaleString()} ${path === "work" ? "job-seeker " : path === "hiring" ? "hiring " : ""}enquir${pathContacts.length === 1 ? "y" : "ies"} from the website`}
        stats={[
          { label: "Awaiting a reply", value: statusCounts.new || 0,
            onClick: () => setStatusFilter("new"),
          selected: statusFilter === "new" },
          { label: "Read, not answered", value: statusCounts.read || 0,
            onClick: () => setStatusFilter("read"),
          selected: statusFilter === "read" },
          { label: "Responded", value: statusCounts.responded || 0,
            onClick: () => setStatusFilter("responded"),
          selected: statusFilter === "responded" },
          { label: "Response rate", value: responseRate,
            hint: "Of the enquiries in this view" },
        ]}
        actions={
          <WorkspaceButton onClick={exportCSV} disabled={filteredContacts.length === 0} aria-label="Export CSV">
            <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </WorkspaceButton>
        }
      />

      <div role="tablist" aria-label="Who the enquiry is from" className="mb-3 flex gap-1 overflow-x-auto border-b border-[var(--adm-line)]">
        {PATHS.map((p) => {
          const active = path === p.key;
          const count = pathCounts[p.key];
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPath(p.key)}
              className={cn(
                "-mb-px inline-flex h-11 flex-none items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium transition-colors duration-150",
                active
                  ? "border-[var(--adm-accent)] text-[var(--adm-ink)]"
                  : "border-transparent text-[var(--adm-ink-mute)] hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]",
              )}
            >
              {p.label}
              <span className="rounded-full bg-[var(--adm-surface-2)] px-1.5 py-px text-[11.5px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                {count.total}
              </span>
              {count.unread > 0 && (
                <span className="rounded-full bg-[var(--adm-accent)] px-1.5 py-px text-[11.5px] font-semibold tabular-nums text-white">
                  {count.unread} new
                </span>
              )}
            </button>
          );
        })}
      </div>

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
            columns={contactColumnOptions(path)}
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
          label={path === "work" ? "Area" : "Type"}
          icon={FilterIcon.type}
          value={inquiryFilter}
          onChange={setInquiryFilter}
          options={[
            { value: "all", label: path === "work" ? "All areas" : "All types" },
            ...inquiryTypes.map((t) => ({
              value: t,
              label: isJobSeeker(t) ? seekerArea(t) : t,
              count: pathContacts.filter((c) => c.inquiryType === t).length,
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
            ? [{ label: `${path === "work" ? "Area" : "Type"}: ${isJobSeeker(inquiryFilter) ? seekerArea(inquiryFilter) : inquiryFilter}`, onClear: () => setInquiryFilter("all") }]
            : []),
        ]}
        onClearAll={clearFilters}
      />

      <Workspace>
        <ContactTable
          path={path}
          contacts={filteredContacts}
          onOpen={(c) => router.push(`/admin/contacts/${c.id}`)}
          onStatusChange={handleStatusChange}
          onDelete={setPendingDelete}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          empty={{
            title: pathContacts.length === 0
              ? (path === "work" ? "No job seekers yet" : path === "hiring" ? "No hiring enquiries yet" : "No contacts yet")
              : "No contacts match your filters",
            description: pathContacts.length === 0
              ? (path === "work"
                ? "People who choose \"Finding work\" on the contact page will appear here."
                : "Submissions from the website contact form will appear here.")
              : "Try adjusting your search or clearing a filter.",
            action: pathContacts.length > 0 && hasActiveFilters
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
