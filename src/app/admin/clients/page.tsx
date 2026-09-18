"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import {
  IconBuilding, IconDownload, IconEdit,
  IconGlobe, IconTrash,
} from "@/components/admin/icons";
import type { Client } from "@/lib/aws/dynamodb";
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
import { Field, FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, LIMITS, maxLen, phone, required, url } from "@/lib/form-validation";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";

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

const FIELD_IDS = {
  name: "client-name",
  websiteUrl: "client-website",
  email: "client-email",
  phone: "client-phone",
  address: "client-address",
  city: "client-city",
  state: "client-state",
  zipCode: "client-zip",
} as const;

type ClientField = keyof typeof FIELD_IDS;

function validateClient(f: FormData) {
  return collectErrors<ClientField>({
    name: check(f.name, required("Enter the client's name."), maxLen(LIMITS.name)),
    websiteUrl: check(
      f.websiteUrl,
      required("Enter the client's website, like https://example.com."),
      url(),
      maxLen(LIMITS.url),
    ),
    email: check(f.email, email("Enter the client's email, like name@company.com."), maxLen(LIMITS.email)),
    phone: check(f.phone, phone()),
    address: check(f.address, maxLen(LIMITS.short)),
    city: check(f.city, maxLen(LIMITS.name)),
    state: check(f.state, maxLen(LIMITS.name)),
    zipCode: check(f.zipCode, maxLen(10, "Enter a ZIP code of 10 characters or fewer, like 43215.")),
  });
}

/** Empty cell. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]"></span>;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { errors: formErrors, validateAll, revalidate, reset: resetErrors, invalidProps } =
    useFormErrors<ClientField>(() => validateClient(formData), FIELD_IDS);
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
      console.error("Failed to load clients:", err);
      setError("Check your connection and try again.");
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

  const statusCounts: Record<string, number> = useMemo(() => ({
    all:      clients.length,
    active:   clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
  }), [clients]);

  const hasActiveFilters = statusFilter !== "all" || debouncedSearch.trim() !== "";

  /** Records nobody can reach, the one client fact worth flagging up top. */
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

  const [rows, setRows] = useLocalStorage<number>("adm.clients.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.clients.hiddenCols", []);
  const clearFilters = () => { setStatusFilter("all"); setSearchQuery(""); };

  // ── form + mutations ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingClient(null);
    setFormData(initialFormData);
    resetErrors();
    setSaveError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData(initialFormData);
    resetErrors();
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSaveError(null);
    if (!validateAll()) return;

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
        throw new Error(data.error || "The client could not be saved. Check your connection and try again.");
      }

      await fetchClients();
      closeForm();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "The client could not be saved. Check your connection and try again.");
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
    resetErrors();
    setSaveError(null);
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
  ];

  // Hover-revealed, not a permanent column of icon buttons down the grid.
  const rowActions = (c: Client) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => handleEdit(c)}
        aria-label={`Edit ${c.name}`}
        title="Edit"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
      >
        <IconEdit className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setPendingDelete(c.id)}
        aria-label={`Delete ${c.name}`}
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
          title="Couldn't load clients"
          description={error}
          action={<WorkspaceButton variant="primary" onClick={fetchClients}>Try again</WorkspaceButton>}
        />
      </AdminCard>
    </div>
  );

  return (
    <>
      <WorkspaceTitle
        title="Clients"
        actions={
          <>
            <WorkspaceButton onClick={handleExportCSV} disabled={filteredClients.length === 0} aria-label="Export CSV">
              <IconDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />Add client
            </WorkspaceButton>
          </>
        }
      />
      <StatStrip
        items={[
          { label: "Active clients", value: statusCounts.active,
            onClick: () => setStatusFilter("active") },
          { label: "Inactive", value: statusCounts.inactive,
            tone: statusCounts.inactive > 0 ? "warning" : "default",
            onClick: () => setStatusFilter("inactive") },
          { label: "Missing contact details", value: noContactCount,
            tone: noContactCount > 0 ? "warning" : "default",
            hint: noContactCount > 0 ? "No email or phone on file" : "All reachable" },
          { label: "Added this month", value: addedThisMonth },
        ]}
      />

      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter clients by name, contact or location"
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
          variant="canvas"
          chips={statusFilter !== "all"
            ? [{ label: `Status: ${STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }]
            : []}
          onClearAll={clearFilters}
      />

      <Workspace>
        <DataTable
          noun="clients"
          storageKey="clients"
          columns={columns}
          rows={filteredClients}
          rowKey={(c) => c.id}
          initialSort={{ key: "created", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
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

      {showForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-form-title"
        >
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
              <h2 id="client-form-title" className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
                {editingClient ? "Edit client" : "Add new client"}
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
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Account</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Client name" required htmlFor={FIELD_IDS.name} error={formErrors.name}>
                      <FormInput
                        id={FIELD_IDS.name}
                        {...invalidProps("name")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter client name"
                      />
                    </Field>
                    <Field label="Website URL" required htmlFor={FIELD_IDS.websiteUrl} error={formErrors.websiteUrl}>
                      <FormInput
                        id={FIELD_IDS.websiteUrl}
                        {...invalidProps("websiteUrl")}
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </Field>
                    <Field label="Status" required fullWidth htmlFor="client-status">
                      <FormSelect
                        id="client-status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </FormSelect>
                    </Field>
                  </div>
                </section>

                <section className="border-t border-[var(--adm-line-soft)] pt-5">
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Contact information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Email" htmlFor={FIELD_IDS.email} error={formErrors.email}>
                      <FormInput
                        id={FIELD_IDS.email}
                        {...invalidProps("email")}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="client@example.com"
                      />
                    </Field>
                    <Field label="Phone number" htmlFor={FIELD_IDS.phone} error={formErrors.phone}>
                      <FormInput
                        id={FIELD_IDS.phone}
                        {...invalidProps("phone")}
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(123) 456-7890"
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-[var(--adm-line-soft)] pt-5">
                  <h3 className="mb-3 text-[14px] font-semibold text-[var(--adm-ink)]">Address</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Street address" fullWidth htmlFor={FIELD_IDS.address} error={formErrors.address}>
                      <FormInput
                        id={FIELD_IDS.address}
                        {...invalidProps("address")}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </Field>
                    <Field label="City" htmlFor={FIELD_IDS.city} error={formErrors.city}>
                      <FormInput id={FIELD_IDS.city} {...invalidProps("city")} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                    </Field>
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
                  {editingClient ? "Update client" : "Add client"}
                </WorkspaceButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
