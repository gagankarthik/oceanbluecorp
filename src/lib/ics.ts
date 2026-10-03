// iCalendar (RFC 5545) invite for an interview. Pure: the API attaches it to an
// email and the console offers it as a download.

export interface IcsEvent {
  uid: string;
  start: Date;
  durationMinutes: number;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  organizer?: { name?: string; email: string };
  attendees?: Array<{ name?: string; email: string }>;
  /** Defaults to now; pass it for a reproducible file. */
  stamp?: Date;
}

const stampOf = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** RFC 5545 text escaping. */
const text = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Works in the browser too, where there is no Buffer.
const encoder = new TextEncoder();
const octets = (s: string) => encoder.encode(s).length;

/** Fold lines over 75 octets with CRLF + space. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (octets(rest) > 75) {
    let cut = 75;
    while (octets(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

const person = (p: { name?: string; email: string }) =>
  `${p.name ? `CN=${text(p.name).replace(/"/g, "")}:` : ""}mailto:${p.email}`;

export function buildIcs(e: IcsEvent): string {
  const end = new Date(e.start.getTime() + e.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ocean Blue Corporation//Recruiting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stampOf(e.stamp ?? new Date())}`,
    `DTSTART:${stampOf(e.start)}`,
    `DTEND:${stampOf(end)}`,
    `SUMMARY:${text(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${text(e.description)}`] : []),
    ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    ...(e.organizer ? [`ORGANIZER;${person(e.organizer)}`] : []),
    ...(e.attendees ?? []).map((a) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;${person(a)}`),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
