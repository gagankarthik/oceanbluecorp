/* The browser window the full-page illustrations are drawn inside (404,
   maintenance). One frame, so they read as a set. */

export const ART_W = 640;
export const ART_H = 420;

/** Shadow filters, referenced as `url(#${id}-shadow)` and `url(#${id}-soft)`. */
export function ArtShadows({ id }: { id: string }) {
  return (
    <>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#0b1a33" floodOpacity=".14" />
      </filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0b1a33" floodOpacity=".18" />
      </filter>
    </>
  );
}

/** Window body, title bar and address field. `children` is the address text. */
export function ArtWindow({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="60" y="24" width="520" height="360" rx="18" fill="#fff" />
      </g>
      <rect x="60.5" y="24.5" width="519" height="359" rx="17.5" fill="none" stroke="#e2e8f1" />
      <path d="M60 60h520" stroke="#e2e8f1" />
      {["#f3b5ae", "#f4d9a1", "#b9dfc3"].map((c, i) => (
        <circle key={c} cx={84 + i * 16} cy="42" r="5" fill={c} />
      ))}
      <rect x="180" y="32" width="280" height="20" rx="10" fill="#f3f6fb" />
      <circle cx="194" cy="42" r="3.5" fill="none" stroke="#9aa6ba" strokeWidth="1.5" />
      <text x="206" y="46" fontSize="11" fill="#56637b" fontFamily="inherit">
        {children}
      </text>
    </>
  );
}
