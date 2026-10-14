/**
 * A centred card for pages that stand in for content: not found, an error,
 * a closed posting. Illustration, heading, one line, the ways forward.
 */
export default function StatusCard({
  icon,
  eyebrow,
  title,
  body,
  actions,
  footnote,
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  body: React.ReactNode;
  actions: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <section className="bg-field-paper">
      <div className="gutter grid min-h-[72svh] place-items-center py-16">
        <div className="w-full max-w-[36rem] bg-mist-0 px-6 py-12 text-center shadow-[0_1px_0_var(--color-mist-200)] md:px-10">
          <div className="mx-auto w-fit">{icon}</div>
          {eyebrow && <p className="mt-6 text-[14px] font-semibold tabular-nums text-ocean-700">{eyebrow}</p>}
          <h1 className={`display text-[clamp(1.75rem,4vw,2.5rem)] ${eyebrow ? "mt-2" : "mt-6"}`}>{title}</h1>
          <div className="mx-auto mt-3 max-w-[34ch] text-mist-600">{body}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
          {footnote && <div className="mt-8 border-t border-mist-200 pt-6 text-[15px] text-mist-600">{footnote}</div>}
        </div>
      </div>
    </section>
  );
}

export const primaryAction =
  "inline-flex min-h-12 items-center justify-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]";
export const secondaryAction =
  "inline-flex min-h-12 items-center justify-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline active:scale-[0.98]";

/** A signpost with nowhere it points: the page isn't here */
export function LostIcon() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="size-24">
      <path d="M31 8h3v50h-3z" className="fill-navy-900" />
      <path d="M12 14h30l7 6-7 6H12z" className="fill-ocean-600" />
      <path d="M52 30H22l-7 6 7 6h30z" className="fill-tide-300" />
      <ellipse cx="32.5" cy="58" rx="13" ry="3" className="fill-mist-200" />
      <circle cx="49" cy="49" r="11" className="fill-mist-0" />
      <circle cx="49" cy="49" r="9" className="fill-cyan-500" />
      <path d="M46 46.3a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8v.6" fill="none" className="stroke-white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="49" cy="54.2" r="1.4" className="fill-white" />
    </svg>
  );
}

/** A plug pulled from its socket, with the spark between: something broke on our side */
export function BrokenIcon() {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className="size-24">
      <path d="M4 26h14a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H4z" className="fill-tide-300" />
      <rect x="18" y="22" width="9" height="20" rx="3" className="fill-ocean-600" />
      <path d="M27 27h5M27 37h5" className="stroke-navy-900" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="40" y="22" width="9" height="20" rx="3" className="fill-ocean-700" />
      <path d="M49 32h11" className="stroke-tide-300" strokeWidth="5" strokeLinecap="round" />
      <path d="m36 18-3 7h5l-3 7" fill="none" className="stroke-cyan-500" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 44l-2 4M38 44l2 4" className="stroke-cyan-500" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="32" cy="56" rx="22" ry="3" className="fill-mist-200" />
    </svg>
  );
}
