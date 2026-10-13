/* The browser window the full-page illustrations are drawn inside (404,
   maintenance). One frame, so they read as a set. */

export const ART_W = 640;
export const ART_H = 420;

/** Shadow filters, referenced as `url(#${id}-shadow)` and `url(#${id}-soft)`. */
export function ArtShadows({ id }: { id: string }) {
  return (
    <>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="var(--color-text-primary)" floodOpacity=".14" />
      </filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="var(--color-text-primary)" floodOpacity=".18" />
      </filter>
    </>
  );
}

/** Window body, title bar and address field. `children` is the address text. */
export function ArtWindow({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="60" y="24" width="520" height="360" rx="18" fill="var(--color-background-primary)" />
      </g>
      <rect x="60.5" y="24.5" width="519" height="359" rx="17.5" fill="none" stroke="var(--color-border-default)" />
      <path d="M60 60h520" stroke="var(--color-border-default)" />
      {["var(--p-red-200)", "var(--p-amber-200)", "var(--p-green-200)"].map((c, i) => (
        <circle key={c} cx={84 + i * 16} cy="42" r="5" fill={c} />
      ))}
      <rect x="180" y="32" width="280" height="20" rx="10" fill="var(--color-background-secondary)" />
      <circle cx="194" cy="42" r="3.5" fill="none" stroke="var(--p-slate-400)" strokeWidth="1.5" />
      <text x="206" y="46" fontSize="11" fill="var(--color-text-tertiary)" fontFamily="inherit">
        {children}
      </text>
    </>
  );
}
