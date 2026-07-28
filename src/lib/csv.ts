/**
 * CSV export for the admin list pages.
 *
 * Seven list pages each had their own copy of "build headers, map rows, wrap
 * every cell in quotes, make a Blob, click an anchor". Every copy quoted with
 * `"${cell}"`, which silently corrupts the file whenever a value contains a
 * double quote (a job title like 6" Pipe Fitter, a note with a quotation) —
 * the stray quote ends the field early and the row splits. RFC 4180 escapes an
 * embedded quote by doubling it, which is what `escapeCell` does.
 */

/** Quote a single field per RFC 4180: double the quotes, wrap the whole thing. */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * Build a CSV and hand it to the browser as a download.
 *
 * `filename` is stamped with today's date and given the .csv extension here, so
 * every export across the console lands with a consistent name.
 */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");

  // The BOM is what makes Excel open a UTF-8 CSV as UTF-8; without it, any
  // accented name in the export renders as mojibake.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
