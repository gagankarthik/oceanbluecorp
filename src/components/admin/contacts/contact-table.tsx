"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { Contact } from "@/lib/aws/dynamodb";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { IconMailOpen, IconMessage, IconSend, IconTrash } from "@/components/admin/icons";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONTACT_STATUS_META, contactName, replyHref, type ContactStatus } from "./contact-status";

function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]";

const COLUMNS: DataTableColumn<Contact>[] = [
  {
    key: "name",
    header: "Name",
    label: "Name",
    locked: true,
    width: "240px",
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
          <span
            className={cn(
              "truncate",
              unread ? "font-semibold text-[var(--adm-ink)]" : "font-medium text-[var(--adm-ink-mute)]",
            )}
          >
            {contactName(c)}
          </span>
          {unread && <span className="sr-only">(unread)</span>}
        </Link>
      );
    },
  },
  {
    key: "type",
    header: "Enquiry type",
    label: "Enquiry type",
    width: "170px",
    hideBelow: "sm",
    sortValue: (c) => c.inquiryType,
    cell: (c) => <span className="text-[var(--adm-ink-mute)]">{c.inquiryType}</span>,
  },
  {
    key: "company",
    header: "Company",
    label: "Company",
    width: "190px",
    hideBelow: "lg",
    sortValue: (c) => c.company,
    cell: (c) => c.company ? <span className="text-[var(--adm-ink-mute)]">{c.company}</span> : <Blank />,
  },
  {
    key: "email",
    header: "Email",
    label: "Email",
    width: "230px",
    hideBelow: "md",
    sortValue: (c) => c.email,
    cell: (c) => (
      <a
        href={`mailto:${c.email}`}
        onClick={(e) => e.stopPropagation()}
        className="block truncate text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
      >
        {c.email}
      </a>
    ),
  },
  {
    key: "message",
    header: "Message",
    label: "Message",
    hideBelow: "xl",
    cell: (c) => <span className="text-[13px] text-[var(--adm-ink-subtle)]">{c.message}</span>,
  },
  {
    key: "status",
    header: "Status",
    label: "Status",
    width: "130px",
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
    width: "120px",
    sortValue: (c) => new Date(c.createdAt).getTime(),
    cell: (c) => (
      <time
        dateTime={c.createdAt}
        title={fmtDateTime(c.createdAt)}
        className={cn(
          "tabular-nums",
          c.status === "new" ? "font-medium text-[var(--adm-ink-mute)]" : "text-[var(--adm-ink-subtle)]",
        )}
      >
        {fmtRelative(c.createdAt)}
      </time>
    ),
  },
];

/** For the Display menu's column toggles. */
export const CONTACT_COLUMN_OPTIONS = COLUMNS.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }));

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
  const rowActions = (c: Contact) => {
    const name = contactName(c);
    return (
      <div className="flex items-center gap-0.5">
        <a
          href={replyHref(c)}
          onClick={() => { if (c.status !== "responded") onStatusChange(c.id, "responded"); }}
          aria-label={`Reply to ${name} by email`}
          title="Reply via email"
          className={iconBtn}
        >
          <IconSend className="h-4 w-4" aria-hidden="true" />
        </a>
        {c.status === "new" && (
          <button
            type="button"
            onClick={() => onStatusChange(c.id, "read")}
            aria-label={`Mark ${name} as read`}
            title="Mark as read"
            className={iconBtn}
          >
            <IconMailOpen className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {c.status !== "responded" && (
          <button
            type="button"
            onClick={() => onStatusChange(c.id, "responded")}
            aria-label={`Mark ${name} as responded`}
            title="Mark as responded"
            className={iconBtn}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(c.id)}
          aria-label={`Delete ${name}`}
          title="Delete"
          className={cn(iconBtn, "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]")}
        >
          <IconTrash className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  };

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
      rowActions={rowActions}
      empty={{ icon: IconMessage, ...empty }}
    />
  );
}
