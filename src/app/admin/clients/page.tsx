"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  IconBuilding, IconDownload, IconEdit,
  IconGlobe, IconMail, IconTrash,
} from "@/components/admin/icons";
import type { Client } from "@/lib/aws/dynamodb";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceButton, WorkspaceSearch, DisplayMenu,
} from "@/components/admin/workspace";
import { ListHeader, ListTabs, ListToolbar, MetaStrong } from "@/components/admin/list-shell";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { Blank, RoleCountCell, RowMenu, StackCell } from "@/components/admin/table-cells";
import { Avatar } from "@/components/admin/avatar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Field, FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, LIMITS, maxLen, phone, required, website } from "@/lib/form-validation";
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
      required("Enter the client's website, like www.example.com."),
      website(),
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
/** "https://www.acme.com/about" → "acme.com" */
const domainOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

// ── page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Skeleton on first load only; later reloads keep the list on screen.
  const loadedOnce = useRef(false);
  useEffect(() => { if (!loading && !error) loadedOnce.current = true; }, [loading, error]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [baseline, setBaseline] = useState<FormData>(initialFormData);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = showForm && JSON.stringify(formData) !== JSON.stringify(baseline);
  const { errors: formErrors, validateAll, revalidate, reset: resetErrors, invalidProps } =
    useFormErrors<ClientField>(() => validateClient(formData), FIELD_IDS);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    try {
      if (!loadedOnce.current) setLoading(true);
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

  const [rows, setRows] = useLocalStorage<number>("adm.clients.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.clients.hiddenCols", []);
  const clearFilters = () => { setStatusFilter("all"); setSearchQuery(""); };

  // ── form + mutations ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingClient(null);
    setFormData(initialFormData);
    setBaseline(initialFormData);
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

  const requestClose = () => {
    if (dirty && !submitting) setConfirmDiscard(true);
    else closeForm();
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
    const next: FormData = {
      name: client.name,
      websiteUrl: client.websiteUrl,
      status: client.status,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
    };
    setFormData(next);
    setBaseline(next);
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
      width: "250px",
      sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <StackCell
            primary={<span className="font-semibold">{c.name}</span>}
            secondary={c.websiteUrl ? domainOf(c.websiteUrl) : undefined}
          />
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      label: "Contact",
      width: "220px",
      sortValue: (c) => c.email || c.phone || "",
      hideBelow: "md",
      cell: (c) => c.email || c.phone
        ? <StackCell primary={c.email || c.phone} secondary={c.email ? c.phone : undefined} title={[c.email, c.phone].filter(Boolean).join(" · ")} />
        : <span className="text-adm-xs text-[var(--adm-ink-subtle)]">No contact on file</span>,
    },
    {
      key: "location",
      header: "Location",
      label: "Location",
      width: "150px",
      sortValue: (c) => [c.city, c.state].filter(Boolean).join(", "),
      hideBelow: "lg",
      cell: (c) => {
        const location = [c.city, c.state].filter(Boolean).join(", ");
        return location ? <span className="block truncate text-[var(--adm-ink-mute)]">{location}</span> : <Blank />;
      },
    },
    {
      key: "jobs",
      header: "Roles",
      label: "Roles",
      width: "120px",
      sortValue: (r) => (r.openJobCount ?? 0) * 10_000 + (r.jobCount ?? 0),
      cell: (r) => <RoleCountCell total={r.jobCount} open={r.openJobCount} />,
    },
    {
      key: "status",
      header: "Status",
      label: "Status",
      width: "110px",
      sortValue: (c) => c.status,
      cell: (c) => <StatusBadge status={c.status} size="md" />,
    },
    {
      key: "created",
      header: "Added",
      label: "Added",
      width: "120px",
      sortValue: (c) => new Date(c.createdAt).getTime(),
      hideBelow: "xl",
      cell: (c) => <span className="tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(c.createdAt)}</span>,
    },
  ];

  // Hover-revealed, not a permanent column of icon buttons down the grid.
  const rowActions = (c: Client) => (
    <RowMenu
      label={c.name}
      items={[
        { label: "Edit client", icon: IconEdit, onSelect: () => handleEdit(c) },
        ...(c.websiteUrl ? [{ label: "Open website", icon: IconGlobe, href: c.websiteUrl, external: true }] : []),
        ...(c.email ? [{ label: "Email", icon: IconMail, href: `mailto:${c.email}` }] : []),
        { label: "Delete", icon: IconTrash, onSelect: () => setPendingDelete(c.id), danger: true, separated: true },
      ]}
    />
  );

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} label="Loading clients" />;

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
      <ListHeader
        title="Clients"
        meta={<>
          {clients.length.toLocaleString()} client{clients.length === 1 ? "" : "s"} on record
          {noContactCount ? <>, <MetaStrong>{noContactCount} missing contact details</MetaStrong></> : null}
        </>}
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

      <Workspace>
        <ListToolbar
          tabs={
            <ListTabs
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, count: statusCounts[t.key] || 0 }))}
            />
          }
          search={<WorkspaceSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search clients…" />}
        >
          <DisplayMenu
            columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
            hidden={hiddenColumns}
            onHiddenChange={setHiddenColumns}
            rows={rows}
            onRowsChange={setRows}
            onReset={() => { setHiddenColumns([]); setRows(25); }}
          />
        </ListToolbar>

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
          rowActionsAlways
          onRowClick={handleEdit}
          empty={{
            icon: IconBuilding,
            title: clients.length === 0 ? "No clients yet" : "No clients match your filters",
            description: clients.length === 0
              ? "Add your first client to start tracking accounts."
              : "Try adjusting your search or status filter.",
            action: clients.length === 0 ? (
              <WorkspaceButton onClick={openCreate}><Plus className="h-4 w-4" />Add client</WorkspaceButton>
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

      <AdminDialog
        open={showForm}
        onOpenChange={(next) => { if (!next) requestClose(); }}
        title={editingClient ? "Edit client" : "Add new client"}
        size="lg"
        busy={submitting}
        footer={
          <>
            <WorkspaceButton type="button" onClick={requestClose} className="w-full sm:w-auto">
              Cancel
            </WorkspaceButton>
            <WorkspaceButton loading={submitting} type="submit" form="client-form" variant="primary" disabled={submitting} className="w-full sm:w-auto">
              {editingClient ? "Update client" : "Add client"}
            </WorkspaceButton>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit} onBlur={revalidate} noValidate className="space-y-5">
          <FormErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
          <section>
            <h3 className="mb-3 text-adm-base font-semibold text-[var(--adm-ink)]">Account</h3>
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
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="www.example.com"
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
            <h3 className="mb-3 text-adm-base font-semibold text-[var(--adm-ink)]">Contact information</h3>
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
            <h3 className="mb-3 text-adm-base font-semibold text-[var(--adm-ink)]">Address</h3>
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
        </form>
      </AdminDialog>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        body="Your edits to this client have not been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => { setConfirmDiscard(false); closeForm(); }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
