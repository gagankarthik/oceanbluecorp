import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS } from "@/components/layout/social";

/**
 * The maintenance screen, shown in place of the public site while the switch
 * at /admin/settings is on.
 *
 * Branded rather than a bare "be right back": a page that still looks like the
 * company reads as planned work, and an unstyled one reads as the whole thing
 * having fallen over.
 *
 * Two pieces of honesty are built into the shape:
 *
 *  · Scheduled work and an unexpected outage get different headings, because
 *    people respond very differently to each and conflating them reads as
 *    evasive. Whoever flips the switch chooses by filling in the estimate.
 *  · When an estimate is given it is stated. "Back soon" tells nobody
 *    anything; even a rough window is worth more.
 *
 * The status page, phone and email stay reachable throughout, since the
 * routes people need most are the ones this page is standing in front of.
 */

export default function Maintenance({
  message,
  eta,
}: {
  /** Optional detail from the admin toggle. Falls back to a plain default. */
  message?: string;
  /** e.g. "by 3:00 PM EST" or "within 2 hours". Empty means unplanned. */
  eta?: string;
}) {
  const planned = Boolean(eta);

  return (
    <main className="horizon flex min-h-[100svh] w-full flex-col bg-[var(--hz-canvas)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <Image
          src="/logo.png"
          alt="Ocean Blue Corporation"
          width={340}
          height={80}
          className="h-12 w-auto"
          priority
        />

        <p className="hz-eyebrow mt-14 text-[var(--hz-cobalt)]">
          {planned ? "Scheduled maintenance" : "Temporarily unavailable"}
        </p>

        <h1 className="hz-display hz-h2 mt-5 max-w-[18ch] text-[var(--hz-text)]">
          {planned ? "We are making some updates." : "The site is briefly offline."}
        </h1>

        <p className="mt-6 max-w-[52ch] text-lead text-[var(--hz-text-mute)]">
          {message ||
            (planned
              ? "The site is down for planned work and will be back shortly. Nothing you have sent us has been lost."
              : "We are working on it now and expect to be back shortly. Nothing you have sent us has been lost.")}
        </p>

        {eta && (
          <p className="mt-5 max-w-[52ch] text-body font-semibold text-[var(--hz-text)]">
            Expected back {eta}.
          </p>
        )}

        <div className="mt-12 border-t border-[var(--hz-line)] pt-8">
          <p className="hz-eyebrow text-[var(--hz-text-subtle)]">If you need us now</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
            <a
              href="tel:+16148446925"
              className="hz-focus text-body font-semibold text-[var(--hz-cobalt)] transition-opacity hover:opacity-75"
            >
              +1 (614) 844-6925
            </a>
            <a
              href="mailto:hr@oceanbluecorp.com"
              className="hz-focus text-body font-semibold text-[var(--hz-cobalt)] transition-opacity hover:opacity-75"
            >
              hr@oceanbluecorp.com
            </a>
            {/* /status is served by the same app, so it is only useful while
                this page is the thing that is up. It is listed because that is
                the common case: the switch is on, the app is fine. */}
            <Link
              href="/status"
              className="hz-focus text-body text-[var(--hz-text-mute)] underline decoration-[var(--hz-line-2)] underline-offset-4 transition-colors hover:text-[var(--hz-text)]"
            >
              System status
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2.5">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="hz-focus grid h-10 w-10 place-items-center rounded-full text-[var(--hz-text)] ring-1 ring-[var(--hz-line-2)] transition-all duration-300 hover:bg-[var(--hz-text)] hover:text-white hover:ring-[var(--hz-text)]"
              >
                <s.icon className="h-[17px] w-[17px]" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--hz-line)]">
        <div className="mx-auto w-full max-w-2xl px-6 py-6 sm:px-10">
          <p className="text-fine text-[var(--hz-text-subtle)]">
            © {new Date().getFullYear()} Ocean Blue Corporation
          </p>
        </div>
      </div>
    </main>
  );
}
