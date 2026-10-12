"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { Contact } from "@/lib/aws/dynamodb";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { IconEye, IconMailOpen, IconMessage, IconSend, IconTrash } from "@/components/admin/icons";
import { RowMenu } from "@/components/admin/table-cells";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { CONTACT_STATUS_META, contactName, replyHref, type ContactStatus } from "./contact-status";

function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

/** US numbers as (614) 555-0100; anything else as typed. */
function displayPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const us = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return us.length === 10 ? `(${us.slice(0, 3)}) ${us.slice(3, 6)}-${us.slice(6)}` : raw;
}


const ENQUIRY_COLUMNS: DataTableColumn<Contact>[] = [
  {
    key: "company",
    header: "Company",
    label: "Company",
    width: "180px",
    hideBelow: "xl",
    sortValue: (c) => c.company,
    cell: (c) => c.company ? <span className="text-[var(--adm-ink-mute)]">{c.company}</span> : <Blank />,
  },
  {
    key: "type",
    header: "Enquiry",
    label: "Enquiry",
    width: "170px",
    hideBelow: "sm",
    sortValue: (c) => c.inquiryType,
    cell: (c) => {
      const text = isJobSeeker(c.inquiryType) ? `Job seeker · ${seekerArea(c.inquiryType)}` : c.inquiryType;
      return <span className="block max-w-[170px] truncate text-[var(--adm-ink-mute)]" title={text}>{text}</span>;
    },
  },
];

const NAME_COLUMN: DataTableColumn<Contact> = {
  key: "name",
  header: "Name",
  label: "Name",
  locked: true,
  width: "230px",
  sortValue: (c) => contactName(c),
  cell: (c) => {
    // "new" is this screen's unread: nobody has opened it yet.
    const unread = c.status === "new";
    return (
      <Link
        href={`/admin/contacts/${c.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex min-w-0 items-center gap-2.5 rounded-[6px]"
      >
        <Avatar name={contactName(c)} email={c.email} size="sm" />
        <span className={cn("truncate text-[var(--adm-ink)]", unread ? "font-semibold" : "font-medium")}>
          {contactName(c)}
        </span>
        {unread && <span className="sr-only">(unread)</span>}
      </Link>
    );
  },
};

const CONTACT_COLUMNS: DataTableColumn<Contact>[] = [
  {
    key: "email",
    header: "Email",
    label: "Email",
    width: "200px",
    hideBelow: "md",
    sortValue: (c) => c.email,
    cell: (c) => (
      <a
        href={`mailto:${c.email}`}
        onClick={(e) => e.stopPropagation()}
        className="block max-w-[180px] truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
      >
        {c.email}
      </a>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    label: "Phone",
    width: "140px",
    hideBelow: "lg",
    cell: (c) => c.phone
      ? (
        <a
          href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
          onClick={(e) => e.stopPropagation()}
          className="whitespace-nowrap tabular-nums text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
        >
          {displayPhone(c.phone)}
        </a>
      )
      : <Blank />,
  },
];

const TRAILING_COLUMNS: DataTableColumn<Contact>[] = [
  {
    key: "status",
    header: "Status",
    label: "Status",
    width: "120px",
    sortValue: (c) => c.status,
    cell: (c) => {
      const meta = CONTACT_STATUS_META[c.status];
      return <StatusBadge status={c.status} tone={meta?.tone} label={meta?.label} size="md" />;
    },
  },
  {
    key: "received",
    header: "Received",
    label: "Received",
    width: "110px",
    sortValue: (c) => new Date(c.createdAt).getTime(),
    cell: (c) => (
      <time
        dateTime={c.createdAt}
        title={fmtDateTime(c.createdAt)}
        className={cn(
          "whitespace-nowrap tabular-nums",
          c.status === "new" ? "font-medium text-[var(--adm-ink-mute)]" : "text-[var(--adm-ink-subtle)]",
        )}
      >
        {fmtRelative(c.createdAt)}
      </time>
    ),
  },
];

const COLUMNS = [NAME_COLUMN, ...CONTACT_COLUMNS, ...ENQUIRY_COLUMNS, ...TRAILING_COLUMNS];

/** For the Display menu's column toggles. */
export const CONTACT_COLUMN_OPTIONS = COLUMNS.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }));

function ContactMenu({
  contact,
  onOpen,
  onStatusChange,
  onDelete,
}: {
  contact: Contact;
  onOpen: (c: Contact) => void;
  onStatusChange: (id: string, s: ContactStatus) => void;
  onDelete: (id: string) => void;
}) {
  const markResponded = () => { if (contact.status !== "responded") onStatusChange(contact.id, "responded"); };
  return (
    <RowMenu
      label={contactName(contact)}
      items={[
        { label: "Open enquiry", icon: IconEye, onSelect: () => onOpen(contact) },
        { label: "Reply by email", icon: IconSend, href: replyHref(contact), onSelect: markResponded },
        ...(contact.status === "new" ? [{ label: "Mark as read", icon: IconMailOpen, onSelect: () => onStatusChange(contact.id, "read") }] : []),
        ...(contact.status !== "responded" ? [{ label: "Mark as responded", icon: Check, onSelect: markResponded }] : []),
        { label: "Delete", icon: IconTrash, onSelect: () => onDelete(contact.id), danger: true, separated: true },
      ]}
    />
  );
}

export function ContactTable({
  contacts,
  onOpen,
  onStatusChange,
  onDelete,
  pageSize,
  onPageSizeChange,
  hiddenColumns,
  empty,
}: {
  contacts: Contact[];
  onOpen: (c: Contact) => void;
  onStatusChange: (id: string, s: ContactStatus) => void;
  onDelete: (id: string) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  hiddenColumns: string[];
  empty: { title: string; description: string; action?: React.ReactNode };
}) {
  return (
    <DataTable
      noun="enquiries"
      storageKey="contacts"
      columns={COLUMNS}
      rows={contacts}
      rowKey={(c) => c.id}
      onRowClick={onOpen}
      initialSort={{ key: "received", dir: "desc" }}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      hiddenColumns={hiddenColumns}
      pinFirstColumn
      rowActions={(c) => <ContactMenu contact={c} onOpen={onOpen} onStatusChange={onStatusChange} onDelete={onDelete} />}
      rowActionsAlways
      empty={{ icon: IconMessage, ...empty }}
    />
  );
}
