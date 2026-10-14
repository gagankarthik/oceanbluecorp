// Staffing economics on a job: margin against target, markup, placement fee. Pure.

/** Margin a role should clear when the job sets no `targetMarginPct`. */
export const DEFAULT_TARGET_MARGIN_PCT = 20;

export type MarginTone = "success" | "warning" | "danger";

export type MarginStatus = {
  tone: MarginTone;
  /** "On target", "Below target (20%)" or "Loss" */
  label: string;
  /** (bill − pay) / bill × 100 */
  marginPct: number;
  /** (bill − pay) / pay × 100; null when pay is 0 */
  markupPct: number | null;
};

/** Markup on pay, as a percentage. Null unless both rates are numbers and pay is positive. */
export function markupPct(bill: number | undefined | null, pay: number | undefined | null): number | null {
  if (typeof bill !== "number" || typeof pay !== "number" || !Number.isFinite(bill) || !Number.isFinite(pay)) return null;
  if (pay <= 0) return null;
  return ((bill - pay) / pay) * 100;
}

/**
 * Margin judged against the target: at or above it is success, positive but
 * short of it is a warning, zero or negative is a loss. Null without a
 * positive bill rate and a pay rate.
 */
export function marginStatus(
  bill: number | undefined | null,
  pay: number | undefined | null,
  targetPct: number | undefined | null = DEFAULT_TARGET_MARGIN_PCT,
): MarginStatus | null {
  if (typeof bill !== "number" || typeof pay !== "number" || !Number.isFinite(bill) || !Number.isFinite(pay)) return null;
  if (bill <= 0) return null;
  const target = typeof targetPct === "number" && Number.isFinite(targetPct) ? targetPct : DEFAULT_TARGET_MARGIN_PCT;
  const marginPct = ((bill - pay) / bill) * 100;
  const markup = markupPct(bill, pay);
  if (marginPct <= 0) return { tone: "danger", label: "Loss", marginPct, markupPct: markup };
  if (marginPct < target) return { tone: "warning", label: `Below target (${fmtPct(target)})`, marginPct, markupPct: markup };
  return { tone: "success", label: "On target", marginPct, markupPct: markup };
}

/**
 * Placement fee: fee % of the annual salary midpoint (or the one figure given).
 * Null without a positive fee and at least one positive salary figure.
 */
export function placementFee(
  feePct: number | undefined | null,
  min: number | undefined | null,
  max: number | undefined | null,
): number | null {
  if (typeof feePct !== "number" || !Number.isFinite(feePct) || feePct <= 0) return null;
  const figures = [min, max].filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
  if (!figures.length) return null;
  const mid = figures.reduce((a, b) => a + b, 0) / figures.length;
  return (mid * feePct) / 100;
}

/** "20%", "17.5%" */
export function fmtPct(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}
