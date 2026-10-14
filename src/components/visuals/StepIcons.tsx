/**
 * Illustrated marks for the four engagement stages: filled, layered shapes on
 * a 48-unit grid in the brand palette (ocean for the subject, navy for
 * structure, tide and cyan for depth and light). Keyed by step name.
 */
const marks: Record<string, React.ReactNode> = {
  // A brief under a lens: learning how things are today
  Discovery: (
    <>
      <rect x="6" y="5" width="25" height="32" rx="3" className="fill-tide-200" />
      <rect x="11" y="11" width="15" height="3" rx="1.5" className="fill-ocean-600" />
      <rect x="11" y="17" width="11" height="2.5" rx="1.25" className="fill-tide-400" />
      <rect x="11" y="22" width="8" height="2.5" rx="1.25" className="fill-tide-400" />
      <path d="M34.6 33.4 42 40.8" className="stroke-navy-900" strokeWidth="5" strokeLinecap="round" />
      <circle cx="28" cy="27" r="10" className="fill-ocean-600" />
      <circle cx="28" cy="27" r="6.6" className="fill-cyan-100" />
      <path d="M24.4 25.2a4.2 4.2 0 0 1 3.2-3" className="stroke-white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  // A plotted route from where you are to a flagged goal
  Strategy: (
    <>
      <path d="M4 12.5 16 8l16 4.5L44 8v28l-12 4.5L16 36 4 40.5Z" className="fill-tide-100" />
      <path d="M16 8v28M32 12.5v28" className="stroke-tide-300" strokeWidth="1.5" />
      <path d="M11 33c5 0 6-7 11-7s5 3 9 3 4-6 6-8" className="stroke-ocean-600" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 5" fill="none" />
      <circle cx="10" cy="33" r="3.6" className="fill-cyan-500" />
      <circle cx="10" cy="33" r="1.4" className="fill-white" />
      <path d="M37 22V6" className="stroke-navy-900" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M37 6.5h8.5l-2.6 3.6 2.6 3.6H37Z" className="fill-ocean-600" />
    </>
  ),
  // Blocks set in place, the last one landing
  Implementation: (
    <>
      <path d="M6 30 16 25l10 5-10 5Z" className="fill-ocean-400" />
      <path d="M6 30v9l10 5v-9Z" className="fill-ocean-700" />
      <path d="M16 35v9l10-5v-9Z" className="fill-ocean-600" />
      <path d="M22 30l10-5 10 5-10 5Z" className="fill-tide-300" />
      <path d="M22 30v9l10 5v-9Z" className="fill-tide-400" />
      <path d="M32 35v9l10-5v-9Z" className="fill-tide-300" />
      <path d="M14 12l10-5 10 5-10 5Z" className="fill-cyan-300" />
      <path d="M14 12v8l10 5v-8Z" className="fill-cyan-600" />
      <path d="M24 17v8l10-5v-8Z" className="fill-cyan-500" />
      <path d="M24 28v-1" className="stroke-navy-900" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // A gauge reading high, still climbing
  Optimization: (
    <>
      <path d="M6 34a18 18 0 0 1 9.2-15.7" className="stroke-tide-300" strokeWidth="6" fill="none" />
      <path d="M15.2 18.3a18 18 0 0 1 17.6 0" className="stroke-cyan-500" strokeWidth="6" fill="none" />
      <path d="M32.8 18.3A18 18 0 0 1 42 34" className="stroke-ocean-600" strokeWidth="6" fill="none" />
      <path d="M24 34 33.5 22" className="stroke-navy-900" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="34" r="4.2" className="fill-navy-900" />
      <circle cx="24" cy="34" r="1.6" className="fill-white" />
      <rect x="31" y="35" width="15" height="10" rx="5" className="fill-ocean-600" />
      <path d="m35 41.5 3.5-3.5 3.5 3.5" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
};

export default function StepIcon({ step, className = "size-12" }: { step: string; className?: string }) {
  const body = marks[step];
  if (!body) return null;
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      {body}
    </svg>
  );
}
