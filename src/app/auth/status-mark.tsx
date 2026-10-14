/* Full-panel state marks for the callback and sign-out screens. */

const PATHS = {
  shield: "M12 3 19.5 6v5.6c0 4.6-3.1 7.8-7.5 9.4-4.4-1.6-7.5-4.8-7.5-9.4V6z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  refresh: "M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4",
  logout: "M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10",
  alert: "M12 8v5M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
} as const;

export function Glyph({ name, className = "size-7" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Mark({ tone, children }: { tone: "success" | "danger" | "neutral"; children: React.ReactNode }) {
  const cls = tone === "success" ? "bg-ocean-600 text-white" : tone === "danger" ? "bg-buoy-300/40 text-navy-900" : "bg-tide-200 text-navy-900";
  return <span className={`grid size-16 place-items-center ${cls}`}>{children}</span>;
}
