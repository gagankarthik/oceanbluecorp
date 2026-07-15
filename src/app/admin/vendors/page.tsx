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
  Users,
  User,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  X,
  Shield,
  UserCog,
} from "lucide-react";
import type { Vendor } from "@/lib/aws/dynamodb";

const vendorLeadConfig = {
  hr: {
    label: "HR",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
    icon: Users,
  },
  admin: {
    label: "Admin",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    icon: Shield,
  },
};

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

interface FormData {
  name: string;
  contactPerson: string;
  email: string;
  zipCode: string;
  state: string;
  vendorLeadId: string;
  vendorLeadName: string;
  vendorLeadRole: "hr" | "admin";
}

const initialFormData: FormData = {
  name: "",
  contactPerson: "",
  email: "",
  zipCode: "",
  state: "",
  vendorLeadId: "",
  vendorLeadName: "",
  vendorLeadRole: "hr",
};

interface FormErrors {
  name?: string;
  vendorLead?: string;
  email?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorLeadFilter, setVendorLeadFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        // Filter HR and Admin users
        const users = data.users || [];
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin"));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vendors");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch vendors");
      }

      setVendors(data.vendors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendorLeadName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendorLead = vendorLeadFilter === "all" || vendor.vendorLeadRole === vendorLeadFilter;
    return matchesSearch && matchesVendorLead;
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Vendor name is required";
    }

    if (!formData.vendorLeadId) {
      errors.vendorLead = "Vendor Lead is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVendorLeadSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        vendorLeadId: userId,
        vendorLeadName: selectedUser.name || selectedUser.email,
        vendorLeadRole: selectedUser.role as "hr" | "admin",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : "/api/vendors";
      const method = editingVendor ? "PATCH" : "POST";

      const vendorData = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        zipCode: formData.zipCode,
        state: formData.state,
        vendorLeadId: formData.vendorLeadId,
        vendorLeadName: formData.vendorLeadName,
        vendorLeadRole: formData.vendorLeadRole,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save vendor");
      }

      await fetchVendors();
      setShowForm(false);
      setEditingVendor(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || "",
      email: vendor.email || "",
      zipCode: vendor.zipCode || "",
      state: vendor.state || "",
      vendorLeadId: vendor.vendorLeadId || "",
      vendorLeadName: vendor.vendorLeadName || "",
      vendorLeadRole: vendor.vendorLeadRole || "hr",
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
      const response = await fetch(`/api/vendors/${pendingDelete}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete vendor");
      setVendors((prev) => prev.filter((vendor) => vendor.id !== pendingDelete));
      toast.success("Vendor deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete vendor");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Contact Person", "Email", "State", "ZIP Code", "Vendor Lead", "Vendor Lead Role", "Created At"];
    const rows = filteredVendors.map((vendor) => [
      `"${vendor.name}"`,
      `"${vendor.contactPerson || ""}"`,
      `"${vendor.email || ""}"`,
      `"${vendor.state || ""}"`,
      `"${vendor.zipCode || ""}"`,
      `"${vendor.vendorLeadName || ""}"`,
      `"${(vendor.vendorLeadRole || "").toUpperCase()}"`,
      `"${new Date(vendor.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: vendors.length,
    hr: vendors.filter((v) => v.vendorLeadRole === "hr").length,
    admin: vendors.filter((v) => v.vendorLeadRole === "admin").length,
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
        title="Delete vendor?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <PageHeader
        title="Vendor Management"
        subtitle="Manage your vendor records"
        icon={UserCog}
        actions={
          <>
            <PageHeaderButton variant="secondary" onClick={handleExportCSV} disabled={filteredVendors.length === 0}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </PageHeaderButton>
            <PageHeaderButton
              variant="primary"
              onClick={() => {
                setEditingVendor(null);
                setFormData(initialFormData);
                setFormErrors({});
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </PageHeaderButton>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard size="sm" label="Total vendors" value={stats.total} icon={UserCog} tone="blue" />
        <StatCard size="sm" label="HR lead" value={stats.hr} icon={Users} tone="violet" />
        <StatCard size="sm" label="Admin lead" value={stats.admin} icon={Shield} tone="amber" />
      </div>

      {/* Toolbar */}
      <AdminCard className="space-y-3 p-3">
        <div className="flex gap-2">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, contact, email, location…" />
          <FilterToggle
            open={showFilters}
            activeCount={vendorLeadFilter !== "all" ? 1 : 0}
            onClick={() => setShowFilters(!showFilters)}
          />
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
            <FormSelect value={vendorLeadFilter} onChange={(e) => setVendorLeadFilter(e.target.value)}>
              <option value="all">All vendor leads</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </FormSelect>
          </div>
        )}
        <FilterChips
          chips={vendorLeadFilter !== "all" ? [{ key: "lead", label: "Lead", value: vendorLeadFilter === "hr" ? "HR" : "Admin", onRemove: () => setVendorLeadFilter("all") }] : []}
        />
      </AdminCard>

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {filteredVendors.length} of {vendors.length} vendors
      </p>

      {/* Vendor Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vendor Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => {
                  const lead = vendorLeadConfig[vendor.vendorLeadRole] || vendorLeadConfig.hr;
                  const LeadIcon = lead.icon;

                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {vendor.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{vendor.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {vendor.contactPerson && (
                            <div className="text-sm text-slate-600 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {vendor.contactPerson}
                            </div>
                          )}
                          {vendor.email && (
                            <a href={`mailto:${vendor.email}`} className="text-sm text-slate-600 hover:text-[var(--hz-cobalt)] flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {vendor.email}
                            </a>
                          )}
                          {!vendor.contactPerson && !vendor.email && (
                            <span className="text-sm text-slate-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {vendor.state || vendor.zipCode ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {[vendor.state, vendor.zipCode].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No location</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${lead.color}`}>
                            <LeadIcon className="w-3 h-3" />
                            {lead.label}
                          </span>
                          {vendor.vendorLeadName && (
                            <span className="text-sm text-slate-700">{vendor.vendorLeadName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(vendor)}
                            aria-label="Edit vendor"
                            className="p-2 text-slate-500 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setPendingDelete(vendor.id)}
                            aria-label="Delete vendor"
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
                      icon={UserCog}
                      tone="blue"
                      title="No vendors found"
                      description={vendors.length === 0 ? "Add your first vendor to start tracking partners." : "No vendors match your search — try clearing a filter."}
                      action={vendors.length === 0 ? (
                        <PageHeaderButton variant="primary" onClick={() => { setEditingVendor(null); setFormData(initialFormData); setFormErrors({}); setShowForm(true); }}>
                          <Plus className="w-3.5 h-3.5" /> Add vendor
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

      {/* Add/Edit Vendor Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingVendor ? "Edit vendor" : "Add new vendor"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingVendor(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                aria-label="Close"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
                  <div className="space-y-4">
                    <Field label="Vendor name" required>
                      <FormInput
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter vendor name"
                        className={formErrors.name ? "border-rose-300 bg-rose-50" : ""}
                      />
                      {formErrors.name && <p className="mt-1.5 text-sm text-rose-600">{formErrors.name}</p>}
                    </Field>
                    <Field label="Vendor lead" required>
                      <FormSelect
                        value={formData.vendorLeadId}
                        onChange={(e) => handleVendorLeadSelect(e.target.value)}
                        className={formErrors.vendorLead ? "border-rose-300 bg-rose-50" : ""}
                      >
                        <option value="">Select a vendor lead…</option>
                        {hrUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email} ({(user.role || "").toUpperCase()})
                          </option>
                        ))}
                      </FormSelect>
                      {formErrors.vendorLead && <p className="mt-1.5 text-sm text-rose-600">{formErrors.vendorLead}</p>}
                    </Field>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <Field label="Contact person">
                      <FormInput
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Contact person name"
                      />
                    </Field>
                    <Field label="Email">
                      <FormInput
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="vendor@example.com"
                        className={formErrors.email ? "border-rose-300 bg-rose-50" : ""}
                      />
                      {formErrors.email && <p className="mt-1.5 text-sm text-rose-600">{formErrors.email}</p>}
                    </Field>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="State">
                      <FormInput value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                    </Field>
                    <Field label="ZIP code">
                      <FormInput value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="12345" />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVendor(null);
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
                  {editingVendor ? "Update Vendor" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
