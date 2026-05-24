// Shared formatting helpers for the admin area.
// Replaces the per-file fmtDate / formatDate / fmtFull / timeAgo / formatTimeAgo copies.

/** "May 24, 2026" — returns "—" for empty values. */
export function fmtDate(d?: string | number | Date | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "May 24, 2026, 3:45 PM" — returns "—" for empty values. */
export function fmtDateTime(d?: string | number | Date | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago" / falls back to fmtDate after a week. */
export function fmtRelative(d?: string | number | Date | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const ms = Date.now() - date.getTime();
  const min = ms / 60000, hr = ms / 3600000, day = ms / 86400000;
  if (min < 1) return "Just now";
  if (min < 60) return `${Math.floor(min)}m ago`;
  if (hr < 24) return `${Math.floor(hr)}h ago`;
  if (day < 7) return `${Math.floor(day)}d ago`;
  return fmtDate(date);
}
