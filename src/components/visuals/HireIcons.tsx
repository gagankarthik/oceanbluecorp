/**
 * Illustrated marks for the hiring steps, drawn like the engagement-stage and
 * benefit marks: filled, layered shapes on a 48-unit grid in the brand palette.
 * Keyed by step name.
 */
const marks: Record<string, React.ReactNode> = {
  // A resume with a photo, on its way
  "Apply or send your resume": (
    <>
      <rect x="4" y="6" width="26" height="34" rx="3" className="fill-tide-200" />
      <circle cx="12.5" cy="15" r="4.5" className="fill-ocean-600" />
      <path d="M8 23.5a4.5 4.5 0 0 1 9 0Z" className="fill-ocean-600" />
      <rect x="19" y="12" width="7" height="2.4" rx="1.2" className="fill-ocean-600" />
      <rect x="19" y="17" width="5" height="2.4" rx="1.2" className="fill-tide-400" />
      <rect x="8" y="28" width="18" height="2.4" rx="1.2" className="fill-tide-400" />
      <rect x="8" y="33" width="12" height="2.4" rx="1.2" className="fill-tide-400" />
      <path d="M44.5 21 26 29.5l7 2.6Z" className="fill-cyan-300" />
      <path d="M44.5 21 33 32.1l2.6 8.4Z" className="fill-cyan-500" />
      <path d="M33 32.1 35.6 40.5l2.2-5.6Z" className="fill-cyan-600" />
    </>
  ),
  // Two people talking it through
  "A conversation with a recruiter": (
    <>
      <path d="M6 8h22a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H15l-6 5v-5H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Z" className="fill-ocean-600" />
      <circle cx="11" cy="17.5" r="1.8" className="fill-white" />
      <circle cx="17" cy="17.5" r="1.8" className="fill-white" />
      <circle cx="23" cy="17.5" r="1.8" className="fill-white" />
      <path d="M42 20H22a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h12l5.5 4.5V37H42a3 3 0 0 0 3-3V23a3 3 0 0 0-3-3Z" className="fill-cyan-500" />
      <rect x="24" y="26" width="15" height="2.4" rx="1.2" className="fill-navy-900" />
      <rect x="24" y="31" width="9" height="2.4" rx="1.2" className="fill-navy-900" />
    </>
  ),
  // Code on screen, talked through with an engineer
  "A technical conversation": (
    <>
      <rect x="3" y="7" width="36" height="28" rx="3" className="fill-navy-900" />
      <rect x="3" y="7" width="36" height="6" rx="3" className="fill-ocean-700" />
      <circle cx="8" cy="10" r="1.2" className="fill-cyan-300" />
      <circle cx="12" cy="10" r="1.2" className="fill-tide-300" />
      <path d="m13 19-5 4.5 5 4.5M29 19l5 4.5-5 4.5" className="stroke-cyan-300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="m23.5 17.5-5 12" className="stroke-white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M43 28H31a2.5 2.5 0 0 0-2.5 2.5v7A2.5 2.5 0 0 0 31 40h7l4 3.5V40h1a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 43 28Z" className="fill-ocean-500" />
      <circle cx="33.5" cy="34" r="1.3" className="fill-white" />
      <circle cx="37" cy="34" r="1.3" className="fill-white" />
      <circle cx="40.5" cy="34" r="1.3" className="fill-white" />
    </>
  ),
  // The candidate and the client, introduced and confirmed
  "Meet the client": (
    <>
      <circle cx="15" cy="15" r="6.5" className="fill-tide-300" />
      <path d="M3 40a12 12 0 0 1 24 0Z" className="fill-tide-300" />
      <circle cx="30" cy="13" r="7" className="fill-ocean-600" />
      <path d="M17 40a13 13 0 0 1 26 0Z" className="fill-ocean-600" />
      <circle cx="39" cy="34" r="7" className="fill-cyan-500" />
      <path d="m35.5 34.2 2.4 2.4 4.6-4.8" className="stroke-white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
};

export default function HireIcon({ step, className = "size-12" }: { step: string; className?: string }) {
  const body = marks[step];
  if (!body) return null;
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      {body}
    </svg>
  );
}
