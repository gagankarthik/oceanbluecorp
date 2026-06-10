import { NextRequest, NextResponse } from "next/server";
import { getAllContacts, createContact, createNotification, Contact } from "@/lib/aws/dynamodb";
import { sendContactNotificationEmail } from "@/lib/aws/ses";
import { v4 as uuidv4 } from "uuid";
import { requireStaff } from "@/lib/auth/verify";

// ── Spam heuristics (no external dependencies) ──────────────────────────────
// A "token" is treated as random/bot-generated if it's long and either has no
// vowels, a long consonant run, or many mid-word UPPER/lower flips
// (e.g. "SGEuyScCROwkOYeZO"). Real names/words almost never do this.
function looksRandom(token: string): boolean {
  const t = (token || "").replace(/[^A-Za-z]/g, "");
  if (t.length < 10) return false;
  const noVowel = !/[aeiou]/i.test(t);
  const longConsonantRun = /[bcdfghjklmnpqrstvwxyz]{5,}/i.test(t);
  let caseFlips = 0;
  for (let i = 1; i < t.length; i++) {
    if (/[A-Z]/.test(t[i - 1]) !== /[A-Z]/.test(t[i])) caseFlips++;
  }
  return noVowel || longConsonantRun || caseFlips >= 4;
}

function isLikelySpam(b: { firstName?: string; lastName?: string; company?: string; message?: string }): boolean {
  const linkRe = /(https?:\/\/|www\.|\[url|<a\s|href=)/i;
  const name = `${b.firstName || ""} ${b.lastName || ""}`;
  const message = b.message || "";
  // Links in the name/company field are a strong spam signal
  if (linkRe.test(name) || linkRe.test(b.company || "")) return true;
  // A random-looking first or last name is almost certainly a bot
  if (looksRandom(b.firstName || "") || looksRandom(b.lastName || "")) return true;
  // Link-farm message — a few links is plausible, four+ is spam
  if ((message.match(/(https?:\/\/|www\.)/gi)?.length ?? 0) >= 4) return true;
  // Bloat: the same character repeated 30+ times (e.g. "aaaaaaaa…")
  if (/(.)\1{29,}/.test(message)) return true;
  // Two or more random tokens in the message
  const randomWords = message.split(/\s+/).filter((w) => looksRandom(w)).length;
  return randomWords >= 2;
}

// ── Field length caps (anti-bloat) + format regexes ─────────────────────────
// Keeps payloads small and well-formed. Separate from the spam heuristics above:
// a malformed-but-honest submission gets a real 400 so the person can fix it,
// whereas spam signals get a silent fake-success so bots don't adapt.
const LIMITS: Record<string, number> = {
  firstName: 60, lastName: 60, email: 254, phone: 30,
  company: 120, jobTitle: 120, inquiryType: 60, message: 4000,
};

const NAME_RE    = /^[\p{L}][\p{L}\p{M} .'-]{0,59}$/u;   // letters + space . ' - ; must start with a letter
const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;       // local@domain.tld
const PHONE_RE   = /^\+?[\d\s().-]{7,20}$/;               // digits + common separators
const INQUIRY_RE = /^[A-Za-z0-9 &/+.-]{2,60}$/;           // short label only

function validateContact(b: Record<string, unknown>): string | null {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  // Length caps first — reject bloat before any other work
  for (const [field, max] of Object.entries(LIMITS)) {
    if (str(b[field]).length > max) return `${field} is too long (max ${max} characters).`;
  }

  if (!NAME_RE.test(str(b.firstName))) return "Please enter a valid first name.";
  if (!NAME_RE.test(str(b.lastName)))  return "Please enter a valid last name.";
  if (!EMAIL_RE.test(str(b.email)))    return "Please enter a valid email address.";
  if (str(b.phone) && !PHONE_RE.test(str(b.phone))) return "Please enter a valid phone number.";
  if (!str(b.company))                 return "Company is required.";
  if (!INQUIRY_RE.test(str(b.inquiryType))) return "Please choose a valid inquiry type.";
  if (str(b.message).length < 10)      return "Please include a short message (at least 10 characters).";

  return null;
}

// GET /api/contacts - Get all contacts (staff only)
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Contact["status"] | null;

    const result = await getAllContacts(status || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const contacts = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Anti-spam gate ──────────────────────────────────────────────────────
    // Bots that trip these get a fake "success" (so they don't adapt) and are
    // never stored / never trigger a notification or email.
    const fakeSuccess = NextResponse.json(
      { message: "Contact form submitted successfully" },
      { status: 201 }
    );
    // 1) Honeypot — humans never fill the hidden "website" field
    if (typeof body.website === "string" && body.website.trim() !== "") return fakeSuccess;
    // 2) Submitted too fast to be a real person (form takes >2.5s to fill)
    if (typeof body._elapsedMs === "number" && body._elapsedMs >= 0 && body._elapsedMs < 2500) return fakeSuccess;
    // 3) Gibberish names / link spam
    if (isLikelySpam(body)) return fakeSuccess;

    // Validate required fields, formats, and length caps (anti-bloat). Honest
    // formatting mistakes get a real 400 so the visitor can correct them.
    const validationError = validateContact(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const contact: Contact = {
      id: uuidv4(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || undefined,
      company: body.company.trim(),
      jobTitle: body.jobTitle?.trim() || undefined,
      inquiryType: body.inquiryType,
      message: body.message.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const result = await createContact(contact);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit contact form" },
        { status: 500 }
      );
    }

    // Create in-app notification for admin panel
    createNotification({
      id: uuidv4(),
      type: "contact_received",
      title: "New Contact Submission",
      message: `${body.firstName} ${body.lastName} from ${body.company} - ${body.inquiryType}`,
      link: `/admin/contacts`,
      relatedId: contact.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    }).catch((err) => console.error("Failed to create notification:", err));

    // Send email notification to admin
    const adminEmail = process.env.NEXT_AWS_SES_FROM_EMAIL || "hiring@oceanbluecorp.com";
    sendContactNotificationEmail({
      adminEmail,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      jobTitle: contact.jobTitle,
      inquiryType: contact.inquiryType,
      message: contact.message,
    }).catch((err) => console.error("Failed to send contact notification email:", err));

    return NextResponse.json(
      { message: "Contact form submitted successfully", contact },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
