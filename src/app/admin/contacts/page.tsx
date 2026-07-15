"use client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { AdminCard } from "@/components/admin/admin-card";
import { StatCard } from "@/components/admin/stat-card";
import { EmptyState } from "@/components/admin/empty-state";
import { SearchInput, FilterToggle } from "@/components/admin/toolbar";
import { FilterChips } from "@/components/admin/filter-chips";
import { FormSelect } from "@/components/admin/forms/primitives";

import { useState, useEffect } from "react";
import {
  Download,
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Archive,
  Clock,
  Trash2,
  Loader2,
  Briefcase,
  Send,
  X,
  Inbox,
  MailOpen,
} from "lucide-react";
import type { Contact } from "@/lib/aws/dynamodb";

const statusConfig = {
  new: { label: "New", bg: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]", dot: "bg-[var(--hz-cobalt)]", icon: Inbox },
  read: { label: "Read", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500", icon: MailOpen },
  responded: { label: "Responded", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", icon: CheckCircle2 },
  archived: { label: "Archived", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400", icon: Archive },
};

const inquiryTypeConfig: Record<string, { textColor: string; bgColor: string }> = {
  "General Inquiry": { textColor: "text-[var(--hz-cobalt)]", bgColor: "bg-[var(--hz-cobalt-100)]" },
  "Business Partnership": { textColor: "text-purple-700", bgColor: "bg-purple-50" },
  "Careers": { textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
  "Technical Support": { textColor: "text-orange-700", bgColor: "bg-orange-50" },
  "Sales Inquiry": { textColor: "text-cyan-700", bgColor: "bg-cyan-50" },
  "Media Inquiry": { textColor: "text-pink-700", bgColor: "bg-pink-50" },
  "Other": { textColor: "text-slate-700", bgColor: "bg-slate-50" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const inquiryTypes = [...new Set(contacts.map(c => c.inquiryType).filter(Boolean))];

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesInquiry = inquiryFilter === "all" || contact.inquiryType === inquiryFilter;
    return matchesSearch && matchesStatus && matchesInquiry;
  });

  const handleStatusChange = async (contactId: string, newStatus: Contact["status"]) => {
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

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleExportCSV = () => {
    const headers = ["Name","Email","Phone","Company","Job Title","Inquiry Type","Status","Date","Message"];
    const rows = filteredContacts.map(contact => [
      `"${contact.firstName} ${contact.lastName}"`,
      `"${contact.email}"`,
      `"${contact.phone || ""}"`,
      `"${contact.company}"`,
      `"${contact.jobTitle || ""}"`,
      `"${contact.inquiryType}"`,
      `"${contact.status}"`,
      `"${new Date(contact.createdAt).toLocaleDateString()}"`,
      `"${contact.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === "new").length,
    read: contacts.filter(c => c.status === "read").length,
    responded: contacts.filter(c => c.status === "responded").length,
  };

  if (loading) return <AdminListSkeleton rows={8} />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-rose-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)]">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete contact?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <PageHeader
        title="Contact Submissions"
        subtitle="Manage inquiries from website visitors"
        icon={MessageSquare}
        meta={<span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{contacts.length} total</span>}
        actions={
          <PageHeaderButton variant="secondary" onClick={handleExportCSV} disabled={filteredContacts.length === 0}>
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export CSV</span>
          </PageHeaderButton>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard size="sm" label="Total" value={stats.total} icon={MessageSquare} tone="blue" />
        <StatCard size="sm" label="New" value={stats.new} icon={Inbox} tone="indigo" />
        <StatCard size="sm" label="Read" value={stats.read} icon={MailOpen} tone="amber" />
        <StatCard size="sm" label="Responded" value={stats.responded} icon={CheckCircle2} tone="emerald" />
      </div>

      {/* Toolbar */}
      <AdminCard className="space-y-3 p-3">
        <div className="flex gap-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, email, company, message…" />
          <FilterToggle
            open={showFilters}
            activeCount={[statusFilter !== "all", inquiryFilter !== "all"].filter(Boolean).length}
            onClick={() => setShowFilters(!showFilters)}
          />
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </FormSelect>
            <FormSelect value={inquiryFilter} onChange={e => setInquiryFilter(e.target.value)}>
              <option value="all">All Inquiry Types</option>
              {inquiryTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </FormSelect>
          </div>
        )}
        <FilterChips
          chips={[
            ...(statusFilter !== "all" ? [{ key: "status", label: "Status", value: statusConfig[statusFilter as keyof typeof statusConfig]?.label ?? statusFilter, onRemove: () => setStatusFilter("all") }] : []),
            ...(inquiryFilter !== "all" ? [{ key: "inquiry", label: "Type", value: inquiryFilter, onRemove: () => setInquiryFilter("all") }] : []),
          ]}
          onClearAll={() => { setStatusFilter("all"); setInquiryFilter("all"); }}
        />
      </AdminCard>

      <p className="text-xs text-slate-400">{filteredContacts.length} of {contacts.length} contacts</p>

      {/* Contact List */}
      <div className="space-y-3">
        {filteredContacts.length > 0 ? filteredContacts.map(contact => {
          const inquiryStyle = inquiryTypeConfig[contact.inquiryType] || inquiryTypeConfig["Other"];
          return (
            <div key={contact.id} onClick={() => { setSelectedContact(contact); if (contact.status === "new") handleStatusChange(contact.id, "read"); }}
              className="border border-slate-200 rounded-xl bg-white shadow-sm p-4 cursor-pointer hover:border-[var(--hz-cobalt-100)] hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{contact.firstName} {contact.lastName}</h3>
                        {contact.status === "new" && <span className="w-2 h-2 bg-[var(--hz-cobalt)] rounded-full flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 flex-shrink-0" />{contact.company}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inquiryStyle.bgColor} ${inquiryStyle.textColor}`}>{contact.inquiryType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={contact.status} />
                      <span className="text-xs text-slate-400 hidden sm:block">{formatTimeAgo(contact.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{contact.message}</p>
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <a href={`mailto:${contact.email}?subject=Re: ${contact.inquiryType} Inquiry`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] rounded-lg text-xs font-medium hover:bg-[var(--hz-cobalt-100)] transition-colors">
                      <Send className="w-3 h-3" /> Reply
                    </a>
                    <button onClick={e => { e.stopPropagation(); setPendingDelete(contact.id); }} className="inline-flex items-center gap-1.5 px-3 py-2.5 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <AdminCard>
            <EmptyState
              icon={MessageSquare}
              tone="blue"
              title="No contacts found"
              description={contacts.length === 0 ? "Submissions from the website contact form will appear here." : "No contacts match your search — try clearing a filter."}
            />
          </AdminCard>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContact(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-600 flex items-center justify-center text-white font-bold">
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedContact.firstName} {selectedContact.lastName}</h2>
                  <p className="text-slate-500 text-sm">{selectedContact.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" aria-hidden="true" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact Information</h3>
                  <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-[var(--hz-cobalt)] transition-colors">
                      <Mail className="w-4 h-4 text-slate-400" />{selectedContact.email}
                    </a>
                    {selectedContact.phone && (
                      <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-[var(--hz-cobalt)] transition-colors">
                        <Phone className="w-4 h-4 text-slate-400" />{selectedContact.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-600"><Building2 className="w-4 h-4 text-slate-400" />{selectedContact.company}</div>
                    {selectedContact.jobTitle && <div className="flex items-center gap-3 text-sm text-slate-600"><Briefcase className="w-4 h-4 text-slate-400" />{selectedContact.jobTitle}</div>}
                    <div className="flex items-center gap-3 text-sm text-slate-600"><Calendar className="w-4 h-4 text-slate-400" />{new Date(selectedContact.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Inquiry Type</p>
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${(inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).bgColor} ${(inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).textColor}`}>
                      {selectedContact.inquiryType}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status & Actions</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Update Status</label>
                    <select value={selectedContact.status} autoComplete="off" onChange={e => handleStatusChange(selectedContact.id, e.target.value as Contact["status"])} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)] bg-white">
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <a href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.inquiryType} Inquiry`} onClick={() => { if (selectedContact.status !== "responded") handleStatusChange(selectedContact.id, "responded"); }} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--hz-cobalt)] text-white rounded-xl hover:bg-[var(--hz-cobalt-600)] transition-colors font-medium text-sm">
                    <Send className="w-4 h-4" /> Reply via Email
                  </a>
                  <button onClick={() => setPendingDelete(selectedContact.id)} className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-medium text-sm">
                    <Trash2 className="w-4 h-4" /> Delete Contact
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
