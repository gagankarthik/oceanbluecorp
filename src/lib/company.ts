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
  { year: "2013", title: "Foundation", description: "Ocean Blue founded with a vision to transform enterprise IT." },
  { year: "2015", title: "First prime-vendor MSA", description: "Established our first Master Service Agreement with a prime vendor." },
  { year: "2021", title: "Fortune 500 MSA", description: "Secured an MSA with a Fortune 500 enterprise client." },
  { year: "2022", title: "Expansion to India", description: "Opened a new delivery center with local operations." },
  { year: "2024", title: "Offices in the UK", description: "Strengthened European presence and client services." },
  { year: "2025", title: "AI practice launch", description: "Launched a dedicated AI practice for production deployments." },
];

/** Every year from founding through `through`, inclusive. */
export function yearsThrough(through: number): number[] {
  return Array.from({ length: through - FOUNDED_YEAR + 1 }, (_, i) => FOUNDED_YEAR + i);
}
