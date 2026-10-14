import Link from "next/link";
import Logo from "@/components/site/Logo";
import Photo from "@/components/site/Photo";
import { company } from "@/lib/site-content";

/**
 * Stands in for the public site while the maintenance switch is on. Scheduled
 * work (an estimate is set) and an unplanned outage get different headings;
 * phone, email and the status page stay reachable.
 */
export default function Maintenance({
  message,
  eta,
}: {
  /** Optional detail from the admin toggle */
  message?: string;
  /** e.g. "by 3:00 PM EST"; empty means unplanned */
  eta?: string;
}) {
  const planned = Boolean(eta);
  const lines = planned ? ["We're making", "updates."] : ["We'll be", "right back."];

  return (
    <main className="flex min-h-[100svh] flex-col bg-field-paper lg:grid lg:grid-cols-12">
      <div className="flex flex-1 flex-col lg:col-span-7">
        <div className="gutter pt-6">
          <Logo className="h-9 w-[7.6rem]" />
        </div>

        <div className="gutter flex flex-1 flex-col justify-center py-14">
          <p className="text-mist-600">{planned ? "Scheduled maintenance" : "Temporarily offline"}</p>
          <h1 className="lines poster mt-4 text-[clamp(3rem,7vw,6.5rem)]">
            {lines.map((l, i) => (
              <span key={l} className="line">
                <span data-line style={{ "--i": i } as React.CSSProperties}>
                  {l}
                </span>
              </span>
            ))}
          </h1>
          <p data-after-lines className="mt-6 max-w-[44ch] text-lead leading-snug">
            {message || "Nothing you have sent us has been lost."}
          </p>
          {eta && (
            <p data-after-lines className="mt-6 self-start bg-tide-200 px-4 py-2 font-medium">
              Expected back {eta}
            </p>
          )}

          <div data-after-lines className="mt-10 flex flex-wrap gap-3">
            <a
              href={company.tel}
              className="inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.98]"
            >
              Call {company.phoneShort}
            </a>
            <a
              href={`mailto:${company.email}`}
              className="inline-flex min-h-12 items-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
            >
              Email us
            </a>
          </div>
          {/* /status is served by the same app and stays up during maintenance */}
          <p data-after-lines className="mt-6 text-mist-600">
            Live service state is on the{" "}
            <Link href="/status" className="text-ocean-700 underline underline-offset-4">
              status page
            </Link>
            .
          </p>
        </div>

        <p className="gutter py-5 text-[length:var(--text-small)] text-mist-600">
          &copy; {new Date().getFullYear()} {company.name}
        </p>
      </div>

      <div className="hidden p-2 lg:col-span-5 lg:block">
        <div className="shutter h-full">
          <Photo name="bridge" className="h-full" preload sizes="40vw" />
        </div>
      </div>
    </main>
  );
}
