import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS } from "@/components/layout/social";
import { buttonClass } from "@/components/site/button";
import {
  IconClock,
  IconMail,
  IconOverview,
  IconPhone,
} from "@/components/site/icons";
import { MaintenanceArt } from "@/components/site/maintenance-art";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/company";

/**
 * The maintenance screen, shown in place of the public site while the switch
 * at /admin/settings is on.
 *
 * The picture carries the message; the words are a heading, one line and the
 * estimate. Scheduled work and an unexpected outage get different headings
 * (whoever flips the switch chooses by filling in the estimate), and the phone,
 * email and status page stay reachable, since this page stands in front of them.
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
    <main className="site flex min-h-[100svh] w-full flex-col bg-white">
      <div className="mx-auto w-full max-w-[var(--grid-max)] px-[var(--space-layout-gutter)] pt-6">
        <Image
          src="/logo.webp"
          alt="Oceanblue Solutions, Inc."
          width={150}
          height={40}
          className="mx-auto h-8 w-auto lg:mx-0"
          priority
        />
      </div>

      <div className="mx-auto grid w-full max-w-[var(--grid-max)] flex-1 items-center gap-8 px-[var(--space-layout-gutter)] py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <MaintenanceArt className="mx-auto h-auto w-full max-w-[420px] lg:order-2 lg:max-w-none" />

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p
            className="rise inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 type-caption font-semibold text-cobalt"
            style={{ animationDelay: "200ms" }}
          >
            <span className="size-1.5 rounded-full bg-cobalt" aria-hidden />
            {planned ? "Scheduled maintenance" : "Temporarily offline"}
          </p>

          <h1
            className="rise mt-4 type-headline-lg font-semibold text-ink"
            style={{ animationDelay: "280ms" }}
          >
            {planned ? "We’re making updates." : "We’ll be right back."}
          </h1>

          <p
            className="rise mt-4 max-w-[44ch] type-body-lg text-ink-muted"
            style={{ animationDelay: "360ms" }}
          >
            {message || "Nothing you have sent us has been lost."}
          </p>

          {eta && (
            <p
              className="rise mt-5 inline-flex items-center gap-2 rounded-full bg-cobalt-tint px-4 py-2 type-label font-semibold text-ink"
              style={{ animationDelay: "400ms" }}
            >
              <IconClock size={16} className="text-cobalt" />
              Expected back {eta}
            </p>
          )}

          <div
            className="rise mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "440ms" }}
          >
            <a href={CONTACT_PHONE.href} className={buttonClass("outline")}>
              <IconPhone size={16} />
              {CONTACT_PHONE.label}
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={buttonClass("outline")}
            >
              <IconMail size={16} />
              {CONTACT_EMAIL}
            </a>
            {/* /status is served by the same app, so it only helps while this
                page is the thing that is up, which is the common case. */}
            <Link href="/status" className={buttonClass("ghost")}>
              <IconOverview size={16} />
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
                className="flex size-10 items-center justify-center rounded-full border border-line-strong text-ink-muted transition-colors hover:border-ink hover:text-ink"
              >
                <s.icon className="size-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="border-t border-line px-[var(--space-layout-gutter)] py-5 text-center type-caption text-ink-subtle">
        © {new Date().getFullYear()} Oceanblue Solutions, Inc.
      </p>
    </main>
  );
}
