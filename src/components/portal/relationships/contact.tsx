"use client";

import { useEffect, useRef, useState } from "react";
import { mutate } from "@/hooks/use-resource";
import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { fmtDateTime } from "@/lib/format";
import { safeHttpUrl } from "@/lib/portal/format";
import Icon from "../icons";
import { Avatar, Badge, Button, Segmented, type Tone } from "../ui";
import { Facts, inputCls, send } from "./shared";

// One enquiry model for the Contacts drawer and the /portal/contacts/[id] record.

export type ContactStatus = Contact["status"];

/** Archived is a choice, not an error: neutral, never red. */
export const CONTACT_STATUSES: { id: ContactStatus; label: string; tone: Tone }[] = [
  { id: "new", label: "New", tone: "blue" },
  { id: "read", label: "Read", tone: "cyan" },
  { id: "responded", label: "Responded", tone: "green" },
  { id: "archived", label: "Archived", tone: "grey" },
];
export const contactStatusMeta = (s: ContactStatus) => CONTACT_STATUSES.find((x) => x.id === s) ?? CONTACT_STATUSES[0];

export const contactName = (c: Pick<Contact, "firstName" | "lastName" | "email">) => `${c.firstName} ${c.lastName}`.trim() || c.email;
export const audienceOf = (c: Pick<Contact, "inquiryType">) => (isJobSeeker(c.inquiryType) ? "Looking for work" : "Hiring staff");
export const topicOf = (c: Pick<Contact, "inquiryType">) => (isJobSeeker(c.inquiryType) ? seekerArea(c.inquiryType) : c.inquiryType);
export const replyHref = (c: Pick<Contact, "email" | "inquiryType">) => `mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.inquiryType} enquiry`)}`;
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const NOTES_MAX = 2000;

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const m = contactStatusMeta(status);
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function AudienceBadge({ c }: { c: Pick<Contact, "inquiryType"> }) {
  return <Badge tone={isJobSeeker(c.inquiryType) ? "cyan" : "blue"}>{audienceOf(c)}</Badge>;
}

/** PATCH replaces status too, so notes always travel with the current status. */
export const saveContactNotes = (c: Contact, notes: string) => send(`/api/contacts/${c.id}`, "PATCH", { status: c.status, notes });
export const saveContactStatus = (id: string, status: ContactStatus) => send(`/api/contacts/${id}`, "PATCH", { status });

/** Opening an unread enquiry marks it read, once per mount; drawer and record page share the rule. */
export function useMarkReadOnOpen(c: Contact | undefined, markRead: (c: Contact) => void) {
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!c || c.status !== "new" || done.current === c.id) return;
    done.current = c.id;
    markRead(c);
  }, [c, markRead]);
}

/** Reply, call, mark responded, and the status switch. */
export function ContactRespond({ c, onStatus, busy }: { c: Contact; onStatus: (s: ContactStatus) => void; busy?: boolean }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        {/* Replying marks the enquiry responded. */}
        <a
          href={replyHref(c)}
          onClick={() => c.status !== "responded" && !busy && onStatus("responded")}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ocean-600 px-4 text-adm-base font-medium text-white transition-colors hover:bg-ocean-700"
        >
          <Icon name="send" className="size-5" />
          Reply by email
        </a>
        <p className="text-adm-xs text-mist-600">Opens your mail app and marks the enquiry responded.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {c.phone && (
          <Button href={telHref(c.phone)} variant="secondary" icon="phone" className="flex-1">
            Call
          </Button>
        )}
        {c.status !== "responded" && (
          <Button variant="secondary" icon="check" onClick={() => onStatus("responded")} disabled={busy} className="flex-1">
            Mark responded
          </Button>
        )}
      </div>
      <div className="grid gap-2">
        <p className="text-adm-xs font-medium text-mist-600">Status</p>
        <Segmented
          label="Enquiry status"
          value={c.status}
          onChange={(s) => s !== c.status && !busy && onStatus(s)}
          options={CONTACT_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
        />
      </div>
    </div>
  );
}

export function ContactMessage({ c }: { c: Contact }) {
  return <p className="max-w-[70ch] whitespace-pre-wrap break-words text-adm-base leading-normal text-navy-900">{c.message}</p>;
}

/** The same fact set in the drawer and on the record page. */
export function ContactFacts({ c, stacked }: { c: Contact; /** One column, for a narrow rail */ stacked?: boolean }) {
  const linkedin = safeHttpUrl(c.linkedinUrl);
  const link = "text-ocean-700 underline-offset-2 hover:underline";
  return (
    <Facts
      cols={stacked ? 1 : 2}
      items={[
        ["Email", <a key="e" href={`mailto:${c.email}`} className={link}>{c.email}</a>],
        ["Phone", c.phone ? <a key="p" href={telHref(c.phone)} className={`${link} tabular-nums`}>{c.phone}</a> : undefined],
        ["For", audienceOf(c)],
        [isJobSeeker(c.inquiryType) ? "Area" : "Enquiry", topicOf(c)],
        ["Company", c.company],
        ["Job title", c.jobTitle],
        [
          "LinkedIn",
          linkedin ? (
            <a key="l" href={linkedin} target="_blank" rel="noopener noreferrer" className={link}>
              View profile
            </a>
          ) : (
            c.linkedinUrl
          ),
        ],
        ["Received", fmtDateTime(c.createdAt)],
        ...(c.updatedAt ? [["Updated", fmtDateTime(c.updatedAt)] as [string, React.ReactNode]] : []),
      ]}
    />
  );
}

/** Internal notes; only staff see them. Saves on its own button. */
export function ContactNotes({ c, onSave }: { c: Contact; onSave: (notes: string) => Promise<void> }) {
  const [value, setValue] = useState(c.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A save elsewhere (or a refetch) resets the field when it isn't being edited.
  const [base, setBase] = useState(c.notes ?? "");
  if ((c.notes ?? "") !== base) {
    setBase(c.notes ?? "");
    if (value === base) setValue(c.notes ?? "");
  }
  const dirty = value.trim() !== (c.notes ?? "").trim();
  const over = value.length > NOTES_MAX;

  const save = async () => {
    if (!dirty || over || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(value.trim());
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save the notes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-2">
      <label className="block text-adm-base font-medium text-navy-900">
        Internal notes
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder="Context for the team: who picked it up, what was agreed, next steps."
          aria-invalid={over || undefined}
          className={`${inputCls} h-auto min-h-24 resize-y py-2 leading-normal`}
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-adm-xs tabular-nums ${over ? "text-status-danger" : "text-mist-600"}`}>
          {error ? <span role="alert" className="text-status-danger">{error}</span> : `${value.length} / ${NOTES_MAX} · Not shown to the sender`}
        </span>
        <div className="flex gap-2">
          {dirty && (
            <Button size="sm" variant="ghost" onClick={() => setValue(c.notes ?? "")} disabled={saving}>
              Discard
            </Button>
          )}
          <Button size="sm" variant="secondary" icon="check" onClick={() => void save()} disabled={!dirty || over} loading={saving}>
            Save notes
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Drawer header block: who wrote and what about. */
export function ContactIdentity({ c }: { c: Contact }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={contactName(c)} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-adm-md font-semibold text-navy-900">{contactName(c)}</p>
        <p className="truncate text-adm-base text-mist-600">{[c.jobTitle, c.company].filter(Boolean).join(", ") || audienceOf(c)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ContactStatusBadge status={c.status} />
          <AudienceBadge c={c} />
        </div>
      </div>
    </div>
  );
}

const LIST_KEY = "/api/contacts";

/** Applies a change to every cached copy of an enquiry (list and record) without a refetch. */
export function syncContact(id: string, fn: (c: Contact) => Contact) {
  void mutate<{ contacts?: Contact[] }>((k) => k === LIST_KEY, (d) => (d?.contacts ? { ...d, contacts: d.contacts.map((c) => (c.id === id ? fn(c) : c)) } : d!), { revalidate: false });
  void mutate<{ contact?: Contact }>((k) => k === `${LIST_KEY}/${id}`, (d) => (d?.contact ? { ...d, contact: fn(d.contact) } : d!), { revalidate: false });
}

export function dropContact(id: string) {
  void mutate<{ contacts?: Contact[] }>((k) => k === LIST_KEY, (d) => (d?.contacts ? { ...d, contacts: d.contacts.filter((c) => c.id !== id) } : d!), { revalidate: false });
}
