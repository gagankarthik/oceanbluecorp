/**
 * Illustrated marks for the careers benefits, drawn like the engagement-stage
 * marks: filled, layered shapes on a 48-unit grid in the brand palette.
 * Keyed by benefit title.
 */
const marks: Record<string, React.ReactNode> = {
  // A shield carrying a medical cross, with a heart for the family it covers
  "Health insurance": (
    <>
      <path d="M22 4 37 9.5v11c0 10-6.4 17.2-15 20.5C13.4 37.7 7 30.5 7 20.5v-11Z" className="fill-ocean-600" />
      <path d="M22 9.2 32.6 13v7.6c0 7.2-4.4 12.6-10.6 15.4C15.8 33.2 11.4 27.8 11.4 20.6V13Z" className="fill-ocean-500" />
      <path d="M19.4 14.5h5.2v5.2h5.2v5.2h-5.2v5.2h-5.2v-5.2h-5.2v-5.2h5.2Z" className="fill-white" />
      <path d="M37.5 44c-.6 0-7.5-4.4-7.5-9a4 4 0 0 1 7.5-2 4 4 0 0 1 7.5 2c0 4.6-6.9 9-7.5 9Z" className="fill-cyan-500" />
    </>
  ),
  // Savings stacking up, with something growing out of them
  "Retirement plans": (
    <>
      <ellipse cx="18" cy="41" rx="12" ry="4" className="fill-ocean-700" />
      <rect x="6" y="35" width="24" height="6" className="fill-ocean-700" />
      <ellipse cx="18" cy="35" rx="12" ry="4" className="fill-ocean-500" />
      <rect x="6" y="29" width="24" height="6" className="fill-ocean-600" />
      <ellipse cx="18" cy="29" rx="12" ry="4" className="fill-ocean-400" />
      <rect x="6" y="23" width="24" height="6" className="fill-ocean-500" />
      <ellipse cx="18" cy="23" rx="12" ry="4" className="fill-tide-300" />
      <path d="M34 42V24" className="stroke-navy-900" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 28c-6.5 0-9.5-4-9.5-9.5C31 18.5 34 22.5 34 28Z" className="fill-cyan-500" />
      <path d="M34 24c0-6.5 3.4-11 10-11 0 6.5-3.4 11-10 11Z" className="fill-cyan-300" />
    </>
  ),
  // A calendar page with the sun coming up over it
  "Paid time off": (
    <>
      <circle cx="35" cy="13" r="8" className="fill-cyan-300" />
      <path d="M35 1.5v2.6M45.5 13h-2.6M42.4 5.6l-1.8 1.8M27.6 5.6l1.8 1.8" className="stroke-cyan-500" strokeWidth="2" strokeLinecap="round" />
      <rect x="4" y="11" width="30" height="31" rx="3" className="fill-mist-0" />
      <path d="M4 14a3 3 0 0 1 3-3h24a3 3 0 0 1 3 3v6H4Z" className="fill-ocean-600" />
      <path d="M11 7.5v6.5M27 7.5v6.5" className="stroke-navy-900" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4" y="11" width="30" height="31" rx="3" className="fill-none stroke-tide-300" strokeWidth="1.5" />
      <rect x="9" y="25" width="5" height="4" rx="1" className="fill-tide-300" />
      <rect x="16.5" y="25" width="5" height="4" rx="1" className="fill-tide-300" />
      <rect x="24" y="25" width="5" height="4" rx="1" className="fill-tide-300" />
      <rect x="9" y="32" width="5" height="4" rx="1" className="fill-tide-300" />
      <rect x="16.5" y="32" width="12.5" height="4" rx="1" className="fill-cyan-500" />
    </>
  ),
};

export default function BenefitIcon({ benefit, className = "size-12" }: { benefit: string; className?: string }) {
  const body = marks[benefit];
  if (!body) return null;
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      {body}
    </svg>
  );
}
