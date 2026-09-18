import type { Contact } from "@/lib/aws/dynamodb";
import type { Tone } from "@/components/admin/theme";

export type ContactStatus = Contact["status"];

/** Enquiry states, in handling order. */
export const CONTACT_STATUSES: { key: ContactStatus; label: string; tone: Tone }[] = [
  { key: "new",       label: "New",       tone: "blue" },
  { key: "read",      label: "Read",      tone: "amber" },
  { key: "responded", label: "Responded", tone: "emerald" },
  { key: "archived",  label: "Archived",  tone: "slate" },
];

export const CONTACT_STATUS_META = Object.fromEntries(
  CONTACT_STATUSES.map((s) => [s.key, s]),
) as Record<string, (typeof CONTACT_STATUSES)[number] | undefined>;

export function contactName(c: Pick<Contact, "firstName" | "lastName" | "email">): string {
  return `${c.firstName} ${c.lastName}`.trim() || c.email;
}

export function replyHref(c: Pick<Contact, "email" | "inquiryType">): string {
  return `mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.inquiryType} enquiry`)}`;
}
