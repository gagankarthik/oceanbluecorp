"use client";

import { useMemo, useState } from "react";
import type { Client, Job } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { safeHttpUrl } from "@/lib/portal/format";
import { check, collectErrors, email, LIMITS, maxLen, phone, required, website, type FieldErrors } from "@/lib/form-validation";
import { useResource } from "@/hooks/use-resource";
import { useJobSummaries } from "@/hooks/use-console-data";
import DataTable, { TableTabs, type Column, type Filter } from "@/components/portal/DataTable";
import { RoleGate } from "@/components/portal/session";
import type { MenuEntry } from "@/components/portal/records/Menu";
import { Avatar, Button, ConfirmDialog, deleteConfirmText, EmptyState, ErrorState, InsightsSheet, KpiRow, ListPageSkeleton, Modal, Page, PageHeader, Panel, StatCard } from "@/components/portal/kit";
import { BarChart, StackedBar } from "@/components/portal/charts";
import Select from "@/components/portal/Select";
import Icon from "@/components/portal/icons";
import { Facts, Field, FormError, GoneNotice, InlineDelete, LinkedRoles, errorText, inputCls, send, useDiscardGuard, useToast } from "@/components/portal/relationships/shared";
import { ActiveBadge, FieldShell, KpiFilter, RecordHead, RecordStats, RoleCount, StateField, stateName, stateOf, useTablePreset } from "@/components/portal/relationships/register";

const KEY = "/api/clients";
const FORM_ID = "client-form";
const statusLabel = (s: Client["status"]) => (s === "active" ? "Active" : "Inactive");
/** "https://www.acme.com/about" → "acme.com" */
const domainOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
const locationOf = (c: Client) => [c.city, stateOf(c.state)].filter(Boolean).join(", ");
const hasContact = (c: Client) => !!(c.email || c.phone);

type Form = { name: string; websiteUrl: string; status: Client["status"]; email: string; phone: string; address: string; city: string; state: string; zipCode: string };
type FormField = Exclude<keyof Form, "status">;
const blank: Form = { name: "", websiteUrl: "", status: "active", email: "", phone: "", address: "", city: "", state: "", zipCode: "" };
const toForm = (c: Client): Form => ({
  name: c.name,
  websiteUrl: c.websiteUrl,
  status: c.status,
  email: c.email || "",
  phone: c.phone || "",
  address: c.address || "",
  city: c.city || "",
  state: stateOf(c.state),
  zipCode: c.zipCode || "",
});

function validate(f: Form): FieldErrors<FormField> {
  return collectErrors<FormField>({
    name: check(f.name, required("Enter the client's name."), maxLen(LIMITS.name)),
    websiteUrl: check(f.websiteUrl, required("Enter the client's website, like www.example.com."), website(), maxLen(LIMITS.url)),
    email: check(f.email, email("Enter the client's email, like name@company.com."), maxLen(LIMITS.email)),
    phone: check(f.phone, phone()),
    address: check(f.address, maxLen(LIMITS.short)),
    city: check(f.city, maxLen(LIMITS.name)),
    state: check(f.state, maxLen(LIMITS.name)),
    zipCode: check(f.zipCode, maxLen(10, "Enter a ZIP code of 10 characters or fewer, like 43215.")),
  });
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 border-t border-mist-200 pt-5 first:border-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="text-adm-base font-semibold text-navy-900">
        {title}
      </p>
      {children}
    </fieldset>
  );
}

function ClientForm({ editing, onClose, onSaved }: { editing: Client | null; onClose: () => void; onSaved: (name: string) => void }) {
  const initial = editing ? toForm(editing) : blank;
  const [f, setF] = useState<Form>(initial);
  const [errors, setErrors] = useState<FieldErrors<FormField>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { close, prompt } = useDiscardGuard(JSON.stringify(f) !== JSON.stringify(initial), saving, onClose);

  const input = (k: FormField, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k] || undefined} className={inputCls} {...extra} />
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setSaveError(null);
    try {
      await send(editing ? `${KEY}/${editing.id}` : KEY, editing ? "PATCH" : "POST", f);
      onSaved(f.name.trim());
    } catch (err) {
      setSaveError(errorText(err, "The client could not be saved. Try again."));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit client" : "Add client"}
      description={editing ? editing.name : "Companies we place consultants with. Only the name and website are required."}
      onClose={close}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} icon="check" loading={saving}>
            {editing ? "Save changes" : "Add client"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="grid gap-5">
        {prompt}
        <FormError message={saveError} />
        <Group title="Company">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" required error={errors.name}>
              {input("name", { placeholder: "Acme Corporation", autoFocus: true, maxLength: LIMITS.name })}
            </Field>
            <Field label="Website" required error={errors.websiteUrl} hint="https:// is added for you.">
              {input("websiteUrl", { placeholder: "www.example.com", inputMode: "url", autoComplete: "url" })}
            </Field>
            <FieldShell label="Status" required hint="Inactive clients stay on record and on their roles.">
              <Select
                label="Status"
                showLabel={false}
                variant="field"
                width="w-full"
                value={f.status}
                onChange={(v) => setF({ ...f, status: v as Client["status"] })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </FieldShell>
          </div>
        </Group>
        <Group title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              {input("email", { type: "email", placeholder: "client@example.com", autoComplete: "off" })}
            </Field>
            <Field label="Phone" error={errors.phone}>
              {input("phone", { type: "tel", placeholder: "(614) 555-0100", autoComplete: "off" })}
            </Field>
          </div>
        </Group>
        <Group title="Address">
          <div className="grid gap-4 sm:grid-cols-6">
            <Field label="Street address" error={errors.address} className="sm:col-span-6">
              {input("address", { placeholder: "123 Main Street" })}
            </Field>
            <Field label="City" error={errors.city} className="sm:col-span-2">
              {input("city")}
            </Field>
            <StateField value={f.state} onChange={(v) => setF({ ...f, state: v })} error={errors.state} className="sm:col-span-2" />
            <Field label="ZIP code" error={errors.zipCode} className="sm:col-span-2">
              {input("zipCode", { inputMode: "numeric", maxLength: 10 })}
            </Field>
          </div>
        </Group>
      </form>
    </Modal>
  );
}

function ClientDetail({ c, jobs, jobsLoading, jobsError, onDelete }: { c: Client; jobs: Job[]; jobsLoading: boolean; jobsError: boolean; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const site = safeHttpUrl(c.websiteUrl);
  return (
    <div className="grid gap-6">
      <RecordHead name={c.name} sub={domainOf(c.websiteUrl)} badges={<ActiveBadge active={c.status === "active"} />} />

      {(site || c.email || c.phone) && (
        <div className="flex flex-wrap gap-2">
          {site && (
            <a
              href={site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-mist-0 px-4 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-mist-300 transition-colors hover:bg-mist-50"
            >
              <Icon name="globe" className="size-5" />
              Website
              <Icon name="external" className="size-4 text-mist-500" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {c.email && (
            <Button href={`mailto:${c.email}`} variant="secondary" icon="mail">
              Email
            </Button>
          )}
          {c.phone && (
            <Button href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} variant="secondary" icon="phone">
              Call
            </Button>
          )}
        </div>
      )}

      <RecordStats
        items={[
          { k: "Open roles", v: c.openJobCount ?? 0 },
          { k: "All roles", v: c.jobCount ?? 0 },
          { k: "Added", v: fmtDate(c.createdAt) },
        ]}
      />

      <Facts
        items={[
          ["Email", c.email],
          ["Phone", c.phone],
          ["Address", c.address],
          ["Location", [c.city, stateName(c.state), c.zipCode].filter(Boolean).join(", ")],
          ["Last updated", c.updatedAt ? fmtDate(c.updatedAt) : undefined],
        ]}
      />

      <section className="grid gap-2">
        <h3 className="text-adm-base font-semibold text-navy-900">Roles</h3>
        <LinkedRoles jobs={jobs} loading={jobsLoading} error={jobsError} />
      </section>

      <div className="border-t border-mist-200 pt-5">
        <InlineDelete
          label="Delete client"
          warning="The client record is removed permanently. Roles that name it keep their copy of the name. This cannot be undone."
          busy={deleting}
          onConfirm={() => {
            setDeleting(true);
            void onDelete().finally(() => setDeleting(false));
          }}
        />
      </div>
    </div>
  );
}

export default function ClientsView() {
  const { data, error, isLoading, isValidating, reload, setData } = useResource<{ clients?: Client[] }>(KEY);
  const clients = useMemo(() => data?.clients ?? [], [data]);
  const jobsRes = useJobSummaries();
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState<{ editing: Client | null } | null>(null);
  const preset = useTablePreset();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rowMenu = (c: Client, openDetail: () => void): MenuEntry[] => [
    { label: "Open", icon: "eye", onSelect: openDetail },
    { label: "Edit", icon: "edit", onSelect: () => setForm({ editing: c }) },
    { kind: "separator" },
    { label: "Delete", icon: "trash", danger: true, onSelect: () => setConfirmDelete(c) },
  ];

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete, () => undefined);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const remove = async (c: Client, close: () => void) => {
    try {
      await send(`${KEY}/${c.id}`, "DELETE");
      close();
      setData((d) => ({ ...d, clients: (d?.clients ?? []).filter((x) => x.id !== c.id) }));
      toast.show(`${c.name} deleted`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't delete the client. Try again."));
    }
  };

  const active = clients.filter((c) => c.status === "active").length;
  const openRoles = clients.reduce((a, c) => a + (c.openJobCount ?? 0), 0);
  const noContact = clients.filter((c) => !hasContact(c)).length;
  const visible = clients.filter((c) => status === "All" || statusLabel(c.status) === status);
  const top = [...clients].sort((a, b) => (b.jobCount ?? 0) - (a.jobCount ?? 0)).filter((c) => c.jobCount).slice(0, 8);
  const byState = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clients) {
      const s = stateName(c.state);
      if (s) m.set(s, (m.get(s) ?? 0) + 1);
    }
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [clients]);

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Client",
      sortable: true,
      cell: (c) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <span className="min-w-0">
            <span className="block max-w-[16rem] truncate font-medium" title={c.name}>
              {c.name}
            </span>
            <span className="block truncate text-adm-xs text-mist-600">{domainOf(c.websiteUrl)}</span>
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideBelow: "lg",
      value: (c) => c.email || c.phone || "",
      cell: (c) =>
        hasContact(c) ? (
          <span className="block min-w-0 max-w-[16rem]">
            <span className="block truncate">{c.email || c.phone}</span>
            {c.email && c.phone && <span className="block text-adm-xs text-mist-600">{c.phone}</span>}
          </span>
        ) : (
          <span className="text-adm-xs text-mist-600">No contact on file</span>
        ),
    },
    { key: "location", header: "Location", sortable: true, hideBelow: "xl", value: locationOf },
    {
      key: "roles",
      header: "Roles",
      sortable: true,
      numeric: true,
      value: (c) => (c.openJobCount ?? 0) * 10_000 + (c.jobCount ?? 0),
      cell: (c) => <RoleCount open={c.openJobCount} all={c.jobCount} />,
    },
    { key: "status", header: "Status", sortable: true, align: "center", value: (c) => statusLabel(c.status), cell: (c) => <ActiveBadge active={c.status === "active"} /> },
    { key: "createdAt", header: "Added", sortable: true, hideBelow: "xl", value: (c) => new Date(c.createdAt).getTime(), cell: (c) => <span className="tabular-nums text-mist-700">{fmtDate(c.createdAt)}</span> },
    { key: "website", header: "Website", defaultHidden: true, value: (c) => c.websiteUrl },
    { key: "email", header: "Email", defaultHidden: true, value: (c) => c.email || "" },
    { key: "phone", header: "Phone", defaultHidden: true, value: (c) => c.phone || "" },
    { key: "address", header: "Address", defaultHidden: true, value: (c) => c.address || "" },
    { key: "zipCode", header: "ZIP code", defaultHidden: true, value: (c) => c.zipCode || "" },
  ];

  // Full record regardless of visible columns.
  const exportCsv = (rows: Client[]) =>
    downloadCsv(
      "clients",
      ["Name", "Website URL", "Status", "Email", "Phone", "Address", "City", "State", "ZIP Code", "Open roles", "All roles", "Created At"],
      rows.map((c) => [c.name, c.websiteUrl, c.status, c.email || "", c.phone || "", c.address || "", c.city || "", stateOf(c.state), c.zipCode || "", c.openJobCount ?? 0, c.jobCount ?? 0, fmtDate(c.createdAt)]),
    );

  const filters: Filter<Client>[] = [
    { key: "state", label: "State", options: Array.from(new Set(clients.map((c) => stateOf(c.state)))).filter(Boolean).sort(), value: (c) => stateOf(c.state) },
    { key: "contact", label: "Contact details", options: ["On file", "Missing"], value: (c) => (hasContact(c) ? "On file" : "Missing") },
    { key: "roles", label: "Roles", options: ["Has open roles", "No open roles"], value: (c) => ((c.openJobCount ?? 0) > 0 ? "Has open roles" : "No open roles") },
  ];

  const openNew = () => setForm({ editing: null });

  const statusTabs = (
    <TableTabs
      label="Filter by status"
      value={status}
      onChange={setStatus}
      options={[
        { value: "All", label: "All", count: clients.length },
        { value: "Active", label: "Active", count: active },
        { value: "Inactive", label: "Inactive", count: clients.length - active },
      ]}
    />
  );

  return (
    <RoleGate href="/portal/clients">
      <Page>
        <PageHeader
          title="Clients"
          icon="building"
          section="relationships"

          actions={
            <>
              {clients.length > 0 && (
                <InsightsSheet title="Clients insights" description="Which clients hold the most roles, and how the accounts split by status and state.">
                  <Panel title="Roles by client" description="The clients with the most roles">
                    {top.length ? (
                      <BarChart
                        title="Open and filled or closed roles for the clients with the most roles"
                        labels={top.map((c) => (c.name.length > 14 ? `${c.name.slice(0, 13)}…` : c.name))}
                        series={[
                          { name: "Open", values: top.map((c) => c.openJobCount ?? 0) },
                          { name: "Other", values: top.map((c) => (c.jobCount ?? 0) - (c.openJobCount ?? 0)) },
                        ]}
                        height={268}
                      />
                    ) : (
                      <EmptyState compact icon="briefcase" title="No roles linked to a client yet" body="Pick a client on a job posting and it shows up here." />
                    )}
                  </Panel>
                  <Panel title="Accounts">
                    <div className="grid gap-6">
                      <StackedBar
                        title="Clients by status"
                        data={[
                          { label: "Active", value: active },
                          { label: "Inactive", value: clients.length - active },
                        ]}
                      />
                      {byState.length > 0 && (
                        <div className="grid gap-2.5 border-t border-mist-200 pt-4">
                          <p className="text-adm-xs font-medium text-mist-600">Top states</p>
                          <ul className="grid gap-2.5 text-adm-base">
                            {byState.map((s) => (
                              <li key={s.label} className="flex items-center justify-between gap-3">
                                <span className="truncate text-navy-900">{s.label}</span>
                                <span className="shrink-0 font-medium tabular-nums">
                                  {s.value} {s.value === 1 ? "client" : "clients"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Panel>
                </InsightsSheet>
              )}
              <Button icon="plus" onClick={openNew}>
                Add client
              </Button>
            </>
          }
        />

        {isLoading ? (
          <ListPageSkeleton header={false} label="Loading clients" kpis={3} insights={false} />
        ) : error && !data ? (
          <ErrorState title="Couldn't load clients" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
        ) : clients.length === 0 ? (
          <EmptyState
            framed
            variant="first-use"
            icon="building"
            title="No clients yet"
            body="Add your first client to start tracking accounts. Job postings can then link to it."
            primary={{ label: "Add client", icon: "plus", onClick: openNew }}
          />
        ) : (
          <>
            <KpiRow>
              <KpiFilter label="Show active clients" active={status === "Active"} onClick={() => setStatus((s) => (s === "Active" ? "All" : "Active"))}>
                <StatCard section="relationships" label="Active clients" value={active} icon="building" hint={`of ${clients.length} on record`} trend="flat" />
              </KpiFilter>
              <KpiFilter label="Show clients with open roles" active={preset.isOn("roles", "Has open roles")} onClick={() => preset.toggle("roles", "Has open roles")}>
                <StatCard section="relationships" label="Open roles" value={openRoles} icon="briefcase" hint={`across ${clients.filter((c) => c.openJobCount).length} clients`} trend="flat" />
              </KpiFilter>
              <KpiFilter label="Show clients missing contact details" active={preset.isOn("contact", "Missing")} onClick={() => preset.toggle("contact", "Missing")}>
                <StatCard section="relationships" label="Missing contact details" value={noContact} icon="alert" hint={noContact ? "no email or phone · fix these" : "every client has one"} trend="flat" />
              </KpiFilter>
            </KpiRow>

            <section aria-label="Client list" className="grid gap-4">
              {visible.length === 0 ? (
                <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
                  <div className="border-b border-mist-200 px-2 sm:px-4">{statusTabs}</div>
                  <EmptyState variant="no-results" title="No clients match this status" onClearFilters={() => setStatus("All")} />
                </div>
              ) : (
                <DataTable
                  key={preset.key}
                  {...preset.table}
                  rows={visible}
                  tabs={statusTabs}
                  columns={columns}
                  filters={filters}
                  exportName="clients"
                  onExport={exportCsv}
                  storageKey="clients"
                  initialSort={{ key: "createdAt", dir: -1 }}
                  searchPlaceholder="Search name, website, email or city"
                  emptyTitle="No clients match your filters"
                  detailTitle={(c) => c.name}
                  detailActions={(c) => (
                    <Button size="sm" variant="secondary" icon="edit" onClick={() => setForm({ editing: clients.find((x) => x.id === c.id) ?? c })}>
                      Edit
                    </Button>
                  )}
                  rowMenu={rowMenu}
                  renderDetail={(r, close) => {
                    const live = clients.find((x) => x.id === r.id);
                    return live ? (
                      <ClientDetail
                        c={live}
                        jobs={(jobsRes.jobs ?? []).filter((j) => j.clientId === live.id)}
                        jobsLoading={jobsRes.isLoading}
                        jobsError={!!jobsRes.error && !jobsRes.jobs}
                        onDelete={() => remove(live, close)}
                      />
                    ) : (
                      <GoneNotice noun="client" />
                    );
                  }}
                />
              )}
            </section>
          </>
        )}
      </Page>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this client?"
          body={`${confirmDelete.name} is removed permanently. Roles that name it keep their copy of the name. This cannot be undone.`}
          confirmLabel="Delete"
          requireText={deleteConfirmText(confirmDelete.name)}
          busy={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void confirmRemove()}
        />
      )}

      {form && (
        <ClientForm
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={(name) => {
            setForm(null);
            void reload();
            toast.show(form.editing ? `${name} updated` : `${name} added`);
          }}
        />
      )}
    </RoleGate>
  );
}
