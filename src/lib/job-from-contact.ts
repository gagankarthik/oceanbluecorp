// A job form draft seeded from a hiring enquiry. Pure and client-safe.

import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker } from "@/lib/contact";
import { fmtDate } from "@/lib/format";

export type JobDraftFromContact = {
  /** Role title, only when the message clearly names one; else "". */
  title: string;
  /** Enquirer's company. Commercial: apply only for callers who can price. */
  clientName: string;
  /** Internal note carrying the enquiry. Never public copy. Commercial. */
  clientNotes: string;
  sourceContactId: string;
};

/** Only hiring enquiries become roles; job seekers are candidates, not clients. */
export const canCreateRoleFromContact = (c: Pick<Contact, "inquiryType">): boolean => !isJobSeeker(c.inquiryType);

const CLIENT_NOTES_MAX = 5_000;

const ROLE_NOUNS =
  "engineer|developer|programmer|architect|analyst|administrator|admin|consultant|designer|tester|" +
  "manager|lead|specialist|scientist|dba|devops|sre|technician|coordinator|director|recruiter|" +
  "accountant|officer|owner|master|strategist|writer";
const COUNT = "(?:a few|a couple of|a|an|one|two|three|four|five|six|seven|eight|nine|ten|several|some|\\d+)";
const WORD = "[A-Za-z0-9][A-Za-z0-9.+#/-]*";
const STOP = new Set(["the", "for", "to", "with", "and", "or", "our", "us", "we", "who", "that", "of", "in", "on", "at", "is", "are"]);

// "need two AWS engineers", "hiring a Senior Java Developer", "looking for an SAP FICO consultant"
const ROLE_RE = new RegExp(
  `\\b(?:need|needs|hiring|hire|looking for|seeking|require|requires|searching for|recruiting)\\s+(?:${COUNT}\\s+)?` +
    `((?:${WORD}\\s+){0,4}?(?:${ROLE_NOUNS})s?)\\b`,
  "i",
);

const titleWord = (w: string) => (/[A-Z]/.test(w.slice(1)) || /^[A-Z]{2,}/.test(w) ? w : w[0].toUpperCase() + w.slice(1));

/** The role a message names, title-cased and singular, or "" when it names none clearly. */
export function roleFromMessage(message: string | undefined | null): string {
  const m = (message ?? "").match(ROLE_RE);
  if (!m) return "";
  const words = m[1].trim().split(/\s+/);
  if (words.some((w) => STOP.has(w.toLowerCase()))) return "";
  const last = words.length - 1;
  // Plural role noun to singular: "engineers" -> "engineer", "DBAs" -> "DBA".
  words[last] = words[last].replace(new RegExp(`^(${ROLE_NOUNS})s$`, "i"), "$1");
  return words.map(titleWord).join(" ");
}

export function jobDraftFromContact(contact: Contact): JobDraftFromContact {
  const name = [contact.firstName, contact.lastName].map((s) => s?.trim()).filter(Boolean).join(" ") || contact.email;
  const date = fmtDate(contact.createdAt);
  const when = date === "–" ? "" : date;
  const message = (contact.message ?? "").trim();
  const note = `From enquiry by ${name}${when ? ` on ${when}` : ""}: ${message}`;
  return {
    title: canCreateRoleFromContact(contact) ? roleFromMessage(message) : "",
    clientName: canCreateRoleFromContact(contact) ? (contact.company ?? "").trim() : "",
    clientNotes: note.length > CLIENT_NOTES_MAX ? `${note.slice(0, CLIENT_NOTES_MAX - 1).trimEnd()}…` : note,
    sourceContactId: contact.id,
  };
}
