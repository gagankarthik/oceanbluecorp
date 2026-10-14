"use client";

import { useMemo, useState } from "react";
import type { Job, Vendor } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { check, collectErrors, email, LIMITS, maxLen, required, type FieldErrors } from "@/lib/form-validation";
import { useResource } from "@/hooks/use-resource";
import { useJobSummaries, useUserDirectory } from "@/hooks/use-console-data";
import DataTable, { TableTabs, type Column, type Filter } from "@/components/portal/DataTable";
import { RoleGate } from "@/components/portal/session";
import type { MenuEntry } from "@/components/portal/records/Menu";
import { Avatar, Badge, Button, ConfirmDialog, deleteConfirmText, EmptyState, ErrorState, InsightsSheet, KpiRow, ListPageSkeleton, Modal, Page, PageHeader, Panel, StatCard } from "@/components/portal/kit";
import { BarChart, DonutChart } from "@/components/portal/charts";
import Select from "@/components/portal/Select";
import { Facts, Field, FormError, GoneNotice, InlineDelete, LinkedRoles, errorText, inputCls, send, useDiscardGuard, useToast } from "@/components/portal/relationships/shared";
import { FieldShell, KpiFilter, RecordHead, RecordStats, RoleCount, StateField, stateName, stateOf, useTablePreset } from "@/components/portal/relationships/register";

const KEY = "/api/vendors";
type LeadRole = Vendor["vendorLeadRole"];
const leadLabel = (r: LeadRole) => (r === "admin" ? "Admin" : "HR");
const FORM_ID = "vendor-form";
const locationOf = (v: Vendor) => [stateOf(v.state), v.zipCode].filter(Boolean).join(" ");
const hasContact = (v: Vendor) => !!(v.contactPerson || v.email);

type Form = { name: string; contactPerson: string; email: string; state: string; zipCode: string; vendorLeadId: string; vendorLeadName: string; vendorLeadRole: LeadRole };
type FormField = "name" | "vendorLead" | "contactPerson" | "email" | "state" | "zipCode";
const blank: Form = { name: "", contactPerson: "", email: "", state: "", zipCode: "", vendorLeadId: "", vendorLeadName: "", vendorLeadRole: "hr" };
const toForm = (v: Vendor): Form => ({
  name: v.name,
  contactPerson: v.contactPerson || "",
  email: v.email || "",
  state: stateOf(v.state),
  zipCode: v.zipCode || "",
  vendorLeadId: v.vendorLeadId || "",
  vendorLeadName: v.vendorLeadName || "",
  vendorLeadRole: v.vendorLeadRole || "hr",
});

function validate(f: Form): FieldErrors<FormField> {
  return collectErrors<FormField>({
    name: check(f.name, required("Enter the vendor's name."), maxLen(LIMITS.name)),
    vendorLead: check(f.vendorLeadId, required("Choose the HR or admin teammate who owns this vendor.")),
    contactPerson: check(f.contactPerson, maxLen(LIMITS.name)),
    email: check(f.email, email("Enter the vendor's email, like name@company.com."), maxLen(LIMITS.email)),
    state: check(f.state, maxLen(LIMITS.name)),
    zipCode: check(f.zipCode, maxLen(10, "Enter a ZIP code of 10 characters or fewer, like 43215.")),
  });
}

type Lead = { id: string; name: string; role: LeadRole };

function VendorForm({ editing, leads, leadsLoading, onClose, onSaved }: { editing: Vendor | null; leads: Lead[]; leadsLoading: boolean; onClose: () => void; onSaved: (name: string) => void }) {
  const initial = editing ? toForm(editing) : blank;
  const [f, setF] = useState<Form>(initial);
  const [errors, setErrors] = useState<FieldErrors<FormField>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { close, prompt } = useDiscardGuard(JSON.stringify(f) !== JSON.stringify(initial), saving, onClose);

  // The current lead stays selectable even if they have since left HR/admin.
  const options = [
    ...leads.map((l) => ({ value: l.id, label: l.name, description: leadLabel(l.role) })),
    ...(f.vendorLeadId && !leads.some((l) => l.id === f.vendorLeadId) ? [{ value: f.vendorLeadId, label: f.vendorLeadName || "Current lead", description: leadLabel(f.vendorLeadRole) }] : []),
  ];

  const input = (k: Exclude<FormField, "vendorLead">, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
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
      setSaveError(errorText(err, "The vendor could not be saved. Try again."));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit vendor" : "Add vendor"}
      description={editing ? editing.name : "Staffing partners we source through. Every vendor has an HR or admin owner."}
      onClose={close}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} icon="check" loading={saving}>
            {editing ? "Save changes" : "Add vendor"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="grid gap-5">
        {prompt}
        <FormError message={saveError} />
        <fieldset className="grid gap-4">
          <legend className="sr-only">Vendor</legend>
          <p aria-hidden className="text-adm-base font-semibold text-navy-900">
            Vendor
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor name" required error={errors.name}>
              {input("name", { autoFocus: true, maxLength: LIMITS.name })}
            </Field>
            <FieldShell label="Vendor lead" required error={errors.vendorLead} hint="The HR or admin teammate who owns this relationship.">
              <Select
                label="Vendor lead"
                showLabel={false}
                variant="field"
                width="w-full"
                searchable={options.length > 6}
                disabled={leadsLoading && !options.length}
                value={f.vendorLeadId}
                onChange={(id) => {
                  const l = leads.find((x) => x.id === id);
                  if (l) setF({ ...f, vendorLeadId: l.id, vendorLeadName: l.name, vendorLeadRole: l.role });
                }}
                options={[{ value: "", label: leadsLoading ? "Loading teammates…" : options.length ? "Choose a teammate" : "No HR or admin teammates" }, ...options]}
              />
            </FieldShell>
          </div>
        </fieldset>
        <fieldset className="grid gap-4 border-t border-mist-200 pt-5">
          <legend className="sr-only">Contact</legend>
          <p aria-hidden className="text-adm-base font-semibold text-navy-900">
            Contact
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person" error={errors.contactPerson}>
              {input("contactPerson", { autoComplete: "off" })}
            </Field>
            <Field label="Email" error={errors.email}>
              {input("email", { type: "email", placeholder: "name@vendor.com", autoComplete: "off" })}
            </Field>
            <StateField value={f.state} onChange={(v) => setF({ ...f, state: v })} error={errors.state} />
            <Field label="ZIP code" error={errors.zipCode}>
              {input("zipCode", { inputMode: "numeric", maxLength: 10 })}
            </Field>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function VendorDetail({ v, jobs, jobsLoading, jobsError, onDelete }: { v: Vendor; jobs: Job[]; jobsLoading: boolean; jobsError: boolean; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="grid gap-6">
      <RecordHead
        name={v.name}
        sub={v.contactPerson || v.email || "No contact on file"}
        badges={
          <>
            <Badge tone={v.vendorLeadName ? "blue" : "red"}>Lead: {v.vendorLeadName || "Unassigned"}</Badge>
            <Badge>{leadLabel(v.vendorLeadRole)}</Badge>
          </>
        }
      />

      {v.email && (
        <div className="flex flex-wrap gap-2">
          <Button href={`mailto:${v.email}`} variant="secondary" icon="mail">
            Email contact
          </Button>
        </div>
      )}

      <RecordStats
        items={[
          { k: "Open roles", v: v.openJobCount ?? 0 },
          { k: "All roles", v: v.jobCount ?? 0 },
          { k: "Added", v: fmtDate(v.createdAt) },
        ]}
      />

      <Facts
        items={[
          ["Contact person", v.contactPerson],
          ["Email", v.email],
          ["Location", [stateName(v.state), v.zipCode].filter(Boolean).join(" ")],
          ["Vendor lead", v.vendorLeadName],
          ["Last updated", v.updatedAt ? fmtDate(v.updatedAt) : undefined],
        ]}
      />

      <section className="grid gap-2">
        <h3 className="text-adm-base font-semibold text-navy-900">Roles</h3>
        <LinkedRoles jobs={jobs} loading={jobsLoading} error={jobsError} />
      </section>

      <div className="border-t border-mist-200 pt-5">
        <InlineDelete
          label="Delete vendor"
          warning="The vendor record is removed permanently. Roles that name it keep their copy of the name. This cannot be undone."
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

export default function VendorsView() {
  const { data, error, isLoading, isValidating, reload, setData } = useResource<{ vendors?: Vendor[] }>(KEY);
  const vendors = useMemo(() => data?.vendors ?? [], [data]);
  const jobsRes = useJobSummaries();
  const directory = useUserDirectory();
  const [lead, setLead] = useState("All");
  const [form, setForm] = useState<{ editing: Vendor | null } | null>(null);
  const preset = useTablePreset();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Only HR and admin teammates may own a vendor relationship.
  const leads = useMemo<Lead[]>(
    () =>
      (directory.users ?? [])
        .filter((u) => u.role === "hr" || u.role === "admin")
        .map((u) => ({ id: u.id, name: u.name || u.email, role: u.role as LeadRole }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [directory.users],
  );

  const rowMenu = (v: Vendor, openDetail: () => void): MenuEntry[] => [
    { label: "Open", icon: "eye", onSelect: openDetail },
    { label: "Edit", icon: "edit", onSelect: () => setForm({ editing: v }) },
    { kind: "separator" },
    { label: "Delete", icon: "trash", danger: true, onSelect: () => setConfirmDelete(v) },
  ];

  const confirmRemove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await remove(confirmDelete, () => undefined);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const remove = async (v: Vendor, close: () => void) => {
    try {
      await send(`${KEY}/${v.id}`, "DELETE");
      close();
      setData((d) => ({ ...d, vendors: (d?.vendors ?? []).filter((x) => x.id !== v.id) }));
      toast.show(`${v.name} deleted`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't delete the vendor. Try again."));
    }
  };

  const openRoles = vendors.reduce((a, v) => a + (v.openJobCount ?? 0), 0);
  const withRoles = vendors.filter((v) => v.jobCount).length;
  const noContact = vendors.filter((v) => !hasContact(v)).length;
  const byLead = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of vendors) {
      const k = v.vendorLeadName || "Unassigned";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    const sorted = [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    return sorted.length <= 6 ? sorted : [...sorted.slice(0, 5), { label: "Others", value: sorted.slice(5).reduce((a, x) => a + x.value, 0) }];
  }, [vendors]);
  const leadBucket = (v: Vendor) => {
    const k = v.vendorLeadName || "Unassigned";
    return byLead.some((b) => b.label === k) ? k : "Others";
  };
  const top = [...vendors].sort((a, b) => (b.jobCount ?? 0) - (a.jobCount ?? 0)).filter((v) => v.jobCount).slice(0, 8);
  const visible = vendors.filter((v) => lead === "All" || leadBucket(v) === lead);

  const columns: Column<Vendor>[] = [
    {
      key: "name",
      header: "Vendor",
      sortable: true,
      cell: (v) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={v.name} size="sm" />
          <span className="block max-w-[16rem] truncate font-medium" title={v.name}>
            {v.name}
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideBelow: "lg",
      value: (v) => v.contactPerson || v.email || "",
      cell: (v) =>
        hasContact(v) ? (
          <span className="block min-w-0 max-w-[16rem]">
            <span className="block truncate">{v.contactPerson || v.email}</span>
            {v.contactPerson && v.email && <span className="block truncate text-adm-xs text-mist-600">{v.email}</span>}
          </span>
        ) : (
          <span className="text-adm-xs text-mist-600">No contact on file</span>
        ),
    },
    { key: "location", header: "Location", sortable: true, hideBelow: "xl", value: locationOf },
    { key: "roles", header: "Roles", sortable: true, numeric: true, value: (v) => (v.openJobCount ?? 0) * 10_000 + (v.jobCount ?? 0), cell: (v) => <RoleCount open={v.openJobCount} all={v.jobCount} /> },
    {
      key: "lead",
      header: "Vendor lead",
      sortable: true,
      value: (v) => v.vendorLeadName || "",
      cell: (v) =>
        v.vendorLeadName ? (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={v.vendorLeadName} size="sm" />
            <span className="min-w-0">
              <span className="block truncate">{v.vendorLeadName}</span>
              <span className="block text-adm-xs text-mist-600">{leadLabel(v.vendorLeadRole)}</span>
            </span>
          </span>
        ) : (
          <span className="text-adm-base font-medium text-status-danger">Unassigned</span>
        ),
    },
    { key: "createdAt", header: "Added", sortable: true, hideBelow: "xl", value: (v) => new Date(v.createdAt).getTime(), cell: (v) => <span className="tabular-nums text-mist-700">{fmtDate(v.createdAt)}</span> },
    { key: "email", header: "Email", defaultHidden: true, value: (v) => v.email || "" },
    { key: "leadRole", header: "Lead role", defaultHidden: true, value: (v) => leadLabel(v.vendorLeadRole) },
  ];

  // Full record regardless of visible columns.
  const exportCsv = (rows: Vendor[]) =>
    downloadCsv(
      "vendors",
      ["Name", "Contact Person", "Email", "State", "ZIP Code", "Vendor Lead", "Vendor Lead Role", "Open roles", "All roles", "Created At"],
      rows.map((v) => [v.name, v.contactPerson || "", v.email || "", stateOf(v.state), v.zipCode || "", v.vendorLeadName || "", (v.vendorLeadRole || "").toUpperCase(), v.openJobCount ?? 0, v.jobCount ?? 0, fmtDate(v.createdAt)]),
    );

  const filters: Filter<Vendor>[] = [
    { key: "leadRole", label: "Lead role", options: ["HR", "Admin"], value: (v) => leadLabel(v.vendorLeadRole) },
    { key: "state", label: "State", options: Array.from(new Set(vendors.map((v) => stateOf(v.state)))).filter(Boolean).sort(), value: (v) => stateOf(v.state) },
    { key: "contact", label: "Contact details", options: ["On file", "Missing"], value: (v) => (hasContact(v) ? "On file" : "Missing") },
    { key: "roles", label: "Roles", options: ["Has open roles", "No open roles"], value: (v) => ((v.openJobCount ?? 0) > 0 ? "Has open roles" : "No open roles") },
  ];

  const openNew = () => setForm({ editing: null });

  const leadTabs =
    byLead.length > 1 ? (
      <TableTabs
        label="Filter by vendor lead"
        value={lead}
        onChange={setLead}
        options={[{ value: "All", label: "All", count: byLead.reduce((n, b) => n + b.value, 0) }, ...byLead.map((b) => ({ value: b.label, label: b.label, count: b.value }))]}
      />
    ) : undefined;

  return (
    <RoleGate href="/portal/vendors">
      <Page>
        <PageHeader
          title="Vendors"
          icon="handshake"
          section="relationships"

          actions={
            <>
              {vendors.length > 0 && (
                <InsightsSheet title="Vendors insights" description="Which vendors carry the most roles, and who leads each one.">
                  <Panel title="Roles by vendor" description="The vendors with the most roles">
                    {top.length ? (
                      <BarChart
                        title="Open and other roles for the vendors with the most roles"
                        labels={top.map((v) => (v.name.length > 14 ? `${v.name.slice(0, 13)}…` : v.name))}
                        series={[
                          { name: "Open", values: top.map((v) => v.openJobCount ?? 0) },
                          { name: "Other", values: top.map((v) => (v.jobCount ?? 0) - (v.openJobCount ?? 0)) },
                        ]}
                        height={268}
                      />
                    ) : (
                      <EmptyState compact icon="briefcase" title="No roles linked to a vendor yet" body="Pick a vendor on a job posting and it shows up here." />
                    )}
                  </Panel>
                  <Panel title="Vendors by lead">
                    <DonutChart title="Vendors by vendor lead" data={byLead} centerLabel="Vendors" size={168} />
                  </Panel>
                </InsightsSheet>
              )}
              <Button icon="plus" onClick={openNew}>
                Add vendor
              </Button>
            </>
          }
        />

        {isLoading ? (
          <ListPageSkeleton header={false} label="Loading vendors" kpis={3} insights={false} />
        ) : error && !data ? (
          <ErrorState title="Couldn't load vendors" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
        ) : vendors.length === 0 ? (
          <EmptyState
            framed
            variant="first-use"
            icon="handshake"
            title="No vendors yet"
            body="Add a vendor and choose the HR or admin teammate who owns it. Job postings can then link to it."
            primary={{ label: "Add vendor", icon: "plus", onClick: openNew }}
          />
        ) : (
          <>
            <KpiRow>
              <StatCard section="relationships" label="Vendors" value={vendors.length} icon="handshake" hint={`${withRoles} with roles`} trend="flat" />
              <KpiFilter label="Show vendors with open roles" active={preset.isOn("roles", "Has open roles")} onClick={() => preset.toggle("roles", "Has open roles")}>
                <StatCard section="relationships" label="Open roles through vendors" value={openRoles} icon="briefcase" hint={`across ${vendors.filter((v) => v.openJobCount).length} vendors`} trend="flat" />
              </KpiFilter>
              <KpiFilter label="Show vendors missing contact details" active={preset.isOn("contact", "Missing")} onClick={() => preset.toggle("contact", "Missing")}>
                <StatCard section="relationships" label="Missing contact details" value={noContact} icon="alert" hint={noContact ? "no contact person or email · fix these" : "every vendor has one"} trend="flat" />
              </KpiFilter>
            </KpiRow>

            <section aria-label="Vendor list" className="grid gap-4">
              {visible.length === 0 ? (
                <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
                  {leadTabs && <div className="border-b border-mist-200 px-2 sm:px-4">{leadTabs}</div>}
                  <EmptyState variant="no-results" title="No vendors for this lead" onClearFilters={() => setLead("All")} />
                </div>
              ) : (
                <DataTable
                  key={preset.key}
                  {...preset.table}
                  rows={visible}
                  tabs={leadTabs}
                  columns={columns}
                  filters={filters}
                  exportName="vendors"
                  onExport={exportCsv}
                  storageKey="vendors"
                  initialSort={{ key: "createdAt", dir: -1 }}
                  searchPlaceholder="Search vendor, contact, email or lead"
                  emptyTitle="No vendors match your filters"
                  detailTitle={(v) => v.name}
                  detailActions={(v) => (
                    <Button size="sm" variant="secondary" icon="edit" onClick={() => setForm({ editing: vendors.find((x) => x.id === v.id) ?? v })}>
                      Edit
                    </Button>
                  )}
                  rowMenu={rowMenu}
                  renderDetail={(r, close) => {
                    const live = vendors.find((x) => x.id === r.id);
                    return live ? (
                      <VendorDetail
                        v={live}
                        jobs={(jobsRes.jobs ?? []).filter((j) => j.vendorId === live.id)}
                        jobsLoading={jobsRes.isLoading}
                        jobsError={!!jobsRes.error && !jobsRes.jobs}
                        onDelete={() => remove(live, close)}
                      />
                    ) : (
                      <GoneNotice noun="vendor" />
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
          title="Delete this vendor?"
          body={`${confirmDelete.name} is removed permanently. Roles that name it keep their copy of the name. This cannot be undone.`}
          confirmLabel="Delete"
          requireText={deleteConfirmText(confirmDelete.name)}
          busy={deleting}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void confirmRemove()}
        />
      )}

      {form && (
        <VendorForm
          editing={form.editing}
          leads={leads}
          leadsLoading={directory.isLoading}
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
