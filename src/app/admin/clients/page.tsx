"use client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { StatCard } from "@/components/admin/stat-card";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { SearchInput, FilterToggle } from "@/components/admin/toolbar";
import { FilterChips } from "@/components/admin/filter-chips";
import { Field, FormInput, FormSelect } from "@/components/admin/forms/primitives";

import { useState, useEffect } from "react";
import {
  Download,
  Plus,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import type { Client } from "@/lib/aws/dynamodb";

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    dotColor: "bg-slate-400",
    icon: XCircle,
  },
};

interface FormData {
  name: string;
  websiteUrl: string;
  status: "active" | "inactive";
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const initialFormData: FormData = {
  name: "",
  websiteUrl: "",
  status: "active",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
};

interface FormErrors {
  name?: string;
  websiteUrl?: string;
  status?: string;
  email?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch clients");
      }

      setClients(data.clients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Client name is required";
    }

    if (!formData.websiteUrl.trim()) {
      errors.websiteUrl = "Website URL is required";
    } else {
      try {
        new URL(formData.websiteUrl);
      } catch {
        errors.websiteUrl = "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    if (!formData.status) {
      errors.status = "Status is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save client");
      }

      await fetchClients();
      setShowForm(false);
      setEditingClient(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      websiteUrl: client.websiteUrl,
      status: client.status,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
    });
    setFormErrors({});
    setShowForm(true);
  };

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/clients/${pendingDelete}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete client");
      setClients((prev) => prev.filter((client) => client.id !== pendingDelete));
      toast.success("Client deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Website URL", "Status", "Email", "Phone", "Address", "City", "State", "ZIP Code", "Created At"];
    const rows = filteredClients.map((client) => [
      `"${client.name}"`,
      `"${client.websiteUrl}"`,
      `"${client.status}"`,
      `"${client.email || ""}"`,
      `"${client.phone || ""}"`,
      `"${client.address || ""}"`,
      `"${client.city || ""}"`,
      `"${client.state || ""}"`,
      `"${client.zipCode || ""}"`,
      `"${new Date(client.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
  };

  if (loading) return <AdminListSkeleton rows={8} />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete client?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <PageHeader
        title="Client Management"
        subtitle="Manage your client records"
        icon={Building2}
        actions={
          <>
            <PageHeaderButton variant="secondary" onClick={handleExportCSV} disabled={filteredClients.length === 0}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </PageHeaderButton>
            <PageHeaderButton
              variant="primary"
              onClick={() => {
                setEditingClient(null);
                setFormData(initialFormData);
                setFormErrors({});
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Client
            </PageHeaderButton>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard size="sm" label="Total clients" value={stats.total} icon={Building2} tone="blue" />
        <StatCard size="sm" label="Active" value={stats.active} icon={CheckCircle2} tone="emerald" />
        <StatCard size="sm" label="Inactive" value={stats.inactive} icon={XCircle} tone="slate" />
      </div>

      {/* Toolbar */}
      <AdminCard className="space-y-3 p-3">
        <div className="flex gap-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, website, email, location…" />
          <FilterToggle
            open={showFilters}
            activeCount={statusFilter !== "all" ? 1 : 0}
            onClick={() => setShowFilters(!showFilters)}
          />
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
            <FormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormSelect>
          </div>
        )}
        <FilterChips
          chips={statusFilter !== "all" ? [{ key: "status", label: "Status", value: statusFilter, onRemove: () => setStatusFilter("all") }] : []}
        />
      </AdminCard>

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {filteredClients.length} of {clients.length} clients
      </p>

      {/* Client Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const status = statusConfig[client.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{client.name}</p>
                            <a
                              href={client.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] flex items-center gap-1 truncate"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{client.websiteUrl.replace(/^https?:\/\//, "")}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {client.email && (
                            <a href={`mailto:${client.email}`} className="text-sm text-slate-600 hover:text-[var(--hz-cobalt)] flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {client.email}
                            </a>
                          )}
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="text-sm text-slate-600 hover:text-[var(--hz-cobalt)] flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {client.phone}
                            </a>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-sm text-slate-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {client.city || client.state || client.zipCode ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {[client.city, client.state, client.zipCode].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No location</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(client.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 text-slate-500 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDelete(client.id)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Building2}
                      tone="blue"
                      title="No clients found"
                      description={clients.length === 0 ? "Add your first client to start tracking accounts." : "No clients match your search — try clearing a filter."}
                      action={clients.length === 0 ? (
                        <PageHeaderButton variant="primary" onClick={() => { setEditingClient(null); setFormData(initialFormData); setFormErrors({}); setShowForm(true); }}>
                          <Plus className="w-3.5 h-3.5" /> Add client
                        </PageHeaderButton>
                      ) : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Client Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingClient ? "Edit client" : "Add new client"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingClient(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Required Fields Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    Required Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Client name" required>
                      <FormInput
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter client name"
                        className={formErrors.name ? "border-rose-300 bg-rose-50" : ""}
                      />
                      {formErrors.name && <p className="mt-1.5 text-sm text-rose-600">{formErrors.name}</p>}
                    </Field>
                    <Field label="Website URL" required>
                      <FormInput
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        className={formErrors.websiteUrl ? "border-rose-300 bg-rose-50" : ""}
                      />
                      {formErrors.websiteUrl && <p className="mt-1.5 text-sm text-rose-600">{formErrors.websiteUrl}</p>}
                    </Field>
                    <Field label="Status" required fullWidth>
                      <FormSelect
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                        className={formErrors.status ? "border-rose-300 bg-rose-50" : ""}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </FormSelect>
                      {formErrors.status && <p className="mt-1.5 text-sm text-rose-600">{formErrors.status}</p>}
                    </Field>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Email">
                      <FormInput
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@example.com"
                        className={formErrors.email ? "border-rose-300 bg-rose-50" : ""}
                      />
                      {formErrors.email && <p className="mt-1.5 text-sm text-rose-600">{formErrors.email}</p>}
                    </Field>
                    <Field label="Phone number">
                      <FormInput
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(123) 456-7890"
                      />
                    </Field>
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Address</h3>
                  <div className="space-y-4">
                    <Field label="Street address">
                      <FormInput
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </Field>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Field label="City">
                        <FormInput value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                      </Field>
                      <Field label="State">
                        <FormInput value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                      </Field>
                      <Field label="ZIP code">
                        <FormInput value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="12345" />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                    setFormData(initialFormData);
                    setFormErrors({});
                  }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingClient ? "Update Client" : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
