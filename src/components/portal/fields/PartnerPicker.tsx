"use client";

import { useState } from "react";
import type { Client, Vendor } from "@/lib/aws/dynamodb";
import { useFormErrors } from "@/hooks/use-form-errors";
import { LIMITS, check, collectErrors, email, maxLen, phone, required, website } from "@/lib/form-validation";
import { Button } from "../kit/Button";
import { Modal } from "../kit/overlay";
import { Field, FormBanner, NativeSelect, TextInput } from "./base";
import type { StaffPerson } from "./StaffPicker";

export type NewClientInput = { name: string; websiteUrl: string; email: string; phone: string };
export type NewVendorInput = Pick<Vendor, "name" | "contactPerson" | "email" | "vendorLeadId" | "vendorLeadName" | "vendorLeadRole">;

const ADD = "__add__";

/**
 * Client or vendor select with "+ Add new" at the top, which opens a small
 * create dialog and selects the new record. Without `onCreate` it is a plain picker.
 */
export function PartnerPicker<T extends { id: string; name: string }>({
  id,
  kind,
  items,
  value,
  onChange,
  noneLabel,
  onCreate,
  renderCreate,
}: {
  id?: string;
  kind: "client" | "vendor";
  items: T[];
  value: string;
  onChange: (id: string, item: T | null) => void;
  noneLabel: string;
  onCreate?: (created: T) => void;
  /** The create dialog; receives close and done */
  renderCreate?: (close: () => void, done: (item: T) => void) => React.ReactNode;
}) {
  const [creating, setCreating] = useState(false);
  const known = items.some((i) => i.id === value);
  return (
    <>
      <NativeSelect
        id={id}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === ADD) {
            setCreating(true);
            return;
          }
          onChange(v, items.find((i) => i.id === v) ?? null);
        }}
      >
        <option value="">{noneLabel}</option>
        {renderCreate && <option value={ADD}>+ Add new {kind}</option>}
        {value && !known && <option value={value}>Current {kind}</option>}
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </NativeSelect>
      {creating &&
        renderCreate?.(
          () => setCreating(false),
          (item) => {
            setCreating(false);
            onCreate?.(item);
            onChange(item.id, item);
          },
        )}
    </>
  );
}

/** POST /api/clients through `onAdd`; validation matches the clients page. */
export function AddClientDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (data: NewClientInput) => Promise<Client> }) {
  const [form, setForm] = useState<NewClientInput>({ name: "", websiteUrl: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () =>
      collectErrors({
        name: check(form.name, required("Enter the client's company name."), maxLen(LIMITS.name)),
        websiteUrl: check(form.websiteUrl, required("Enter the client's website, like www.acme.com."), website(), maxLen(LIMITS.url)),
        email: check(form.email, email("Enter the client's email, like contact@acme.com."), maxLen(LIMITS.email)),
        phone: check(form.phone, phone()),
      }),
    { name: "client-name", websiteUrl: "client-website", email: "client-email", phone: "client-phone" },
  );
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || !validateAll()) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The client could not be added. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Add a client"
      size="sm"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            Add client
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={submit} onBlur={revalidate} className="grid gap-5">
        <FormBanner message={error} onDismiss={() => setError(null)} />
        <Field label="Client name" required htmlFor="client-name" error={errors.name}>
          <TextInput id="client-name" {...invalidProps("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" autoFocus />
        </Field>
        <Field label="Website" required htmlFor="client-website" error={errors.websiteUrl}>
          <TextInput id="client-website" inputMode="url" {...invalidProps("websiteUrl")} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="www.example.com" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" optional htmlFor="client-email" error={errors.email}>
            <TextInput id="client-email" type="email" {...invalidProps("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
          </Field>
          <Field label="Phone" optional htmlFor="client-phone" error={errors.phone}>
            <TextInput id="client-phone" type="tel" {...invalidProps("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

/** POST /api/vendors through `onAdd`. The lead is an admin or HR user, defaulting to you. */
export function AddVendorDialog({
  leads,
  defaultLeadId,
  onClose,
  onAdd,
}: {
  leads: StaffPerson[];
  defaultLeadId?: string;
  onClose: () => void;
  onAdd: (data: NewVendorInput) => Promise<Vendor>;
}) {
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    vendorLeadId: leads.some((u) => u.id === defaultLeadId) ? defaultLeadId! : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () =>
      collectErrors({
        name: check(form.name, required("Enter the vendor's company name."), maxLen(LIMITS.name)),
        contactPerson: check(form.contactPerson, maxLen(LIMITS.name)),
        email: check(form.email, email("Enter the vendor's email, like contact@acme.com."), maxLen(LIMITS.email)),
        vendorLeadId: check(form.vendorLeadId, required("Choose who leads this vendor.")),
      }),
    { name: "vendor-name", contactPerson: "vendor-contact", email: "vendor-email", vendorLeadId: "vendor-lead" },
  );
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || !validateAll()) return;
    const lead = leads.find((u) => u.id === form.vendorLeadId);
    if (!lead) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        name: form.name,
        contactPerson: form.contactPerson,
        email: form.email,
        vendorLeadId: lead.id,
        vendorLeadName: lead.name || lead.email,
        vendorLeadRole: lead.role as "admin" | "hr",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The vendor could not be added. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Add a vendor"
      size="sm"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            Add vendor
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={submit} onBlur={revalidate} className="grid gap-5">
        <FormBanner message={error} onDismiss={() => setError(null)} />
        <Field label="Vendor name" required htmlFor="vendor-name" error={errors.name}>
          <TextInput id="vendor-name" {...invalidProps("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Staffing" autoFocus />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact person" optional htmlFor="vendor-contact" error={errors.contactPerson}>
            <TextInput id="vendor-contact" {...invalidProps("contactPerson")} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" optional htmlFor="vendor-email" error={errors.email}>
            <TextInput id="vendor-email" type="email" {...invalidProps("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
          </Field>
        </div>
        <Field label="Vendor lead" required htmlFor="vendor-lead" error={errors.vendorLeadId}>
          <NativeSelect id="vendor-lead" {...invalidProps("vendorLeadId")} value={form.vendorLeadId} onChange={(e) => setForm({ ...form, vendorLeadId: e.target.value })}>
            <option value="">Select lead</option>
            {leads.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </form>
    </Modal>
  );
}
