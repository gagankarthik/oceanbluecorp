"use client";

import type { Contact } from "@/lib/aws/dynamodb";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { FormSelect } from "@/components/admin/forms/primitives";
import {
  IconBuilding, IconCalendar, IconJob, IconMail, IconMessage,
  IconPhone, IconSend, IconTrash,
} from "@/components/admin/icons";
import type { Tone } from "@/components/admin/theme";
import { fmtDateTime } from "@/lib/format";

/* ============================================================
   ContactDetail, the reading pane of the contacts screen.

   Lifted out of a centred modal. A modal was the wrong container
   for this: reading an enquiry and moving to the next one is the
   whole job on this screen, and a modal makes that
   open → read → close → find your place → open again. In a split
   view the next enquiry is one click away and the list never
   loses its position.

   Deliberately presentational, every mutation is a callback, so
   the page keeps owning the data and this can be rendered
   anywhere (pane today, drawer on a phone).
   ============================================================ */

type ContactStatus = Contact["status"];

export function ContactDetail({
  contact,
  statuses,
  statusMeta,
  onStatusChange,
  onDelete,
}: {
  contact: Contact;
  statuses: { key: ContactStatus; label: string }[];
  statusMeta: Record<string, { label: string; tone: Tone } | undefined>;
  onStatusChange: (id: string, s: ContactStatus) => void;
  onDelete: (id: string) => void;
}) {
  const name = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sender, pinned, so you always know whose message you are reading */}
      <div className="flex flex-none items-start justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} email={contact.email} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold leading-tight text-[var(--adm-ink)]">{name}</h2>
            <p className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-subtle)]">{contact.company}</p>
          </div>
        </div>
        <StatusBadge
          status={contact.status}
          tone={statusMeta[contact.status]?.tone}
          label={statusMeta[contact.status]?.label}
          size="md"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {/* The message leads. It is what the person actually sent, and it was
            previously below two columns of metadata the reader already knew. */}
        <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">
          <IconMessage className="h-3.5 w-3.5" /> Message
        </h3>
        <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-zebra)] p-4">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
            {contact.message}
          </p>
        </div>

        {/* Reply is the point of opening this, so it sits directly under what
            is being replied to rather than in a column beside it. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${contact.email}?subject=Re: ${contact.inquiryType} Inquiry`}
            onClick={() => { if (contact.status !== "responded") onStatusChange(contact.id, "responded"); }}
            className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[var(--adm-accent)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
          >
            <IconSend className="h-4 w-4" /> Reply via email
          </a>
          <div className="min-w-[150px]">
            <FormSelect
              id="contact-status"
              aria-label="Update status"
              value={contact.status}
              onChange={(e) => onStatusChange(contact.id, e.target.value as ContactStatus)}
            >
              {statuses.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </FormSelect>
          </div>
        </div>

        <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">
          Contact information
        </h3>
        <div className="divide-y divide-[var(--adm-line-soft)] rounded-[6px] border border-[var(--adm-line)]">
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
          >
            <IconMail className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
            <span className="truncate">{contact.email}</span>
          </a>
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
            >
              <IconPhone className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
              {contact.phone}
            </a>
          )}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)]">
            <IconBuilding className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
            <span className="truncate">{contact.company}</span>
          </div>
          {contact.jobTitle && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)]">
              <IconJob className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
              <span className="truncate">{contact.jobTitle}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] tabular-nums text-[var(--adm-ink-mute)]">
            <IconCalendar className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
            {fmtDateTime(contact.createdAt)}
          </div>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--adm-ink-mute)]">
            <IconMessage className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
            {contact.inquiryType}
          </div>
        </div>

        {/* Destructive action last and quiet, it is not why anyone opened this. */}
        <button
          onClick={() => onDelete(contact.id)}
          className="mt-6 inline-flex items-center gap-2 rounded-[6px] border border-[var(--adm-danger-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--adm-danger)] transition-colors hover:bg-[var(--adm-danger-soft)]"
        >
          <IconTrash className="h-4 w-4" /> Delete contact
        </button>
      </div>
    </div>
  );
}
