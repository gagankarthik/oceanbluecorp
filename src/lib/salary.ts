// Salary display and schema.org units for public job pages. Pure.

import type { SalaryPeriod } from "@/lib/aws/dynamodb";

export type Salary = { min: number; max: number; currency: string; period?: SalaryPeriod };

const PERIOD_SUFFIX: Record<SalaryPeriod, string> = {
  year: "/yr",
  month: "/mo",
  week: "/wk",
  day: "/day",
  hour: "/hr",
};

// Older postings stored the symbol, not the ISO code.
const SYMBOL_CODE: Record<string, string> = { $: "USD", "US$": "USD", "€": "EUR", "£": "GBP", "₹": "INR", "C$": "CAD" };

export function currencyCode(currency: string | null | undefined): string {
  const c = (currency ?? "").trim();
  if (/^[A-Za-z]{3}$/.test(c)) return c.toUpperCase();
  return SYMBOL_CODE[c] ?? "USD";
}

/** Missing period = annual (records from before the field existed). */
export const salaryPeriod = (s: { period?: SalaryPeriod | null }): SalaryPeriod => s.period ?? "year";

/** schema.org QuantitativeValue unitText. */
export const salaryUnitText = (s: { period?: SalaryPeriod | null }): string => salaryPeriod(s).toUpperCase();

function money(n: number, code: string): string {
  const opts: Intl.NumberFormatOptions = { style: "currency", currency: code, maximumFractionDigits: 0 };
  // An hourly $42.50 must not round to $43.
  if (!Number.isInteger(n)) Object.assign(opts, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  try {
    return new Intl.NumberFormat("en-US", opts).format(n);
  } catch {
    return new Intl.NumberFormat("en-US", { ...opts, currency: "USD" }).format(n);
  }
}

/** "$90,000 – $120,000/yr", "$45/hr", "Up to $60/hr". Null when there is nothing to show. */
export function formatSalary(s: Salary | null | undefined): string | null {
  if (!s) return null;
  const min = Number.isFinite(s.min) && s.min > 0 ? s.min : null;
  const max = Number.isFinite(s.max) && s.max > 0 ? s.max : null;
  if (min === null && max === null) return null;
  const code = currencyCode(s.currency);
  const suffix = PERIOD_SUFFIX[salaryPeriod(s)];
  if (min !== null && max !== null) {
    if (min === max) return `${money(min, code)}${suffix}`;
    const [lo, hi] = min < max ? [min, max] : [max, min];
    return `${money(lo, code)} – ${money(hi, code)}${suffix}`;
  }
  return min !== null ? `From ${money(min, code)}${suffix}` : `Up to ${money(max!, code)}${suffix}`;
}
