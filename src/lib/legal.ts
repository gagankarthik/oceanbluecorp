// Dates and change history for the legal documents. The pages and the /legal
// index both read from here, so a revision is dated in one place.

export type LegalRevision = { date: string; summary: string };
export type LegalDoc = { effective: string; updated: string; history: LegalRevision[] };

// Newest first. A revision's summary says what changed for the reader, in
// plain words; "updated the policy" is not a summary.
export const LEGAL_DOCS = {
  privacy: {
    effective: "April 1, 2026",
    updated: "October 1, 2026",
    history: [
      {
        date: "October 1, 2026",
        summary:
          "Brought in line with what this site does. It no longer mentions public accounts, usage analytics, location tracking, or email tracking pixels, none of which the site has. It now says that resumes are read and scored by software as a guide for recruiters, names Amazon Web Services as our hosting provider, and explains that the office map and some logos load from other servers.",
      },
      { date: "April 1, 2026", summary: "This version took effect." },
    ],
  },
  terms: {
    effective: "April 1, 2026",
    updated: "October 1, 2026",
    history: [
      {
        date: "October 1, 2026",
        summary:
          "Section 3 no longer asks you to register for an account, because this site has no public accounts: you can apply or contact us without one. It now covers the information you submit and the invitation-only staff console.",
      },
      { date: "April 1, 2026", summary: "This version took effect." },
    ],
  },
  cookies: {
    effective: "April 1, 2026",
    updated: "September 30, 2026",
    history: [
      {
        date: "September 30, 2026",
        summary:
          "The cookie table now lists only what this site actually stores. Analytics, advertising and third-party security cookies were removed from it because the site does not set them.",
      },
      { date: "April 1, 2026", summary: "This version took effect." },
    ],
  },
} satisfies Record<string, LegalDoc>;
