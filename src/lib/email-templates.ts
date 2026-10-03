// Candidate email templates. Pure: the console fills and previews them, the API
// fills them again server-side before sending.

export interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

/** Placeholders a template may use. Unknown ones are left as typed. */
export type TemplateVars = Partial<Record<
  "firstName" | "fullName" | "jobTitle" | "recruiterName" | "companyName" | "interviewWhen" | "interviewWhere",
  string
>>;

export const EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  {
    id: "follow-up",
    label: "Follow-up",
    subject: "Following up on {{jobTitle}}",
    body: "Hi {{firstName}},\n\nThanks for your interest in the {{jobTitle}} role. I'd like to set up a short call to talk through the position and your background. What times work for you this week?\n\nBest,\n{{recruiterName}}",
  },
  {
    id: "interview-invite",
    label: "Interview invitation",
    subject: "Interview for {{jobTitle}}",
    body: "Hi {{firstName}},\n\nWe'd like to invite you to interview for the {{jobTitle}} role.\n\nWhen: {{interviewWhen}}\nWhere: {{interviewWhere}}\n\nA calendar invite is attached. Please reply to confirm, or suggest another time if this doesn't work.\n\nBest,\n{{recruiterName}}",
  },
  {
    id: "submitted",
    label: "Submitted to client",
    subject: "Your profile has been submitted for {{jobTitle}}",
    body: "Hi {{firstName}},\n\nGood news: I've submitted your profile for the {{jobTitle}} role. I'll be in touch as soon as I hear back.\n\nBest,\n{{recruiterName}}",
  },
  {
    id: "offer",
    label: "Offer",
    subject: "Offer for {{jobTitle}}",
    body: "Hi {{firstName}},\n\nI'm pleased to let you know we'd like to offer you the {{jobTitle}} role. I'll call you shortly to walk through the details.\n\nBest,\n{{recruiterName}}",
  },
  {
    id: "rejection",
    label: "Not moving forward",
    subject: "Your application for {{jobTitle}}",
    body: "Hi {{firstName}},\n\nThank you for your time and interest in the {{jobTitle}} role. After careful consideration, we've decided to move forward with other candidates. We'll keep your profile on file and reach out if a better fit comes up.\n\nBest regards,\n{{recruiterName}}",
  },
];

export const templateById = (id: string | null | undefined) => EMAIL_TEMPLATES.find((t) => t.id === id);

export function fillTemplate(text: string, vars: TemplateVars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => {
    const v = vars[key as keyof TemplateVars];
    return v === undefined || v === "" ? whole : v;
  });
}

/** Placeholders still unfilled, so the console can warn before sending. */
export function unfilledPlaceholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];
}

export function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
