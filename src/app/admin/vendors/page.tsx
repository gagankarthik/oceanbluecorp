"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import {
  IconDownload, IconEdit, IconTrash,
  IconUserRole,
} from "@/components/admin/icons";
import type { Vendor } from "@/lib/aws/dynamodb";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { type Tone } from "@/components/admin/theme";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { Field, FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, LIMITS, maxLen, required } from "@/lib/form-validation";

// ── config ───────────────────────────────────────────────────────────────────

type LeadRole = "hr" | "admin";

/** Who owns the vendor relationship. One table drives the badge and the filter. */
const LEAD_META: Record<LeadRole, { label: string; tone: Tone }> = {
  hr:    { label: "HR",    tone: "blue"  },
  admin: { label: "Admin", tone: "slate" },
};

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FormData {
  name: string;
  contactPerson: string;
  email: string;
  zipCode: string;
  state: string;
  vendorLeadId: string;
  vendorLeadName: string;
  vendorLeadRole: LeadRole;
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

const FIELD_IDS = {
  name: "vendor-name",
  vendorLead: "vendor-lead",
  contactPerson: "vendor-contact",
  email: "vendor-email",
  state: "vendor-state",
  zipCode: "vendor-zip",
} as const;

type VendorField = keyof typeof FIELD_IDS;

function validateVendor(f: FormData) {
  return collectErrors<VendorField>({
    name: check(f.name, required("Enter the vendor's name."), maxLen(LIMITS.name)),
    vendorLead: check(f.vendorLeadId, required("Choose the HR or admin teammate who owns this vendor.")),
    contactPerson: check(f.contactPerson, maxLen(LIMITS.name)),
    email: check(f.email, email("Enter the vendor's email, like name@company.com."), maxLen(LIMITS.email)),
    state: check(f.state, maxLen(LIMITS.name)),
    zipCode: check(f.zipCode, maxLen(10, "Enter a ZIP code of 10 characters or fewer, like 43215.")),
  });
}

/** Empty cell. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]"></span>;
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorLeadFilter, setVendorLeadFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { errors: formErrors, validateAll, revalidate, reset: resetErrors, invalidProps } =
    useFormErrors<VendorField>(() => validateVendor(formData), FIELD_IDS);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        // Only HR and Admin staff may own a vendor relationship.
        const users = data.users || [];
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin"));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/vendors");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch vendors");
      }

      setVendors(data.vendors || []);
    } catch (err) {
      console.error("Failed to load vendors:", err);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVendors();
    void fetchUsers();
  }, [fetchVendors, fetchUsers]);

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      vendor.name.toLowerCase().includes(q) ||
      vendor.contactPerson?.toLowerCase().includes(q) ||
      vendor.email?.toLowerCase().includes(q) ||
      vendor.state?.toLowerCase().includes(q) ||
      vendor.vendorLeadName?.toLowerCase().includes(q);
    const matchesVendorLead = vendorLeadFilter === "all" || vendor.vendorLeadRole === vendorLeadFilter;
    return matchesSearch && matchesVendorLead;
  }), [vendors, debouncedSearch, vendorLeadFilter]);

  const stats = useMemo(() => ({
    total: vendors.length,
    hr:    vendors.filter((v) => v.vendorLeadRole === "hr").length,
    admin: vendors.filter((v) => v.vendorLeadRole === "admin").length,
    // The actionable inverse of "reachable": records nobody can call or email.
    noContact: vendors.filter((v) => !v.contactPerson && !v.email).length,
  }), [vendors]);

  const hasActiveFilters = vendorLeadFilter !== "all" || debouncedSearch.trim() !== "";

  const [rows, setRows] = useLocalStorage<number>("adm.vendors.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.vendors.hiddenCols", []);
  const clearFilters = () => { setVendorLeadFilter("all"); setSearchQuery(""); };

  // ── form + mutations ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingVendor(null);
    setFormData(initialFormData);
    resetErrors();
    setSaveError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setFormData(initialFormData);
    resetErrors();
    setSaveError(null);
  };

  const handleVendorLeadSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    if (selectedUser) {
      setFormData({
        ...formData,
        vendorLeadId: userId,
        vendorLeadName: selectedUser.name || selectedUser.email,
        vendorLeadRole: selectedUser.role as LeadRole,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSaveError(null);
    if (!validateAll()) return;

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
        throw new Error(data.error || "The vendor could not be saved. Check your connection and try again.");
      }

      await fetchVendors();
      closeForm();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "The vendor could not be saved. Check your connection and try again.");
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
    resetErrors();
    setSaveError(null);
    setShowForm(true);
  };

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

  const handleExportCSV = () => downloadCsv(
    "vendors",
    ["Name", "Contact Person", "Email", "State", "ZIP Code", "Vendor Lead", "Vendor Lead Role", "Created At"],
    filteredVendors.map((vendor) => [
      vendor.name,
      vendor.contactPerson || "",
      vendor.email || "",
      vendor.state || "",
      vendor.zipCode || "",
      vendor.vendorLeadName || "",
      (vendor.vendorLeadRole || "").toUpperCase(),
      fmtDate(vendor.createdAt),
    ]),
  );

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<Vendor>[] = [
    {
      key: "name",
      header: "Vendor",
      label: "Vendor",
      locked: true,
      width: "230px",
      sortValue: (v) => v.name,
      cell: (v) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={v.name} size="sm" />
          <span className="truncate font-semibold text-[var(--adm-ink)]">{v.name}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      label: "Contact",
      width: "190px",
      sortValue: (v) => v.contactPerson || "",
      hideBelow: "md",
      cell: (v) => v.contactPerson
        ? <span className="block truncate text-[var(--adm-ink-mute)]">{v.contactPerson}</span>
        : <Blank />,
    },
    {
      key: "email",
      header: "Email",
      label: "Email",
      width: "230px",
      sortValue: (v) => v.email || "",
      hideBelow: "lg",
      cell: (v) => v.email ? (
        <a
          href={`mailto:${v.email}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {v.email}
        </a>
      ) : <Blank />,
    },
    {
      key: "location",
      header: "Location",
      label: "Location",
      width: "160px",
      sortValue: (v) => v.state || "",
      hideBelow: "lg",
      cell: (v) => {
        const location = [v.state, v.zipCode].filter(Boolean).join(", ");
        return location
          ? <span className="block truncate text-[var(--adm-ink-mute)]">{location}</span>
          : <Blank />;
      },
    },
    {
      key: "lead",
      header: "Vendor lead",
      label: "Vendor lead",
      width: "220px",
      sortValue: (v) => v.vendorLeadName || "",
      cell: (v) => {
        const meta = LEAD_META[v.vendorLeadRole] || LEAD_META.hr;
        return (
          <div className="flex items-center gap-2">
            <StatusBadge tone={meta.tone} label={meta.label} size="md" />
            {v.vendorLeadName
              ? <span className="truncate text-[var(--adm-ink-mute)]">{v.vendorLeadName}</span>
              : <Blank />}
          </div>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      label: "Created",
      width: "130px",
      sortValue: (v) => new Date(v.createdAt).getTime(),
      hideBelow: "xl",
      cell: (v) => <span className="text-[14px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(v.createdAt)}</span>,
    },
  ];

  // Hover-revealed, not a permanent column of icon buttons down the grid.
  const rowActions = (v: Vendor) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => handleEdit(v)}
        aria-label={`Edit ${v.name}`}
        title="Edit"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
      >
        <IconEdit className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setPendingDelete(v.id)}
        aria-label={`Delete ${v.name}`}
        title="Delete"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
      >
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <AdminCard className="w-full max-w-md">
        <EmptyState
          variant="error"
          title="Couldn't load vendors"
          description={error}
          action={<WorkspaceButton variant="primary" onClick={fetchVendors}>Try again</WorkspaceButton>}
        />
      </AdminCard>
    </div>
  );

  return (
    <>
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete vendor?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <WorkspaceTitle
        title="Vendors"
        actions={
          <>
            <WorkspaceButton onClick={handleExportCSV} disabled={filteredVendors.length === 0} aria-label="Export CSV">
              <IconDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />Add vendor
            </WorkspaceButton>
          </>
        }
      />
      <StatStrip
        items={[
          { label: "HR-led", value: stats.hr, onClick: () => setVendorLeadFilter("hr") },
          { label: "Admin-led", value: stats.admin, onClick: () => setVendorLeadFilter("admin") },
          { label: "No contact on file", value: stats.noContact,
            tone: stats.noContact > 0 ? "warning" : "default",
            hint: stats.noContact > 0 ? "Cannot be called or emailed" : "All reachable" },
        ]}
      />

      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter vendors by name, contact or location"
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
            label="Lead"
            icon={FilterIcon.person}
            value={vendorLeadFilter}
            onChange={setVendorLeadFilter}
            options={[
              { value: "all",   label: "All leads",           count: stats.total },
              { value: "hr",    label: LEAD_META.hr.label,    count: stats.hr },
              { value: "admin", label: LEAD_META.admin.label, count: stats.admin },
            ]}
          />
      </WorkspaceToolbar>

      <ActiveFilters
          variant="canvas"
          chips={vendorLeadFilter !== "all"
            ? [{
                label: `Lead: ${LEAD_META[vendorLeadFilter as LeadRole]?.label ?? vendorLeadFilter}`,
                onClear: () => setVendorLeadFilter("all"),
              }]
            : []}
          onClearAll={clearFilters}
      />

      <Workspace>
        <DataTable
          noun="vendors"
          storageKey="vendors"
          columns={columns}
          rows={filteredVendors}
          rowKey={(v) => v.id}
          initialSort={{ key: "created", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          rowActions={rowActions}
          empty={{
            icon: IconUserRole,
            title: vendors.length === 0 ? "No vendors yet" : "No vendors match your filters",
            description: vendors.length === 0
              ? "Add your first vendor to start tracking partners."
              : "Try adjusting your search or lead filter.",
            action: vendors.length === 0 ? (
              <WorkspaceButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" />Add vendor</WorkspaceButton>
            ) : hasActiveFilters ? (
              <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>
            ) : undefined,
          }}
        />
      </Workspace>

      {showForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-form-title"
        >
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
              <h2 id="vendor-form-title" className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
                {editingVendor ? "Edit vendor" : "Add new vendor"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} onBlur={revalidate} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                <FormErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
                <section>
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Vendor</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Vendor name" required htmlFor={FIELD_IDS.name} error={formErrors.name}>
                      <FormInput
                        id={FIELD_IDS.name}
                        {...invalidProps("name")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter vendor name"
                      />
                    </Field>
                    <Field label="Vendor lead" required htmlFor={FIELD_IDS.vendorLead} error={formErrors.vendorLead} helper="HR or admin staff who own the relationship.">
                      <FormSelect
                        id={FIELD_IDS.vendorLead}
                        {...invalidProps("vendorLead")}
                        value={formData.vendorLeadId}
                        onChange={(e) => handleVendorLeadSelect(e.target.value)}
                      >
                        <option value="">Select a vendor lead…</option>
                        {hrUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email} ({LEAD_META[user.role as LeadRole]?.label ?? user.role})
                          </option>
                        ))}
                      </FormSelect>
                    </Field>
                  </div>
                </section>

                <section className="border-t border-[var(--adm-line-soft)] pt-5">
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Contact information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Contact person" htmlFor={FIELD_IDS.contactPerson} error={formErrors.contactPerson}>
                      <FormInput
                        id={FIELD_IDS.contactPerson}
                        {...invalidProps("contactPerson")}
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Contact person name"
                      />
                    </Field>
                    <Field label="Email" htmlFor={FIELD_IDS.email} error={formErrors.email}>
                      <FormInput
                        id={FIELD_IDS.email}
                        {...invalidProps("email")}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="vendor@example.com"
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-[var(--adm-line-soft)] pt-5">
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Location</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="State" htmlFor={FIELD_IDS.state} error={formErrors.state}>
                      <FormInput id={FIELD_IDS.state} {...invalidProps("state")} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                    </Field>
                    <Field label="ZIP code" htmlFor={FIELD_IDS.zipCode} error={formErrors.zipCode}>
                      <FormInput id={FIELD_IDS.zipCode} {...invalidProps("zipCode")} value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="12345" />
                    </Field>
                  </div>
                </section>
              </div>

              <div className="flex flex-none flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                <WorkspaceButton type="button" onClick={closeForm} className="w-full sm:w-auto">
                  Cancel
                </WorkspaceButton>
                <WorkspaceButton type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {editingVendor ? "Update vendor" : "Add vendor"}
                </WorkspaceButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
