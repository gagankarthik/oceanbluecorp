/* Durable company facts. Pure data: no AWS, no React, safe to import from a
   server page, a client component, or an OG image route. */

/* Not interchangeable. BRAND_NAME is the operating brand, for sentences about
   the business people deal with. LEGAL_NAME is the entity, for of-record
   contexts: the legal footer, the colophon, structured data. */
export const BRAND_NAME = "Ocean Blue Solutions";
export const LEGAL_NAME = "Ocean Blue Corporation";

export const FOUNDED_YEAR = 2013;

/** Month is 1-indexed here (8 = August), this is a label, not a Date arg. */
export const FOUNDED_MONTH = 8;
export const FOUNDED_DAY = 8;

/** "08/08/2013", matches the founding date printed on the anniversary artwork. */
export const FOUNDED_SHORT = "08/08/2013";
export const FOUNDED_LONG = "August 8, 2013";

export type Milestone = {
  year: string;
  title: string;
  description: string;
};

export const MILESTONES: Milestone[] = [
  { year: "2013", title: "Company Founded", description: "Ocean Blue opened in Ohio with a vision to transform enterprise IT." },
  { year: "2015", title: "Breakthrough Engagement", description: "Signed our first Master Service Agreement with a prime vendor, establishing credibility as a delivery partner." },
  { year: "2021", title: "Enterprise Trust", description: "Secured an MSA with a Fortune 500 client, taking our teams into enterprise-scale programs." },
  { year: "2022", title: "Global Delivery", description: "Opened a delivery center in India with local operations, adding a second hub alongside the US." },
  { year: "2024", title: "Major Expansion", description: "Opened offices in the United Kingdom to strengthen our European presence and client service." },
  { year: "2025", title: "AI Expertise", description: "Launched a dedicated AI practice that takes models from pilot to production." },
];

/** Every year from founding through `through`, inclusive. */
export function yearsThrough(through: number): number[] {
  return Array.from({ length: through - FOUNDED_YEAR + 1 }, (_, i) => FOUNDED_YEAR + i);
}
