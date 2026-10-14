import Link from "next/link";
import { company } from "@/lib/site-content";

/** The call to action that closes every page */
export default function Closing({
  lines = ["Let's talk about", "your requirements"],
  sentence = "One conversation covers people, platforms and operations. You talk to someone who can answer for all of it.",
  action = "Contact us",
}: {
  lines?: [string, string];
  sentence?: string;
  action?: string;
}) {
  return (
    <section aria-label="Contact" className="relative overflow-hidden bg-ocean-600 text-white">
      {/* Wave lines that settle into place once, a nod to the name */}
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-[200%] text-white" viewBox="0 0 2400 400" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            className="wave-drift"
            style={{ animationDuration: `${3 + i * 0.5}s`, opacity: 0.07 + i * 0.03 } as React.CSSProperties}
            d={`M0 ${250 + i * 34} C 200 ${200 + i * 34}, 400 ${300 + i * 34}, 600 ${250 + i * 34} S 1000 ${200 + i * 34}, 1200 ${250 + i * 34} S 1600 ${300 + i * 34}, 1800 ${250 + i * 34} S 2200 ${200 + i * 34}, 2400 ${250 + i * 34}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="gutter relative flex flex-col items-center gap-10 py-20 text-center md:py-24">
        <div data-reveal>
          <h2 className="display text-[clamp(2.25rem,4vw,3.75rem)]">
            {lines[0]}
            <br />
            {lines[1]}
          </h2>
          <p className="mx-auto mt-6 max-w-[48ch] text-white">{sentence}</p>
        </div>
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
          <Link
            href="/contact"
            className="inline-flex min-h-13 items-center justify-center whitespace-nowrap bg-white px-7 font-medium text-navy-950 btn-fill btn-fill-white active:scale-[0.98]"
          >
            {action}
          </Link>
          <a
            href={company.tel}
            className="inline-flex min-h-13 items-center justify-center whitespace-nowrap bg-navy-900 px-7 font-medium text-white btn-fill btn-fill-navy active:scale-[0.98]"
          >
            Call {company.phoneShort}
          </a>
        </div>
      </div>
    </section>
  );
}
