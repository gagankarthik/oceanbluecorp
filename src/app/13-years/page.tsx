import type { Metadata } from "next";
import ThirteenYearsPage from "./_content";
import { BRAND_NAME, FOUNDED_YEAR, MILESTONES } from "@/lib/company";
import {
  ANNIVERSARY_COPY,
  ANNIVERSARY_PATH,
  ANNIVERSARY_YEAR,
  ANNIVERSARY_YEARS,
} from "@/lib/anniversary";

/* TEMPORARY — the 13-year anniversary story page. See lib/anniversary.ts for
   the teardown list. Unlike the homepage band this page is NOT date-gated: a
   link shared on the day should keep resolving afterwards rather than 404. */

const URL = `https://oceanbluecorp.com${ANNIVERSARY_PATH}`;
const TITLE = `${ANNIVERSARY_COPY.heading} — ${FOUNDED_YEAR}–${ANNIVERSARY_YEAR}`;
/* Kept under ~160 characters, which is all a search result shows. The previous
   build ran to 250 and was cut mid-clause; the founding date and the legal
   entity are both on the page itself and in the Organization JSON-LD, so they
   were spending the visible half of the snippet on detail nobody searches for. */
const DESCRIPTION = `${BRAND_NAME} turns ${ANNIVERSARY_YEARS} in ${ANNIVERSARY_YEAR}: ${ANNIVERSARY_YEARS} years of IT staffing, enterprise solutions, and managed services from Powell, Ohio.`;

export const metadata: Metadata = {
  title: `Celebrating ${ANNIVERSARY_YEARS} Years`,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { title: TITLE, description: DESCRIPTION },
  alternates: { canonical: URL },
};

/* An Event node, so the anniversary can surface as a dated milestone rather
   than an undated marketing page. `milestones` is reused from lib/company. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: TITLE,
  startDate: `${ANNIVERSARY_YEAR}-08-08`,
  endDate: `${ANNIVERSARY_YEAR}-08-08`,
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  url: URL,
  description: DESCRIPTION,
  organizer: { "@id": "https://oceanbluecorp.com/#organization" },
  about: {
    "@type": "ItemList",
    name: `${BRAND_NAME} milestones, ${FOUNDED_YEAR}–${ANNIVERSARY_YEAR}`,
    itemListElement: MILESTONES.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.year} — ${m.title}`,
      description: m.description,
    })),
  },
};

export default function ThirteenYears() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThirteenYearsPage />
    </>
  );
}
