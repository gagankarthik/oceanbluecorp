"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
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
import { Contact } from "@/lib/aws/dynamodb";

const statusConfig = {
  new: { label: "New", bg: "bg-blue-100 text-blue-800", dot: "bg-blue-500", icon: Inbox },
  read: { label: "Read", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500", icon: MailOpen },
  responded: { label: "Responded", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", icon: CheckCircle2 },
  archived: { label: "Archived", bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400", icon: Archive },
};

const inquiryTypeConfig: Record<string, { textColor: string; bgColor: string }> = {
  "General Inquiry": { textColor: "text-blue-700", bgColor: "bg-blue-50" },
  "Business Partnership": { textColor: "text-purple-700", bgColor: "bg-purple-50" },
  "Careers": { textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
  "Technical Support": { textColor: "text-orange-700", bgColor: "bg-orange-50" },
  "Sales Inquiry": { textColor: "text-cyan-700", bgColor: "bg-cyan-50" },
  "Media Inquiry": { textColor: "text-pink-700", bgColor: "bg-pink-50" },
  "Other": { textColor: "text-gray-700", bgColor: "bg-gray-50" },
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
      alert("Failed to update contact status");
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete contact");
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setSelectedContact(null);
    } catch {
      alert("Failed to delete contact");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-rose-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{contacts.length}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage inquiries from website visitors</p>
        </div>
        <button onClick={handleExportCSV} disabled={filteredContacts.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          <Download className="w-4 h-4" /><span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare, gradient: "from-blue-500 to-cyan-500" },
          { label: "New", value: stats.new, icon: Inbox, gradient: "from-blue-400 to-blue-600" },
          { label: "Read", value: stats.read, icon: MailOpen, gradient: "from-amber-400 to-orange-500" },
          { label: "Responded", value: stats.responded, icon: CheckCircle2, gradient: "from-emerald-400 to-emerald-600" },
        ].map(stat => (
          <div key={stat.label} className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${showFilters || statusFilter !== "all" || inquiryFilter !== "all" ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {(statusFilter !== "all" || inquiryFilter !== "all") && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-medium">{[statusFilter !== "all", inquiryFilter !== "all"].filter(Boolean).length}</span>
            )}
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700">
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </select>
            <select value={inquiryFilter} onChange={e => setInquiryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700">
              <option value="all">All Inquiry Types</option>
              {inquiryTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {(statusFilter !== "all" || inquiryFilter !== "all") && (
              <button onClick={() => { setStatusFilter("all"); setInquiryFilter("all"); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Clear filters</button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">{filteredContacts.length} of {contacts.length} contacts</p>

      {/* Contact List */}
      <div className="space-y-3">
        {filteredContacts.length > 0 ? filteredContacts.map(contact => {
          const inquiryStyle = inquiryTypeConfig[contact.inquiryType] || inquiryTypeConfig["Other"];
          return (
            <div key={contact.id} onClick={() => { setSelectedContact(contact); if (contact.status === "new") handleStatusChange(contact.id, "read"); }}
              className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{contact.firstName} {contact.lastName}</h3>
                        {contact.status === "new" && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 flex-shrink-0" />{contact.company}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inquiryStyle.bgColor} ${inquiryStyle.textColor}`}>{contact.inquiryType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={contact.status} />
                      <span className="text-xs text-gray-400 hidden sm:block">{formatTimeAgo(contact.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{contact.message}</p>
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`mailto:${contact.email}?subject=Re: ${contact.inquiryType} Inquiry`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      <Send className="w-3 h-3" /> Reply
                    </a>
                    <button onClick={e => { e.stopPropagation(); handleDelete(contact.id); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="border border-gray-200 rounded-xl bg-white p-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No contacts found</h3>
            <p className="text-gray-500 text-sm">{contacts.length === 0 ? "No contact submissions yet" : "No contacts match your search criteria"}</p>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContact(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedContact.firstName} {selectedContact.lastName}</h2>
                  <p className="text-gray-500 text-sm">{selectedContact.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h3>
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                      <Mail className="w-4 h-4 text-gray-400" />{selectedContact.email}
                    </a>
                    {selectedContact.phone && (
                      <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4 text-gray-400" />{selectedContact.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600"><Building2 className="w-4 h-4 text-gray-400" />{selectedContact.company}</div>
                    {selectedContact.jobTitle && <div className="flex items-center gap-3 text-sm text-gray-600"><Briefcase className="w-4 h-4 text-gray-400" />{selectedContact.jobTitle}</div>}
                    <div className="flex items-center gap-3 text-sm text-gray-600"><Calendar className="w-4 h-4 text-gray-400" />{new Date(selectedContact.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Inquiry Type</p>
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${(inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).bgColor} ${(inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).textColor}`}>
                      {selectedContact.inquiryType}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status & Actions</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Update Status</label>
                    <select value={selectedContact.status} onChange={e => handleStatusChange(selectedContact.id, e.target.value as Contact["status"])} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <a href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.inquiryType} Inquiry`} onClick={() => { if (selectedContact.status !== "responded") handleStatusChange(selectedContact.id, "responded"); }} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
                    <Send className="w-4 h-4" /> Reply via Email
                  </a>
                  <button onClick={() => handleDelete(selectedContact.id)} className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-medium text-sm">
                    <Trash2 className="w-4 h-4" /> Delete Contact
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
