import Link from "next/link";
import { company } from "@/lib/site-content";

/** The call to action that closes every page; sits flush on the footer as its opening row */
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
    <section aria-label="Contact" className="on-dark bg-navy-950 text-white">
      <div className="gutter">
        <div className="grid gap-10 border-b border-white/10 pb-16 pt-20 md:pt-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7" data-reveal>
            <h2 className="display text-head">
              {lines[0]}{" "}
              <br />
              {lines[1]}
            </h2>
            <p className="mt-6 max-w-measure-narrow text-tide-300">{sentence}</p>
          </div>
          <div
            className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end"
            data-reveal
            style={{ "--d": 1 } as React.CSSProperties}
          >
            <Link
              href="/contact"
              className="inline-flex min-h-13 items-center justify-center whitespace-nowrap bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
            >
              {action}
            </Link>
            <a
              href={company.tel}
              className="inline-flex min-h-13 items-center justify-center whitespace-nowrap px-7 font-medium text-white ring-2 ring-inset ring-white/70 btn-fill btn-fill-outline-light active:scale-[0.98]"
            >
              Call {company.phoneShort}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
