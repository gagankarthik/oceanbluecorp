"use client";

import { Check } from "lucide-react";
import type { Contact } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { MenuSelect, WorkspaceButton } from "@/components/admin/workspace";
import { IconSend, IconTrash } from "@/components/admin/icons";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONTACT_STATUSES, replyHref, type ContactStatus } from "./contact-status";

/** Body of the enquiry record page: the message, and a rail with actions and details. Mutations are callbacks. */
export function ContactDetail({
  contact,
  onStatusChange,
  onDelete,
}: {
  contact: Contact;
  onStatusChange: (s: ContactStatus) => void;
  onDelete: () => void;
}) {
  const facts: { label: string; value?: string; href?: string; numeric?: boolean }[] = [
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { label: "Phone", value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined, numeric: true },
    { label: "Company", value: contact.company },
    { label: "Job title", value: contact.jobTitle },
    { label: "Enquiry type", value: contact.inquiryType },
    { label: "Received", value: fmtDateTime(contact.createdAt), numeric: true },
    ...(contact.updatedAt ? [{ label: "Updated", value: fmtDateTime(contact.updatedAt), numeric: true }] : []),
  ];

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
      <AdminCard>
        <AdminCardHeader title="Message" meta={`${contact.inquiryType} enquiry`} />
        <div className="p-4 sm:p-5">
          <p className="max-w-[70ch] whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-[var(--adm-ink)]">
            {contact.message}
          </p>
        </div>
      </AdminCard>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-1">
        <AdminCard>
          <AdminCardHeader title="Respond" />
          <div className="space-y-2 p-4">
            <WorkspaceButton variant="primary" asChild className="w-full">
              <a
                href={replyHref(contact)}
                onClick={() => { if (contact.status !== "responded") onStatusChange("responded"); }}
              >
                <IconSend aria-hidden="true" /> Reply via email
              </a>
            </WorkspaceButton>
            {contact.status !== "responded" && (
              <WorkspaceButton className="w-full" onClick={() => onStatusChange("responded")}>
                <Check aria-hidden="true" /> Mark as responded
              </WorkspaceButton>
            )}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[13px] text-[var(--adm-ink-mute)]">Status</span>
              <MenuSelect
                label="Status"
                value={contact.status}
                onChange={onStatusChange}
                options={CONTACT_STATUSES.map((s) => ({ value: s.key, label: s.label }))}
              />
            </div>
          </div>
          <div className="rounded-b-[14px] border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-2 py-1.5">
            <WorkspaceButton
              variant="ghost"
              onClick={onDelete}
              className="text-[var(--adm-danger-ink)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
            >
              <IconTrash aria-hidden="true" /> Delete enquiry
            </WorkspaceButton>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="Contact details" />
          <dl className="divide-y divide-[var(--adm-line-soft)]">
            {facts.map(({ label, value, href, numeric }) => (
              <div key={label} className="flex min-w-0 items-baseline justify-between gap-4 px-4 py-2.5">
                <dt className="flex-none text-[13px] text-[var(--adm-ink-subtle)]">{label}</dt>
                <dd className={cn("min-w-0 truncate text-right text-[13.5px] text-[var(--adm-ink)]", numeric && "tabular-nums")}>
                  {!value ? (
                    <span className="text-[var(--adm-ink-subtle)]">&mdash;</span>
                  ) : href ? (
                    <a href={href} className="transition-colors hover:text-[var(--adm-accent)]">{value}</a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}
