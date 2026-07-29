"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import {
  IconBuilding, IconContact, IconDownload, IconEdit, IconError,
  IconGlobe, IconSuccess, IconTrash, IconWarning,
} from "@/components/admin/icons";
import type { Client } from "@/lib/aws/dynamodb";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DensityMenu, ColumnsMenu, KpiRow, type Density,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Field, FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { PageHeaderButton } from "@/components/admin/page-header";

// ── config ───────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "inactive", label: "Inactive" },
];

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

/** Placeholder for an empty cell — an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">—</span>;
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
  }, []);

  useEffect(() => { void fetchClients(); }, [fetchClients]);

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredClients = useMemo(() => clients.filter((client) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      client.name.toLowerCase().includes(q) ||
      client.websiteUrl.toLowerCase().includes(q) ||
      client.email?.toLowerCase().includes(q) ||
      client.city?.toLowerCase().includes(q) ||
      client.state?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [clients, debouncedSearch, statusFilter]);

  // Counts feed the view tabs. The old `stats` object also computed a
  // "reachable" figure that existed only to fill a fourth KPI tile.
  const statusCounts: Record<string, number> = useMemo(() => ({
    all:      clients.length,
    active:   clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
  }), [clients]);

  const hasActiveFilters = statusFilter !== "all" || debouncedSearch.trim() !== "";

  /** Records nobody can reach — the one client fact worth flagging up top. */
  const noContactCount = useMemo(
    () => clients.filter((c) => !c.email && !c.phone).length,
    [clients],
  );

  const addedThisMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return clients.filter((c) => new Date(c.createdAt).getTime() >= start.getTime()).length;
  }, [clients]);

  const [density, setDensity] = useLocalStorage<Density>("adm.clients.density", "default");
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.clients.hiddenCols", []);
  const clearFilters = () => { setStatusFilter("all"); setSearchQuery(""); };

  // ── form + mutations ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingClient(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

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
      closeForm();
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

  const handleExportCSV = () => downloadCsv(
    "clients",
    ["Name", "Website URL", "Status", "Email", "Phone", "Address", "City", "State", "ZIP Code", "Created At"],
    filteredClients.map((client) => [
      client.name,
      client.websiteUrl,
      client.status,
      client.email || "",
      client.phone || "",
      client.address || "",
      client.city || "",
      client.state || "",
      client.zipCode || "",
      fmtDate(client.createdAt),
    ]),
  );

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<Client>[] = [
    {
      key: "name",
      header: "Client",
      label: "Client",
      locked: true,
      width: "260px",
      sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} size="sm" />
          <span className="truncate font-semibold text-[var(--adm-ink)]">{c.name}</span>
          {c.websiteUrl && (
            <a
              href={c.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={c.websiteUrl.replace(/^https?:\/\//, "")}
              aria-label={`Open ${c.name} website`}
              className="flex-none text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
            >
              <IconGlobe className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      label: "Contact",
      width: "240px",
      sortValue: (c) => c.email || "",
      hideBelow: "md",
      cell: (c) => c.email ? (
        <a
          href={`mailto:${c.email}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {c.email}
        </a>
      ) : <Blank />,
    },
    {
      key: "phone",
      header: "Phone",
      label: "Phone",
      width: "160px",
      sortValue: (c) => c.phone || "",
      hideBelow: "xl",
      cell: (c) => c.phone ? (
        <a
          href={`tel:${c.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="tabular-nums text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {c.phone}
        </a>
      ) : <Blank />,
    },
    {
      key: "location",
      header: "Location",
      label: "Location",
      width: "180px",
      sortValue: (c) => c.state || "",
      hideBelow: "lg",
      cell: (c) => {
        const location = [c.city, c.state].filter(Boolean).join(", ");
        return location ? <span className="text-[var(--adm-ink-mute)]">{location}</span> : <Blank />;
      },
    },
    {
      key: "status",
      header: "Status",
      label: "Status",
      width: "130px",
      sortValue: (c) => c.status,
      cell: (c) => <StatusBadge status={c.status} size="md" />,
    },
    {
      key: "created",
      header: "Created",
      label: "Created",
      width: "130px",
      sortValue: (c) => new Date(c.createdAt).getTime(),
      hideBelow: "xl",
      cell: (c) => <span className="text-[14px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(c.createdAt)}</span>,
    },
    // No trailing "actions" column. Edit and delete now ride in DataTable's
    // rowActions slot, which reveals them on hover — a permanent column of
    // pencil-and-bin icons drew a vertical stripe of chrome down the grid and
    // competed with the records for attention.
  ];

  const rowActions = (c: Client) => (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => handleEdit(c)}
        aria-label={`Edit ${c.name}`}
        title="Edit"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
      >
        <IconEdit className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        onClick={() => setPendingDelete(c.id)}
        aria-label={`Delete ${c.name}`}
        title="Delete"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
      >
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
        <p className="text-sm text-[var(--adm-danger)]">{error}</p>
        <button
          onClick={fetchClients}
          className="rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--adm-accent-strong)]"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* One panel. The KPI strip that used to sit above this is gone: it
          restated the status counts that now ride on the view tabs, and three
          of its four tiles drew a share bar ("7% reachable") against a total
          that is not a whole those figures are part of. */}
      {/* Overview. Deliberately NOT a count of rows the footer already shows:
          each tile is either something the grid cannot tell you at a glance, or
          a shortcut that filters to it. */}
      <WorkspaceTitle
        title="Clients"
        meta={`${clients.length} accounts`}
        actions={
          <>
            <WorkspaceButton onClick={handleExportCSV} disabled={filteredClients.length === 0}>
              <IconDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />Add client
            </WorkspaceButton>
          </>
        }
      />
      <KpiRow
        items={[
          { label: "Active clients", value: statusCounts.active, icon: IconSuccess,
            onClick: () => setStatusFilter("active") },
          { label: "Inactive", value: statusCounts.inactive, icon: IconError,
            tone: statusCounts.inactive > 0 ? "warning" : "default",
            onClick: () => setStatusFilter("inactive") },
          { label: "Missing contact details", value: noContactCount, icon: IconContact,
            tone: noContactCount > 0 ? "warning" : "default",
            hint: noContactCount > 0 ? "No email or phone on file" : "All reachable" },
          { label: "Added this month", value: addedThisMonth, icon: IconBuilding },
        ]}
      />

      <Workspace>
        <WorkspaceToolbar
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter clients by name, contact or location"
            />
          }
          trailing={
            <>
              <ColumnsMenu
                columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
                hidden={hiddenColumns}
                onChange={setHiddenColumns}
              />
              <DensityMenu value={density} onChange={setDensity} />
            </>
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
        </WorkspaceToolbar>

        <ActiveFilters
          chips={statusFilter !== "all"
            ? [{ label: `Status: ${STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }]
            : []}
          onClearAll={clearFilters}
        />

        <DataTable
          noun="clients"
          storageKey="clients"
          columns={columns}
          rows={filteredClients}
          rowKey={(c) => c.id}
          initialSort={{ key: "created", dir: "desc" }}
          density={density}
          hiddenColumns={hiddenColumns}
          rowActions={rowActions}
          empty={{
            icon: IconBuilding,
            title: clients.length === 0 ? "No clients yet" : "No clients match your filters",
            description: clients.length === 0
              ? "Add your first client to start tracking accounts."
              : "Try adjusting your search or status filter.",
            action: clients.length === 0 ? (
              <WorkspaceButton variant="primary" onClick={openCreate}><Plus className="h-4 w-4" />Add client</WorkspaceButton>
            ) : hasActiveFilters ? (
              <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>
            ) : undefined,
          }}
        />
      </Workspace>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete client?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* ── add / edit client ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--adm-line)] px-6 py-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-ink)]">
                {editingClient ? "Edit client" : "Add new client"}
              </h2>
              <button
                onClick={closeForm}
                aria-label="Close"
                className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--adm-ink-subtle)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--adm-danger)]" />
                    Required information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Client name" required error={formErrors.name}>
                      <FormInput
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter client name"
                        invalid={!!formErrors.name}
                      />
                    </Field>
                    <Field label="Website URL" required error={formErrors.websiteUrl}>
                      <FormInput
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        invalid={!!formErrors.websiteUrl}
                      />
                    </Field>
                    <Field label="Status" required fullWidth error={formErrors.status}>
                      <FormSelect
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </FormSelect>
                    </Field>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--adm-ink-subtle)]">Contact information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Email" error={formErrors.email}>
                      <FormInput
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@example.com"
                        invalid={!!formErrors.email}
                      />
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

                <div>
                  <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--adm-ink-subtle)]">Address</h3>
                  <div className="space-y-4">
                    <Field label="Street address">
                      <FormInput
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-3">
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

              <div className="mt-8 flex items-center justify-end gap-2 border-t border-[var(--adm-line)] pt-6">
                <PageHeaderButton type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </PageHeaderButton>
                <PageHeaderButton type="submit" variant="primary" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingClient ? "Update client" : "Add client"}
                </PageHeaderButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
