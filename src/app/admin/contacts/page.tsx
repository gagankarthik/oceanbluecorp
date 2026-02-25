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
  Eye,
  CheckCircle2,
  Archive,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  User,
  Briefcase,
  ExternalLink,
  MailOpen,
  Send,
  X,
  Inbox,
} from "lucide-react";
import { Contact } from "@/lib/aws/dynamodb";

const statusConfig = {
  new: {
    label: "New",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    icon: Inbox,
  },
  read: {
    label: "Read",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    icon: MailOpen,
  },
  responded: {
    label: "Responded",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    dotColor: "bg-slate-400",
    icon: Archive,
  },
};

const inquiryTypeConfig: Record<string, { color: string; bgColor: string }> = {
  "General Inquiry": { color: "text-blue-700", bgColor: "bg-blue-50" },
  "Business Partnership": { color: "text-purple-700", bgColor: "bg-purple-50" },
  "Careers": { color: "text-green-700", bgColor: "bg-green-50" },
  "Technical Support": { color: "text-orange-700", bgColor: "bg-orange-50" },
  "Sales Inquiry": { color: "text-cyan-700", bgColor: "bg-cyan-50" },
  "Media Inquiry": { color: "text-pink-700", bgColor: "bg-pink-50" },
  "Other": { color: "text-slate-700", bgColor: "bg-slate-50" },
};

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

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch contacts");
        }

        setContacts(data.contacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const inquiryTypes = [...new Set(contacts.map((c) => c.inquiryType).filter(Boolean))];

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, status: newStatus } : contact
        )
      );

      if (selectedContact?.id === contactId) {
        setSelectedContact({ ...selectedContact, status: newStatus });
      }
    } catch (err) {
      alert("Failed to update contact status");
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete contact");
      }

      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      setSelectedContact(null);
    } catch (err) {
      alert("Failed to delete contact");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Company", "Job Title", "Inquiry Type", "Status", "Date", "Message"];
    const rows = filteredContacts.map((contact) => [
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

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const stats = {
    total: contacts.length,
    new: contacts.filter((c) => c.status === "new").length,
    read: contacts.filter((c) => c.status === "read").length,
    responded: contacts.filter((c) => c.status === "responded").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage inquiries from website visitors
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredContacts.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              <p className="text-xs text-gray-500">New</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
              <p className="text-xs text-gray-500">Read</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.responded}</p>
              <p className="text-xs text-gray-500">Responded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${
                showFilters || statusFilter !== "all" || inquiryFilter !== "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(statusFilter !== "all" || inquiryFilter !== "all") && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                  {[statusFilter !== "all", inquiryFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={inquiryFilter}
                onChange={(e) => setInquiryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All Inquiry Types</option>
                {inquiryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {(statusFilter !== "all" || inquiryFilter !== "all") && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setInquiryFilter("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredContacts.length} of {contacts.length} contacts
        </p>
      </div>

      {/* Contact List */}
      <div className="space-y-3">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => {
            const status = statusConfig[contact.status as keyof typeof statusConfig] || statusConfig.new;
            const inquiryStyle = inquiryTypeConfig[contact.inquiryType] || inquiryTypeConfig["Other"];
            const StatusIcon = status.icon;

            return (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  if (contact.status === "new") {
                    handleStatusChange(contact.id, "read");
                  }
                }}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {contact.firstName} {contact.lastName}
                          </h3>
                          {contact.status === "new" && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            {contact.company}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inquiryStyle.bgColor} ${inquiryStyle.color}`}>
                            {contact.inquiryType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        <span className={`sm:hidden w-2.5 h-2.5 rounded-full ${status.dotColor}`} />
                        <span className="text-xs text-gray-400">{formatTimeAgo(contact.createdAt)}</span>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {contact.message}
                    </p>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`mailto:${contact.email}?subject=Re: ${contact.inquiryType} Inquiry`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Reply
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No contacts found</h3>
            <p className="text-gray-500 text-sm">
              {contacts.length === 0
                ? "No contact submissions yet"
                : "No contacts match your search criteria"}
            </p>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <p className="text-gray-500 text-sm">{selectedContact.company}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Contact Information
                  </h3>
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedContact.email}
                    </a>
                    {selectedContact.phone && (
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedContact.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {selectedContact.company}
                    </div>
                    {selectedContact.jobTitle && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {selectedContact.jobTitle}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(selectedContact.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Inquiry Type */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Inquiry Type</h4>
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${
                      (inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).bgColor
                    } ${
                      (inquiryTypeConfig[selectedContact.inquiryType] || inquiryTypeConfig["Other"]).color
                    }`}>
                      {selectedContact.inquiryType}
                    </span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Status & Actions</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Update Status</label>
                    <select
                      value={selectedContact.status}
                      onChange={(e) => handleStatusChange(selectedContact.id, e.target.value as Contact["status"])}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="responded">Responded</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.inquiryType} Inquiry`}
                      onClick={() => {
                        if (selectedContact.status !== "responded") {
                          handleStatusChange(selectedContact.id, "responded");
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Reply via Email
                    </a>
                    <button
                      onClick={() => handleDelete(selectedContact.id)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Contact
                    </button>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Message
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-5 border border-gray-100">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
